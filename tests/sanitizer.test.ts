import { describe, it, expect } from 'vitest';
import { sanitize } from '../src/core/sanitizer';

describe('Secret and PII Sanitizer', () => {
  it('should redact AWS access key IDs', () => {
    const input = 'Error contacting AWS with key AKIAIOSFODNN7EXAMPLE in us-east-1';
    const result = sanitize(input);

    expect(result.sanitized).toBe('Error contacting AWS with key [REDACTED_AWS_ACCESS_KEY] in us-east-1');
    expect(result.matchCount).toBe(1);
    expect(result.matches[0].category).toBe('Cloud Credentials');
  });

  it('should redact GitHub Personal Access Tokens and Fine-grained PATs', () => {
    const input = 'Clone URL: https://ghp_0123456789abcdefghijklmnopqrstuvwxyz@github.com/repo';
    const result = sanitize(input);

    expect(result.sanitized).toContain('[REDACTED_GITHUB_TOKEN]');
    expect(result.sanitized).not.toContain('ghp_0123456789');
  });

  it('should redact AI API keys (OpenAI / Anthropic)', () => {
    const input = 'Authorization: Bearer sk-1234567890abcdef1234567890abcdef';
    const result = sanitize(input);

    expect(result.sanitized).not.toContain('sk-1234567890');
    expect(result.matchCount).toBeGreaterThan(0);
  });

  it('should redact database connection passwords without corrupting URI structure', () => {
    const input = 'CONNECT_STRING=postgres://dbuser:SuperSecretPassword123@db.prod.internal:5432/core_db';
    const result = sanitize(input);

    expect(result.sanitized).toBe('CONNECT_STRING=postgres://dbuser:[REDACTED_DB_PASSWORD]@db.prod.internal:5432/core_db');
  });

  it('should redact key-value password assignments in JSON', () => {
    const input = '{"username": "admin", "password": "UnsafePlainTextPassword!"}';
    const result = sanitize(input);

    expect(result.sanitized).toBe('{"username": "admin", "password": "[REDACTED_SECRET]"}');
  });

  it('should redact private key blocks', () => {
    const input = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Yt09
...dummy private key data...
-----END RSA PRIVATE KEY-----`;
    const result = sanitize(input);

    expect(result.sanitized).toBe('[REDACTED_PRIVATE_KEY]');
  });

  it('should support asterisk and deterministic hash masking styles', () => {
    const secret = 'user@example.com';
    const resultAsterisk = sanitize(secret, {}, 'asterisk');
    expect(resultAsterisk.sanitized).toBe('********');

    const resultHash = sanitize(secret, {}, 'hash');
    expect(resultHash.sanitized).toMatch(/^\[EMAIL:[a-f0-9]{6}\]$/);
  });
});
