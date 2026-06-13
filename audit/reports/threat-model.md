# Threat Model — NEØN SERPENT

> **STRIDE** threat model for the NEØN SERPENT 3D browser game.
> Generated: 2026-06-13
> Methodology: Microsoft STRIDE + OWASP ASVS 5.0

## 1. System Overview

| Aspect | Value |
|--------|-------|
| **Application type** | Client-side PWA (Single Page App) |
| **Deployment** | GitHub Pages (static) |
| **Backend** | None (100% client-side) |
| **Database** | None (localStorage only) |
| **Authentication** | None (no user accounts) |
| **Data sensitivity** | Low (high scores, settings, calibration) |

### Architecture Diagram

```
┌─────────────────────────────────────────────┐
│            Browser (Client)                 │
│  ┌──────────────────────────────────────┐   │
│  │  index.html                          │   │
│  │  ┌────────────────────────────────┐  │   │
│  │  │  Content-Security-Policy       │  │   │
│  │  │  Permissions-Policy             │  │   │
│  │  │  Referrer-Policy                │  │   │
│  │  └────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────┐  │   │
│  │  │  Service Worker (sw.js)        │  │   │
│  │  └────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────┐  │   │
│  │  │  ImportMap (SRI verified)      │  │   │
│  │  │  https://unpkg.com/three@...   │  │   │
│  │  └────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────┐  │   │
│  │  │  Modules (ES2020)              │  │   │
│  │  │  - src/main.js                 │  │   │
│  │  │  - Safe DOM API (no innerHTML) │  │   │
│  │  └────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────┐  │   │
│  │  │  Storage (localStorage, ns_*)  │  │   │
│  │  └────────────────────────────────┘  │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## 2. Assets

| ID | Asset | Sensitivity | Storage |
|----|-------|-------------|---------|
| A1 | Three.js library | High (RCE if compromised) | CDN cache (SRI verified) |
| A2 | Game source code | Low (public) | Service Worker cache |
| A3 | User high scores | Low (non-PII) | localStorage |
| A4 | User settings | Low | localStorage |
| A5 | Calibration data | Low | localStorage |

## 3. Trust Boundaries

| ID | Boundary | From | To |
|----|----------|------|-----|
| TB1 | Network → Browser | External (CDN) | Same-origin resources (CSP restricted) |
| TB2 | Browser → localStorage | JavaScript | Persistent storage (namespaced) |
| TB3 | Web Component → Shadow DOM | Safe DOM API | Encapsulated DOM |
| TB4 | Service Worker → Cache API | SW script | Cache storage (versioned) |
| TB5 | Three.js CDN | External (SRI verified) | Browser |

## 4. STRIDE Analysis (Post-Fix)

### 4.1 Spoofing (S)
| Threat | Status |
|--------|--------|
| S1: Impersonate CDN | ✅ **Mitigated** — SRI hash on importmap |
| S2: Forge localStorage | ✅ Acceptable (local-only, no server) |
| S3: Fake Service Worker | ✅ Mitigated — HTTPS + CSP `worker-src 'self'` |

### 4.2 Tampering (T)
| Threat | Status |
|--------|--------|
| T1: Modify JS in DevTools | ✅ Acceptable (self-inflicted) |
| T2: Tamper localStorage | ✅ Acceptable |
| T3: Inject script via XSS | ✅ **Mitigated** — CSP blocks inline scripts; innerHTML replaced |
| T4: Modify SW cache | ✅ Mitigated — versioned cache |
| T5: MITM on first load | ✅ Mitigated — HTTPS + HSTS |

### 4.3 Repudiation (R)
- ✅ N/A — single-user local app

### 4.4 Information Disclosure (I)
| Threat | Status |
|--------|--------|
| I1: localStorage leak | ✅ Low sensitivity |
| I2: Error stack traces | ✅ **Mitigated** — sanitized `__bootErr` |
| I3: Fingerprinting | 🟡 Future work |
| I4: `__bootErr` exposure | ✅ **Mitigated** — sanitized |

### 4.5 Denial of Service (D)
| Threat | Status |
|--------|--------|
| D1: Battery exhaustion | ✅ `prefers-reduced-motion` respected |
| D2: WebGL memory exhaustion | ✅ Three.js handles context loss |
| D5: Three.js CDN DoS | 🟡 Future: self-host |

### 4.6 Elevation of Privilege (E)
| Threat | Status |
|--------|--------|
| E1: Sandbox escape | ✅ Browser vendor responsibility |
| E2: Same-origin bypass | ✅ No cross-origin loads (SRI only) |
| E3: Feature policy abuse | ✅ **Mitigated** — Permissions-Policy |

## 5. Mitigations Summary (All Implemented)

| Mitigation | Status |
|------------|--------|
| HTTPS only | ✅ GitHub Pages |
| HSTS | ✅ GitHub Pages default |
| CSP | ✅ **ADDED** |
| SRI for Three.js | ✅ **ADDED** |
| Permissions-Policy | ✅ **ADDED** |
| Referrer-Policy | ✅ **ADDED** |
| X-Content-Type-Options | ✅ **ADDED** |
| X-Frame-Options (CSP frame-ancestors) | ✅ **ADDED** |
| Safe DOM API (no innerHTML) | ✅ **DONE in 4 files** |
| localStorage namespacing | ✅ Already in place |
| License compliance | ✅ **FIXED** |
| Security headers in CI | ✅ **NEW WORKFLOW** |
| security.txt | ✅ **ADDED** |
| Dependabot | ✅ Already in place |
| CodeQL | ✅ Already in place |

## 6. Residual Risks

| Risk | Severity | Mitigation Strategy |
|------|----------|---------------------|
| Three.js CDN compromise | Low | SRI detects; CSP blocks inline execution |
| Future code regression | Low | CSP defense-in-depth + CodeQL + ESLint |
| Fingerprinting | Low | Future: canvas noise |
| Translation poisoning | Low | Future: i18n key validation |

## 7. Verdict

**Post-fix risk level**: 🟢 **LOW**

All P0 findings remediated. P1 findings addressed via defense-in-depth. Residual risks are acceptable for a static, client-side game with no backend.
