---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: ['docs/prd.md']
workflowType: 'architecture'
lastStep: 0
project_name: 'pgn'
user_name: 'Marshal'
date: '2025-12-07'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
41 functional requirements organized into:
- Location Tracking Service Management (5 requirements)
- Emergency Scenario Handling (7 requirements)
- Data Management & Persistence (5 requirements)
- Service Recovery & Health (4 requirements)
- Admin Monitoring & Visualization (5 requirements)
- Attendance & Audit Management (5 requirements)
- Device & Platform Integration (5 requirements)
- User Experience & Communication (5 requirements)

**Non-Functional Requirements:**
- Performance: Location sync within 10 seconds, dashboard updates within 30 seconds, battery impact <8% per shift
- Security: HTTPS/TLS encryption, JWT authentication (15-min expiration), role-based access control, employee data isolation
- Reliability: 99.5%+ service uptime, 15-minute recovery from interruptions, zero data loss during normal operations
- Integration: Supabase API with 3-retry exponential backoff, rate limiting (100 requests/minute/device)

**Scale & Complexity:**
- Primary domain: React Native mobile app with background services + Next.js admin dashboard
- Complexity level: Medium (background service persistence across device states drives complexity)
- Estimated architectural components: 8-10 major components

### Technical Constraints & Dependencies

- Android-only deployment (React Native with Expo framework)
- Notifee for foreground service management (LOCATION + MEDIA_PLAYBACK types)
- Supabase for backend services (PostgreSQL with RLS, Storage, Auth)
- Must leverage existing attendance store structure
- Implementation must remain simple (no complex offline queuing mechanisms)
- 5-minute sync intervals balance accountability with battery life

### Cross-Cutting Concerns Identified

- **Service Persistence**: Continuous operation regardless of app state
- **Permission Monitoring**: 30-second intervals during active tracking
- **Battery Optimization**: Handling across different Android OEM behaviors
- **Data Integrity**: Emergency storage and sync recovery
- **Audit Compliance**: Complete trail for 7+ year retention
- **Failure Recovery**: Graceful handling of all interruption scenarios
- **Real-time Communication**: Admin dashboard updates every 30 seconds

## Starter Template Evaluation

### Primary Technology Domain

Enhancement of existing React Native + Next.js monorepo with Supabase backend

### Starter Options Considered

Given this is an enhancement project:
- New project starters: Not applicable
- Component integration: Relevant for UI components
- Service enhancement: Primary focus for location tracking improvements

### Selected Approach: Enhancement of Existing Architecture

**Rationale for Selection:**
- Established monorepo structure already exists
- Current tech stack aligns with PRD requirements
- No framework changes needed
- Focus on service reliability, not new foundations

**Architectural Decisions Already Established:**

**Language & Runtime:**
- TypeScript strict mode across mobile, web, and shared packages
- React Native with Expo for Android deployment
- Next.js 16 with App Router for admin dashboard

**Styling Solution:**
- Tailwind CSS for web components
- NativeWind for mobile React Native components

**Build Tooling:**
- Expo build pipeline (Android focus)
- Next.js optimized builds with ISR for dashboard
- Shared package builds dependencies first

**Testing Framework:**
- Jest/React Native Testing Library for mobile
- Jest/Playwright for web
- Existing test patterns to extend

**Code Organization:**
- Monorepo: apps/mobile, apps/web, packages/shared
- Service layer for Supabase interactions
- Zustand for state management
- API routes as service gateways

**Development Experience:**
- npm scripts for development workflow
- ESLint/Prettier configuration
- Conventional commit patterns

**Note:** No project initialization needed. Enhancement should focus on extending existing location tracking service with Notifee integration and emergency handling logic.

## Core Architectural Decisions

### Decision Priority Analysis

**Already Implemented:**
- ✅ AsyncStorage for emergency data persistence (emergency_attendance_data key)
- ✅ Notifee foreground service with LOCATION + MEDIA_PLAYBACK types
- ✅ 30-second permission and battery monitoring
- ✅ Emergency data structure (location, battery, timestamp, attendance ID)
- ✅ Battery level monitoring with 5% threshold
- ✅ Permission revocation emergency check-out
- ✅ Emergency data overwrite every 30 seconds

