/**
 * Client-Side Cryptographic Vault for ScrubPad
 * 
 * Implements zero-leak encryption using Web Crypto API:
 * - AES-GCM (256-bit)
 * - PBKDF2 key derivation with SHA-256 and 100,000 iterations
 * - Cryptographically secure 12-byte IV per encryption
 * - SHA-256 deterministic secret masking fingerprints
 */

export interface EncryptedPayload {
  version: 1;
  ciphertext: string; // base64
  iv: string;         // base64
  salt: string;       // base64
  timestamp: number;
}

export class CryptoDecryptionError extends Error {
  constructor(message: string = 'Failed to decrypt payload. Invalid passphrase or corrupted data.') {
    super(message);
    this.name = 'CryptoDecryptionError';
  }
}

// Convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive an AES-GCM 256-bit CryptoKey from a passphrase and salt using PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt arbitrary text with a passphrase using AES-GCM 256
 */
export async function encryptText(text: string, passphrase: string): Promise<EncryptedPayload> {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty.');
  }
  if (!passphrase) {
    throw new Error('Passphrase cannot be empty.');
  }

  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);
  const encodedText = enc.encode(text);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedText
  );

  return {
    version: 1,
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    timestamp: Date.now(),
  };
}

/**
 * Decrypt an EncryptedPayload back into plaintext using the passphrase
 */
export async function decryptText(payload: EncryptedPayload, passphrase: string): Promise<string> {
  if (!payload || !payload.ciphertext || !payload.iv || !payload.salt) {
    throw new CryptoDecryptionError('Invalid encrypted payload structure.');
  }

  try {
    const salt = base64ToBuffer(payload.salt);
    const iv = base64ToBuffer(payload.iv);
    const ciphertext = base64ToBuffer(payload.ciphertext);

    const key = await deriveKey(passphrase, salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    throw new CryptoDecryptionError();
  }
}

/**
 * Computes a truncated SHA-256 hex fingerprint for a secret string.
 * Used for deterministic token masking (e.g. [MASK:8f12cb]) so developers
 * can verify identity without leaking any secret bytes.
 */
export async function computeSecretFingerprint(secret: string, length: number = 8): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.substring(0, length);
}
