# Theia Mobile Backend Development Guidelines

**Audience**: AI Assistant working on this repository

This document provides guidance for developing the Theia Mobile Backend. The backend is part of a two-repository architecture that supports the ModusFabrica iOS app.

---

## Project Overview

Eclipse Theia Mobile is a two-repository project:

1. **Backend Repository** (THIS REPO): `/Users/michaelsmith/IdeaProjects/theia`
   - Technology: Node.js, TypeScript, InversifyJS
   - Package: `@theia/core-mobile`
   - Purpose: Mobile RPC Protocol, LSP Proxy, WebSocket server, Profile Management

2. **iOS App Repository** (SEPARATE): `/Users/michaelsmith/IdeaProjects/theia-ios/ModusFabrica`
   - Technology: Swift, SwiftUI, iOS native
   - Purpose: iOS-only mobile IDE application
   - Connects to backend via WebSocket

**Important**: This is an **iOS-ONLY** application at this time. There are NO React Native, Kotlin Multiplatform, or Android components. All mobile references should be to **Swift/iOS**.

---

## Repository Layout

```
/Users/michaelsmith/IdeaProjects/
├── theia/                          # THIS REPO - Backend
│   ├── packages/core-mobile/       # Mobile backend package
│   │   ├── src/
│   │   │   ├── common/            # Shared protocol types
│   │   │   └── node/              # Backend services
│   │   └── docs/mobile/           # Architecture documentation
│   └── docs/                      # General Theia docs
│
└── theia-ios/                     # SEPARATE REPO - iOS App
    └── ModusFabrica/              # iOS application
        ├── ModusFabrica/          # Swift source code
        └── docs/                  # iOS app documentation
```

---

## Development Approach

### Test-Driven Development (TDD)

Follow TDD for all backend features:

1. **Red**: Write a failing test that defines expected behavior
2. **Green**: Implement minimal code to pass the test
3. **Refactor**: Improve code while keeping tests green

**Testing Stack**:
- Jest for unit tests (TypeScript/Node.js)
- ts-jest for TypeScript support
- 100% coverage target for new code

**Commands**:
```bash
cd packages/core-mobile
npm test                        # Run all tests
npm test -- --watch            # Watch mode
npm test -- file.spec.ts       # Run specific test
```

### Branching and Version Control

- Create feature branches: `feature/mobile-xxx`
- Semantic commits: `feat:`, `fix:`, `refactor:`, `test:`
- Commit frequently with descriptive messages
- Merge via pull requests after review

---

## Mobile Backend Architecture

### Two-Tier Persistence Model

**Critical**: There are TWO separate persistence layers:

#### 1. Backend Persistence (Node.js - This Repo)
**File**: `~/.theia/mobile-profiles.json`
**Purpose**: 
- Remember which profile is active on backend
- Track which LSPs are installed on server
- Support multi-user scenarios
- Restore state on backend restart

**When Used**:
- Backend processes LSP requests
- Multiple iOS clients connect to same backend
- Backend restarts

#### 2. iOS App Persistence (Swift - Separate Repo)
**Location**: `~/Library/Application Support/ModusFabrica/`
**Purpose**:
- Remember user's profile preference
- Cache LSP responses for offline mode
- Store downloaded LSP metadata
- Enable offline editing

**When Used**:
- App launches
- Offline mode
- Profile switches initiated on iOS

### Synchronization Flow

```
iOS App (Offline)
  │
  ├─ Tree-sitter (local, instant)
  ├─ LSP Cache (SQLite, stale but fast)
  │
  └─ [Goes Online] ──WebSocket──> Backend
                                    │
                                    ├─ Sync profile state
                                    ├─ Live LSP requests
                                    └─ Update cache

Backend receives:
  - Profile switch request from iOS
  - Saves to ~/.theia/mobile-profiles.json
  - Activates corresponding LSPs
  - Sends responses back to iOS
  
iOS receives:
  - Saves profile to local storage
  - Updates LSP cache
  - Both are in sync
```

