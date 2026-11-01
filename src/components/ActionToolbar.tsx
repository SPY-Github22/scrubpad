import React, { useState } from 'react';
import {
  Wand2,
  FileCode,
  ShieldAlert,
  ArrowDownUp,
  Binary,
  GitCompare,
  Copy,
  Check,
  Save,
  MessageSquareCode,
  Bot
} from 'lucide-react';

interface ActionToolbarProps {
  onQuickScrub: () => void;
  onUnmangle: () => void;
  onSanitize: () => void;
  onFormat: () => void;
  onSortKeys: () => void;
  onAutoDecode: () => void;
  onOpenDiff: () => void;
  onSaveToVault: () => void;
  onCopyRaw: () => void;
  onCopyLlmPrompt: () => void;
  onCopySlack: () => void;
  isJson: boolean;
  hasOutput: boolean;
  matchCount: number;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  onQuickScrub,
  onUnmangle,
  onSanitize,
  onFormat,
  onSortKeys,
  onAutoDecode,
  onOpenDiff,
  onSaveToVault,
  onCopyRaw,
  onCopyLlmPrompt,
  onCopySlack,
  isJson,
  hasOutput,
  matchCount,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopy = (type: string, fn: () => void) => {
    fn();
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
      {/* Transformation Actions */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Quick Scrub Master Button */}
        <button
          onClick={onQuickScrub}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-md shadow-sm transition active:scale-95"
          title="Unmangle + Sanitize + Format in one step (Ctrl/Cmd + Enter)"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Quick Scrub</span>
          <span className="text-[10px] opacity-75 hidden sm:inline">(Ctrl+↵)</span>
        </button>

        <div className="h-5 w-[1px] bg-neutral-700 mx-1 hidden sm:block" />

        {/* Individual Actions */}
        <button
          onClick={onUnmangle}
          className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1.5 rounded-md border border-neutral-700/80 transition"
          title="Unpack stringified JSON inside JSON, clean unicode and escape characters"
        >
          <FileCode className="w-3.5 h-3.5 text-blue-400" />
          <span>Unmangle</span>
        </button>

        <button
          onClick={onSanitize}
          className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1.5 rounded-md border border-neutral-700/80 transition relative"
          title="Redact API keys, tokens, passwords, and private data"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Sanitize</span>
          {matchCount > 0 && (
            <span className="bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
              {matchCount}
            </span>
          )}
        </button>

        <button
          onClick={onFormat}
          disabled={!isJson && !hasOutput}
          className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:pointer-events-none text-neutral-200 px-2.5 py-1.5 rounded-md border border-neutral-700/80 transition"
          title="Format with 2-space indentation"
        >
          <span>Format</span>
        </button>

        <button
          onClick={onSortKeys}
          disabled={!isJson && !hasOutput}
          className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:pointer-events-none text-neutral-200 px-2.5 py-1.5 rounded-md border border-neutral-700/80 transition"
          title="Sort JSON keys alphabetically for clean diffs"
        >
          <ArrowDownUp className="w-3.5 h-3.5 text-purple-400" />
          <span>Sort Keys</span>
        </button>

        <button
          onClick={onAutoDecode}
          className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1.5 rounded-md border border-neutral-700/80 transition"
          title="Auto-detect and decode Base64, JWT, or URL query parameters"
        >
          <Binary className="w-3.5 h-3.5 text-cyan-400" />
          <span>Auto-Decode</span>
        </button>

        <button
          onClick={onOpenDiff}
          disabled={!hasOutput}
          className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:pointer-events-none text-neutral-200 px-2.5 py-1.5 rounded-md border border-neutral-700/80 transition"
          title="Side-by-side comparison between raw input and cleaned output"
        >
          <GitCompare className="w-3.5 h-3.5 text-emerald-400" />
          <span>Diff</span>
        </button>
      </div>

      {/* Export & Copy Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleCopy('raw', onCopyRaw)}
          disabled={!hasOutput}
          className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:pointer-events-none text-neutral-100 font-medium px-2.5 py-1.5 rounded-md border border-neutral-700 transition"
          title="Copy clean sanitized text to clipboard"
        >
          {copiedType === 'raw' ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-neutral-400" />
          )}
          <span>{copiedType === 'raw' ? 'Copied!' : 'Copy'}</span>
        </button>

        <button
          onClick={() => handleCopy('llm', onCopyLlmPrompt)}
          disabled={!hasOutput}
          className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:pointer-events-none text-neutral-100 font-medium px-2.5 py-1.5 rounded-md border border-neutral-700 transition"
          title="Copy formatted with LLM prompt context wrapper"
        >
          {copiedType === 'llm' ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Bot className="w-3.5 h-3.5 text-purple-400" />
          )}
          <span>Prompt</span>
        </button>

        <button
          onClick={() => handleCopy('slack', onCopySlack)}
          disabled={!hasOutput}
          className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:pointer-events-none text-neutral-100 font-medium px-2.5 py-1.5 rounded-md border border-neutral-700 transition"
          title="Copy formatted with markdown code-block for Slack/Discord"
        >
          {copiedType === 'slack' ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <MessageSquareCode className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>Slack</span>
        </button>

        <button
          onClick={onSaveToVault}
          disabled={!hasOutput}
          className="flex items-center gap-1 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 disabled:opacity-40 disabled:pointer-events-none font-medium px-2.5 py-1.5 rounded-md border border-emerald-800/50 transition"
          title="Save securely to AES-GCM Encrypted Local Vault"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Vault</span>
        </button>
      </div>
    </div>
  );
};
