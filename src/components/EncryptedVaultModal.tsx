import React, { useState } from 'react';
import { X, Lock, Unlock, Key, Trash2, ArrowUpRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { EncryptedPayload, encryptText, decryptText } from '../core/crypto';

export interface VaultItem {
  id: string;
  title: string;
  encrypted: EncryptedPayload;
  createdAt: number;
}

interface EncryptedVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultItems: VaultItem[];
  onSaveNewItem: (title: string, encrypted: EncryptedPayload) => void;
  onDeleteItem: (id: string) => void;
  onClearVault: () => void;
  onRestoreContent: (content: string) => void;
  currentOutput: string;
}

export const EncryptedVaultModal: React.FC<EncryptedVaultModalProps> = ({
  isOpen,
  onClose,
  vaultItems,
  onSaveNewItem,
  onDeleteItem,
  onClearVault,
  onRestoreContent,
  currentOutput,
}) => {
  const [saveTitle, setSaveTitle] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Decryption state
  const [decryptId, setDecryptId] = useState<string | null>(null);
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!saveTitle.trim()) {
      setSaveError('Please enter a title for this snippet.');
      return;
    }
    if (!passphrase || passphrase.length < 6) {
      setSaveError('Passphrase must be at least 6 characters.');
      return;
    }
    if (!currentOutput) {
      setSaveError('There is no cleaned output to encrypt and save.');
      return;
    }

    try {
      const encrypted = await encryptText(currentOutput, passphrase);
      onSaveNewItem(saveTitle.trim(), encrypted);
      setSaveTitle('');
      setPassphrase('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Encryption failed.';
      setSaveError(msg);
    }
  };

  const handleDecrypt = async (item: VaultItem) => {
    setDecryptError(null);
    setDecryptedText(null);

    if (!decryptPassphrase) {
      setDecryptError('Please enter the passphrase.');
      return;
    }

    try {
      const text = await decryptText(item.encrypted, decryptPassphrase);
      setDecryptedText(text);
      setDecryptError(null);
    } catch {
      setDecryptError('Invalid passphrase or corrupted ciphertext.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AES-GCM Encrypted Local Vault
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PBKDF2 SHA-256
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Encrypted with your local key before touching browser storage. Zero unencrypted bytes stored.
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Save Current Output Box */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encrypt & Save Current Output</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Snippet Label / Title
                  </label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="e.g. Staging Auth Response"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Encryption Passphrase
                  </label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Secret passphrase (min 6 chars)"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {saveError && (
                <div className="text-xs text-red-400 flex items-center gap-1.5 bg-red-950/30 border border-red-900/50 p-2 rounded">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{saveError}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-900/50 p-2 rounded">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Successfully encrypted and stored in local vault!</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!currentOutput}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-md text-xs font-medium transition"
                >
                  Encrypt & Save
                </button>
              </div>
            </form>
          </div>

          {/* Stored Snippets List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              <span>Saved Encrypted Snippets ({vaultItems.length})</span>
              {vaultItems.length > 0 && (
                <button
                  onClick={onClearVault}
                  className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Wipe Vault</span>
                </button>
              )}
            </div>

            {vaultItems.length === 0 ? (
              <div className="text-neutral-500 text-xs text-center py-8 bg-neutral-950 border border-neutral-800/80 rounded-lg">
                No encrypted snippets stored. Use the form above to protect any cleaned payload.
              </div>
            ) : (
              <div className="space-y-2">
                {vaultItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-neutral-950 border border-neutral-800/80 rounded-lg p-3.5 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-neutral-200">{item.title}</span>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          {new Date(item.createdAt).toLocaleString()} • {item.encrypted.ciphertext.length} bytes ciphertext
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setDecryptId(decryptId === item.id ? null : item.id);
                            setDecryptedText(null);
                            setDecryptError(null);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                        >
                          <Unlock className="w-3 h-3 text-emerald-400" />
                          <span>{decryptId === item.id ? 'Hide' : 'Unlock'}</span>
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 text-neutral-500 hover:text-red-400 transition"
                          title="Delete snippet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Decryption Panel for this item */}
                    {decryptId === item.id && (
                      <div className="pt-3 border-t border-neutral-800/80 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={decryptPassphrase}
                            onChange={(e) => setDecryptPassphrase(e.target.value)}
                            placeholder="Enter passphrase to decrypt"
                            className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-200 outline-none focus:border-emerald-500"
                          />
                          <button
                            onClick={() => handleDecrypt(item)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition"
                          >
                            Decrypt
                          </button>
                        </div>

                        {decryptError && (
                          <div className="text-[11px] text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{decryptError}</span>
                          </div>
                        )}

                        {decryptedText && (
                          <div className="bg-neutral-900 border border-emerald-900/40 rounded p-2.5 space-y-2">
                            <pre className="font-mono text-[11px] text-emerald-300 max-h-36 overflow-auto whitespace-pre-wrap break-all">
                              {decryptedText}
                            </pre>
                            <div className="flex justify-end">
                              <button
                                onClick={() => {
                                  onRestoreContent(decryptedText);
                                  onClose();
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded text-xs transition"
                              >
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Load into Editor</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
