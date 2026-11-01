import { describe, it, expect } from 'vitest';
import { unmangle, stripLogPrefixes, extractCurlPayload, deepUnpackJson } from '../src/core/unmangler';

describe('Recursive Unmangler', () => {
  it('should unpack double-escaped JSON strings', () => {
    // Escaped string inside JSON: {"event": "{\"action\":\"login\",\"userId\":42}"}
    const input = '{"event": "{\\"action\\":\\"login\\",\\"userId\\":42}"}';
    const result = unmangle(input);

    expect(result.isJson).toBe(true);
    expect(result.parsedObject).toEqual({
      event: {
        action: 'login',
        userId: 42
      }
    });
    expect(result.operationsApplied).toContain('Recursively parsed nested JSON string fields');
  });

  it('should strip log timestamps and severity prefixes', () => {
    const logLine = '2026-11-02T12:00:00.000Z [ERROR] (api-service): {"error": "Unauthorized", "code": 401}';
    const stripped = stripLogPrefixes(logLine);
    expect(stripped).toBe('{"error": "Unauthorized", "code": 401}');

    const result = unmangle(logLine);
    expect(result.isJson).toBe(true);
    expect(result.parsedObject).toEqual({ error: 'Unauthorized', code: 401 });
  });

  it('should extract payload from cURL command', () => {
    const curl = `curl -X POST https://api.example.com/v1/users \\
      -H "Content-Type: application/json" \\
      -d '{"name": "Alice", "role": "admin"}'`;

    const extracted = extractCurlPayload(curl);
    expect(extracted).toBe('{"name": "Alice", "role": "admin"}');

    const result = unmangle(curl);
    expect(result.isJson).toBe(true);
    expect(result.parsedObject).toEqual({ name: 'Alice', role: 'admin' });
    expect(result.operationsApplied).toContain('Extracted cURL body payload');
  });

  it('should deep unpack multi-level nested JSON strings in arrays', () => {
    const nestedData = {
      items: [
        '{"id": 1, "meta": "{\\"flag\\": true}"}',
        '{"id": 2, "meta": "{\\"flag\\": false}"}'
      ]
    };
    const unpacked = deepUnpackJson(nestedData) as { items: Array<{ id: number; meta: { flag: boolean } }> };
    expect(unpacked.items[0].meta.flag).toBe(true);
    expect(unpacked.items[1].meta.flag).toBe(false);
  });

  it('should decode unicode escape sequences', () => {
    const input = '{"path": "\\u002Fapi\\u002Fv1\\u002Fusers"}';
    const result = unmangle(input);
    expect(result.parsedObject).toEqual({ path: '/api/v1/users' });
  });
});
