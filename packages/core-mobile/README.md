# @theia/core-mobile

Mobile backend support for Eclipse Theia - enables iOS and Android clients to connect to Theia via WebSocket.

## Status

✅ **READY FOR DEPLOYMENT**

- **151 tests passing**
- **Docker configuration complete**
- **All core features implemented**

See [STATUS.md](STATUS.md) for detailed status report.

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Build
npm run compile

# Run tests
npm test

# Start backend
npm run start:backend
```

Backend starts on `ws://localhost:3030/mobile`

### API Documentation

Once started, access interactive API documentation:

- **Swagger UI**: http://localhost:3030/api-docs
- **Health Check**: http://localhost:3030/health

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete guide including:
- OpenAPI 3.0 specification
- Postman collections
- WebSocket RPC examples
- Client SDK generation

### Docker Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f mobile-backend

# Stop
docker-compose down
```

## Features

- **WebSocket Communication**: Real-time bidirectional communication with mobile clients
- **Mobile RPC Protocol**: Custom JSON-based protocol optimized for mobile
- **Session Management**: Persistent sessions with state tracking
- **LSP Integration**: Full Language Server Protocol support via proxy
- **Language Profiles**: On-demand language server management (protocol ready, service in progress)

## Architecture

```
Mobile Client (iOS/Android)
        ↕ WebSocket
Mobile Connection Handler
        ↕
Mobile Session Manager
        ↕
Mobile LSP Proxy
        ↕
Theia Language Servers
```

## API

### RPC Methods

**Initialization**:
- `mobile/initialize` - Handshake and capability exchange
- `mobile/requestCapabilities` - Get mobile capabilities

**Session Management**:
- `mobile/createSession` - Create new session
- `mobile/restoreSession` - Restore previous session
- `mobile/updateSessionState` - Update session state

**LSP Operations**:
- `mobile/didOpenTextDocument` - Open file
- `mobile/didChangeTextDocument` - Text changes (incremental)
- `mobile/didCloseTextDocument` - Close file
- `mobile/completion` - Code completions
- `mobile/hover` - Hover information
- `mobile/definition` - Go to definition
- `mobile/diagnostics` - Errors and warnings

**Language Profiles** (protocol ready):
- `mobile/listProfiles` - Get available profiles
- `mobile/switchProfile` - Switch language profile
- `mobile/getActiveProfile` - Get active profile

See [ModusFabrica/docs/api/RPC_PROTOCOL.md](../../theia-ios/ModusFabrica/docs/api/RPC_PROTOCOL.md) for complete protocol specification.

## Configuration

Environment variables:

```env
MOBILE_BACKEND_PORT=3030        # WebSocket server port
MOBILE_BACKEND_HOST=0.0.0.0     # Bind address
MOBILE_WS_PATH=/mobile          # WebSocket path
LOG_LEVEL=info                  # debug, info, warn, error
NODE_ENV=production             # production, development
```

See [.env.example](.env.example) for all options.

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Specific test file
npx jest mobile-connection-handler.spec.ts
```

**Test Coverage**: 151 tests passing across 7 test suites
- Mobile RPC Protocol: 24 tests
- Connection Handler: 18 tests
- Session Manager: 15 tests
- LSP Proxy: 12 tests
- Backend Module: 24 tests
- Language Profiles: 24 tests
- Protocol Guards: Integrated

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Local development setup
- Docker deployment
- Kubernetes deployment
- Cloud platform deployment (AWS, GCP, Azure)
- Production best practices
- Monitoring and logging
- Troubleshooting

## Documentation

- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API documentation guide
  - OpenAPI 3.0 specification
  - Swagger UI usage
  - Postman collections
  - WebSocket RPC examples
- **[STATUS.md](STATUS.md)** - Current implementation status and readiness
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
- **[COMPLETE.md](COMPLETE.md)** - Final verification and summary
- **[ModusFabrica/docs/](../../theia-ios/ModusFabrica/docs/)** - Full documentation suite
  - Architecture overview
  - RPC protocol specification
  - Backend setup guide
  - iOS development guide
  - Language profiles guide

## Development

### Project Structure

