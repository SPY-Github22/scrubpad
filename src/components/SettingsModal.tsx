import React from 'react';
import { X, SlidersHorizontal, Shield, KeyRound, Globe, Hash } from 'lucide-react';
import { RedactionRuleConfig, MaskStyle } from '../core/sanitizer';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RedactionRuleConfig;
  onUpdateConfig: (newConfig: RedactionRuleConfig) => void;
  maskStyle: MaskStyle;
  onUpdateMaskStyle: (style: MaskStyle) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  maskStyle,
  onUpdateMaskStyle,
}) => {
  if (!isOpen) return null;

  const toggleRule = (key: keyof RedactionRuleConfig) => {
    onUpdateConfig({
      ...config,
      [key]: !config[key],
    });
  };

  const categories = [
    {
      title: 'Cloud & API Credentials',
      icon: KeyRound,
      rules: [
        { key: 'awsKeys' as const, label: 'AWS Access Key IDs (AKIA...)', desc: 'Identifies standard 20-character AWS credentials' },
        { key: 'githubTokens' as const, label: 'GitHub PAT & Tokens (ghp_, gho_, pat_)', desc: 'Detects GitHub classic and fine-grained access tokens' },
        { key: 'aiApiKeys' as const, label: 'AI API Keys (OpenAI, Anthropic)', desc: 'Identifies sk-... and sk-ant-... models API keys' },
        { key: 'googleCloudKeys' as const, label: 'Google Cloud & Firebase (AIza...)', desc: 'Detects 39-character Google service keys' },
        { key: 'stripeKeys' as const, label: 'Stripe Secret Keys (sk_live_, rk_live_)', desc: 'Redacts production payment API keys' },
        { key: 'slackTokens' as const, label: 'Slack Tokens (xoxb-, xoxp-)', desc: 'Detects bot and user OAuth workspace tokens' },
      ],
    },
    {
      title: 'Secrets & Cryptography',
      icon: Shield,
      rules: [
        { key: 'privateKeys' as const, label: 'Private Keys (RSA, EC, OpenSSH, PGP)', desc: 'Redacts entire multi-line private key blocks' },
        { key: 'jwtAndBearer' as const, label: 'JWT & Bearer Tokens', desc: 'Detects Authorization headers and base64 JWT triples' },
        { key: 'databaseUrls' as const, label: 'Database Credentials in URIs', desc: 'Redacts password portion in postgres://, mysql://, mongodb://' },
        { key: 'keyValuePasswords' as const, label: 'JSON / Key-Value Passwords', desc: 'Redacts values assigned to password, secret, auth_token' },
      ],
    },
    {
      title: 'PII & Network',
      icon: Globe,
      rules: [
        { key: 'emails' as const, label: 'Email Addresses', desc: 'Redacts personal and enterprise email addresses' },
        { key: 'ipAddresses' as const, label: 'IPv4 Addresses', desc: 'Redacts public IP addresses (excludes localhost)' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Redaction & Security Rules</h2>
              <p className="text-xs text-neutral-400">
                Customise detection heuristics and masking styles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Masking Style Selector */}
          <div className="bg-neutral-950 border border-neutral-800/80 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
              <span>Masking Format</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => onUpdateMaskStyle('tag')}
                className={`p-3 rounded-lg border text-left transition ${
                  maskStyle === 'tag'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">[REDACTED_TYPE]</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Semantic labels (recommended)</div>
              </button>

              <button
                onClick={() => onUpdateMaskStyle('asterisk')}
                className={`p-3 rounded-lg border text-left transition ${
                  maskStyle === 'asterisk'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">********</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Simple asterisk masking</div>
              </button>

              <button
                onClick={() => onUpdateMaskStyle('hash')}
                className={`p-3 rounded-lg border text-left transition ${
                  maskStyle === 'hash'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">[TYPE:8f2a1c]</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Fingerprint cross-matching</div>
              </button>
            </div>
          </div>

          {/* Rules By Category */}
          {categories.map((cat, catIdx) => {
            const Icon = cat.icon;
            return (
              <div key={catIdx} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  <Icon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{cat.title}</span>
                </div>
                <div className="bg-neutral-950 border border-neutral-800/80 rounded-lg divide-y divide-neutral-800/60">
                  {cat.rules.map((rule) => {
                    const active = config[rule.key];
                    return (
                      <label
                        key={rule.key}
                        className="flex items-center justify-between p-3.5 hover:bg-neutral-900/40 cursor-pointer transition select-none"
                      >
                        <div className="pr-4">
                          <div className="text-xs font-medium text-neutral-200">{rule.label}</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">{rule.desc}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleRule(rule.key)}
                          className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
