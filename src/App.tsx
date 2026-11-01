import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ActionToolbar } from './components/ActionToolbar';
import { EditorPane } from './components/EditorPane';
import { DiffModal } from './components/DiffModal';
import { SettingsModal } from './components/SettingsModal';
import { EncryptedVaultModal, VaultItem } from './components/EncryptedVaultModal';
import { unmangle } from './core/unmangler';
import { sanitize, DEFAULT_REDACTION_CONFIG, RedactionRuleConfig, MaskStyle } from './core/sanitizer';
import { autoDecode } from './core/decoder';
import { sortJsonString } from './core/diff';
import { EncryptedPayload } from './core/crypto';

// Preset sample payloads
const SAMPLES = {
  log: `2026-11-02T00:15:22.418Z [ERROR] (auth-worker-3): {"event":"login_failed","ip":"198.51.100.42","user":"dev-lead@megacorp.internal","db_uri":"postgres://admin_usr:SuperSecretDbPass99@db.prod.aws.internal:5432/users","headers":{"authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6ImFkbWluIn0.c2lnbmF0dXJlX2J5dGVzX2hlcmU"},"details":"{\\"retry_count\\":3,\\"aws_session\\":\\"AKIAIOSFODNN7EXAMPLE\\"}"}`,
  nested: `{"status":200,"service":"order_processor","raw_response":"{\\"orderId\\":98412,\\"customer\\":\\"alice.smith@enterprise.org\\",\\"payment_payload\\":\\"{\\\\\\"stripe_token\\\\\\":\\\\\\"sk_live_51Mz0123456789ABCDEF\\\\\\",\\\\\\"amount\\\\\\":4999}\\"}"}`,
  curl: `curl -X POST https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-ant-api03-abcdef1234567890abcdef1234567890" \\
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "Debug this error"}], "credentials": {"github_token": "ghp_111122223333444455556666777788889999", "password": "ProductionDatabaseMasterKey!"}}'`,
  jwt: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTA4MTIiLCJuYW1lIjoiQWxleCBDaGVuIiwiZW1haWwiOiJhbGV4LmNoZW5AY29tcGFueS5jb20iLCJyb2xlIjoiYWRtaW4iLCJhd3Nfa2V5IjoiQUtJQUpRN1hZODlFWFNBTVAxMiIsImlhdCI6MTczMDUwODAwMH0.wZ0F1Xq8dM5m_4XzQ3Y9Q2nKpLsVo7Tq1RuE5vN8XzM`,
};

const VAULT_STORAGE_KEY = 'scrubpad_encrypted_vault_v1';
const RULES_STORAGE_KEY = 'scrubpad_rules_config_v1';
const MASK_STORAGE_KEY = 'scrubpad_mask_style_v1';

export function App() {
  const [input, setInput] = useState(SAMPLES.log);
  const [output, setOutput] = useState('');
  const [operationsApplied, setOperationsApplied] = useState<string[]>([]);
  const [detectedFormat, setDetectedFormat] = useState('CloudWatch Log');
  const [matchCount, setMatchCount] = useState(0);

  // Settings & Mask style
  const [config, setConfig] = useState<RedactionRuleConfig>(() => {
    try {
      const stored = localStorage.getItem(RULES_STORAGE_KEY);
      return stored ? { ...DEFAULT_REDACTION_CONFIG, ...JSON.parse(stored) } : DEFAULT_REDACTION_CONFIG;
    } catch {
      return DEFAULT_REDACTION_CONFIG;
    }
  });

  const [maskStyle, setMaskStyle] = useState<MaskStyle>(() => {
    try {
      const stored = localStorage.getItem(MASK_STORAGE_KEY) as MaskStyle;
      return stored && ['tag', 'asterisk', 'hash'].includes(stored) ? stored : 'tag';
    } catch {
      return 'tag';
    }
  });

  // Vault state
  const [vaultItems, setVaultItems] = useState<VaultItem[]>(() => {
    try {
      const stored = localStorage.getItem(VAULT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // Sync config & maskStyle to localStorage
  const handleUpdateConfig = (newConfig: RedactionRuleConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(newConfig));
    } catch {
      // ignore quota / private mode errors
    }
  };

  const handleUpdateMaskStyle = (newStyle: MaskStyle) => {
    setMaskStyle(newStyle);
    try {
      localStorage.setItem(MASK_STORAGE_KEY, newStyle);
    } catch {
      // ignore
    }
  };

  // Sync vault items to localStorage
  const handleSaveVaultItem = (title: string, encrypted: EncryptedPayload) => {
    const newItem: VaultItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `item_${Date.now()}_${Math.random()}`,
      title,
      encrypted,
      createdAt: Date.now(),
    };
    const updated = [newItem, ...vaultItems];
    setVaultItems(updated);
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDeleteVaultItem = (id: string) => {
    const updated = vaultItems.filter(item => item.id !== id);
    setVaultItems(updated);
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearVault = () => {
    if (window.confirm('Are you sure you want to wipe all encrypted snippets from local storage?')) {
      setVaultItems([]);
      try {
        localStorage.removeItem(VAULT_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  };

  // Transformation Actions
  const runQuickScrub = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setOperationsApplied([]);
      setMatchCount(0);
      return;
    }

    // Step 1: Unmangle
    const unmangled = unmangle(input);
    const ops = [...unmangled.operationsApplied];

    // Step 2: Sanitize
    const sanitized = sanitize(unmangled.content, config, maskStyle);
    if (sanitized.matchCount > 0) {
      ops.push(`Sanitized ${sanitized.matchCount} secret(s)`);
    }

    // Step 3: Format if JSON
    let finalContent = sanitized.sanitized;
    if (unmangled.isJson) {
      try {
        const obj = JSON.parse(finalContent);
        finalContent = JSON.stringify(obj, null, 2);
        setDetectedFormat('Formatted JSON');
      } catch {
        setDetectedFormat('Structured Text');
      }
    } else {
      setDetectedFormat('Sanitized Text');
    }

    setOutput(finalContent);
    setOperationsApplied(ops);
    setMatchCount(sanitized.matchCount);
  }, [input, config, maskStyle]);

  const handleUnmangleOnly = () => {
    if (!input.trim()) return;
    const res = unmangle(input);
    setOutput(res.content);
    setOperationsApplied(res.operationsApplied);
    setDetectedFormat(res.isJson ? 'Unpacked JSON' : 'Unescaped Text');
  };

  const handleSanitizeOnly = () => {
    const target = output || input;
    if (!target.trim()) return;
    const res = sanitize(target, config, maskStyle);
    setOutput(res.sanitized);
    setMatchCount(res.matchCount);
    setOperationsApplied([`Sanitized ${res.matchCount} secret(s)`]);
  };

  const handleFormatOnly = () => {
    const target = output || input;
    try {
      const parsed = JSON.parse(target);
      setOutput(JSON.stringify(parsed, null, 2));
      setDetectedFormat('Formatted JSON');
    } catch {
      // not valid JSON
    }
  };

  const handleSortKeys = () => {
    const target = output || input;
    const sorted = sortJsonString(target);
    setOutput(sorted);
    setOperationsApplied(['Alphabetically sorted object keys']);
  };

  const handleAutoDecode = () => {
    const target = input.trim();
    if (!target) return;
    const decoded = autoDecode(target);
    setOutput(decoded.decodedContent);
    setDetectedFormat(decoded.description);
    setOperationsApplied([decoded.description]);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to Quick Scrub
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runQuickScrub();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runQuickScrub]);

  // Initial run on mount
  useEffect(() => {
    runQuickScrub();
  }, [runQuickScrub]);

  // Copy exports
  const handleCopyRaw = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
  };

  const handleCopyLlmPrompt = () => {
    if (!output) return;
    const promptWrapped = `Here is the sanitized payload/log for context (all credentials, tokens, and PII have been redacted via ScrubPad):\n\n\`\`\`json\n${output}\n\`\`\``;
    navigator.clipboard.writeText(promptWrapped);
  };

  const handleCopySlack = () => {
    if (!output) return;
    const slackWrapped = `\`\`\`\n${output}\n\`\`\``;
    navigator.clipboard.writeText(slackWrapped);
  };

  // Paste handler
  const handlePasteInput = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInput(text);
      }
    } catch {
      // clipboard permission denied
    }
  };

  const isCurrentOutputJson = (() => {
    if (!output) return false;
    try {
      JSON.parse(output);
      return true;
    } catch {
      return false;
    }
  })();

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Header
        onLoadSample={(key) => setInput(SAMPLES[key])}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenVault={() => setIsVaultOpen(true)}
        vaultSavedCount={vaultItems.length}
      />

      <ActionToolbar
        onQuickScrub={runQuickScrub}
        onUnmangle={handleUnmangleOnly}
        onSanitize={handleSanitizeOnly}
        onFormat={handleFormatOnly}
        onSortKeys={handleSortKeys}
        onAutoDecode={handleAutoDecode}
        onOpenDiff={() => setIsDiffOpen(true)}
        onSaveToVault={() => setIsVaultOpen(true)}
        onCopyRaw={handleCopyRaw}
        onCopyLlmPrompt={handleCopyLlmPrompt}
        onCopySlack={handleCopySlack}
        isJson={isCurrentOutputJson}
        hasOutput={Boolean(output)}
        matchCount={matchCount}
      />

      <EditorPane
        input={input}
        output={output}
        onInputChange={setInput}
        onClearInput={() => {
          setInput('');
          setOutput('');
          setOperationsApplied([]);
          setMatchCount(0);
        }}
        onPasteInput={handlePasteInput}
        detectedFormat={detectedFormat}
        operationsApplied={operationsApplied}
        matchCount={matchCount}
      />

      {/* Modals */}
      <DiffModal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
        rawInput={input}
        cleanedOutput={output}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        maskStyle={maskStyle}
        onUpdateMaskStyle={handleUpdateMaskStyle}
      />

      <EncryptedVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        vaultItems={vaultItems}
        onSaveNewItem={handleSaveVaultItem}
        onDeleteItem={handleDeleteVaultItem}
        onClearVault={handleClearVault}
        onRestoreContent={(restored) => {
          setInput(restored);
        }}
        currentOutput={output}
      />
    </div>
  );
}
