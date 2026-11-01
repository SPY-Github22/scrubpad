import { describe, it, expect } from 'vitest';
import { autoDecode, inspectJwt, inspectUrlQueryParams, safeBase64Decode } from '../src/core/decoder';

describe('Auto-Decoder', () => {
  it('should decode Base64 strings correctly', () => {
    const raw = 'Hello from ScrubPad!';
    const encoded = btoa(raw);
    const decoded = safeBase64Decode(encoded);
    expect(decoded).toBe(raw);
  });

  it('should inspect and decode JWT tokens', () => {
    // Standard mock JWT token (alg: HS256, typ: JWT) + { sub: "1234567890", name: "John Doe", admin: true }
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: '1234567890', name: 'John Doe', admin: true }));
    const fakeSignature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const jwt = `${header}.${payload}.${fakeSignature}`;

    const result = inspectJwt(jwt);
    expect(result).not.toBeNull();
    expect(result?.detectedType).toBe('jwt');
    expect(result?.structuredObject).toMatchObject({
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { name: 'John Doe', admin: true },
    });
  });

  it('should parse URL query parameters into structured object', () => {
    const url = 'https://api.github.com/search/repositories?q=scrubpad+language:typescript&sort=stars&order=desc';
    const result = inspectUrlQueryParams(url);

    expect(result).not.toBeNull();
    expect(result?.detectedType).toBe('url_query');
    expect(result?.structuredObject).toEqual({
      q: 'scrubpad language:typescript',
      sort: 'stars',
      order: 'desc'
    });
  });

  it('should auto-detect decoded types seamlessly', () => {
    const base64Json = btoa('{"service":"auth","status":"healthy"}');
    const result = autoDecode(base64Json);

    expect(result.detectedType).toBe('base64');
    expect(result.structuredObject).toEqual({
      service: 'auth',
      status: 'healthy'
    });
  });
});
