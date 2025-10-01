# Theia Mobile Architecture

## Overview

Theia Mobile uses a **hybrid repository architecture** that separates backend and frontend concerns while maintaining type safety and protocol compatibility.

## Repository Structure

### Phase 1: Backend in Monorepo (Current)

```
eclipse-theia/theia/
├── packages/
│   └── core-mobile/              # @theia/core-mobile package
│       ├── src/
│       │   ├── common/           # Protocol definitions (published)
│       │   │   ├── mobile-protocol.ts
│       │   │   ├── mobile-protocol-guards.ts
│       │   │   ├── index.ts
│       │   │   └── test/
│       │   │       └── mock-channel.ts
│       │   └── node/             # Backend implementation (published)
│       │       ├── mobile-connection-handler.ts
│       │       ├── mobile-session-manager.ts
│       │       └── mobile-backend-module.ts
│       ├── package.json          # Publishable to npm
│       └── README.md
├── docs/mobile/                  # Mobile documentation
│   ├── architecture.md           # This file
│   └── mobile-tdd-implementation-plan.md
└── .zencoder/rules/
    └── guidelines.md             # Development guidelines
```

### Phase 2: Mobile App in Separate Repo (Future)

```
theia-mobile/ (NEW separate repository)
├── src/
│   ├── services/
│   │   ├── connection/           # WebSocket client
│   │   │   ├── websocket-manager.ts
│   │   │   ├── rpc-client.ts
│   │   │   └── mobile-client.ts
│   │   ├── extension/            # Extension system
│   │   │   ├── extension-manager.ts
│   │   │   └── plugin-api-bridge.ts
│   │   ├── file/                 # File system integration
│   │   └── state/                # State management (Redux/Zustand)
│   ├── components/               # React Native UI
│   │   ├── Explorer/
│   │   │   ├── FileExplorer.tsx
│   │   │   └── __tests__/
│   │   ├── Editor/
│   │   │   ├── CodeEditor.tsx
│   │   │   └── MonacoWebView.tsx
│   │   ├── Terminal/
│   │   │   └── MobileTerminal.tsx
│   │   └── Navigation/
│   │       └── TabNavigator.tsx
│   ├── screens/                  # Top-level screens
│   ├── hooks/                    # Custom React hooks
│   └── types/                    # Type definitions
│       └── mobile-protocol.d.ts  # From @theia/core-mobile
├── ios/                          # iOS native code
├── android/                      # Android native code
├── e2e/                          # Detox E2E tests
├── package.json                  # Depends on @theia/core-mobile
├── metro.config.js
├── app.json                      # Expo configuration
└── README.md
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                        Theia Backend                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          @theia/core (Main Process)                      │   │
│  │  ┌────────────────────────────────────────────────┐     │   │
│  │  │     Language Server Protocol (LSP)             │     │   │
│  │  │     Debug Adapter Protocol (DAP)               │     │   │
│  │  │     File System, Git, Terminal, etc.           │     │   │
│  │  └────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↕                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      @theia/core-mobile (Mobile Support Layer)          │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  MobileConnectionHandler                        │    │   │
│  │  │  - Accept WebSocket connections                 │    │   │
│  │  │  - Route mobile RPC requests                    │    │   │
│  │  │  - Manage connection lifecycle                  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  MobileSessionManager                           │    │   │
│  │  │  - Persist workspace state                      │    │   │
│  │  │  - Handle reconnection                          │    │   │
│  │  │  - Session expiration                           │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  MobileRPC Protocol                             │    │   │
│  │  │  - Protocol definitions                         │    │   │
│  │  │  - Type guards and validators                   │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          ↕
                   WebSocket over HTTPS
                   (Mobile RPC Protocol)
                          ↕
┌─────────────────────────────────────────────────────────────────┐
│                    Theia Mobile App                              │
│                   (Separate Repository)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React Native UI Layer                       │   │
│  │  ┌────────────────────────────────────────────────┐     │   │
│  │  │  File Explorer  │  Code Editor  │  Terminal    │     │   │
│  │  │  Extensions     │  Settings     │  Search      │     │   │
│  │  └────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↕                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Connection Service Layer                    │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  MobileWebSocketManager                         │    │   │
│  │  │  - WebSocket connection                         │    │   │
│  │  │  - Reconnection with backoff                    │    │   │
│  │  │  - Network monitoring                           │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  MobileRPCClient                                │    │   │
│  │  │  - Request/response handling                    │    │   │
│  │  │  - Notification routing                         │    │   │
│  │  │  - Message encoding (msgpack)                   │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  Types from @theia/core-mobile                  │    │   │
│  │  │  - MobileRPC protocol definitions               │    │   │
│  │  │  - Protocol guards                              │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↕                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Platform Services (Native)                  │   │
│  │  - File System (iOS Files app, Android storage)         │   │
│  │  - Biometric Auth                                        │   │
│  │  - Share Sheet                                           │   │
│  │  - Haptic Feedback                                       │   │
│  │  - Notifications                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Protocol Communication

### Mobile RPC Protocol

The communication protocol is defined in `@theia/core-mobile` and consists of:

#### 1. Context Definitions

**MobileMainContext** (Mobile → Backend):
```typescript
interface MobileMainContext {
    $showTextDocument(uri: string, options?: MobileTextDocumentShowOptions): Promise<void>;
    $updateLayout(layout: MobileLayout): Promise<void>;
    $registerComponent(component: MobileComponentDescriptor): Promise<void>;
    $showToast(message: string, type: 'info' | 'warning' | 'error'): Promise<void>;
    $vibrate(pattern: number[]): Promise<void>;
    $requestPermission(permission: MobilePermission): Promise<boolean>;
}
```

**MobileExtContext** (Backend → Mobile):
```typescript
interface MobileExtContext {
    $onDidChangeTextDocument(uri: string, changes: TextDocumentContentChangeEvent[]): void;
    $onDidChangeOrientation(orientation: 'portrait' | 'landscape'): void;
    $onDidEnterBackground(): void;
    $onDidEnterForeground(): void;
    $executeCommand(command: string, ...args: any[]): Promise<any>;
}
```

#### 2. Connection Lifecycle

```
Mobile App                          Backend
    │                                  │
    │──── WebSocket Connect ──────────>│
    │                                  │
    │──── mobile/initialize ──────────>│
    │     { clientInfo, capabilities } │
    │                                  │
    │<─── Initialize Response ─────────│
    │     { serverCapabilities,        │
    │       mobileCapabilities }       │
    │                                  │
    │──── mobile/requestCapabilities ─>│
    │                                  │
    │<─── Capabilities Response ───────│
    │                                  │
    │═════ Active Session ═════════════│
    │                                  │
    │──── RPC Requests ───────────────>│
    │<─── RPC Responses ───────────────│
    │<─── Event Notifications ─────────│
    │                                  │
    │──── WebSocket Close ────────────>│
    │<─── Cleanup ─────────────────────│
