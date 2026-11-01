/**
 * Recursive Unmangler for ScrubPad
 * 
 * Unpacks escaped JSON strings, removes nested stringification,
 * decodes unicode escapes, cleans log prefixes, and extracts curl payloads.
 */

export interface UnmangleOptions {
  recursiveJson?: boolean;
  stripLogPrefixes?: boolean;
  unescapeSequences?: boolean;
  extractCurlData?: boolean;
}

export interface UnmangleResult {
  content: string;
  isJson: boolean;
  parsedObject: unknown | null;
  operationsApplied: string[];
}

/**
 * Regex for standard log prefixes:
 * - ISO-8601 timestamps (2026-11-02T00:12:34.567Z)
 * - Bracketed timestamps [2026-11-02 00:12:34]
 * - Log levels (INFO, WARN, ERROR, DEBUG, TRACE, FATAL)
 * - Thread/worker tags like [main] or (worker-1)
 */
const LOG_PREFIX_REGEX = /^(?:\[?[0-9]{4}-[0-9]{2}-[0-9]{2}[T\s][0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,6})?(?:Z|[+-][0-9]{2}:?[0-9]{2})?\]?\s*)?(?:\[?(?:INFO|WARN|WARNING|ERROR|DEBUG|TRACE|FATAL|CRITICAL)\]?[:\s-]*)?(?:\([^)]+\)[:\s-]*)?(?:\[[^\]]+\][:\s-]*)?\s*/i;

/**
 * Decodes standard unicode escape sequences like \u002F or \u003c
 */
export function decodeUnicodeEscapes(input: string): string {
  return input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
}

/**
 * Clean common escape sequences (\n, \t, \r, \", \\)
 */
export function unescapeStringLiterals(input: string): string {
  let cleaned = decodeUnicodeEscapes(input);
  // Replace escaped slashes
  cleaned = cleaned.replace(/\\\//g, '/');
  return cleaned;
}

/**
 * Strip log line prefixes (e.g. timestamps, levels) from each line or from the front
 */
export function stripLogPrefixes(input: string): string {
  const lines = input.split('\n');
  const cleanedLines = lines.map(line => {
    const trimmed = line.trimStart();
    const match = trimmed.match(LOG_PREFIX_REGEX);
    if (match && match[0].length > 0) {
      const remainder = trimmed.slice(match[0].length).trimStart();
      // If the remainder looks like JSON or structured data, strip the prefix
      if (remainder.startsWith('{') || remainder.startsWith('[') || remainder.startsWith('"')) {
        return remainder;
      }
    }
    return line;
  });
  return cleanedLines.join('\n');
}

/**
 * Extracts payload data from a cURL command if present
 */
export function extractCurlPayload(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed.toLowerCase().startsWith('curl')) {
    return null;
  }

  // Look for --data, -d, --data-raw, --data-binary followed by single/double quoted payload
  const dataMatch = trimmed.match(/(?:--data|--data-raw|--data-binary|-d)\s+(?:'([^']*)'|"((?:[^"\\]|\\.)*)")/);
  if (dataMatch) {
    return dataMatch[1] ?? dataMatch[2] ?? null;
  }
  return null;
}

/**
 * Recursively parses string values in an object/array if they contain valid JSON
 */
export function deepUnpackJson(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        return deepUnpackJson(parsed);
      } catch {
        return value;
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => deepUnpackJson(item));
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = deepUnpackJson(v);
    }
    return result;
  }

  return value;
}

/**
 * Main unmangle function
 */
export function unmangle(rawInput: string, options: UnmangleOptions = {}): UnmangleResult {
  const {
    recursiveJson = true,
    stripLogPrefixes: shouldStripPrefixes = true,
    unescapeSequences = true,
    extractCurlData = true,
  } = options;

  let current = rawInput.trim();
  const ops: string[] = [];

  // 1. Check for cURL payload
  if (extractCurlData && current.toLowerCase().startsWith('curl')) {
    const curlData = extractCurlPayload(current);
    if (curlData !== null) {
      current = curlData;
      ops.push('Extracted cURL body payload');
    }
  }

  // 2. Strip log prefixes if present
  if (shouldStripPrefixes) {
    const stripped = stripLogPrefixes(current);
    if (stripped !== current) {
      current = stripped;
      ops.push('Stripped log timestamps and severity levels');
    }
  }

  // 3. If the entire string is wrapped in quotes with internal escapes, unwrap outer quotes
  if (current.startsWith('"') && current.endsWith('"') && current.length >= 2) {
    try {
      const unwrapped = JSON.parse(current);
      if (typeof unwrapped === 'string') {
        current = unwrapped;
        ops.push('Unwrapped outer escaped string');
      }
    } catch {
      // Continue if not a pure JSON string
    }
  }

  // 4. Try parsing as JSON
  let isJson = false;
  let parsedObject: unknown | null = null;

  try {
    parsedObject = JSON.parse(current);
    isJson = true;
  } catch {
    // If initial parse fails, try unescaping common literals and parse again
    if (unescapeSequences) {
      const unescaped = unescapeStringLiterals(current);
      try {
        parsedObject = JSON.parse(unescaped);
        current = unescaped;
        isJson = true;
        ops.push('Unescaped literals and resolved JSON');
      } catch {
        // Not valid JSON, retain unescaped string
        if (unescaped !== current) {
          current = unescaped;
          ops.push('Unescaped unicode and escape sequences');
        }
      }
    }
  }

  // 5. If JSON, perform deep recursive unpacking
  if (isJson && recursiveJson && parsedObject !== null) {
    const unpacked = deepUnpackJson(parsedObject);
    const unpackedStr = JSON.stringify(unpacked, null, 2);
    if (unpackedStr !== JSON.stringify(parsedObject, null, 2)) {
      parsedObject = unpacked;
      current = unpackedStr;
      ops.push('Recursively parsed nested JSON string fields');
    } else {
      current = JSON.stringify(parsedObject, null, 2);
    }
  }

  return {
    content: current,
    isJson,
    parsedObject,
    operationsApplied: ops,
  };
}
