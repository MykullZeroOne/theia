# Theia React Native Mobile Client - TDD Implementation Plan

## Overview

This document provides a detailed, enumerated implementation plan for building the Theia React Native mobile client following Test-Driven Development (TDD) principles. Each feature is broken down into manageable tasks with specific test requirements, branch naming, and commit guidelines.

## TDD Workflow

Every feature follows this cycle:

1. **🔴 RED**: Write failing tests first
2. **🟢 GREEN**: Write minimal code to make tests pass
3. **🔵 REFACTOR**: Clean up code while keeping tests green
4. **✅ COMMIT**: Commit when all tests pass
5. **🚀 PUSH**: Push to feature branch
6. **🔀 PR**: Create pull request for review

## Branch Naming Convention

```
feature/mobile-{feature-number}-{short-description}
```

Examples:
- `feature/mobile-001-project-setup`
- `feature/mobile-002-websocket-connection`
- `feature/mobile-015-file-explorer`

## Commit Message Convention

```
[mobile-{feature-number}] {type}: {description}

{optional body}

Tests: {test description}
```

Types: `feat`, `test`, `refactor`, `fix`, `docs`, `chore`

Example:
```
[mobile-002] test: add WebSocket connection tests

Add unit tests for WebSocket manager covering:
- Connection establishment
- Reconnection logic
- Message encoding/decoding

Tests: WebSocket connection lifecycle
```

---

# Phase 0: Project Setup & Infrastructure (Week 1)

## Feature 0.1: Repository Structure Setup

**Branch**: `feature/mobile-001-project-setup`

### Task 0.1.1: Create basic directory structure
**TDD Steps**:
1. 🔴 Write structure validation test
2. 🟢 Create directories
3. ✅ Commit: `[mobile-001] chore: create mobile project structure`

**Files to create**:
```
examples/mobile/.gitkeep
packages/core-mobile/.gitkeep
docs/mobile/.gitkeep
```

**Test**:
```typescript
// scripts/test-mobile-structure.spec.ts
describe('Mobile Project Structure', () => {
  test('mobile directories exist', () => {
    expect(fs.existsSync('examples/mobile')).toBe(true);
    expect(fs.existsSync('packages/core-mobile')).toBe(true);
    expect(fs.existsSync('docs/mobile')).toBe(true);
  });
});
```

### Task 0.1.2: Setup packages/core-mobile package
**TDD Steps**:
1. 🔴 Write package.json validation tests
2. 🟢 Create package.json and tsconfig.json
3. 🔵 Refactor package metadata
4. ✅ Commit: `[mobile-001] feat: add core-mobile package configuration`

**Test**:
```typescript
// packages/core-mobile/test/package.spec.ts
describe('Core Mobile Package', () => {
  test('package.json has required fields', () => {
    const pkg = require('../package.json');
    expect(pkg.name).toBe('@theia/core-mobile');
    expect(pkg.version).toBeDefined();
    expect(pkg.dependencies).toHaveProperty('@theia/core');
  });

  test('tsconfig extends base configuration', () => {
    const tsconfig = require('../tsconfig.json');
    expect(tsconfig.extends).toBe('../../configs/base.tsconfig.json');
  });
});
```

### Task 0.1.3: Update root package.json with mobile scripts
**TDD Steps**:
1. 🔴 Write script execution tests
2. 🟢 Add mobile scripts to root package.json
3. ✅ Commit: `[mobile-001] chore: add mobile npm scripts`

**Scripts to add**:
```json
{
  "scripts": {
    "mobile:install": "cd examples/mobile && npm install",
    "mobile:test": "lerna run test --scope '@theia/*mobile*'",
    "mobile:build": "lerna run compile --scope '@theia/core-mobile'",
    "mobile:watch": "lerna run watch --scope '@theia/core-mobile'"
  }
}
```

### Task 0.1.4: Configure lerna for mobile packages
**TDD Steps**:
1. 🔴 Write lerna bootstrap test
2. 🟢 Update lerna.json if needed
3. ✅ Commit: `[mobile-001] chore: configure lerna for mobile packages`

**Push branch and create PR**

---

## Feature 0.2: CI/CD Pipeline for Mobile

**Branch**: `feature/mobile-002-ci-pipeline`

### Task 0.2.1: Create mobile CI workflow
**TDD Steps**:
1. 🔴 Write workflow validation test
2. 🟢 Create .github/workflows/mobile-ci.yml
3. ✅ Commit: `[mobile-002] ci: add mobile CI workflow`

**Workflow File**:
```yaml
# .github/workflows/mobile-ci.yml
name: Mobile CI

on:
  push:
    branches: [master, 'feature/mobile-*']
    paths:
      - 'packages/core-mobile/**'
      - 'examples/mobile/**'
      - '.github/workflows/mobile-ci.yml'
  pull_request:
    paths:
      - 'packages/core-mobile/**'
      - 'examples/mobile/**'

jobs:
  test-backend:
    name: Test Mobile Backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run mobile:build
      - run: npm run mobile:test

  # More jobs added in later tasks
```

### Task 0.2.2: Setup test coverage reporting
**TDD Steps**:
1. 🔴 Write coverage validation test
2. 🟢 Add coverage configuration
3. ✅ Commit: `[mobile-002] test: configure coverage reporting`

**Push branch and create PR**

---

## Feature 0.3: Testing Infrastructure

**Branch**: `feature/mobile-003-test-infrastructure`

### Task 0.3.1: Setup Jest for mobile packages
**TDD Steps**:
1. 🔴 Write Jest config validation test
2. 🟢 Create jest.config.js for mobile packages
3. ✅ Commit: `[mobile-003] test: setup Jest configuration`

**Files**:
```javascript
// packages/core-mobile/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/test/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Task 0.3.2: Create test utilities and mocks
**TDD Steps**:
1. 🔴 Write tests for test utilities
2. 🟢 Create reusable test utilities
3. ✅ Commit: `[mobile-003] test: add test utilities and mocks`

**Files**:
```typescript
// packages/core-mobile/src/common/test/mock-channel.ts
export class MockChannel implements Channel {
  private handlers: ((data: Uint8Array) => void)[] = [];

  onMessage(handler: (data: Uint8Array) => void): Disposable {
    this.handlers.push(handler);
    return { dispose: () => {} };
  }

  send(data: Uint8Array): void {
    // Mock implementation
  }
}
```

**Push branch and create PR**

---

# Phase 1: Core Backend Support (Months 1-2)

## Feature 1.1: Mobile Protocol Definition

**Branch**: `feature/mobile-010-mobile-protocol`

### Task 1.1.1: Define mobile RPC protocol interfaces
**TDD Steps**:
1. 🔴 Write protocol interface tests
2. 🟢 Implement protocol interfaces
3. 🔵 Refactor for clarity
4. ✅ Commit: `[mobile-010] feat: define mobile RPC protocol interfaces`

**Test**:
```typescript
// packages/core-mobile/src/common/mobile-protocol.spec.ts
import { MobileRPC } from './mobile-protocol';

