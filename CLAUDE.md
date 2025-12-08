# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PGN Location Tracking & Attendance System - An enterprise-grade system for tracking sales team locations and managing attendance with face recognition capabilities. This is a monorepo containing React Native mobile app and Next.js admin dashboard with Supabase backend.

**Core Business Requirements:**

- Location tracking every 5 minutes when checked in (50m movement threshold)
- Face recognition attendance with confidence scoring (>90% auto-approve, 70-90% manual review)
- Complete audit logging for compliance (7+ year retention)
- Offline-first capabilities with automatic sync
- Admin dashboard with real-time map visualization
- Human-readable employee IDs in PGN-YYYY-NNNN format

## Development Commands

### Setup and Installation

```bash
# Install all dependencies across monorepo
npm run bootstrap

# Clean all build artifacts and dependencies
npm run clean
```

### Development

```bash
# Start all applications (mobile + web + shared)
npm run dev

# Start individual applications
npm run dev:mobile    # React Native mobile app
npm run dev:web       # Next.js admin dashboard
npm run dev:shared    # Shared package development
```

### Building

```bash
# Build all applications (always build shared first)
npm run build

# Build individual applications
npm run build:shared   # Must be built first
npm run build:mobile
npm run build:web
```

### Testing and Quality

```bash
# Run all tests
npm run test

# Run individual test suites
npm run test:mobile
npm run test:web
npm run test:shared

# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## Architecture Overview

### Technology Stack

- **Mobile**: React Native with Expo (Android only deployment)
- **Web**: Next.js 16 with App Router, API routes, and middleware
- **Backend**: Supabase (PostgreSQL with RLS, Storage, Auth)
- **State Management**: Zustand (shared between platforms)
- **Authentication**: JWT tokens for API security (15min expiration)
- **Face Recognition**: Client-side TensorFlow Lite with server fallback
- **Styling**: Tailwind CSS (web) and NativeWind (mobile)
- **Language**: TypeScript with strict typing

### Monorepo Structure

```
pgn/
├── apps/
│   ├── mobile/          # React Native mobile app
│   └── web/             # Next.js admin dashboard
├── packages/
│   └── shared/          # Shared types, utils, constants
├── docs/                # Project documentation
└── .bmad-core/          # BMAD framework configuration
```

### Key Architectural Patterns

#### Service Layer Security

- **API Routes as Gateways**: All client requests must go through Next.js API routes
- **Service Files Only**: Only service files in `apps/web/services/` can directly access Supabase
- **JWT Middleware**: All API endpoints protected with JWT validation middleware
- **No Direct Supabase Access**: Clients (mobile/web) use Zustand stores to call API routes

#### Authentication Flow

1. **Admin Login**: Uses Supabase Auth with user_metadata.role = 'admin', no JWT tokens
2. **Employee Login**: Validates against `employees` table, generates JWT tokens for API access
3. **Employment Status**: Access controlled by `employment_status` and `can_login` fields
4. **Token Validation**: 15-minute expiration with refresh mechanism

#### Database Schema (Key Tables)

- **employees**: Core employee data with face recognition embeddings
- **daily_attendance**: Smart daily records with JSONB path data and embedded file data
- **Security**: RLS policies on all tables, comprehensive audit logging

#### Face Recognition System

- **Primary Method**: Client-side TensorFlow Lite for speed and privacy
- **Confidence Scoring**: >90% auto-approve, 70-90% retry (max 3), <70% manual review
- **Reference Photos**: Admin-controlled upload with server-side embedding generation
- **Anti-Spoofing**: Liveness detection, digital photo detection, 3D face validation

## Important Implementation Details

### User ID System

- **Format**: PGN-YYYY-NNNN (e.g., PGN-2024-0001)
- **Generation**: Automatic with year-based sequence
- **Validation**: Shared utility functions in `packages/shared/src/utils/user-id.ts`
- **Immutability**: Cannot be changed once assigned for audit trail integrity

### Location Tracking

- **Interval**: Every 5 minutes when checked in
- **Movement Threshold**: Only show path segments when movement exceeds 50 meters
- **Path Storage**: JSONB array in `daily_attendance` table with battery info
- **Color Assignment**: Unique colors for each employee's path visualization

### Security Considerations

- **Rate Limiting**: 5 failed login attempts per 15 minutes
- **Request Signing**: All API calls signed for integrity verification
- **External Request Blocking**: Only authorized clients can access API
- **Certificate Pinning**: Mobile app uses certificate pinning
- **Device Fingerprinting**: Track registered devices for security

### Offline Architecture

- **Local Storage**: Encrypted SQLite for offline data
- **Sync Queue**: Automatic sync when connection restored
- **Face Recognition**: Complete offline capability with server validation
- **Conflict Resolution**: Server-side validation with audit trail

## File Organization Patterns

### Mobile App Structure (`apps/mobile/`)

- `app/(tabs)/` - Tab navigation screens
- `components/` - Reusable UI components
- `services/` - API service calls and local storage
- `hooks/` - Custom React hooks
- `store/` - Zustand state management

### Web App Structure (`apps/web/`)

- `app/(dashboard)/` - Protected dashboard routes
- `app/api/` - API routes with JWT middleware
- `components/` - React components and UI library
- `services/` - Business logic layer (only files that access Supabase)
- `lib/` - Utility libraries (JWT, auth middleware, rate limiting)
- `store/` - Zustand state management

### Shared Package (`packages/shared/`)

- `types/` - TypeScript interfaces (auth, employee, attendance, UI, middleware)
- `utils/` - Shared utility functions (user-id generation, validation)
- `constants/` - App-wide constants

## Database Operations

### Supabase Client Setup

- **Server Client**: `apps/web/utils/supabase/server.ts` (for service layer)
- **Admin Client**: `apps/web/utils/supabase/admin.ts` (for admin operations)
- **Service Layer Only**: Only service files can import and use Supabase clients

### Migration Management

- Migrations stored in project repository
- All schema changes require migration files
- RLS policies implemented on all tables

## Testing Strategy

### Unit Tests

- Service layer business logic
- JWT authentication flow
- User ID generation and validation
- Utility functions

### Integration Tests

- API endpoint security
- Database operations
- Face recognition workflow
- Offline sync functionality

### Manual Testing

- Face recognition accuracy
- Mobile camera integration
- Background location tracking
- Offline scenarios

## Development Guidelines

### Code Standards

- **TypeScript**: Strict mode enabled, no implicit any
- **ESLint**: Custom rules for security and consistency
- **Prettier**: Consistent formatting across all packages
- **Conventional Commits**: Structured commit messages

### Security Requirements

- **No Secrets in Code**: Use environment variables for all sensitive data
- **Input Validation**: All API inputs validated with Zod schemas
- **Error Handling**: No sensitive information in error messages
- **Audit Logging**: All security events logged with timestamps

### Performance Considerations

- **Mobile Battery**: Optimize location tracking for minimal battery impact
- **Database Queries**: Optimized indexes for common queries
- **Image Compression**: Compress photos before upload while maintaining quality
- **Caching**: Implement caching for frequently accessed data

## Environment Setup

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_EXPIRES_IN` - Token expiration (default: 15m)

