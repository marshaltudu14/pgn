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

# **Mandatory Instructions for AI Agents**

## **0. Core Operating Principle (For AI Agents)**

**Before performing ANY task**, the agent must:

1. Detect the frameworks and package versions involved.
2. Fetch up-to-date documentation using the required MCP tools.
3. Only then proceed with implementation using the latest stable practices.

No code may be produced before documentation is updated.

---

# **1. Version Detection & Documentation Retrieval**

## **1.1 Next.js Projects**

- Auto-detect the Next.js version.
- Always use **Next DevTools MCP** to fetch:
  - Latest API docs
  - Best practices
  - Current constraints
  - Deprecation notices

- All output must comply with the detected version’s official documentation.

## **1.2 React Native / Expo Projects**

- Auto-detect the React Native, Expo, and library versions.
- Always use **Context7 MCP** to retrieve:
  - Latest documentation
  - Best practices

- All output must avoid deprecated APIs or outdated patterns.

## **1.3 Any Other Package**

- Use **Context7 MCP** to fetch its updated documentation and recommended usage.

---

# **2. Coding Rules (Strict)**

## **2.1 Always use:**

- Latest APIs, patterns, architectures.
- Modern idiomatic TypeScript and React patterns.
- Stable, non-deprecated features only.

## **2.2 After generating code**

The agent **must simulate running**:

```
npx tsc --noEmit && npm run lint
```

Then fix all TypeScript errors and ESLint warnings in the final output.

No code is considered complete until the agent ensures it is fully error-free.

---

# **3. Next.js Architecture (Mandatory & Strict)**

## **3.1 `page.tsx` MUST be server-side**

- Pages are always **server components**.
- Server logic is allowed directly inside page files.

## **3.2 Client components**

- Must be placed separately.
- Allowed to use hooks and client-only features.

## **3.3 Services Layer Rules (Next.js Only)**

- **Service files** are server-only files responsible for:
  - Database access
  - Authentication
  - Server-only logic

### Allowed connections:

- `page.tsx` → Service files
- API routes → Service files

### Forbidden:

- Client components → Service files ❌
- Client components → Database ❌
- Client components → Server-only logic ❌

## **3.4 Client Data Flow**

Client components must follow this pipeline:

```
Client Components → Zustand Stores → API Routes → Service Files → Database
```

This pipeline is **mandatory** for all client-side environments.

---

# **4. React Native Architecture (Adjusted & Corrected)**

React Native is **entirely client-side**, so:

### **React Native MUST NOT:**

- Have service files ❌
- Access the database directly ❌
- Access server functions directly ❌
- Store or expose secrets ❌

### **React Native MUST:**

- Use Zustand (if stateful logic is needed)
- Communicate ONLY via **Next.js API routes**
- Rely on server-side logic implemented in the Next.js project

### Correct pipeline:

```
React Native App → Zustand (if needed) → Next.js API Routes → Next.js Service Files → Database
```

---

# **5. Next.js Development Rules for AI Agents**

### **5.1 Never run the Next.js dev server manually**

Instead:

1. Connect to the running server via **Next DevTools MCP**
   - Default: port **3000**
   - Ask user for a different port if needed

2. Use **Next DevTools MCP** to:
   - Inspect routing
   - Inspect logs
   - Analyze server components
   - Access real-time server state

3. Use **Playwright MCP** to:
   - Interact with the UI
   - Test functionality
   - Validate user flows

AI agents must prefer remote integration testing over running local dev servers.

---

# **6. Always Prefer Latest Stable Features**

For **every** code output:

- Replace old APIs with their modern equivalents.
- Adopt the official recommended patterns from the retrieved documentation.
- Remove legacy or deprecated patterns.
- Always upgrade logic to match the latest version’s architecture.

---

# **7. AI Agent Workflow Summary (Enforced)**

For ANY task:

### **Step 1:** Detect versions

### **Step 2:** Fetch documentation (Next DevTools MCP or Context7 MCP)

### **Step 3:** Produce solution using modern best practices

### **Step 4:** Virtually run `tsc` + `lint` and fix errors

### **Step 5:** Output final optimized solution

Failure to follow these steps is not allowed.
