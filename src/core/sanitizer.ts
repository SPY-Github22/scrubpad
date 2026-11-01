/**
 * High-Entropy Secret & PII Redactor for ScrubPad
 * 
 * Accurately detects and redacts cloud credentials, API keys, tokens,
 * database strings, passwords, emails, and IP addresses with zero telemetry.
 */

export type MaskStyle = 'tag' | 'asterisk' | 'hash';

export interface RedactionRuleConfig {
  awsKeys: boolean;
  githubTokens: boolean;
  aiApiKeys: boolean;
  googleCloudKeys: boolean;
  stripeKeys: boolean;
  slackTokens: boolean;
  privateKeys: boolean;
  jwtAndBearer: boolean;
  databaseUrls: boolean;
  keyValuePasswords: boolean;
  emails: boolean;
  ipAddresses: boolean;
}

export const DEFAULT_REDACTION_CONFIG: RedactionRuleConfig = {
  awsKeys: true,
  githubTokens: true,
  aiApiKeys: true,
  googleCloudKeys: true,
  stripeKeys: true,
  slackTokens: true,
  privateKeys: true,
  jwtAndBearer: true,
  databaseUrls: true,
  keyValuePasswords: true,
  emails: true,
  ipAddresses: false, // Default false to avoid mangling standard local subnet/docs unless requested
};

export interface RedactedMatch {
  ruleId: string;
  category: string;
  originalText: string;
  replacementText: string;
  index: number;
}

export interface SanitizerResult {
  sanitized: string;
  matchCount: number;
  matches: RedactedMatch[];
}

/**
 * Fast synchronous DJB2-based 6-character hex hash for deterministic masking
 */
function fastShortHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const unsigned = hash >>> 0;
  return unsigned.toString(16).padStart(6, '0').slice(0, 6);
}

function generateMask(secret: string, label: string, style: MaskStyle): string {
  switch (style) {
    case 'asterisk':
      return '********';
    case 'hash':
      return `[${label}:${fastShortHash(secret)}]`;
    case 'tag':
    default:
      return `[REDACTED_${label}]`;
  }
}

interface RuleDefinition {
  id: string;
  category: string;
  label: string;
  configKey: keyof RedactionRuleConfig;
  regex: RegExp;
  // If replacement needs group-level targeting
  customReplacer?: (match: string, ...args: unknown[]) => string;
}

const REDACTION_RULES: RuleDefinition[] = [
  {
    id: 'private_key',
    category: 'Credentials',
    label: 'PRIVATE_KEY',
    configKey: 'privateKeys',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g,
  },
  {
    id: 'aws_access_key',
    category: 'Cloud Credentials',
    label: 'AWS_ACCESS_KEY',
    configKey: 'awsKeys',
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    id: 'github_pat',
    category: 'Tokens',
    label: 'GITHUB_TOKEN',
    configKey: 'githubTokens',
    regex: /\b(?:gh[pousr]_[A-Za-z0-9_]{36,255}|github_pat_[A-Za-z0-9_]{82})\b/g,
  },
  {
    id: 'ai_api_key',
    category: 'API Keys',
    label: 'AI_API_KEY',
    configKey: 'aiApiKeys',
    regex: /\bsk-(?:ant-)?[a-zA-Z0-9_-]{20,}\b/g,
  },
  {
    id: 'google_api_key',
    category: 'API Keys',
    label: 'GOOGLE_API_KEY',
    configKey: 'googleCloudKeys',
    regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
  },
  {
    id: 'stripe_key',
    category: 'API Keys',
    label: 'STRIPE_KEY',
    configKey: 'stripeKeys',
    regex: /\b[sr]k_live_[0-9a-zA-Z]{24,}\b/g,
  },
  {
    id: 'slack_token',
    category: 'Tokens',
    label: 'SLACK_TOKEN',
    configKey: 'slackTokens',
    regex: /\bxox[baprs]-[0-9a-zA-Z]{10,48}\b/g,
  },
  {
    id: 'jwt_token',
    category: 'Tokens',
    label: 'JWT',
    configKey: 'jwtAndBearer',
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  },
  {
    id: 'bearer_token',
    category: 'Tokens',
    label: 'BEARER_TOKEN',
    configKey: 'jwtAndBearer',
    regex: /\bBearer\s+([A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_+/=]*)\b/g,
  },
  {
    id: 'database_password',
    category: 'Credentials',
    label: 'DB_PASSWORD',
    configKey: 'databaseUrls',
    regex: /((?:postgres|postgresql|mysql|mongodb|redis|amqp|mssql):\/\/[^:@\s]+:)([^@\s]+)(@)/gi,
  },
  {
    id: 'kv_password',
    category: 'Credentials',
    label: 'SECRET',
    configKey: 'keyValuePasswords',
    regex: /(["']?(?:password|passwd|pwd|secret|api_key|apikey|auth_token|access_token|private_key)["']?\s*[:=]\s*["'])([^"'\r\n]+)(["'])/gi,
  },
  {
    id: 'email',
    category: 'PII',
    label: 'EMAIL',
    configKey: 'emails',
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
  },
  {
    id: 'ipv4',
    category: 'Network',
    label: 'IP_ADDRESS',
    configKey: 'ipAddresses',
    // Matches valid IPv4, excluding 127.0.0.1 and 0.0.0.0
    regex: /\b(?!127\.0\.0\.1\b|0\.0\.0\.0\b)(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  },
];

/**
 * Sanitize text using active redaction rules and chosen mask style
 */
export function sanitize(
  text: string,
  config: Partial<RedactionRuleConfig> = {},
  style: MaskStyle = 'tag'
): SanitizerResult {
  const effectiveConfig: RedactionRuleConfig = {
    ...DEFAULT_REDACTION_CONFIG,
    ...config,
  };

  let result = text;
  const matches: RedactedMatch[] = [];

  for (const rule of REDACTION_RULES) {
    if (!effectiveConfig[rule.configKey]) {
      continue;
    }

    if (rule.id === 'database_password') {
      result = result.replace(rule.regex, (_full, prefix: string, pass: string, suffix: string, offset: number) => {
        const replacement = generateMask(pass, rule.label, style);
        matches.push({
          ruleId: rule.id,
          category: rule.category,
          originalText: pass,
          replacementText: replacement,
          index: offset + prefix.length,
        });
        return `${prefix}${replacement}${suffix}`;
      });
    } else if (rule.id === 'kv_password') {
      result = result.replace(rule.regex, (_full, prefix: string, secret: string, suffix: string, offset: number) => {
        const replacement = generateMask(secret, rule.label, style);
        matches.push({
          ruleId: rule.id,
          category: rule.category,
          originalText: secret,
          replacementText: replacement,
          index: offset + prefix.length,
        });
        return `${prefix}${replacement}${suffix}`;
      });
    } else if (rule.id === 'bearer_token') {
      result = result.replace(rule.regex, (_full, token: string, offset: number) => {
        const replacement = generateMask(token, rule.label, style);
        matches.push({
          ruleId: rule.id,
          category: rule.category,
          originalText: token,
          replacementText: replacement,
          index: offset + 'Bearer '.length,
        });
        return `Bearer ${replacement}`;
      });
    } else {
      result = result.replace(rule.regex, (match, offset: number) => {
        const replacement = generateMask(match, rule.label, style);
        matches.push({
          ruleId: rule.id,
          category: rule.category,
          originalText: match,
          replacementText: replacement,
          index: offset,
        });
        return replacement;
      });
    }
  }

  return {
    sanitized: result,
    matchCount: matches.length,
    matches,
  };
}
