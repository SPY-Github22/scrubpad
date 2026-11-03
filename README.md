# ScrubPad 🛡️✨

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-emerald?style=for-the-badge&logo=github)](https://spy-github22.github.io/scrubpad/)
[![CI & Deployment](https://github.com/SPY-Github22/scrubpad/actions/workflows/ci.yml/badge.svg)](https://github.com/SPY-Github22/scrubpad/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **The Zero-Leak Developer Scratchpad & Payload Sanitizer**  
> *Recursive JSON un-mangler, zero-leak credential redactor, AES-GCM encrypted local vault, and semantic diff engine.*

🌐 **Live Web App**: [https://spy-github22.github.io/scrubpad/](https://spy-github22.github.io/scrubpad/)

---

## 🚀 The Daily Friction It Solves

Every day, engineers copy logs and API payloads from AWS CloudWatch, Datadog, Docker, Sentry, terminal outputs, and cURL commands:
1. **Double/Triple-Escaped Payloads**: Logs embed stringified JSON inside JSON (`{\"details\":\"{\\\"token\\\":\\\"ghp_...\\\"}\"}`), escaped newlines (`\n`), unicode characters (`\u002F`), or URL encoding.
2. **Accidental Credential Leaks**: Payloads contain live AWS keys (`AKIA...`), Bearer tokens, GitHub personal access tokens, database connection URIs, or customer emails. Pasting these into public LLMs (ChatGPT, Claude) or public Slack channels risks enterprise security breaches.
3. **Disparate, Unsafe Online Tools**: Most web tools are ad-ridden single-purpose formatters that send your raw payloads to third-party servers, directly violating enterprise data compliance policies.

**ScrubPad** solves this in a single, lightning-fast, 100% offline-first web application.

---

## 🔒 Security Architecture: Zero-Leak Guarantee

ScrubPad is engineered specifically for privacy and enterprise security:

- **Browser Content Security Policy (CSP)**:
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; font-src 'self' data:; object-src 'none'; base-uri 'self';
  ```
  `connect-src 'none'` cryptographically guarantees that your browser **cannot** make outbound HTTP/WebSocket network calls. Zero bytes ever leave your device.
- **Client-Side AES-GCM 256-Bit Encrypted Vault**:
  Saved scratchpad items are encrypted in local memory using `crypto.subtle` (AES-GCM 256 + PBKDF2 with SHA-256 and 100,000 iterations). Zero unencrypted bytes ever touch `localStorage`.
- **Zero Third-Party Telemetry**:
  No Google Analytics, no tracking pixels, no telemetry SDKs.

---

## ✨ Features

- **⚡ Recursive Un-mangler**: Automatically unpacks nested JSON strings, unescapes characters (`\"`, `\n`, `\t`, `\/`), cleans log timestamps and severity prefixes (CloudWatch, Datadog, ISO 8601), and extracts bodies from `curl` commands.
- **🛡️ 1-Click Secret & PII Redactor**:
  - AWS Access Key IDs (`AKIA...`)
  - GitHub Classic & Fine-grained Personal Access Tokens (`ghp_`, `github_pat_`)
  - OpenAI, Anthropic, & AI API keys (`sk-...`, `sk-ant-...`)
  - Google Cloud & Firebase keys (`AIza...`)
  - Stripe Secret & Restricted keys (`sk_live_`, `rk_live_`)
  - Slack Tokens (`xoxb-`, `xoxp-`)
  - Private Keys (`-----BEGIN RSA/EC/OPENSSH/PGP PRIVATE KEY-----`)
  - Database connection strings (`postgres://user:pass@host...`, `mongodb://`, `redis://`)
  - Key-Value passwords in JSON (`"password": "..."`)
  - Email addresses & public IPv4 addresses
- **🎭 Configurable Masking Styles**:
  - `[REDACTED_TYPE]` (Semantic descriptive tags)
  - `********` (Minimalist asterisk masking)
  - `[TYPE:8f2a1c]` (Cryptographic deterministic fingerprint for cross-matching identical secrets without revealing secret bytes)
- **🔍 Semantic Key-Sorted Diff Viewer**:
  Alphabetically sorts nested JSON keys before diffing to eliminate false order differences, showing exact additions and removals.
- **🧩 Universal Auto-Decoder**:
  Auto-detects and decodes JWT headers & payload claims, Base64 strings, and URL query parameters into structured objects.
- **📋 1-Click Developer Exports**:
  - *Copy Cleaned Raw*: Clean sanitized output for codebases.
  - *Copy as LLM Prompt*: Pre-wraps payload in fenced markdown with a security assertion for Claude/ChatGPT/Gemini.
  - *Copy for Slack*: Formats code blocks for Slack/Discord.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Cryptography**: Web Crypto API (`window.crypto.subtle`)
- **Testing**: [Vitest](https://vitest.dev/) (100% test coverage for crypto, sanitizer, unmangler, and diff engines)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/SPY-Github22/scrubpad.git
cd scrubpad

# Install dependencies
npm install

# Run unit test suite
npm test

# Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + Enter` (or `Cmd + Enter`) | **Quick Scrub** (Unmangle + Sanitize + Format in 1 step) |
| `Ctrl + Shift + C` | Copy Clean Output to Clipboard |

---

## 🧪 Unit Tests

Run the Vitest suite:
```bash
npm test
```

Includes 23 automated tests verifying:
- PBKDF2 AES-GCM encryption & tamper detection
- Recursive stringified JSON unpacking & log prefix removal
- Secret regex heuristic detection & URI password masking
- JWT, Base64, and URL query parsing
- Deterministic key sorting and line-by-line diffing

---

## 📄 License

MIT © 2026 ScrubPad Contributors
