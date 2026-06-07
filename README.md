# Coding Interview Coach

An AI-powered browser extension that acts as a coding interview mentor — progressive hints, pattern recognition, and complexity analysis without spoiling solutions.

## Tech Stack

- Chrome Extension Manifest V3
- React + TypeScript
- Vite + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- Tailwind CSS

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for folder layout, message flow, and milestone ownership map.

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (supports extension HMR)
npm run dev

# Production build
npm run build
```

### Load in Chrome

**Option A — Production (recommended, no dev server needed):**

```bash
npm run build
```

Load the **`dist/`** folder in `chrome://extensions`. Works without `npm run dev`.

**Option B — Dev mode (hot reload):**

```bash
npm run dev   # keep this terminal running
```

1. Load **`dist/`** in `chrome://extensions`
2. If using a **remote workspace** (Cursor SSH/WSL), open the **Ports** panel and forward port **5173**
3. Click **Reload Extension** on the CRXJS popup (or in `chrome://extensions`)

### Troubleshooting "Cannot connect to localhost:5173"

| Cause | Fix |
|-------|-----|
| Dev server not running | Run `npm run dev` and keep it open |
| Extension loaded before dev server started | Reload extension after `npm run dev` is ready |
| Remote workspace (Cursor) | Forward port **5173** in Cursor → Ports tab |
| Dev mode too fragile | Use `npm run build` instead (Option A) |

### Environment Variables

Copy `.env.example` to `.env`:

```
VITE_GEMINI_API_KEY=your_key_here
VITE_GEMINI_MODEL=gemini-2.5-flash
```

Run `npm run build` after changing `.env`, then reload the extension in `chrome://extensions`.

## Contributors

Built by **[VoMinhHung-SR](https://github.com/VoMinhHung-SR)** with **[Cursor](https://cursor.com)**