describe('Mobile RPC Protocol', () => {
  describe('Context Identifiers', () => {
    test('should have MOBILE_MAIN context', () => {
      expect(MobileRPC.CONTEXT.MOBILE_MAIN).toBe('MOBILE_MAIN');
    });

    test('should have MOBILE_EXT context', () => {
      expect(MobileRPC.CONTEXT.MOBILE_EXT).toBe('MOBILE_EXT');
    });
  });

  describe('MobileMainContext Interface', () => {
    test('should define required methods', () => {
      const methods = [
        '$showTextDocument',
        '$updateLayout',
        '$registerComponent',
        '$showToast',
        '$vibrate',
        '$requestPermission'
      ];

      // Validate interface structure via type checking
      const mockImpl: MobileRPC.MobileMainContext = {
        $showTextDocument: jest.fn(),
        $updateLayout: jest.fn(),
        $registerComponent: jest.fn(),
        $showToast: jest.fn(),
        $vibrate: jest.fn(),
        $requestPermission: jest.fn()
      };

      methods.forEach(method => {
        expect(mockImpl).toHaveProperty(method);
      });
    });
  });

  describe('MobileLayout Type', () => {
    test('should validate layout structure', () => {
      const layout: MobileRPC.MobileLayout = {
        orientation: 'portrait',
        screenSize: { width: 375, height: 812 },
        safeAreaInsets: { top: 44, bottom: 34, left: 0, right: 0 }
      };

      expect(layout.orientation).toMatch(/^(portrait|landscape)$/);
      expect(layout.screenSize).toHaveProperty('width');
      expect(layout.screenSize).toHaveProperty('height');
    });
  });

  describe('MobileComponentDescriptor Type', () => {
    test('should validate component descriptor', () => {
      const descriptor: MobileRPC.MobileComponentDescriptor = {
        id: 'test-component',
        type: 'view',
        contribution: {
          title: 'Test View',
          location: 'tab'
        },
        renderer: 'react'
      };

      expect(descriptor.type).toMatch(/^(view|panel|modal)$/);
      expect(descriptor.renderer).toMatch(/^(react|webview)$/);
    });
  });
});
```

**Implementation**:
```typescript
// packages/core-mobile/src/common/mobile-protocol.ts
export namespace MobileRPC {
    export const CONTEXT = {
        MOBILE_MAIN: 'MOBILE_MAIN',
        MOBILE_EXT: 'MOBILE_EXT'
    };

    export interface MobileMainContext {
        $showTextDocument(uri: string, options?: MobileTextDocumentShowOptions): Promise<void>;
        $updateLayout(layout: MobileLayout): Promise<void>;
        $registerComponent(component: MobileComponentDescriptor): Promise<void>;
        $showToast(message: string, type: 'info' | 'warning' | 'error'): Promise<void>;
        $vibrate(pattern: number[]): Promise<void>;
        $requestPermission(permission: MobilePermission): Promise<boolean>;
    }

    export interface MobileExtContext {
        $onDidChangeTextDocument(uri: string, changes: TextDocumentContentChangeEvent[]): void;
        $onDidChangeOrientation(orientation: 'portrait' | 'landscape'): void;
        $onDidEnterBackground(): void;
        $onDidEnterForeground(): void;
        $executeCommand(command: string, ...args: any[]): Promise<any>;
    }

    export interface MobileLayout {
        orientation: 'portrait' | 'landscape';
        screenSize: { width: number; height: number };
        safeAreaInsets: { top: number; bottom: number; left: number; right: number };
        splitView?: {
            enabled: boolean;
            ratio: number;
        };
    }

    export interface MobileComponentDescriptor {
        id: string;
        type: 'view' | 'panel' | 'modal';
        contribution: {
            title: string;
            icon?: string;
            location: 'tab' | 'drawer' | 'floating';
        };
        renderer: 'react' | 'webview';
        component?: any; // React.ComponentType - avoid importing React in common
        webviewOptions?: any;
    }

    export type MobilePermission =
        | 'camera'
        | 'photoLibrary'
        | 'location'
        | 'notifications'
        | 'microphone';

    export interface MobileTextDocumentShowOptions {
        selection?: { start: number; end: number };
        preserveFocus?: boolean;
        preview?: boolean;
    }
}
```

### Task 1.1.2: Add protocol type guards and validators
**TDD Steps**:
1. 🔴 Write type guard tests
2. 🟢 Implement type guards
3. ✅ Commit: `[mobile-010] feat: add protocol type guards`

**Test**:
```typescript
// packages/core-mobile/src/common/mobile-protocol-guards.spec.ts
import { MobileProtocolGuards } from './mobile-protocol-guards';

describe('Mobile Protocol Guards', () => {
  describe('isValidOrientation', () => {
    test('should accept valid orientations', () => {
      expect(MobileProtocolGuards.isValidOrientation('portrait')).toBe(true);
      expect(MobileProtocolGuards.isValidOrientation('landscape')).toBe(true);
    });

    test('should reject invalid orientations', () => {
      expect(MobileProtocolGuards.isValidOrientation('vertical')).toBe(false);
      expect(MobileProtocolGuards.isValidOrientation('')).toBe(false);
    });
  });

  describe('isValidLayout', () => {
    test('should validate complete layout', () => {
      const validLayout = {
        orientation: 'portrait',
        screenSize: { width: 375, height: 812 },
        safeAreaInsets: { top: 44, bottom: 34, left: 0, right: 0 }
      };
      expect(MobileProtocolGuards.isValidLayout(validLayout)).toBe(true);
    });

    test('should reject incomplete layout', () => {
      const invalidLayout = { orientation: 'portrait' };
      expect(MobileProtocolGuards.isValidLayout(invalidLayout)).toBe(false);
    });
  });
});
```

**Push branch and create PR**

---

## Feature 1.2: WebSocket Connection Handler

**Branch**: `feature/mobile-011-websocket-handler`

### Task 1.2.1: Write tests for connection lifecycle
**TDD Steps**:
1. 🔴 Write connection lifecycle tests
2. 🟢 Implement MobileConnectionHandler skeleton
3. 🔵 Refactor connection logic
4. ✅ Commit: `[mobile-011] test: add connection lifecycle tests`

**Test**:
```typescript
// packages/core-mobile/src/node/mobile-connection-handler.spec.ts
import { MobileConnectionHandler } from './mobile-connection-handler';
import { MockChannel } from '../common/test/mock-channel';

