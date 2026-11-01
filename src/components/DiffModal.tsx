import React, { useState, useMemo } from 'react';
import { X, GitCompare, ArrowDownUp } from 'lucide-react';
import { computeLineDiff, sortJsonString } from '../core/diff';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawInput: string;
  cleanedOutput: string;
}

export const DiffModal: React.FC<DiffModalProps> = ({
  isOpen,
  onClose,
  rawInput,
  cleanedOutput,
}) => {
  const [sortBeforeDiff, setSortBeforeDiff] = useState(true);

  const diffResult = useMemo(() => {
    if (!isOpen) return null;
    const a = sortBeforeDiff ? sortJsonString(rawInput) : rawInput;
    const b = sortBeforeDiff ? sortJsonString(cleanedOutput) : cleanedOutput;
    return computeLineDiff(a, b);
  }, [isOpen, rawInput, cleanedOutput, sortBeforeDiff]);

  if (!isOpen || !diffResult) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Structural Diff Viewer
                {diffResult.identical ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Identical
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    +{diffResult.additions} / -{diffResult.deletions}
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-400">
                Comparing raw input against cleaned & sanitized output
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSortBeforeDiff(!sortBeforeDiff)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition ${
                sortBeforeDiff
                  ? 'bg-purple-950/40 text-purple-300 border-purple-800/60'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
              title="Alphabetically sorts object keys to prevent false order diffs"
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span>Sort Keys First: {sortBeforeDiff ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Diff Content Lines */}
        <div className="flex-1 overflow-auto bg-neutral-950 font-mono text-xs p-4 leading-relaxed">
          {diffResult.lines.length === 0 ? (
            <div className="text-neutral-500 text-center py-20">No differences to display.</div>
          ) : (
            <div className="space-y-0.5">
              {diffResult.lines.map((line, idx) => {
                let rowBg = 'hover:bg-neutral-900/60 text-neutral-400';
                let indicator = ' ';
                let lineNumColor = 'text-neutral-600';

                if (line.type === 'added') {
                  rowBg = 'bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50';
                  indicator = '+';
                  lineNumColor = 'text-emerald-500 font-semibold';
                } else if (line.type === 'removed') {
                  rowBg = 'bg-red-950/30 text-red-300 hover:bg-red-950/50';
                  indicator = '-';
                  lineNumColor = 'text-red-500 font-semibold';
                }

                return (
                  <div key={idx} className={`flex items-start px-2 py-0.5 rounded ${rowBg}`}>
                    <span className={`w-8 select-none text-right pr-3 ${lineNumColor}`}>
                      {line.lineA ?? ''}
                    </span>
                    <span className={`w-8 select-none text-right pr-3 ${lineNumColor}`}>
                      {line.lineB ?? ''}
                    </span>
                    <span className="w-6 select-none font-bold text-center">{indicator}</span>
                    <span className="flex-1 whitespace-pre-wrap break-all">{line.content}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {diffResult.additions} addition{diffResult.additions === 1 ? '' : 's'}
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              {diffResult.deletions} deletion{diffResult.deletions === 1 ? '' : 's'}
            </span>
            <span className="text-neutral-500">
              {diffResult.unchanged} unchanged line{diffResult.unchanged === 1 ? '' : 's'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