**Critical Decisions Needed:**
- App crash detection (service died vs app closed)
- 1-hour internet disconnection timeout implementation

### Service Architecture Decision

**No Resume Logic Required:**
- Service runs continuously via Notifee foreground service
- User either manually checks out OR emergency check-out occurs
- No "resume tracking" scenario - service persists through app close

**Emergency Check-out Triggers:**
- Service dead + no updates for >15 minutes → Emergency check-out
- Service running + no internet for 1 hour → Emergency check-out
- Battery at 5% → Immediate emergency check-out
- Any permission revoked → Immediate emergency check-out

### Data Architecture

**Emergency Data Storage:** AsyncStorage (already implemented)
- Structure includes: attendanceId, employeeId, lastLocationUpdate, trackingActive, lastKnownTime
- Overwrite strategy: Every 30 seconds during active tracking
- Clear on successful manual check-out

### Service Lifecycle Management

**App Restart Scenario (already handled):**
- Service continues via Notifee
- Check attendance status on app start
- If service not running but user CHECKED_IN → restart service

**Missing Implementation:**
1. **Service Death Detection** - Check if service actually died (lastStoredTime > 15 minutes ago)
2. **Internet Timeout** - Track consecutive failed syncs, emergency check-out after 1 hour

### Implementation Sequence

1. Add service death detection in attendance store initialization
2. Implement offline timeout counter in location service
3. Add emergency check-out for 1-hour internet disconnection
4. Test all failure scenarios per PRD requirements

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
6 areas where AI agents could make different choices based on existing codebase

### Naming Patterns

**Database Naming Conventions:**
- Tables: snake_case (e.g., daily_attendance, employees)
- Columns: snake_case (e.g., employee_id, attendance_id)
- Emergency storage key: `emergency_attendance_data` (already defined)

**API Naming Conventions:**
- Endpoints: kebab-case (e.g., /attendance/status, /attendance/checkin)
- Request/response types: PascalCase (e.g., CheckInMobileRequest, DailyAttendanceRecord)
- Constants: SCREAMING_SNAKE_CASE (e.g., API_ENDPOINTS, LOCATION_TRACKING_CONFIG)

**Code Naming Conventions:**
- Components: PascalCase (e.g., CheckInOutModal, LocationSyncTimer)
- Files: kebab-case for components (e.g., check-in-out-modal.tsx)
- Functions: camelCase (e.g., handleMobileApiResponse, getCurrentLocation)
- Variables: camelCase with descriptive names (e.g., emergencyDataCallback)

### Structure Patterns

**Project Organization:**
- Tests: Co-located with files (e.g., utils/errorHandling.ts → utils/__tests__/errorHandling.test.ts)
- Services: Organized by domain (location-foreground-service-notifee.ts)
- Stores: Feature-based with utils subdirectory
- Shared types: In packages/shared/src/types/

**File Structure Patterns:**
- Config: constants/location-tracking.ts
- Utilities: utils/[name].ts
- Store utilities: store/utils/[name].ts
- Error handling: Dedicated utils/errorHandling.ts

### Format Patterns

**API Response Formats:**
- Response wrapper: handleMobileApiResponse() returns {success, data, error}
- Error format: transformApiErrorMessage() for consistent error messages
- Date format: ISO strings in JSON, converted to Date objects in TypeScript

**Data Exchange Formats:**
- JSON fields: camelCase in frontend, snake_case in database
- Emergency data: Structured with timestamp as number (ms since epoch)
- Location data: [latitude, longitude] tuple for coordinates

### Communication Patterns

**Event System Patterns:**
- Callback naming: [purpose]Callback (e.g., locationUpdateCallback)
- Event payload: Typed interfaces (e.g., EmergencyAttendanceData)
- Service events: Notifee notification IDs with timestamps

**State Management Patterns:**
- Zustand pattern: create() with persist() and devtools()
- State updates: Immutable via set() function
- Async actions: Separate async methods in store

### Process Patterns

