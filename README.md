# PGN Location Tracking - Monorepo

A monorepo for the PGN Location Tracking system, containing React Native mobile app and Next.js web application for employee location and attendance management.

## Project Structure

```
pgn/
├── apps/
│   ├── mobile/                 # React Native mobile app
│   │   ├── app/                # React Native app structure
│   │   │   ├── (tabs)/         # Tab navigation screens
│   │   │   ├── _layout.tsx     # Root layout
│   │   │   ├── screens/        # App screens
│   │   │   ├── components/     # UI components
│   │   │   ├── services/       # Local services
│   │   │   ├── hooks/          # Custom hooks
│   │   │   └── store/          # Zustand store
│   │   └── package.json
│   └── web/                    # Next.js admin dashboard
│       ├── app/                # Next.js app structure
│       │   ├── api/            # API routes
│       │   ├── (auth)/         # Auth route groups
│       │   ├── (dashboard)/    # Dashboard route groups
│       │   ├── layout.tsx      # Root layout
│       │   ├── page.tsx        # Home page
│       │   ├── components/     # React components
│       │   ├── hooks/          # Custom hooks
│       │   └── store/          # Zustand store
│       └── package.json
├── packages/
│   └── shared/                 # Shared packages
│       └── src/
│           ├── types/          # TypeScript definitions
│           ├── utils/          # Shared utilities
│           └── constants/      # Shared constants
├── .bmad-core/                 # BMAD framework configuration
├── docs/                       # Project documentation
└── package.json                # Root package.json with workspaces
```

## Technology Stack

- **Mobile**: React Native (Android only) with Expo
- **Web**: Next.js with API routes
- **State Management**: Zustand (shared between platforms)
- **Backend**: Supabase (PostgreSQL database)
- **Language**: TypeScript with strict typing
- **Styling**: Tailwind CSS (NativeWind for mobile)

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Expo CLI (for mobile development)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pgn
   ```

2. Install dependencies:
   ```bash
   npm run bootstrap
   ```

### Development

1. Start both applications in parallel:
   ```bash
   npm run dev
   ```

2. Or start applications individually:
   ```bash
   # Start mobile app
   npm run dev:mobile

   # Start web app
   npm run dev:web
   ```

3. Start shared package development:
   ```bash
   npm run dev:shared
   ```

### Building

1. Build all applications:
   ```bash
   npm run build
   ```

2. Build specific applications:
   ```bash
   npm run build:shared   # Build shared packages first
   npm run build:mobile
   npm run build:web
   ```

### Testing

```bash
# Run all tests
npm run test

# Test specific packages
npm run test:mobile
npm run test:web
npm run test:shared
```

### Linting and Formatting

```bash
# Lint all code
npm run lint

# Format all code (Prettier)
npm run format

# Fix linting issues
npm run lint:fix
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run bootstrap` | Install dependencies for all packages |
| `npm run dev` | Start all applications in development mode |
| `npm run build` | Build all applications for production |
| `npm run test` | Run all test suites |
| `npm run lint` | Lint all code with ESLint |
| `npm run clean` | Clean all build artifacts and dependencies |
| `npm run dev:mobile` | Start React Native mobile app |
| `npm run dev:web` | Start Next.js web app |
| `npm run dev:shared` | Start shared package development |

## Environment Variables

Create environment files for each application:

- `apps/mobile/.env` - Mobile app environment variables
- `apps/web/.env.local` - Web app environment variables

## Code Quality

This monorepo is configured with:

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Jest**: Unit testing framework
- **VS Code**: Configured with formatting on save

## Development Workflow

1. All code should be written in TypeScript
2. Follow the established directory structure
3. Use shared types and utilities from `@pgn/shared`
4. Run tests and linting before committing
5. Follow Git conventional commit messages

## Deployment

- **Mobile**: Build and distribute via Expo CLI
- **Web**: Deploy to Vercel or similar platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

[Add your license information here]