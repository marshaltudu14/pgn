# PGN Monorepo

A monorepo containing React Native mobile app and Next.js web application.

## Structure

```
pgn/
├── apps/
│   ├── mobile/          # React Native app (Expo)
│   └── web/             # Next.js web app
├── packages/
│   └── shared/          # Shared utilities and types
└── package.json         # Root package.json with workspaces
```

## Getting Started

1. Install dependencies:
   ```bash
   npm run bootstrap
   ```

2. Start development:
   ```bash
   # Start both apps in parallel
   npm run dev

   # Or start individually
   npm run dev:mobile
   npm run dev:web
   ```

## Scripts

- `npm run bootstrap` - Install all dependencies
- `npm run dev` - Start both apps in development mode
- `npm run build` - Build all applications
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run clean` - Clean all build artifacts and node_modules