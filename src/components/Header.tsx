import React from 'react';
import { ShieldCheck, Lock, Sparkles, SlidersHorizontal, History } from 'lucide-react';

interface HeaderProps {
  onLoadSample: (sampleKey: 'log' | 'curl' | 'nested' | 'jwt') => void;
  onOpenSettings: () => void;
  onOpenVault: () => void;
  vaultSavedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  onOpenSettings,
  onOpenVault,
  vaultSavedCount,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Security Badge */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                ScrubPad
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v1.0
                </span>
              </h1>
            </div>
            <p className="text-xs text-neutral-400 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>100% Client-Side Memory</span>
              <span className="text-neutral-600">•</span>
              <span className="text-neutral-500">CSP Outbound Network Blocked</span>
            </p>
          </div>
        </div>

        {/* Quick Samples Dropdown & Actions */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-neutral-800/80 border border-neutral-700/60 rounded-md px-2 py-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-400 font-medium">Try Sample:</span>
            <button
              onClick={() => onLoadSample('log')}
              className="text-neutral-300 hover:text-white hover:underline px-1 py-0.5"
            >
              CloudWatch Log
            </button>
            <span className="text-neutral-600">|</span>
            <button
              onClick={() => onLoadSample('nested')}
              className="text-neutral-300 hover:text-white hover:underline px-1 py-0.5"
            >
              Escaped JSON
            </button>
            <span className="text-neutral-600">|</span>
            <button
              onClick={() => onLoadSample('curl')}
              className="text-neutral-300 hover:text-white hover:underline px-1 py-0.5"
            >
              cURL + Secret
            </button>
            <span className="text-neutral-600">|</span>
            <button
              onClick={() => onLoadSample('jwt')}
              className="text-neutral-300 hover:text-white hover:underline px-1 py-0.5"
            >
              JWT
            </button>
          </div>

          {/* Vault Button */}
          <button
            onClick={onOpenVault}
            className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-md border border-neutral-700 transition"
            title="Open AES-GCM Encrypted Vault"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vault</span>
            {vaultSavedCount > 0 && (
              <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full text-[10px]">
                {vaultSavedCount}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-md border border-neutral-700 transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
            <span>Rules</span>
          </button>

          {/* GitHub link */}
          <a
            href="https://github.com/SPY-Github22/scrubpad"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-neutral-400 hover:text-white transition"
            title="View on GitHub"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};