---

## Core Backend Services

### 1. LanguageProfileManager
Manages language stack profiles for on-demand LSP loading.

**Features**:
- Get available profiles (Java, .NET, Mobile Dev)
- Switch active profile
- Track installed languages
- Persist state to disk

**Storage**: `~/.theia/mobile-profiles.json`

### 2. LanguageProfileStorage
Handles persistence of profile state.

**Features**:
- Load/save profile data
- Graceful error handling
- JSON formatted output

### 3. MobileLSPProxy
Bridges LSP between backend and iOS app.

**Features** (Planned):
- Forward LSP events to iOS
- Filter by active profile languages
- Handle completion requests
- Manage diagnostics

### 4. MobileConnectionHandler
Manages WebSocket connections from iOS app.

### 5. MobileSessionManager
Manages session lifecycle and state.

---

## Mobile RPC Protocol

Communication between iOS app and backend uses a custom RPC protocol over WebSocket.

### Backend → iOS (`MobileMainContext`)
```typescript
$showTextDocument(uri: string): Promise<void>
$showDiagnostics(uri: string, diagnostics: Diagnostic[]): Promise<void>
$showCompletions(completions: CompletionList): Promise<void>
```

### iOS → Backend (`MobileExtContext`)
```typescript
$onDidChangeTextDocument(uri: string, changes: TextEdit[]): Promise<void>
$requestCompletion(uri: string, position: Position): Promise<CompletionList>
$requestHover(uri: string, position: Position): Promise<Hover | null>
$requestDefinition(uri: string, position: Position): Promise<Location[]>

// Profile management
$getAvailableProfiles(): Promise<LanguageStackProfile[]>
$getActiveProfile(): Promise<ActiveProfileInfo | null>
$switchProfile(request: ProfileSwitchRequest): Promise<void>
```

---

## Language Stack Profiles

Reduces storage from ~250MB (all LSPs) to 70-85MB per profile (73% reduction).

### Available Profiles

1. **Java Full Stack** (80MB)
   - Java, SQL, JavaScript, HTML, CSS
   - Use case: Spring Boot apps

2. **.NET Full Stack** (85MB)
   - C#, SQL, TypeScript, HTML, CSS
   - Use case: ASP.NET Core apps

3. **Mobile Development** (55MB)
   - Kotlin, Swift
   - Use case: iOS/Android development

### Profile State

**Backend** (`~/.theia/mobile-profiles.json`):
```json
{
  "activeProfileId": "java-fullstack",
  "installedLanguages": ["java", "sql", "javascript", "html", "css"],
  "lastUpdated": 1704067200000
}
```

**iOS App** (to be implemented in Phase 3):
```
ModusFabrica/
├── profile-preference.plist    # User's active profile
├── lsp-cache.sqlite           # Cached LSP responses
└── lsp-metadata.json          # Downloaded LSP info
```

---

## Common Commands

### Backend Development (This Repo)

```bash
cd packages/core-mobile

# Testing
npm test                       # Run all tests (199 tests)
npm test -- --watch           # Watch mode
npm test -- --coverage        # Coverage report

# Building
npm run compile               # Compile TypeScript

# Linting
npm run lint                  # Check code style
npm run lint:fix             # Auto-fix issues
```

---

## iOS App Integration

### What iOS App Needs to Implement (Phase 3)

The iOS app (ModusFabrica) will need:

1. **Profile Storage Service** (Swift)
```swift
class ProfileStorage {
    func saveActiveProfile(_ profileId: String)
    func getActiveProfile() -> String?
    func isLSPDownloaded(_ languageId: String) -> Bool
}
```

2. **LSP Cache** (CoreData/SQLite)
```swift
class LSPCache {
    func cacheDiagnostics(uri: String, diagnostics: [Diagnostic])
    func getCachedDiagnostics(uri: String) -> [Diagnostic]?
    func cacheCompletions(uri: String, completions: CompletionList)
}
```

