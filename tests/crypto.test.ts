import { describe, it, expect } from 'vitest';
import { encryptText, decryptText, computeSecretFingerprint, CryptoDecryptionError } from '../src/core/crypto';

describe('Web Crypto Vault', () => {
  it('should encrypt and decrypt text successfully with valid passphrase', async () => {
    const original = 'Authorization: Bearer my-super-secret-token-12345';
    const password = 'CorrectHorseBatteryStaple#99';

    const encrypted = await encryptText(original, password);
    expect(encrypted.version).toBe(1);
    expect(encrypted.ciphertext).toBeTypeOf('string');
    expect(encrypted.ciphertext).not.toEqual(original);
    expect(encrypted.iv).toBeTypeOf('string');
    expect(encrypted.salt).toBeTypeOf('string');

    const decrypted = await decryptText(encrypted, password);
    expect(decrypted).toBe(original);
  });

  it('should fail decryption if wrong passphrase is provided', async () => {
    const original = 'DATABASE_URL=postgres://user:pass@localhost:5432/prod';
    const password = 'RealPassword123!';
    const wrongPassword = 'WrongPassword456!';

    const encrypted = await encryptText(original, password);
    await expect(decryptText(encrypted, wrongPassword)).rejects.toThrow(CryptoDecryptionError);
  });

  it('should fail decryption if ciphertext is tampered with', async () => {
    const original = 'Sensitive JSON payload';
    const password = 'SecureVaultKey789';

    const encrypted = await encryptText(original, password);
    // Tamper with the ciphertext base64
    const tampered = {
      ...encrypted,
      ciphertext: encrypted.ciphertext.substring(0, encrypted.ciphertext.length - 4) + 'AAAA'
    };

    await expect(decryptText(tampered, password)).rejects.toThrow(CryptoDecryptionError);
  });

  it('should generate deterministic fingerprints of exact length', async () => {
    const token = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    const fp1 = await computeSecretFingerprint(token, 8);
    const fp2 = await computeSecretFingerprint(token, 8);
    const fpLong = await computeSecretFingerprint(token, 16);

    expect(fp1).toHaveLength(8);
    expect(fp1).toEqual(fp2);
    expect(fpLong).toHaveLength(16);
    expect(fpLong.startsWith(fp1)).toBe(true);

    const diffToken = 'ghp_DIFFERENT_TOKEN_1234567890';
    const fpDiff = await computeSecretFingerprint(diffToken, 8);
    expect(fpDiff).not.toEqual(fp1);
  });
});
