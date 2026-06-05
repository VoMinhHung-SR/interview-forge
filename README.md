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

1. Run `npm run dev` or `npm run build`
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the `dist/` directory

### Environment Variables

Copy `.env.example` to `.env` and fill in API keys when implementing the AI layer (M2):

```
VITE_GEMINI_API_KEY=
VITE_OPENAI_API_KEY=
```

## Status

Scaffold only — no MVP features implemented yet. See [PRD.md](./PRD.md) for product requirements.