describe('MobileConnectionHandler', () => {
  let handler: MobileConnectionHandler;
  let mockChannel: MockChannel;

  beforeEach(() => {
    handler = new MobileConnectionHandler();
    mockChannel = new MockChannel();
  });

  describe('Connection Handling', () => {
    test('should accept new connection', async () => {
      await expect(handler.handleConnection(mockChannel)).resolves.not.toThrow();
    });

    test('should create RPC protocol for connection', async () => {
      await handler.handleConnection(mockChannel);
      expect(handler.getActiveConnections()).toHaveLength(1);
    });

    test('should cleanup on connection close', async () => {
      await handler.handleConnection(mockChannel);
      mockChannel.close();

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(handler.getActiveConnections()).toHaveLength(0);
    });
  });

  describe('Request Handling', () => {
    test('should handle mobile/initialize request', async () => {
      await handler.handleConnection(mockChannel);

      const response = await mockChannel.sendRequest('mobile/initialize', [{
        clientInfo: { name: 'TheiaMobile', version: '1.0.0' },
        capabilities: {}
      }]);

      expect(response).toHaveProperty('serverCapabilities');
      expect(response).toHaveProperty('mobileCapabilities');
    });

    test('should return mobile-specific capabilities', async () => {
      await handler.handleConnection(mockChannel);

      const response = await mockChannel.sendRequest('mobile/requestCapabilities', []);

      expect(response.offlineMode).toBe(true);
      expect(response.gestureSupport).toBe(true);
      expect(response.hapticFeedback).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown method gracefully', async () => {
      await handler.handleConnection(mockChannel);

      await expect(
        mockChannel.sendRequest('mobile/unknownMethod', [])
      ).rejects.toThrow('Unknown method');
    });

    test('should handle malformed requests', async () => {
      await handler.handleConnection(mockChannel);

      await expect(
        mockChannel.sendRequest('mobile/initialize', [null])
      ).rejects.toThrow();
    });
  });
});
```

### Task 1.2.2: Implement connection handler
**TDD Steps**:
1. 🟢 Implement to pass tests
2. 🔵 Refactor for better error handling
3. ✅ Commit: `[mobile-011] feat: implement mobile connection handler`

**Implementation**:
```typescript
// packages/core-mobile/src/node/mobile-connection-handler.ts
import { injectable } from '@theia/core/shared/inversify';
import { RpcProtocol } from '@theia/core/lib/common/message-rpc/rpc-protocol';
import { Channel } from '@theia/core/lib/common/message-rpc/channel';
import { MsgPackMessageEncoder, MsgPackMessageDecoder } from '@theia/core/lib/common/message-rpc/rpc-message-encoder';
import { Disposable } from '@theia/core/lib/common/disposable';

export interface MobileInitializeOptions {
    clientInfo: {
        name: string;
        version: string;
    };
    capabilities: Record<string, any>;
}

@injectable()
export class MobileConnectionHandler {
    private connections = new Map<string, { protocol: RpcProtocol; disposable: Disposable }>();

    async handleConnection(channel: Channel): Promise<void> {
        const connectionId = this.generateConnectionId();

        const protocol = new RpcProtocol(channel, this.createRequestHandler(), {
            encoder: new MsgPackMessageEncoder(),
            decoder: new MsgPackMessageDecoder()
        });

        const disposable = channel.onClose(() => {
            this.connections.delete(connectionId);
        });

        this.connections.set(connectionId, { protocol, disposable });
    }

    getActiveConnections(): Array<{ protocol: RpcProtocol }> {
        return Array.from(this.connections.values());
    }

    private createRequestHandler() {
        return async (method: string, args: any[]): Promise<any> => {
            switch (method) {
                case 'mobile/initialize':
                    return this.handleInitialize(args[0]);
                case 'mobile/requestCapabilities':
                    return this.handleCapabilities();
                default:
                    throw new Error(`Unknown method: ${method}`);
            }
        };
    }

    private async handleInitialize(options: MobileInitializeOptions) {
        if (!options || !options.clientInfo) {
            throw new Error('Invalid initialize options');
        }

        return {
            serverCapabilities: {
                textDocumentSync: 2, // Incremental
                completionProvider: { triggerCharacters: ['.', ':', '<'] },
                hoverProvider: true,
                definitionProvider: true,
            },
            mobileCapabilities: {
                offlineMode: true,
                backgroundSync: true,
                gestureSupport: true,
                hapticFeedback: true
            }
        };
    }

    private async handleCapabilities() {
        return {
            offlineMode: true,
            backgroundSync: true,
            gestureSupport: true,
            hapticFeedback: true
        };
    }