**Error Handling Patterns:**
- Global handler: handleMobileApiResponse() for API responses
- Error transformation: transformApiErrorMessage() for user-friendly messages
- Logging: console.error() with service prefix for debugging

**Loading State Patterns:**
- Boolean flags: is[Action] (e.g., isCheckingIn, isLoading)
- State management: Set true before async, false after
- Error state: Store error messages in state

### Enforcement Guidelines

**All AI Agents MUST:**

1. Use existing error handling utilities (handleMobileApiResponse, transformApiErrorMessage)
2. Follow the established emergency data structure in AsyncStorage
3. Use camelCase for TypeScript interfaces, snake_case for database fields
4. Co-locate test files in __tests__ subdirectories
5. Use the existing Notifee service patterns for foreground notifications
6. Follow the Zustand store pattern with persist and devtools

**Pattern Enforcement:**
- Check existing implementations before creating new patterns
- Use imported utilities rather than recreating functionality
- Follow the established naming conventions for consistency

## Project Structure & Boundaries

### Complete Project Directory Structure

```
pgn/
├── package.json                    # Root package.json (monorepo workspace)
├── CLAUDE.md                       # Project documentation and AI agent rules
├── .gitignore
├── .bmad/                          # BMAD framework configuration
│   └── bmm/
│       ├── config.yaml             # BMAD project configuration
│       └── workflows/              # BMAD workflow definitions
├── apps/
│   ├── mobile/                     # React Native mobile app (Android)
│   │   ├── package.json
│   │   ├── app.json                # Expo configuration
│   │   ├── babel.config.js
│   │   ├── metro.config.js
│   │   ├── app/
│   │   │   ├── _layout.tsx          # Root layout with splash screen
│   │   │   ├── index.tsx            # App entry point
│   │   │   ├── (auth)/              # Auth stack
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── login.tsx
│   │   │   │   └── permissions.tsx
│   │   │   ├── (dashboard)/         # Main app stack
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── index.tsx
│   │   │   │   ├── attendance.tsx
│   │   │   │   ├── dealers.tsx
│   │   │   │   ├── retailers.tsx
│   │   │   │   ├── farmers.tsx
│   │   │   │   ├── tasks.tsx
│   │   │   │   ├── profile.tsx
│   │   │   │   └── modal.tsx        # Global modal
│   │   │   └── modal.tsx            # Global modal
│   │   ├── components/             # Reusable UI components
│   │   │   ├── CheckInOutModal.tsx
│   │   │   ├── CreateDealerModal.tsx
│   │   │   ├── CreateRetailerModal.tsx
│   │   │   ├── CreateFarmerModal.tsx
│   │   │   ├── DealerSearchModal.tsx
│   │   │   ├── RetailerSearchModal.tsx
│   │   │   ├── FloatingActionButton.tsx
│   │   │   ├── LocationSyncTimer.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── ThemeWrapper.tsx
│   │   │   ├── ThemedText.tsx
│   │   │   ├── ThemedView.tsx
│   │   │   └── ui/                  # Base UI components
│   │   ├── contexts/                # React contexts
│   │   │   └── theme-context.tsx
│   │   ├── services/                # Business logic services
│   │   │   ├── api-client.ts        # HTTP client for API calls
│   │   │   ├── permissions.ts      # Permission handling
│   │   │   ├── location-foreground-service-notifee.ts  # Core location tracking
│   │   │   └── __tests__/           # Service tests
│   │   │       ├── api-client.test.ts
│   │   │       └── permissions.test.ts
│   │   ├── store/                   # Zustand state management
│   │   │   ├── attendance-store.ts  # Attendance state
│   │   │   ├── auth-store.ts        # Authentication state
│   │   │   ├── dealer-store.ts      # Dealer management state
│   │   │   ├── retailer-store.ts    # Retailer management state
│   │   │   ├── farmer-store.ts      # Farmer management state
│   │   │   ├── utils/               # Store utilities
│   │   │   │   ├── errorHandling.ts
│   │   │   │   └── __tests__/
│   │   │   │       └── errorHandling.test.ts
│   │   │   └── __tests__/           # Store tests
│   │   ├── utils/                   # Utility functions
│   │   │   ├── auth-utils.ts
│   │   │   ├── camera.ts            # Camera utilities
│   │   │   ├── location.ts          # Location utilities
│   │   │   ├── toast.tsx
│   │   │   └── __tests__/
│   │   │       ├── auth-utils.test.ts
│   │   │       ├── camera.test.ts
│   │   │       └── location.test.ts
│   │   └── constants/               # App constants
│   │       └── location-tracking.ts # Location tracking config
│   └── web/                        # Next.js admin dashboard
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       ├── app/
│       │   ├── layout.tsx           # Root layout
│       │   ├── globals.css
│       │   ├── (dashboard)/         # Protected dashboard routes
│       │   │   ├── layout.tsx
│       │   │   ├── dashboard/
│       │   │   │   ├── page.tsx
│       │   │   │   ├── components/
│       │   │   │   │   ├── EmployeeList.tsx
│       │   │   │   │   └── TrackingView.tsx
│       │   │   │   └── loading.tsx
│       │   │   └── ...
│       │   └── api/                 # API routes (server-side)
│       │       ├── auth/
│       │       │   └── ...
│       │       ├── attendance/
│       │       │   └── ...
│       │       └── ...
│       ├── components/              # Web components
│       │   ├── DealerForm.tsx
│       │   ├── EmployeeForm.tsx
│       │   ├── FarmerForm.tsx
│       │   ├── RetailerForm.tsx
│       │   └── attendance/
│       │       └── attendance-details-modal.tsx
│       ├── services/                # Web service layer
│       │   ├── attendance.service.ts
│       │   ├── employee.service.ts
│       │   └── __tests__/
│       │       ├── attendance.service.test.ts
│       │       └── employee.service.test.ts
│       └── lib/
│           ├── stores/              # Web Zustand stores
│           │   ├── employeeStore.ts
│           │   ├── regionsStore.ts
│           │   └── __tests__/
│           │       └── employeeStore.test.ts
│           ├── jwt.ts               # JWT utilities
│           ├── auth-middleware.ts   # API authentication middleware
│           └── rate-limiter.ts      # Rate limiting utilities
└── packages/
    └── shared/                      # Shared types and utilities
        ├── package.json
        ├── src/
        │   ├── types/               # TypeScript interfaces
        │   │   ├── auth.ts
        │   │   ├── employee.ts
        │   │   ├── attendance.ts
        │   │   ├── supabase.ts
        │   │   └── index.ts
        │   ├── utils/               # Shared utilities
        │   │   ├── user-id.ts
        │   │   └── index.ts
        │   └── constants/           # Shared constants
        │       └── index.ts
        └── dist/                    # Built shared package
```

