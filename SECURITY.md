# Security Policy

> NEØN SERPENT is a client-side browser game. We take security seriously even
> though there's no server-side code.

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 3.x     | ✅ Active          |
| 2.x     | ⚠️ Critical fixes only |
| < 2.0   | ❌ End of life     |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report privately via one of these channels:

1. **GitHub Security Advisories** (preferred):
   https://github.com/vdirienzo/neon-serpent/security/advisories/new

2. **Email**: security@[project-domain] (PGP key on request)

### What to include

- A clear description of the vulnerability
- Steps to reproduce
- Impact assessment (what an attacker could do)
- Suggested fix (if any)
- Your name/handle for the security hall of fame (optional)

### What to expect

- **48 hours**: Initial acknowledgement
- **7 days**: Triage and severity assessment
- **30 days**: Target fix timeline (negotiable for complex issues)
- **Public disclosure**: Coordinated with reporter, typically 90 days after report

## Security Scope

### In scope

- **Client-side XSS** via user-generated content (none currently, but defensive coding matters)
- **Dependency vulnerabilities** in `three`, build tools, or runtime deps
- **localStorage poisoning** — the game stores high scores and settings
- **Service Worker** — cache poisoning or scope confusion
- **Prototype pollution** via JSON parsing (we use `Object.freeze` defensively)
- **CSP bypasses** — Content Security Policy in `index.html`
- **Supply chain attacks** in npm dependencies

### Out of scope

- Browser-specific bugs (report to the browser vendor)
- Social engineering
- Physical attacks
- Issues requiring a malicious user to control the victim's browser

## Security Practices

- **No telemetry**: the game collects no data
- **No external API calls**: all assets are local except Three.js CDN
- **Frozen objects**: critical config is `Object.freeze()`d to prevent tampering
- **localStorage namespacing**: keys are prefixed `ns_` and validated on read
- **CSP headers**: restrictive Content Security Policy
- **Subresource Integrity**: Three.js loaded with SRI hash
- **Dependency scanning**: Dependabot + CodeQL on every PR
- **Branch protection**: main requires CI pass + 1 review

## Hall of Fame

We credit security researchers who responsibly disclose issues. Add your
name here with our thanks (PR welcome after coordinated disclosure).

- _No disclosures yet_

## Acknowledgements

This security policy is based on the
[GitHub Security Lab template](https://github.com/securitylab)
and [disclose.io](https://disclose.io) best practices.
