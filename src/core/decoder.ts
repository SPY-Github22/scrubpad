/**
 * Auto-Decoder & Format Inspector for ScrubPad
 * 
 * Auto-detects and decodes:
 * - JWT header & payload claims
 * - URL encoded query strings and search parameters
 * - Base64 encoded JSON or ASCII payloads
 */

export interface DecodedResult {
  detectedType: 'jwt' | 'url_query' | 'base64' | 'plain';
  description: string;
  decodedContent: string;
  structuredObject?: unknown;
}

/**
 * Safely decodes base64 string to UTF-8
 */
export function safeBase64Decode(str: string): string | null {
  const trimmed = str.trim();
  // Quick base64 format check
  if (!/^[A-Za-z0-9+/=_-]+$/.test(trimmed) || trimmed.length < 4) {
    return null;
  }

  // Handle URL-safe base64
  let base64 = trimmed.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  try {
    const binary = atob(base64);
    // Convert binary string to UTF-8
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const text = decoder.decode(bytes);

    // Sanity check: must be predominantly printable characters
    let printableCount = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126) || code > 127) {
        printableCount++;
      }
    }

    if (printableCount / text.length > 0.85) {
      return text;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Inspects and parses JWT token into Header and Payload
 */
export function inspectJwt(input: string): DecodedResult | null {
  const trimmed = input.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [headerB64, payloadB64] = parts;
  const headerStr = safeBase64Decode(headerB64);
  const payloadStr = safeBase64Decode(payloadB64);

  if (!headerStr || !payloadStr) {
    return null;
  }

  try {
    const header = JSON.parse(headerStr);
    const payload = JSON.parse(payloadStr);

    const combined = {
      _type: 'JWT',
      header,
      payload,
      signature: '[PROTECTED_SIGNATURE_BYTES]'
    };

    return {
      detectedType: 'jwt',
      description: 'Decoded JWT Header & Claims Payload',
      decodedContent: JSON.stringify(combined, null, 2),
      structuredObject: combined,
    };
  } catch {
    return null;
  }
}

/**
 * Inspects and parses URL query string or full URL with search parameters
 */
export function inspectUrlQueryParams(input: string): DecodedResult | null {
  const trimmed = input.trim();
  let queryString = '';

  if (trimmed.includes('?')) {
    queryString = trimmed.substring(trimmed.indexOf('?') + 1);
  } else if (
    trimmed.includes('=') &&
    !trimmed.includes('{') &&
    !trimmed.includes('\n') &&
    // Must look like key=value pair (not base64 trailing padding ==)
    /^[a-zA-Z0-9_.~%-]+=[^=]*(?:&[a-zA-Z0-9_.~%-]+=[^=]*)*$/.test(trimmed)
  ) {
    queryString = trimmed;
  } else {
    return null;
  }

  try {
    const params = new URLSearchParams(queryString);
    const entries: Record<string, string | string[]> = {};
    let count = 0;

    for (const [key, value] of params.entries()) {
      count++;
      if (key in entries) {
        const existing = entries[key];
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          entries[key] = [existing, value];
        }
      } else {
        entries[key] = value;
      }
    }

    if (count === 0) {
      return null;
    }

    return {
      detectedType: 'url_query',
      description: `Parsed ${count} URL Query Parameter(s)`,
      decodedContent: JSON.stringify(entries, null, 2),
      structuredObject: entries,
    };
  } catch {
    return null;
  }
}

/**
 * Universal auto-decoder
 */
export function autoDecode(input: string): DecodedResult {
  const trimmed = input.trim();

  // 1. Check if JWT
  const jwt = inspectJwt(trimmed);
  if (jwt) {
    return jwt;
  }

  // 2. Check if URL Query params
  const query = inspectUrlQueryParams(trimmed);
  if (query) {
    return query;
  }

  // 3. Check if standalone Base64
  const b64Decoded = safeBase64Decode(trimmed);
  if (b64Decoded && b64Decoded.length > 0 && b64Decoded !== trimmed) {
    let structured: unknown = undefined;
    try {
      structured = JSON.parse(b64Decoded);
    } catch {
      // plain text
    }

    return {
      detectedType: 'base64',
      description: 'Decoded Base64 Payload',
      decodedContent: structured ? JSON.stringify(structured, null, 2) : b64Decoded,
      structuredObject: structured,
    };
  }

  return {
    detectedType: 'plain',
    description: 'Plain Text / Standard Payload',
    decodedContent: input,
  };
}
