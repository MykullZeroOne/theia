# @theia/core-mobile

Backend support package for Theia mobile clients. Provides protocol definitions, connection handling, and session management for mobile IDE applications.

## Overview

This package is part of a **hybrid repository architecture**:

- **Backend** (`@theia/core-mobile`): Lives in Theia monorepo (this package)
- **Mobile App** (`theia-mobile`): Separate React Native repository (to be created)

## Package Contents

### Protocol Definitions (`src/common/`)

Core protocol types shared between backend and mobile clients:

- **`MobileRPC`**: RPC protocol namespace with contexts and type definitions
  - `MobileMainContext`: Mobile → Backend method calls
  - `MobileExtContext`: Backend → Mobile event notifications
  - `MobileLayout`: Screen orientation and safe area configuration
  - `MobileComponentDescriptor`: UI component registration
  - `MobilePermission`: Platform permission types

- **`MobileProtocolGuards`**: Runtime type validation
  - `isValidOrientation()`, `isValidLayout()`, `isValidComponentDescriptor()`, etc.

### Backend Implementation (`src/node/`)

Server-side mobile client support:

- **`MobileConnectionHandler`**: WebSocket connection lifecycle management
  - Accept and track mobile client connections
  - Route RPC requests (`mobile/initialize`, `mobile/requestCapabilities`)
  - Handle connection errors and cleanup
  
- **`MobileSessionManager`** *(planned)*: Session state persistence
- **`MobileBackendModule`** *(planned)*: Inversify DI bindings

### Test Utilities (`src/common/test/`)

Reusable test helpers:

- **`MockChannel`**: Simulates WebSocket channel for testing

## Installation

```bash
npm install @theia/core-mobile
```

## Usage

### In Theia Backend Extension

```typescript
import { MobileConnectionHandler } from '@theia/core-mobile/lib/node';
import { Channel } from '@theia/core/lib/common';

@injectable()
export class MyBackendService {
    @inject(MobileConnectionHandler)
    protected connectionHandler: MobileConnectionHandler;
    
    async handleMobileConnection(channel: Channel): Promise<void> {
        await this.connectionHandler.handleConnection(channel);
    }
}
```

### In Mobile Client (theia-mobile repo)

```typescript
import { MobileRPC, MobileProtocolGuards } from '@theia/core-mobile';

// Use protocol types
const initOptions: MobileRPC.MobileInitializeOptions = {
    clientInfo: { name: 'TheiaMobile', version: '1.0.0' },
    capabilities: {}
};

// Validate incoming data
if (MobileProtocolGuards.isValidLayout(layout)) {
    updateScreenLayout(layout);
}
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Building

```bash
# Compile TypeScript
npm run compile

# Clean build artifacts
npm run clean
```

### Test-Driven Development

This package follows strict TDD practices:

1. **RED**: Write failing test
2. **GREEN**: Implement minimal code to pass
3. **REFACTOR**: Improve code quality
4. **COMMIT**: Commit when tests pass

See [TDD Implementation Plan](../../docs/mobile-tdd-implementation-plan.md) for details.

## Architecture

```
@theia/core-mobile/
├── src/
│   ├── common/              # Published: Protocol types, guards
│   │   ├── mobile-protocol.ts
│   │   ├── mobile-protocol-guards.ts
│   │   ├── index.ts
│   │   └── test/            # Published: Test utilities
│   │       └── mock-channel.ts
│   └── node/                # Published: Backend implementation
│       ├── mobile-connection-handler.ts
│       ├── mobile-session-manager.ts (planned)
│       └── mobile-backend-module.ts (planned)
├── test/                    # Not published: Package tests
│   └── package.spec.js
└── lib/                     # Generated: Compiled JS + .d.ts files
```

## Publishing

This package is designed to be published to npm for consumption by the separate `theia-mobile` React Native application.

### Package.json Configuration

- **Main entry**: `lib/common/index.js`
- **Types**: `lib/common/index.d.ts`
- **Files**: Includes `lib/` and `src/` directories
- **Peer Dependencies**: `@theia/core`

### Versioning

Follow semantic versioning:
- **Major**: Breaking protocol changes
- **Minor**: New features, backward-compatible
- **Patch**: Bug fixes

## Mobile App Integration

The separate `theia-mobile` React Native application will:

1. Install `@theia/core-mobile` from npm
2. Import protocol types and guards
3. Implement WebSocket client using protocol definitions
4. Connect to Theia backend via mobile-specific endpoints

### Example Mobile Integration

```typescript
// In theia-mobile/src/services/connection/mobile-client.ts
import { MobileRPC } from '@theia/core-mobile';
import { WebSocketClient } from './websocket-client';

export class MobileTheiaClient {
    async initialize(): Promise<void> {
        const initOptions: MobileRPC.MobileInitializeOptions = {
            clientInfo: {
                name: 'Theia Mobile',
                version: '1.0.0'
            },
            capabilities: {
                offlineMode: true,
                gestures: true
            }
        };
        
        const response = await this.sendRequest('mobile/initialize', [initOptions]);
        console.log('Server capabilities:', response.serverCapabilities);
    }
}
```

## Contributing

See [Development Guidelines](../../.zencoder/rules/guidelines.md) for:
- TDD workflow
- Code quality standards
- Commit message format
- Testing requirements

## License

EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

## Links

- [Theia](https://theia-ide.org/)
- [Eclipse Theia GitHub](https://github.com/eclipse-theia/theia)
- [Mobile TDD Plan](../../docs/mobile-tdd-implementation-plan.md)