### Architectural Boundaries

**Service Boundaries:**
- Mobile Services: Only business logic, no direct Supabase access
- Web Services: Only files in apps/web/services/ can access Supabase
- API Routes: Gateway between client and services, protected by JWT middleware

**Data Boundaries:**
- Supabase Client: Server-side only (apps/web/utils/supabase/)
- Mobile Storage: AsyncStorage for local emergency data
- Shared Types: packages/shared/src/types/ for all data interfaces

**Component Boundaries:**
- Mobile Components: Native components with Tailwind via NativeWind
- Web Components: React components with shadcn/ui and Tailwind
- Shared Logic: Only through packages/shared

### Requirements to Structure Mapping

**Location Tracking Enhancement:**
- Core Service: apps/mobile/services/location-foreground-service-notifee.ts
- Emergency Storage: AsyncStorage with key 'emergency_attendance_data'
- Permission Monitoring: apps/mobile/services/permissions.ts
- Config: apps/mobile/constants/location-tracking.ts

**Emergency Scenarios:**
- Battery Monitoring: Integrated in location-foreground-service-notifee.ts
- Permission Revocation: 30-second checks in service
- App Crash Recovery: Emergency data check in attendance-store.ts
- Internet Timeout: To be added in location service

**Admin Dashboard:**
- Real-time View: apps/web/app/(dashboard)/dashboard/components/TrackingView.tsx
- API Endpoints: apps/web/app/api/attendance/
- Data Services: apps/web/services/attendance.service.ts