    private generateConnectionId(): string {
        return `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
```

### Task 1.2.3: Add connection rate limiting tests
**TDD Steps**:
1. 🔴 Write rate limiting tests
2. 🟢 Implement rate limiting
3. ✅ Commit: `[mobile-011] feat: add connection rate limiting`

**Push branch and create PR**

---

## Feature 1.3: Session Management

**Branch**: `feature/mobile-012-session-management`

### Task 1.3.1: Write session lifecycle tests
**TDD Steps**:
1. 🔴 Write session management tests
2. 🟢 Implement MobileSessionManager
3. ✅ Commit: `[mobile-012] test: add session management tests`

**Test**:
```typescript
// packages/core-mobile/src/node/mobile-session-manager.spec.ts
import { MobileSessionManager } from './mobile-session-manager';
import { RpcProtocol } from '@theia/core/lib/common/message-rpc/rpc-protocol';

describe('MobileSessionManager', () => {
  let sessionManager: MobileSessionManager;

  beforeEach(() => {
    sessionManager = new MobileSessionManager();
  });

  describe('Session Creation', () => {
    test('should create new session', async () => {
      const protocol = createMockProtocol();
      const session = await sessionManager.createSession(protocol);

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('createdAt');
    });

    test('should assign unique session IDs', async () => {
      const protocol1 = createMockProtocol();
      const protocol2 = createMockProtocol();

      const session1 = await sessionManager.createSession(protocol1);
      const session2 = await sessionManager.createSession(protocol2);

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('Session Retrieval', () => {
    test('should retrieve existing session', async () => {
      const protocol = createMockProtocol();
      const created = await sessionManager.createSession(protocol);

      const retrieved = sessionManager.getSession(created.id);
      expect(retrieved).toEqual(created);
    });

    test('should return undefined for non-existent session', () => {
      const session = sessionManager.getSession('non-existent');
      expect(session).toBeUndefined();
    });
  });

  describe('Session Persistence', () => {
    test('should save session state', async () => {
      const protocol = createMockProtocol();
      const session = await sessionManager.createSession(protocol);

      const state = { workspace: '/tmp/test', openFiles: ['file1.ts'] };
      await sessionManager.saveSessionState(session.id, state);

      const retrieved = await sessionManager.getSessionState(session.id);
      expect(retrieved).toEqual(state);
    });

    test('should restore session on reconnect', async () => {
      const protocol1 = createMockProtocol();
      const session1 = await sessionManager.createSession(protocol1);

      const state = { workspace: '/tmp/test' };
      await sessionManager.saveSessionState(session1.id, state);

      // Simulate disconnect and reconnect
      await sessionManager.destroySession(session1.id);

      const protocol2 = createMockProtocol();
      const session2 = await sessionManager.restoreSession(session1.id, protocol2);

      const restoredState = await sessionManager.getSessionState(session2.id);
      expect(restoredState).toEqual(state);
    });
  });

  describe('Session Cleanup', () => {
    test('should destroy session', async () => {
      const protocol = createMockProtocol();
      const session = await sessionManager.createSession(protocol);

      await sessionManager.destroySession(session.id);

      expect(sessionManager.getSession(session.id)).toBeUndefined();
    });

    test('should cleanup expired sessions', async () => {
      jest.useFakeTimers();

      const protocol = createMockProtocol();
      const session = await sessionManager.createSession(protocol);

      // Fast-forward time past expiration
      jest.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 hours

      await sessionManager.cleanupExpiredSessions();

      expect(sessionManager.getSession(session.id)).toBeUndefined();

      jest.useRealTimers();
    });
  });
});

function createMockProtocol(): RpcProtocol {
  const mockChannel = {
    onMessage: jest.fn(),
    onClose: jest.fn(),
    send: jest.fn()
  };
  return new RpcProtocol(mockChannel as any, jest.fn());
}
```

### Task 1.3.2: Implement session manager
**TDD Steps**:
1. 🟢 Implement session manager
2. 🔵 Refactor session storage
3. ✅ Commit: `[mobile-012] feat: implement mobile session manager`

### Task 1.3.3: Add session persistence to filesystem
**TDD Steps**:
1. 🔴 Write filesystem persistence tests
2. 🟢 Implement filesystem persistence
3. ✅ Commit: `[mobile-012] feat: add session filesystem persistence`

**Push branch and create PR**

---

## Feature 1.4: Backend DI Module

**Branch**: `feature/mobile-013-backend-module`

### Task 1.4.1: Write module binding tests
**TDD Steps**:
1. 🔴 Write DI module tests
2. 🟢 Create backend module
3. ✅ Commit: `[mobile-013] feat: create mobile backend DI module`

**Test**:
```typescript
// packages/core-mobile/src/node/mobile-backend-module.spec.ts
import { Container } from '@theia/core/shared/inversify';
import { bindMobileBackend } from './mobile-backend-module';
import { MobileConnectionHandler } from './mobile-connection-handler';
import { MobileSessionManager } from './mobile-session-manager';

describe('Mobile Backend Module', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    bindMobileBackend(container.bind.bind(container));
  });

  test('should bind MobileConnectionHandler', () => {
    const handler = container.get(MobileConnectionHandler);
    expect(handler).toBeInstanceOf(MobileConnectionHandler);
  });

  test('should bind MobileSessionManager', () => {
    const manager = container.get(MobileSessionManager);
    expect(manager).toBeInstanceOf(MobileSessionManager);
  });

  test('should bind as singletons', () => {
    const handler1 = container.get(MobileConnectionHandler);
    const handler2 = container.get(MobileConnectionHandler);
    expect(handler1).toBe(handler2);
  });
});
```

**Push branch and create PR**

---

# Phase 2: React Native App Foundation (Months 3-4)

## Feature 2.1: React Native Project Setup

**Branch**: `feature/mobile-020-rn-project-setup`

### Task 2.1.1: Initialize React Native project
**TDD Steps**:
1. 🔴 Write project structure validation tests
2. 🟢 Run `npx react-native init` and configure
3. ✅ Commit: `[mobile-020] feat: initialize React Native project`

**Commands**:
```bash
cd examples/
npx react-native@latest init TheiaMobile --template react-native-template-typescript
mv TheiaMobile mobile
cd mobile
```

### Task 2.1.2: Configure TypeScript and ESLint
**TDD Steps**:
1. 🔴 Write config validation tests
2. 🟢 Create tsconfig.json and .eslintrc
3. ✅ Commit: `[mobile-020] chore: configure TypeScript and ESLint`

### Task 2.1.3: Setup Metro bundler for monorepo
**TDD Steps**:
1. 🔴 Write Metro config tests
2. 🟢 Configure metro.config.js for Lerna
3. ✅ Commit: `[mobile-020] chore: configure Metro for monorepo`

**metro.config.js**:
```javascript
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  watchFolders: [
    path.resolve(__dirname, '../../node_modules'),
    path.resolve(__dirname, '../../packages'),
  ],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, './node_modules'),
      path.resolve(__dirname, '../../node_modules'),
    ],
    extraNodeModules: new Proxy({}, {
      get: (target, name) => path.join(__dirname, `../../node_modules/${name}`),
    }),
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

### Task 2.1.4: Add React Native testing setup
**TDD Steps**:
1. 🔴 Write sample component test
2. 🟢 Setup @testing-library/react-native
3. ✅ Commit: `[mobile-020] test: setup React Native testing library`

**jest.config.js**:
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)',
  ],
  moduleNameMapper: {
    '^@theia/(.*)$': '<rootDir>/../../packages/$1/src',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

**Push branch and create PR**

---

## Feature 2.2: WebSocket Connection Layer

**Branch**: `feature/mobile-021-websocket-client`

### Task 2.2.1: Write WebSocket manager tests
**TDD Steps**:
1. 🔴 Write connection tests
2. 🟢 Implement MobileWebSocketManager skeleton
3. ✅ Commit: `[mobile-021] test: add WebSocket manager tests`

**Test**:
```typescript
// examples/mobile/src/services/connection/__tests__/websocket-manager.test.ts
import { MobileWebSocketManager } from '../websocket-manager';
import WS from 'jest-websocket-mock';

describe('MobileWebSocketManager', () => {
  let server: WS;
  let wsManager: MobileWebSocketManager;

  beforeEach(() => {
    server = new WS('ws://localhost:3000');
    wsManager = new MobileWebSocketManager('ws://localhost:3000');
  });

  afterEach(() => {
    WS.clean();
  });

  describe('Connection', () => {
    test('should connect to server', async () => {
      const connectPromise = wsManager.connect();
      await server.connected;
      await connectPromise;

      expect(wsManager.isConnected()).toBe(true);
    });

    test('should emit onConnect event', async () => {
      const onConnect = jest.fn();
      wsManager.onConnect(onConnect);

      await wsManager.connect();
      await server.connected;

      expect(onConnect).toHaveBeenCalled();
    });

    test('should reject on connection timeout', async () => {
      jest.useFakeTimers();

      const connectPromise = wsManager.connect();

      jest.advanceTimersByTime(11000); // Past 10s timeout

      await expect(connectPromise).rejects.toThrow('Connection timeout');

      jest.useRealTimers();
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await wsManager.connect();
      await server.connected;
    });

    test('should send messages', async () => {
      const data = new Uint8Array([1, 2, 3, 4]);
      wsManager.send(data);

      await expect(server).toReceiveMessage(data.buffer);
    });

    test('should receive messages', async () => {
      const onMessage = jest.fn();
      wsManager.onMessage(onMessage);

      const data = new Uint8Array([5, 6, 7, 8]);
      server.send(data.buffer);

      expect(onMessage).toHaveBeenCalledWith(data);
    });

    test('should throw when sending while disconnected', () => {
      wsManager.close();

      expect(() => {
        wsManager.send(new Uint8Array([1, 2, 3]));
      }).toThrow('WebSocket is not connected');
    });
  });

  describe('Reconnection', () => {
    test('should attempt reconnection on disconnect', async () => {
      jest.useFakeTimers();

      await wsManager.connect();
      await server.connected;

      server.close();

      // Should attempt first reconnection after 1s
      jest.advanceTimersByTime(1000);

      await server.connected;
      expect(wsManager.isConnected()).toBe(true);

      jest.useRealTimers();
    });

    test('should use exponential backoff', async () => {
      jest.useFakeTimers();

      await wsManager.connect();
      await server.connected;

      // Close and reject first reconnection
      server.close();
      jest.advanceTimersByTime(1000);
      server.error();

      // Should wait 2s for second attempt
      jest.advanceTimersByTime(2000);
      await server.connected;

      jest.useRealTimers();
    });

    test('should stop after max attempts', async () => {
      jest.useFakeTimers();

      await wsManager.connect();
      server.close();

      // Exhaust all reconnection attempts
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(Math.min(1000 * Math.pow(2, i), 30000));
        server.error();
      }

      expect(wsManager.isConnected()).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('Network Monitoring', () => {
    test('should reconnect when network is restored', async () => {
      // This would test NetInfo integration
      // Skipped for brevity - would use NetInfo mocks
    });
  });
});
```

### Task 2.2.2: Implement WebSocket manager
**TDD Steps**:
1. 🟢 Implement WebSocket manager
2. 🔵 Refactor connection logic
3. ✅ Commit: `[mobile-021] feat: implement WebSocket manager`

### Task 2.2.3: Add network monitoring
**TDD Steps**:
1. 🔴 Write network monitoring tests
2. 🟢 Integrate @react-native-community/netinfo
3. ✅ Commit: `[mobile-021] feat: add network state monitoring`

**Push branch and create PR**

---

## Feature 2.3: RPC Client Implementation

**Branch**: `feature/mobile-022-rpc-client`

### Task 2.3.1: Write RPC client tests
**TDD Steps**:
1. 🔴 Write RPC protocol tests
2. 🟢 Implement RPC client skeleton
3. ✅ Commit: `[mobile-022] test: add RPC client tests`

**Test**:
```typescript
// examples/mobile/src/services/connection/__tests__/rpc-client.test.ts
import { MobileRPCClient } from '../rpc-client';
import { MobileWebSocketManager } from '../websocket-manager';

describe('MobileRPCClient', () => {
  let rpcClient: MobileRPCClient;
  let mockWS: jest.Mocked<MobileWebSocketManager>;

  beforeEach(() => {
    mockWS = {
      send: jest.fn(),
      onMessage: jest.fn(),
      isConnected: jest.fn(() => true),
    } as any;

    rpcClient = new MobileRPCClient(mockWS);
  });

  describe('Request/Response', () => {
    test('should send request and receive response', async () => {
      const responsePromise = rpcClient.sendRequest('test/method', ['arg1', 'arg2']);

      // Get the message handler
      const messageHandler = mockWS.onMessage.mock.calls[0][0];

      // Simulate response
      const response = {
        type: 'response',
        id: '1',
        result: 'success'
      };
      messageHandler(encodeMessage(response));

      const result = await responsePromise;
      expect(result).toBe('success');
    });

    test('should handle request errors', async () => {
      const responsePromise = rpcClient.sendRequest('test/method', []);

      const messageHandler = mockWS.onMessage.mock.calls[0][0];

      const errorResponse = {
        type: 'error',
        id: '1',
        error: { message: 'Method not found' }
      };
      messageHandler(encodeMessage(errorResponse));

      await expect(responsePromise).rejects.toThrow('Method not found');
    });

    test('should handle concurrent requests', async () => {
      const request1 = rpcClient.sendRequest('method1', []);
      const request2 = rpcClient.sendRequest('method2', []);

      const messageHandler = mockWS.onMessage.mock.calls[0][0];

      // Respond out of order
      messageHandler(encodeMessage({ type: 'response', id: '2', result: 'result2' }));
      messageHandler(encodeMessage({ type: 'response', id: '1', result: 'result1' }));

      expect(await request1).toBe('result1');
      expect(await request2).toBe('result2');
    });
  });

  describe('Notifications', () => {
    test('should send notifications', () => {
      rpcClient.sendNotification('test/notify', ['data']);

      expect(mockWS.send).toHaveBeenCalledWith(
        expect.any(Uint8Array)
      );
    });

    test('should handle incoming notifications', () => {
      const handler = jest.fn();
      rpcClient.onNotification('test/event', handler);

      const messageHandler = mockWS.onMessage.mock.calls[0][0];

      messageHandler(encodeMessage({
        type: 'notification',
        method: 'test/event',
        params: ['data']
      }));

      expect(handler).toHaveBeenCalledWith(['data']);
    });
  });

  describe('Cancellation', () => {
    test('should support request cancellation', async () => {
      const controller = new AbortController();
      const request = rpcClient.sendRequest('test/method', [], controller.signal);

      controller.abort();

      await expect(request).rejects.toThrow('Request cancelled');
    });
  });
});

function encodeMessage(message: any): Uint8Array {
  // Simplified - would use msgpackr
  return new TextEncoder().encode(JSON.stringify(message));
}
```

### Task 2.3.2: Implement RPC client
**TDD Steps**:
1. 🟢 Implement RPC client
2. 🔵 Refactor message handling
3. ✅ Commit: `[mobile-022] feat: implement RPC client`

### Task 2.3.3: Add msgpackr encoding
**TDD Steps**:
1. 🔴 Write encoding tests
2. 🟢 Integrate msgpackr
3. ✅ Commit: `[mobile-022] feat: add msgpackr message encoding`

**Push branch and create PR**

---

## Feature 2.4: State Management Setup

**Branch**: `feature/mobile-023-state-management`

### Task 2.4.1: Write state management tests
**TDD Steps**:
1. 🔴 Write Redux/Zustand store tests
2. 🟢 Setup state management
3. ✅ Commit: `[mobile-023] test: add state management tests`

### Task 2.4.2: Create workspace state slice
**TDD Steps**:
1. 🔴 Write workspace state tests
2. 🟢 Implement workspace state
3. ✅ Commit: `[mobile-023] feat: implement workspace state management`

### Task 2.4.3: Create connection state slice
**TDD Steps**:
1. 🔴 Write connection state tests
2. 🟢 Implement connection state
3. ✅ Commit: `[mobile-023] feat: implement connection state management`

**Push branch and create PR**

---

# Phase 3: Core UI Components (Months 5-7)

## Feature 3.1: File Explorer Component

**Branch**: `feature/mobile-030-file-explorer`

### Task 3.1.1: Write file explorer component tests
**TDD Steps**:
1. 🔴 Write component rendering tests
2. 🟢 Create skeleton component
3. ✅ Commit: `[mobile-030] test: add file explorer component tests`

**Test**:
```typescript
// examples/mobile/src/components/Explorer/__tests__/FileExplorer.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FileExplorer } from '../FileExplorer';

describe('FileExplorer', () => {
  const mockFileService = {
    resolve: jest.fn(),
    read: jest.fn(),
  };

  const mockFiles = [
    { name: 'file1.ts', uri: 'file:///file1.ts', isDirectory: false },
    { name: 'folder1', uri: 'file:///folder1', isDirectory: true },
  ];

  beforeEach(() => {
    mockFileService.resolve.mockResolvedValue({
      children: mockFiles
    });
  });

  test('should render file list', async () => {
    const { getByText } = render(
      <FileExplorer
        fileService={mockFileService}
        rootUri="file:///"
        onFileSelect={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByText('file1.ts')).toBeTruthy();
      expect(getByText('folder1')).toBeTruthy();
    });
  });

  test('should call onFileSelect when file is tapped', async () => {
    const onFileSelect = jest.fn();

    const { getByText } = render(
      <FileExplorer
        fileService={mockFileService}
        rootUri="file:///"
        onFileSelect={onFileSelect}
      />
    );

    await waitFor(() => getByText('file1.ts'));

    fireEvent.press(getByText('file1.ts'));

    expect(onFileSelect).toHaveBeenCalledWith('file:///file1.ts');
  });

  test('should expand folder when tapped', async () => {
    mockFileService.resolve
      .mockResolvedValueOnce({ children: mockFiles })
      .mockResolvedValueOnce({
        children: [
          { name: 'nested.ts', uri: 'file:///folder1/nested.ts', isDirectory: false }
        ]
      });

    const { getByText } = render(
      <FileExplorer
        fileService={mockFileService}
        rootUri="file:///"
        onFileSelect={jest.fn()}
      />
    );

    await waitFor(() => getByText('folder1'));

    fireEvent.press(getByText('folder1'));

    await waitFor(() => {
      expect(getByText('nested.ts')).toBeTruthy();
    });
  });

  test('should support swipe-to-delete', async () => {
    const { getByText, getByTestId } = render(
      <FileExplorer
        fileService={mockFileService}
        rootUri="file:///"
        onFileSelect={jest.fn()}
      />
    );

    await waitFor(() => getByText('file1.ts'));

    const swipeable = getByTestId('swipeable-file1.ts');
    // Simulate swipe gesture
    fireEvent(swipeable, 'onSwipeableOpen', { direction: 'right' });

    const deleteButton = getByText('Delete');
    expect(deleteButton).toBeTruthy();
  });
});
```

### Task 3.1.2: Implement file explorer component
**TDD Steps**:
1. 🟢 Implement component to pass tests
2. 🔵 Refactor for performance
3. ✅ Commit: `[mobile-030] feat: implement file explorer component`

### Task 3.1.3: Add file system operations
**TDD Steps**:
1. 🔴 Write file operation tests (create, rename, delete)
2. 🟢 Implement operations
3. ✅ Commit: `[mobile-030] feat: add file system operations`

### Task 3.1.4: Add search and filtering
**TDD Steps**:
1. 🔴 Write search tests
2. 🟢 Implement search
3. ✅ Commit: `[mobile-030] feat: add file search and filtering`

**Push branch and create PR**

---

## Feature 3.2: Code Editor Component

**Branch**: `feature/mobile-031-code-editor`

### Task 3.2.1: Write simple text editor tests
**TDD Steps**:
1. 🔴 Write editor component tests
2. 🟢 Create simple TextInput-based editor
3. ✅ Commit: `[mobile-031] test: add simple editor tests`

### Task 3.2.2: Implement simple text editor
**TDD Steps**:
1. 🟢 Implement editor component
2. 🔵 Add syntax highlighting (basic)
3. ✅ Commit: `[mobile-031] feat: implement simple text editor`

### Task 3.2.3: Write Monaco WebView editor tests
**TDD Steps**:
1. 🔴 Write WebView Monaco tests
2. 🟢 Create Monaco WebView wrapper
3. ✅ Commit: `[mobile-031] test: add Monaco editor tests`

### Task 3.2.4: Implement Monaco WebView editor
**TDD Steps**:
1. 🟢 Implement Monaco integration
2. 🔵 Add bridge communication
3. ✅ Commit: `[mobile-031] feat: implement Monaco WebView editor`

### Task 3.2.5: Add editor mode switching
**TDD Steps**:
1. 🔴 Write mode switching tests
2. 🟢 Implement toggle between simple/Monaco
3. ✅ Commit: `[mobile-031] feat: add editor mode switching`

**Push branch and create PR**

---

## Feature 3.3: Terminal Component

**Branch**: `feature/mobile-032-terminal`

### Task 3.3.1: Write terminal component tests
**TDD Steps**:
1. 🔴 Write terminal tests
2. 🟢 Create terminal skeleton
3. ✅ Commit: `[mobile-032] test: add terminal component tests`

**Test**:
```typescript
// examples/mobile/src/components/Terminal/__tests__/Terminal.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MobileTerminal } from '../MobileTerminal';

describe('MobileTerminal', () => {
  const mockTerminalService = {
    getById: jest.fn(),
    create: jest.fn(),
  };

  const mockTerminal = {
    id: 'term-1',
    onData: jest.fn((callback) => {
      return { dispose: jest.fn() };
    }),
    sendText: jest.fn(),
  };

  beforeEach(() => {
    mockTerminalService.getById.mockReturnValue(mockTerminal);
  });

  test('should render terminal output', async () => {
    const { getByText } = render(
      <MobileTerminal
        terminalService={mockTerminalService}
        terminalId="term-1"
      />
    );

    // Simulate terminal output
    const dataCallback = mockTerminal.onData.mock.calls[0][0];
    dataCallback('$ ls\nfile1.ts\nfile2.ts\n');

    await waitFor(() => {
      expect(getByText(/file1.ts/)).toBeTruthy();
      expect(getByText(/file2.ts/)).toBeTruthy();
    });
  });

  test('should send input to terminal', async () => {
    const { getByPlaceholderText } = render(
      <MobileTerminal
        terminalService={mockTerminalService}
        terminalId="term-1"
      />
    );

    const input = getByPlaceholderText('Enter command...');

    fireEvent.changeText(input, 'npm test');
    fireEvent(input, 'onSubmitEditing');

    expect(mockTerminal.sendText).toHaveBeenCalledWith('npm test\n');
  });

  test('should auto-scroll to bottom on new output', async () => {
    const { getByTestId } = render(
      <MobileTerminal
        terminalService={mockTerminalService}
        terminalId="term-1"
      />
    );

    const scrollView = getByTestId('terminal-output');
    const scrollToEnd = jest.spyOn(scrollView, 'scrollToEnd');

    // Simulate output
    const dataCallback = mockTerminal.onData.mock.calls[0][0];
    dataCallback('New output\n');

    await waitFor(() => {
      expect(scrollToEnd).toHaveBeenCalled();
    });
  });
});
```

### Task 3.3.2: Implement terminal component
**TDD Steps**:
1. 🟢 Implement terminal
2. 🔵 Add ANSI color support
3. ✅ Commit: `[mobile-032] feat: implement terminal component`

### Task 3.3.3: Add terminal input enhancements
**TDD Steps**:
1. 🔴 Write input feature tests (autocomplete, history)
2. 🟢 Implement features
3. ✅ Commit: `[mobile-032] feat: add terminal input enhancements`

**Push branch and create PR**

---

## Feature 3.4: Navigation Structure

**Branch**: `feature/mobile-033-navigation`

### Task 3.4.1: Write navigation tests
**TDD Steps**:
1. 🔴 Write navigation flow tests
2. 🟢 Setup React Navigation
3. ✅ Commit: `[mobile-033] test: add navigation tests`

### Task 3.4.2: Implement tab navigation
**TDD Steps**:
1. 🟢 Create bottom tab navigator
2. 🔵 Add tab icons and styling
3. ✅ Commit: `[mobile-033] feat: implement tab navigation`

### Task 3.4.3: Implement stack navigation
**TDD Steps**:
1. 🟢 Create stack navigator for screens
2. 🔵 Add transitions
3. ✅ Commit: `[mobile-033] feat: implement stack navigation`

**Push branch and create PR**

---

# Phase 4: Extension System (Months 8-10)

## Feature 4.1: Extension Manager

**Branch**: `feature/mobile-040-extension-manager`

### Task 4.1.1: Write extension manager tests
**TDD Steps**:
1. 🔴 Write extension lifecycle tests
2. 🟢 Create extension manager skeleton
3. ✅ Commit: `[mobile-040] test: add extension manager tests`

**Test**:
```typescript
// examples/mobile/src/services/extension/__tests__/ExtensionManager.test.ts
import { MobileExtensionManager } from '../ExtensionManager';
import RNFS from 'react-native-fs';

jest.mock('react-native-fs');

describe('MobileExtensionManager', () => {
  let manager: MobileExtensionManager;

  beforeEach(() => {
    manager = new MobileExtensionManager();
  });

  describe('Extension Installation', () => {
    test('should download and install extension', async () => {
      const vsixUrl = 'https://example.com/extension.vsix';

      RNFS.downloadFile.mockReturnValue({
        promise: Promise.resolve({ statusCode: 200 })
      });

      const extensionId = await manager.installExtension(vsixUrl);

      expect(extensionId).toBeTruthy();
      expect(RNFS.downloadFile).toHaveBeenCalled();
    });

    test('should validate extension manifest', async () => {
      const invalidManifest = { name: 'test' }; // Missing required fields

      await expect(
        manager.validateManifest(invalidManifest)
      ).rejects.toThrow('Invalid manifest');
    });

    test('should extract VSIX contents', async () => {
      const vsixPath = '/path/to/extension.vsix';
      const extractPath = '/path/to/extensions/extension-name';

      await manager.extractVSIX(vsixPath, extractPath);

      // Verify extraction occurred
      expect(RNFS.exists).toHaveBeenCalledWith(extractPath);
    });
  });

  describe('Extension Loading', () => {
    test('should load installed extensions on startup', async () => {
      RNFS.readDir.mockResolvedValue([
        { name: 'ext1', isDirectory: () => true, path: '/ext1' },
        { name: 'ext2', isDirectory: () => true, path: '/ext2' },
      ]);

      await manager.loadInstalledExtensions();

      expect(manager.getInstalledExtensions()).toHaveLength(2);
    });

    test('should skip invalid extensions', async () => {
      RNFS.readDir.mockResolvedValue([
        { name: 'valid-ext', isDirectory: () => true, path: '/valid-ext' },
        { name: 'invalid-ext', isDirectory: () => true, path: '/invalid-ext' },
      ]);

      // Make second extension invalid
      RNFS.readFile.mockImplementation((path) => {
        if (path.includes('invalid-ext')) {
          throw new Error('Invalid manifest');
        }
        return Promise.resolve('{"name": "test", "version": "1.0.0"}');
      });

      await manager.loadInstalledExtensions();

      expect(manager.getInstalledExtensions()).toHaveLength(1);
    });
  });

  describe('Extension Uninstallation', () => {
    test('should remove extension files', async () => {
      await manager.uninstallExtension('test-extension');

      expect(RNFS.unlink).toHaveBeenCalled();
    });

    test('should deactivate extension before removing', async () => {
      const deactivate = jest.fn();
      manager.registerExtension({
        id: 'test-ext',
        deactivate
      });

      await manager.uninstallExtension('test-ext');

      expect(deactivate).toHaveBeenCalled();
    });
  });
});
```

### Task 4.1.2: Implement extension manager
**TDD Steps**:
1. 🟢 Implement extension manager
2. 🔵 Add error handling
3. ✅ Commit: `[mobile-040] feat: implement extension manager`

### Task 4.1.3: Add extension storage management
**TDD Steps**:
1. 🔴 Write storage tests
2. 🟢 Implement extension storage
3. ✅ Commit: `[mobile-040] feat: add extension storage management`

**Push branch and create PR**

---

## Feature 4.2: Plugin API Bridge

**Branch**: `feature/mobile-041-plugin-api`

### Task 4.2.1: Write plugin API bridge tests
**TDD Steps**:
1. 🔴 Write API proxy tests
2. 🟢 Create API bridge skeleton
3. ✅ Commit: `[mobile-041] test: add plugin API bridge tests`

### Task 4.2.2: Implement window API
**TDD Steps**:
1. 🔴 Write window API tests
2. 🟢 Implement mobile window API
3. ✅ Commit: `[mobile-041] feat: implement mobile window API`

### Task 4.2.3: Implement workspace API
**TDD Steps**:
1. 🔴 Write workspace API tests
2. 🟢 Implement mobile workspace API
3. ✅ Commit: `[mobile-041] feat: implement mobile workspace API`

### Task 4.2.4: Implement commands API
**TDD Steps**:
1. 🔴 Write commands API tests
2. 🟢 Implement commands API
3. ✅ Commit: `[mobile-041] feat: implement mobile commands API`

**Push branch and create PR**

---

## Feature 4.3: Extension Marketplace

**Branch**: `feature/mobile-042-marketplace`

### Task 4.3.1: Write marketplace integration tests
**TDD Steps**:
1. 🔴 Write OpenVSX API tests
2. 🟢 Create marketplace client
3. ✅ Commit: `[mobile-042] test: add marketplace integration tests`

### Task 4.3.2: Implement extension search
**TDD Steps**:
1. 🟢 Implement search UI and API
2. 🔵 Add search filters
3. ✅ Commit: `[mobile-042] feat: implement extension search`

### Task 4.3.3: Implement extension details view
**TDD Steps**:
1. 🔴 Write details view tests
2. 🟢 Create details screen
3. ✅ Commit: `[mobile-042] feat: implement extension details view`

### Task 4.3.4: Add extension ratings and reviews
**TDD Steps**:
1. 🔴 Write ratings tests
2. 🟢 Implement ratings display
3. ✅ Commit: `[mobile-042] feat: add extension ratings and reviews`

**Push branch and create PR**

---

# Phase 5: Platform Features (Months 11-13)

## Feature 5.1: iOS Native Modules

**Branch**: `feature/mobile-050-ios-native`

### Task 5.1.1: Write iOS bridge tests
**TDD Steps**:
1. 🔴 Write native module tests
2. 🟢 Create iOS bridge module
3. ✅ Commit: `[mobile-050] test: add iOS native module tests`

### Task 5.1.2: Implement iOS share sheet
**TDD Steps**:
1. 🟢 Implement share functionality
2. ✅ Commit: `[mobile-050] feat: implement iOS share sheet`

### Task 5.1.3: Implement Files app integration
**TDD Steps**:
1. 🔴 Write Files app tests
2. 🟢 Implement document picker
3. ✅ Commit: `[mobile-050] feat: implement Files app integration`

### Task 5.1.4: Add iOS shortcuts support
**TDD Steps**:
1. 🔴 Write shortcuts tests
2. 🟢 Implement Siri shortcuts
3. ✅ Commit: `[mobile-050] feat: add iOS shortcuts support`

**Push branch and create PR**

---

## Feature 5.2: Android Native Modules

**Branch**: `feature/mobile-051-android-native`

### Task 5.2.1: Write Android bridge tests
**TDD Steps**:
1. 🔴 Write native module tests
2. 🟢 Create Android bridge module
3. ✅ Commit: `[mobile-051] test: add Android native module tests`

### Task 5.2.2: Implement Android share
**TDD Steps**:
1. 🟢 Implement share intent
2. ✅ Commit: `[mobile-051] feat: implement Android share`

### Task 5.2.3: Implement app shortcuts
**TDD Steps**:
1. 🔴 Write shortcuts tests
2. 🟢 Implement dynamic shortcuts
3. ✅ Commit: `[mobile-051] feat: implement Android app shortcuts`

**Push branch and create PR**

---

## Feature 5.3: Offline Support

**Branch**: `feature/mobile-052-offline-support`

### Task 5.3.1: Write offline state management tests
**TDD Steps**:
1. 🔴 Write offline detection tests
2. 🟢 Implement offline state
3. ✅ Commit: `[mobile-052] test: add offline state tests`

### Task 5.3.2: Implement file caching
**TDD Steps**:
1. 🔴 Write cache tests
2. 🟢 Implement file cache
3. ✅ Commit: `[mobile-052] feat: implement file caching`

### Task 5.3.3: Add sync queue
**TDD Steps**:
1. 🔴 Write sync queue tests
2. 🟢 Implement change queue
3. ✅ Commit: `[mobile-052] feat: add offline sync queue`

**Push branch and create PR**

---

# Phase 6: Polish & Release (Months 14-15)

## Feature 6.1: Performance Optimization

**Branch**: `feature/mobile-060-performance`

### Task 6.1.1: Add performance monitoring
**TDD Steps**:
1. 🔴 Write performance metric tests
2. 🟢 Implement performance monitor
3. ✅ Commit: `[mobile-060] feat: add performance monitoring`

### Task 6.1.2: Optimize list rendering
**TDD Steps**:
1. 🔴 Write virtualization tests
2. 🟢 Implement FlatList optimization
3. ✅ Commit: `[mobile-060] perf: optimize list rendering`

### Task 6.1.3: Reduce bundle size
**TDD Steps**:
1. 🔴 Write bundle size tests
2. 🟢 Optimize imports and lazy loading
3. ✅ Commit: `[mobile-060] perf: reduce bundle size`

**Push branch and create PR**

---

## Feature 6.2: End-to-End Testing

**Branch**: `feature/mobile-061-e2e-testing`

### Task 6.2.1: Setup Detox
**TDD Steps**:
1. 🔴 Write Detox config validation
2. 🟢 Configure Detox
3. ✅ Commit: `[mobile-061] test: setup Detox E2E testing`

### Task 6.2.2: Write critical user flow tests
**TDD Steps**:
1. 🔴 Write E2E tests for main flows
2. 🟢 Implement tests
3. ✅ Commit: `[mobile-061] test: add critical E2E tests`

**E2E Tests**:
```typescript
// examples/mobile/e2e/workflows.test.ts
describe('Critical User Flows', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  test('should connect to server and open workspace', async () => {
    // Enter server URL
    await element(by.id('server-url-input')).typeText('ws://localhost:3000');
    await element(by.id('connect-button')).tap();

    // Wait for connection
    await waitFor(element(by.text('Connected')))
      .toBeVisible()
      .withTimeout(5000);

    // Open workspace
    await element(by.id('workspace-selector')).tap();
    await element(by.text('Test Workspace')).tap();

    // Verify workspace loaded
    await expect(element(by.id('file-explorer'))).toBeVisible();
  });

  test('should open file and edit', async () => {
    // Navigate to explorer
    await element(by.id('tab-explorer')).tap();

    // Open file
    await element(by.text('test.ts')).tap();

    // Wait for editor
    await waitFor(element(by.id('code-editor')))
      .toBeVisible()
      .withTimeout(3000);

    // Edit content
    await element(by.id('code-editor')).typeText('console.log("test");');

    // Save
    await element(by.id('save-button')).tap();

    // Verify saved
    await expect(element(by.text('Saved'))).toBeVisible();
  });

  test('should install extension from marketplace', async () => {
    // Navigate to extensions
    await element(by.id('tab-extensions')).tap();

    // Search
    await element(by.id('extension-search')).typeText('prettier');
    await element(by.id('search-submit')).tap();

    // Install first result
    await element(by.id('extension-item-0')).tap();
    await element(by.id('install-button')).tap();

    // Wait for installation
    await waitFor(element(by.text('Installed')))
      .toBeVisible()
      .withTimeout(30000);
  });
});
```

**Push branch and create PR**

---

## Feature 6.3: Documentation

**Branch**: `feature/mobile-062-documentation`

### Task 6.3.1: Write user documentation
**TDD Steps**:
1. Create user guide
2. ✅ Commit: `[mobile-062] docs: add user documentation`

### Task 6.3.2: Write developer documentation
**TDD Steps**:
1. Create architecture docs
2. Create API reference
3. ✅ Commit: `[mobile-062] docs: add developer documentation`

### Task 6.3.3: Create video tutorials
**TDD Steps**:
1. Record setup tutorial
2. Record extension development tutorial
3. ✅ Commit: `[mobile-062] docs: add video tutorials`

**Push branch and create PR**

---

## Feature 6.4: App Store Preparation

**Branch**: `feature/mobile-063-app-store`

### Task 6.4.1: iOS App Store preparation
**TDD Steps**:
1. Create app icons
2. Create screenshots
3. Write app description
4. ✅ Commit: `[mobile-063] chore: prepare iOS App Store submission`

### Task 6.4.2: Google Play Store preparation
**TDD Steps**:
1. Create app icons
2. Create screenshots
3. Write app description
4. ✅ Commit: `[mobile-063] chore: prepare Google Play Store submission`

### Task 6.4.3: App store submission
**TDD Steps**:
1. Build release APK/IPA
2. Submit to stores
3. ✅ Commit: `[mobile-063] chore: submit to app stores`

**Push branch and create PR**

---

# Summary Statistics

## Total Features: 35
## Total Tasks: ~150
## Total Branches: 35
## Estimated Commits: 200-250

## Coverage Requirements

All packages must maintain:
- **Line Coverage**: ≥ 80%
- **Branch Coverage**: ≥ 80%
- **Function Coverage**: ≥ 80%
- **Statement Coverage**: ≥ 80%

## Testing Breakdown

- **Unit Tests**: ~120 test suites
- **Integration Tests**: ~20 test suites
- **E2E Tests**: ~10 test suites

## CI/CD Checks

Each PR must pass:
- ✅ All unit tests
- ✅ All integration tests
- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)
- ✅ Code coverage thresholds
- ✅ Build succeeds (iOS & Android)

---

# Notes for Implementation

## TDD Best Practices

1. **Always write tests first** - No exceptions
2. **Keep tests simple and focused** - One concept per test
3. **Use descriptive test names** - Explain what is being tested
4. **Arrange-Act-Assert** - Structure tests clearly
5. **Mock external dependencies** - Tests should be isolated
6. **Test edge cases** - Don't just test happy paths

## Commit Guidelines

- **Commit frequently** - After each passing test
- **Atomic commits** - One logical change per commit
- **Clear messages** - Describe what and why
- **Reference feature number** - For traceability

## Branch Management

- **Create branch from master** - Always start from latest
- **Keep branches focused** - One feature per branch
- **Rebase before PR** - Keep history clean
- **Delete after merge** - Clean up merged branches

## Code Review Checklist

- ✅ All tests passing
- ✅ Code coverage maintained
- ✅ No console.log statements
- ✅ TypeScript types defined
- ✅ Documentation updated
- ✅ No unnecessary dependencies
- ✅ Performance considered
- ✅ Accessibility checked

---

This plan provides a comprehensive, test-driven approach to implementing the Theia React Native mobile client. Each feature is broken into manageable, testable chunks with clear success criteria.
