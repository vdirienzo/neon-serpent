# 🚀 NEØN SERPENT — Deploy to Vercel

> **One-click deploy guide** — choose your method.

## 🎯 Method 1: Vercel Dashboard (Recommended, 30 seconds)

Click this button to import the repo:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvdirienzo%2Fneon-serpent&project-name=neon-serpent&repo-name=neon-serpent&root-directory=.git)

Or manually:

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select `vdirienzo/neon-serpent`
4. **Project Name**: `neon-serpent` (or whatever you prefer)
5. **Framework Preset**: Vite (auto-detected)
6. **Root Directory**: `./` (default)
7. Click **Deploy**
8. Wait ~2 minutes
9. Your game is live at `https://neon-serpent-<hash>.vercel.app`

The Vercel project will auto-deploy on every push to `main`.

## 🔑 Method 2: Vercel CLI (Command-line)

If you want to deploy from this terminal:

```bash
# 1. Login (opens browser)
vercel login

# 2. Deploy to preview
cd /home/user/Projects/opensake
vercel

# 3. Deploy to production
vercel --prod
```

## 🛠️ Method 3: Vercel API (Token-based)

If you have a `VERCEL_TOKEN`:

```bash
# Create token at: https://vercel.com/account/tokens
export VERCEL_TOKEN="your-token-here"

# Deploy via API
curl -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "neon-serpent",
    "gitSource": {
      "type": "github",
      "ref": "main",
      "repoId": "REPO_ID"
    },
    "target": "production"
  }'
```

## 📋 What Vercel will do

When the repo is imported, Vercel will:
- ✅ Auto-detect Vite framework
- ✅ Run `npm run build` (outputs to `dist/`)
- ✅ Apply the `vercel.json` config (security headers, SPA rewrite, cache)
- ✅ Deploy to a `*.vercel.app` URL
- ✅ Auto-deploy on every push to `main`
- ✅ Preview deployments on PRs

## 🔐 Security Headers (will be applied)

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), ...
Content-Security-Policy: default-src 'self'; ... frame-ancestors 'none'; ...
```

## 🌐 After Deploy

The live URL will be: `https://neon-serpent-<hash>.vercel.app`

You can:
- Add a custom domain in Vercel dashboard
- See deploy logs at `vercel.com/<username>/neon-serpent`
- Set environment variables if needed (none required for this project)