```
src/
├── common/
│   ├── mobile-protocol.ts              # RPC protocol types
│   ├── mobile-protocol.spec.ts         # 24 tests
│   ├── mobile-protocol-guards.ts       # Type validation
│   ├── language-profile.spec.ts        # 24 tests
│   └── language-profile-guards.ts      # Profile validation
└── node/
    ├── mobile-connection-handler.ts    # WebSocket handling
    ├── mobile-connection-handler.spec.ts # 18 tests
    ├── mobile-session-manager.ts       # Session lifecycle
    ├── mobile-session-manager.spec.ts  # 15 tests
    ├── mobile-lsp-proxy.ts             # LSP bridge
    ├── mobile-lsp-proxy.spec.ts        # 12 tests
    ├── mobile-backend-module.ts        # DI container
    ├── mobile-backend-module.spec.ts   # 24 tests
    └── backend-main.ts                 # Server entry point
```

### Test-Driven Development

This package follows strict TDD practices:

1. **RED**: Write failing test
2. **GREEN**: Implement minimal code to pass
3. **REFACTOR**: Improve code quality
4. **COMMIT**: Commit when tests pass

See `.zencoder/rules/guidelines.md` for detailed TDD workflow.

### Running in Watch Mode

```bash
# Terminal 1: Build on changes
npm run watch

# Terminal 2: Run backend
npm run start:backend
```

## Mobile App Integration

The companion iOS application **ModusFabrica** uses this backend:

**Location**: `/Users/michaelsmith/IdeaProjects/theia-ios/ModusFabrica`

**Technology Stack**:
- Kotlin Multiplatform Mobile (iOS-only currently)
- Compose Multiplatform for UI
- Ktor for WebSocket client
- SQLDelight for local cache

**Connection**:
```kotlin
// In ModusFabrica iOS app
val client = WebSocketClient("ws://localhost:3030/mobile")
client.connect()

val response = client.sendRequest("mobile/initialize", initParams)
```

See [ModusFabrica/README.md](../../theia-ios/ModusFabrica/README.md) for iOS app details.

## Troubleshooting

### Port already in use

```bash
# Find process
lsof -i :3030

# Kill process
kill -9 <PID>

# Or use different port
MOBILE_BACKEND_PORT=8080 npm run start:backend
```

### Tests failing

```bash
# Clean and rebuild
npm run clean
npm run compile
npm test
```

### Docker build fails

```bash
# Check Docker daemon
docker info

# Clean Docker cache
docker system prune -a

# Rebuild
docker-compose build --no-cache
```

### WebSocket connection fails

```bash
# Install wscat for testing
npm install -g wscat

# Test WebSocket
wscat -c ws://localhost:3030/mobile
```

## What's Next

### In Progress (Q1 2026)
- **Language Profile Manager Service** - Download and manage LSPs on-demand

### Planned (Q1-Q2 2026)
- Authentication (JWT)
- Session persistence (Redis)
- Prometheus metrics
- Rate limiting
- Tree-sitter integration
- LSP response caching

## Contributing

Follow Theia contribution guidelines:
1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Run `npm test` and `npm run lint`
5. Create pull request

All tests must pass before merging.

## Package Information

**Name**: `@theia/core-mobile`
**Version**: `1.65.0`
**Main**: `lib/common/index.js`
**Types**: `lib/common/index.d.ts`

**Dependencies**:
- `@theia/core`: 1.65.0
- `express`: ^4.18.2
- `ws`: ^8.14.2

**Dev Dependencies**:
- `@types/express`: ^4.17.20
- `@types/ws`: ^8.5.8
- `@types/jest`: ^30.0.0
- `ts-jest`: ^29.4.4

## License

EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

## Related Projects

- **ModusFabrica** - iOS mobile IDE built on this backend
  - Location: `/Users/michaelsmith/IdeaProjects/theia-ios/ModusFabrica`
  - Technology: Kotlin Multiplatform + Compose Multiplatform
  - See [ModusFabrica/README.md](../../theia-ios/ModusFabrica/README.md)

## Links

- [Eclipse Theia](https://theia-ide.org)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [Kotlin Multiplatform](https://kotlinlang.org/docs/multiplatform.html)
- [Compose Multiplatform](https://www.jetbrains.com/lp/compose-multiplatform/)

---

**Ready to deploy?** See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions.

**Need help?** See [STATUS.md](STATUS.md) for current status and known limitations.