```

#### 3. Message Format

Messages use MessagePack encoding for efficiency:

```typescript
// Request
{
    type: 'request',
    id: string,
    method: string,
    params: any[]
}

// Response
{
    type: 'response',
    id: string,
    result?: any,
    error?: { message: string, code?: number }
}

// Notification
{
    type: 'notification',
    method: string,
    params: any[]
}
```

## Package Publishing Flow

```
┌──────────────────────────────────────────────────────────┐
│  Development in Theia Monorepo                           │
│                                                           │
│  1. Develop backend features                             │
│  2. Write tests (TDD)                                    │
│  3. Update protocol definitions                          │
│  4. Compile TypeScript                                   │
│  5. Run tests                                            │
│  6. Bump version (semver)                                │
│  7. Generate CHANGELOG                                   │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│  Publish to npm                                          │
│                                                           │
│  npm publish @theia/core-mobile                          │
│                                                           │
│  Includes:                                               │
│  - lib/ (compiled JS + .d.ts)                            │
│  - src/ (TypeScript source)                              │
│  - package.json                                          │
│  - README.md                                             │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│  Mobile App Consumes Package                             │
│                                                           │
│  npm install @theia/core-mobile@^1.0.0                   │
│                                                           │
│  import { MobileRPC } from '@theia/core-mobile';         │
└──────────────────────────────────────────────────────────┘
```

## Development Workflow

### Backend Development (Current Phase)

1. **Write Tests** (RED)
   ```bash
   # In packages/core-mobile/
   npx jest src/node/feature.spec.ts --watch
   ```

2. **Implement Feature** (GREEN)
   - Write minimal code to pass tests
   - Follow Theia patterns (InversifyJS, etc.)

3. **Refactor** (REFACTOR)
   - Improve code quality
   - Ensure tests still pass

4. **Commit**
   ```bash
   git add .
   git commit -m "[mobile-XXX] feat: description"
   ```

### Mobile Development (Future Phase)

1. **Install Latest Backend Package**
   ```bash
   npm install @theia/core-mobile@latest
   ```

2. **Write React Native Tests** (RED)
   ```bash
   npm test src/components/Feature.test.tsx --watch
   ```

3. **Implement Component** (GREEN)
   - Use protocol types from `@theia/core-mobile`
   - Test with MockChannel or test server

4. **Refactor & Commit**

## Security Considerations

### Authentication
- OAuth 2.0 / OpenID Connect for user authentication
- JWT tokens for session management
- Biometric authentication on mobile (Face ID, Touch ID)

### Transport Security
- HTTPS/WSS only (no unencrypted connections)
- Certificate pinning for production
- Token-based WebSocket authentication

### Data Protection
- Encrypt sensitive data at rest (Keychain/Keystore)
- Clear cache on logout
- Secure file storage using platform APIs

## Offline Support

### Strategy
1. **Cache Layer**: Local SQLite database for workspace metadata
2. **File Sync**: Diff-based synchronization when reconnected
3. **Conflict Resolution**: Last-write-wins with manual merge option
4. **Queue System**: Offline operations queued and replayed

### Implementation (Future)
```typescript
interface OfflineSyncService {
    queueOperation(op: FileOperation): void;
    syncWhenOnline(): Promise<void>;
    resolveConflicts(conflicts: Conflict[]): Promise<void>;
}
```

## Performance Optimization

### Mobile App
- Virtualized lists (FlatList, SectionList)
- Lazy loading for large files
- Code splitting for extensions
- Image optimization
- Debounced text input

### Backend
- Connection pooling
- Rate limiting per connection
- Message batching
- Gzip compression
- Response caching

## Testing Strategy

### Backend Tests (packages/core-mobile/)
- **Unit Tests**: Jest with ts-jest
- **Coverage**: ≥80% (lines, branches, functions)
- **Integration Tests**: Test with MockChannel
- **Location**: Co-located with source (`*.spec.ts`)

### Mobile Tests (theia-mobile/)
- **Unit Tests**: Jest + React Native Testing Library
- **Component Tests**: Render and interaction tests
- **Integration Tests**: WebSocket client tests
- **E2E Tests**: Detox for full user flows
- **Location**: Co-located or `__tests__/` directories

## Deployment

### Backend
- Published to npm as `@theia/core-mobile`
- Consumed by standard Theia installations
- No separate deployment needed

### Mobile App
- **iOS**: TestFlight → App Store
- **Android**: Google Play Internal Testing → Production
- **Build**: Expo Application Services (EAS)
- **CI/CD**: GitHub Actions

## Next Steps

### Phase 1: Complete Backend (Months 1-2)
- ✅ Protocol definitions
- ✅ Connection handler
- ⏳ Session manager
- ⏳ Backend DI module
- ⏳ Publish to npm

### Phase 2: Create Mobile Repo (Month 3)
- Create `theia-mobile` repository
- Setup React Native + Expo
- Install `@theia/core-mobile` dependency
- Implement WebSocket client
- Create basic UI components

### Phase 3: Feature Development (Months 4-12)
- File explorer
- Code editor (Monaco WebView)
- Terminal
- Extension system
- Search
- Git integration

### Phase 4: Polish & Release (Months 13-15)
- Performance optimization
- E2E testing
- Beta testing
- App Store submission

## References

- [TDD Implementation Plan](./mobile-tdd-implementation-plan.md)
- [Development Guidelines](../../.zencoder/rules/guidelines.md)
- [Eclipse Theia Docs](https://theia-ide.org/docs/)