3. **WebSocket Client**
```swift
class TheiaWebSocketClient {
    func connect(to url: URL)
    func sendRPC<T>(_ method: String, params: [Any]) async throws -> T
    func handleIncomingRPC(_ method: String, params: [Any])
}
```

4. **Profile Sync Manager**
```swift
class ProfileSyncManager {
    func syncWithBackend() async throws
    func reconcileDifferences(local: String?, remote: String?)
}
```

---

## Testing Strategy

### Backend Tests (Jest)

**Current Status**: 199 tests passing

**Test Organization**:
- `src/common/*.spec.ts` - Protocol tests
- `src/node/*.spec.ts` - Service tests
- `test/package.spec.js` - Package validation

**Coverage Target**: 80%+ (currently 75%)

### iOS App Tests (XCTest - Phase 3)

Will be implemented in iOS repository:
```swift
class ProfileStorageTests: XCTestCase {
    func testSaveAndLoadProfile() {
        // Test iOS persistence
    }
}
```

---

## Code Quality Standards

### TypeScript Backend
- Strict mode enabled
- ESLint + Prettier
- Full JSDoc documentation
- InversifyJS for DI
- Property injection (not constructor)
- `@postConstruct` for initialization
- `.inSingletonScope()` for singletons

### iOS App (Separate Repo)
- Swift 5.9+
- SwiftUI for UI
- Swift Concurrency (async/await)
- CoreData/SQLite for caching
- MVVM architecture

---

## Key Documentation

### Backend Documentation (This Repo)
- [Implementation Plan](docs/mobile/IMPLEMENTATION_PLAN.md)
- [Language Profiles](docs/mobile/LANGUAGE_PROFILES.md)
- [LSP Architecture](docs/mobile/LSP_ARCHITECTURE.md)
- [Mobile Architecture Summary](docs/mobile/MOBILE_ARCHITECTURE_SUMMARY.md)
- [Next Steps](docs/mobile/NEXT_STEPS.md)

### iOS App Documentation (Separate Repo)
- Will be in `/Users/michaelsmith/IdeaProjects/theia-ios/ModusFabrica/docs/`

---

## Current Status

### ✅ Complete (Backend)
- Phase 1: Core backend support (WebSocket, sessions, RPC)
- Phase 1.5: LSP Proxy foundation
- Task 2: LanguageProfileManager service (26 tests)
- Task 3: Profile storage & persistence (22 tests)

### ⏳ In Progress (Backend)
- Task 4: DI integration with connection handler
- Task 5: RPC methods for profile management
- Task 6: LSP filtering by active languages

### 🔜 Next (iOS App - Separate Repo)
- Phase 3: iOS app implementation
- WebSocket client
- Profile storage
- LSP cache
- Tree-sitter integration
- SwiftUI editor

---

## Important Notes

1. **No React Native**: This project uses native iOS (Swift/SwiftUI), not React Native
2. **No Kotlin Multiplatform**: iOS-only at this time
3. **No Android**: iOS-only at this time
4. **Two Repositories**: Backend (this repo) and iOS app (separate repo)
5. **Dual Persistence**: Both backend AND iOS app maintain profile state
6. **Offline First**: iOS app works offline with Tree-sitter + LSP cache

---

## Getting Help

### Backend Issues
- Theia Discord: https://discord.gg/theia
- Stack Overflow: Tag `theia-ide`

### iOS Issues
- Swift Forums: https://forums.swift.org
- Stack Overflow: Tag `swiftui`, `ios`

---

## Quick Reference

**Backend Repo**: `/Users/michaelsmith/IdeaProjects/theia`
**iOS App Repo**: `/Users/michaelsmith/IdeaProjects/theia-ios/ModusFabrica`
**Backend Package**: `packages/core-mobile`
**Tests**: `npm test` (199 passing)
**Platform**: iOS only (Swift/SwiftUI)
**Architecture**: Backend + iOS app (two repositories)