### Development Prerequisites

- Node.js 18.0.0+
- npm 9.0.0+
- Expo CLI (for mobile development)
- Supabase CLI (for database management)

## Common Workflows

### Adding New API Endpoints

1. Create route in `apps/web/app/api/`
2. Add JWT middleware for authentication
3. Implement business logic in service file
4. Update shared types in `packages/shared/`
5. Add Zustand store actions if needed

### Database Schema Changes

1. Create migration file
2. Update TypeScript types in shared package
3. Implement service layer changes
4. Update API routes if needed
5. Test with sample data

### Adding New Mobile Features

1. Create/update screens in `apps/mobile/app/`
2. Add components in `apps/mobile/components/`
3. Implement service calls
4. Update shared types if needed
5. Test offline functionality

## Face Recognition Integration

### Reference Photo Management

- Admin uploads reference photos via dashboard
- Server generates face embeddings using TensorFlow
- Embeddings distributed to devices during login
- Version control for photo updates

### Attendance Workflow

1. Employee opens app and taps check-in
2. Camera launches with face detection overlay
3. TensorFlow Lite processes face locally
4. Confidence score determines approval path
5. Selfie captured and uploaded for audit
6. Location tracked every 5 minutes
7. Process repeats for check-out

### Offline Handling

- Face recognition works completely offline
- Results queued for server validation
- Conflicts flagged for admin review
- Complete audit trail maintained

## Admin Dashboard Features

### Real-time Monitoring

- Live map with 30-second polling
- Unique colored paths for each employee
- Employee status indicators
- Attendance verification queue

### Employee Management

- CRUD operations for employee records
- Employment status management
- Reference photo upload and management
- Regional assignment (display only)

### Security Monitoring

- Failed login tracking
- Device monitoring
- Geographic anomaly detection
- API request monitoring

This architecture supports the business requirement for comprehensive attendance tracking while maintaining enterprise security standards and providing a complete audit trail for compliance purposes.