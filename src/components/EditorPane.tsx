import React from 'react';
import { Trash2, Clipboard, Copy, Check, CheckCircle2 } from 'lucide-react';

interface EditorPaneProps {
  input: string;
  output: string;
  onInputChange: (val: string) => void;
  onClearInput: () => void;
  onPasteInput: () => void;
  detectedFormat: string;
  operationsApplied: string[];
  matchCount: number;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  input,
  output,
  onInputChange,
  onClearInput,
  onPasteInput,
  detectedFormat,
  operationsApplied,
  matchCount,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputLineCount = input ? input.split('\n').length : 0;
  const inputCharCount = input.length;
  const inputEstimatedTokens = Math.ceil(inputCharCount / 4);

  const outputLineCount = output ? output.split('\n').length : 0;
  const outputCharCount = output.length;
  const outputEstimatedTokens = Math.ceil(outputCharCount / 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 flex-1 h-[calc(100vh-140px)] min-h-[500px]">
      {/* Raw Input Column */}
      <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden shadow-sm">
        {/* Pane Header */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-neutral-800 bg-neutral-900/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-300">Raw Input</span>
            <span className="text-neutral-500 font-mono text-[11px]">
              {inputLineCount} lines • {inputCharCount} chars • ~{inputEstimatedTokens} tokens
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onPasteInput}
              className="flex items-center gap-1 text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 transition"
              title="Paste from clipboard"
            >
              <Clipboard className="w-3 h-3" />
              <span>Paste</span>
            </button>
            <button
              onClick={onClearInput}
              disabled={!input}
              className="flex items-center gap-1 text-neutral-400 hover:text-red-400 px-2 py-1 rounded bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Clear input"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="relative flex-1 bg-neutral-950">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Paste your messy log string, double-escaped JSON, cURL command, or dirty payload here..."
            className="w-full h-full p-4 font-mono text-xs md:text-sm bg-transparent text-neutral-200 resize-none outline-none focus:ring-1 focus:ring-emerald-500/40 border-none selection:bg-emerald-500/30 leading-relaxed"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Cleaned & Sanitized Output Column */}
      <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden shadow-sm">
        {/* Pane Header */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-neutral-800 bg-neutral-900/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cleaned Output</span>
            </span>
            <span className="text-neutral-500 font-mono text-[11px]">
              {outputLineCount} lines • {outputCharCount} chars • ~{outputEstimatedTokens} tokens
            </span>
          </div>

          <div className="flex items-center gap-2">
            {detectedFormat && (
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-mono">
                {detectedFormat}
              </span>
            )}
            <button
              onClick={handleCopyOutput}
              disabled={!output}
              className="flex items-center gap-1 text-neutral-200 hover:text-white px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Copy output"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Applied Operations Bar if any */}
        {operationsApplied.length > 0 && (
          <div className="bg-emerald-950/20 border-b border-emerald-900/30 px-3 py-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-emerald-400">
            <span className="font-semibold text-emerald-500">Auto-Applied:</span>
            {operationsApplied.map((op, idx) => (
              <span
                key={idx}
                className="bg-emerald-900/40 border border-emerald-700/40 px-1.5 py-0.5 rounded"
              >
                {op}
              </span>
            ))}
            {matchCount > 0 && (
              <span className="bg-amber-900/40 border border-amber-700/40 text-amber-300 px-1.5 py-0.5 rounded font-medium">
                Redacted {matchCount} secret{matchCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Text Area Output */}
        <div className="relative flex-1 bg-neutral-950">
          <textarea
            readOnly
            value={output}
            placeholder="Cleaned, unescaped, and redacted output will appear here..."
            className="w-full h-full p-4 font-mono text-xs md:text-sm bg-transparent text-emerald-300 resize-none outline-none border-none selection:bg-emerald-500/30 leading-relaxed"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
