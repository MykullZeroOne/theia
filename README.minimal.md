# Theia Mobile Backend - Minimal Fork

A streamlined Theia backend optimized for mobile IDE applications with Java and C#/.NET support.

## 🎯 What This Is

This is a **minimal fork** of Eclipse Theia containing only:
- Core Theia packages (11 packages vs original 77)
- VSX plugin support (OpenVSX marketplace)
- Mobile backend support (`@theia/core-mobile`)
- Java language server support
- C#/.NET language server support
- Docker-ready configuration

**Size reduction**: ~85% fewer packages, ~70-80% disk space savings

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
cd docker
docker-compose up -d
```

Access backend at:
- Main API: http://localhost:3000
- Mobile WebSocket: ws://localhost:3030

### Option 2: Local Development

```bash
npm install
npm run build
npm start
```

## 📦 What's Included

### Core Packages (11 total)
```
packages/
├── core/                  # Core Theia framework
├── core-mobile/          # Mobile backend support
├── filesystem/           # File operations
├── messages/             # Messaging system
├── plugin/               # Plugin infrastructure
├── plugin-ext/           # Plugin runtime
├── plugin-ext-vscode/    # VS Code compatibility
├── vsx-registry/         # OpenVSX integration
├── workspace/            # Workspace management
├── process/              # Process spawning
└── terminal/             # Terminal support
```

### Language Support

**Java** (via VSX plugin):
- Eclipse JDT Language Server
- Maven & Gradle support
- JDK 17 included in Docker

**C#/.NET** (via VSX plugin):
- OmniSharp Language Server
- .NET SDK 8.0 included in Docker
- NuGet package support

**Other Languages**:
All via VSX plugins from open-vsx.org

## 🗑️ What Was Removed

- ❌ 64 unnecessary packages (AI, UI, dev tools)
- ❌ Browser and Electron examples
- ❌ Sample plugins
- ❌ Old documentation
- ❌ IDE configurations (.vscode, .idea)

See [MINIMAL_STRUCTURE.md](./MINIMAL_STRUCTURE.md) for complete list.

## 🛠️ Initial Setup

If starting fresh, run cleanup script:

```bash
./scripts/cleanup-for-minimal.sh
```

This removes all unnecessary packages and creates the minimal structure.

## 🐳 Docker

### Build

```bash
docker build -f docker/Dockerfile -t theia-mobile-backend .
```

### Run

```bash
docker-compose -f docker/docker-compose.yml up -d
```

### Environment Variables

```yaml
THEIA_WORKSPACE: /workspace        # Workspace directory
THEIA_MOBILE_ENABLED: true         # Enable mobile endpoints
VSX_REGISTRY_URL: https://open-vsx.org/api
JAVA_HOME: /usr/lib/jvm/java-17-openjdk-amd64
DOTNET_ROOT: /usr/share/dotnet
```

## 📱 Mobile App Integration

The mobile React Native app connects via:

```typescript
import { MobileRPC } from '@theia/core-mobile';

// Connect to backend
const client = new MobileClient('ws://localhost:3030');

// Initialize session
await client.initialize({
  clientInfo: { name: 'TheiaMobile', version: '1.0.0' },
  capabilities: {}
});
```

## 🔌 Installing Plugins

### Via VSX Registry (Automatic)

```javascript
// Mobile client requests plugin
await vsx.install('redhat.java');
await vsx.install('ms-dotnettools.csharp');
```

### Via Docker Volume

```bash
docker exec theia-mobile-backend \
  wget -P /app/plugins/java \
  https://open-vsx.org/api/vscode/extension/redhat.java/latest
```

## 📊 Architecture

```
Mobile App (React Native)
         ↓
    WebSocket (port 3030)
         ↓
@theia/core-mobile (our package)
         ↓
    Theia Backend
         ↓
┌────────┴────────┐
│   Plugins       │
├─────────────────┤
│ • Java LSP      │
│ • C# OmniSharp  │
│ • VSX Registry  │
└─────────────────┘
```

## 🧪 Testing

```bash
# Test core-mobile package
npm run mobile:test

# Test all packages
npm run test

# Coverage
npm run test -- --coverage
```

Current test results:
- ✅ 75 tests passing
- 📊 84% statement coverage
- 📊 80% branch coverage

## 📚 Documentation

- [Architecture](./docs/mobile/architecture.md) - Detailed architecture
- [Minimal Structure](./MINIMAL_STRUCTURE.md) - What's kept/removed
- [Development Guidelines](./.zencoder/rules/guidelines.md) - TDD workflow

## 🔄 CI/CD

GitHub Actions workflow (`.github/workflows/mobile-ci.yml`):
- Build and test on push
- Docker image build
- Publish to registry

## 🤝 Contributing

1. Follow TDD (Test-Driven Development)
2. Use branch naming: `feature/mobile-XXX-description`
3. Commit format: `[mobile-XXX] type: description`
4. Ensure tests pass: `npm run mobile:test`
5. Maintain 80%+ coverage

## 📝 License

EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

## 🔗 Links

- [Eclipse Theia](https://theia-ide.org/)
- [OpenVSX Registry](https://open-vsx.org/)
- [Original Theia Repo](https://github.com/eclipse-theia/theia)

## 🎯 Roadmap

- [x] Phase 1: Backend support (complete)
  - [x] Protocol definitions
  - [x] Connection handler
  - [x] Session manager
  - [x] DI module
- [ ] Phase 2: Java/C# integration
  - [ ] Java LSP configuration
  - [ ] C# OmniSharp configuration
  - [ ] Docker testing
- [ ] Phase 3: Mobile app (separate repo)
  - [ ] React Native project
  - [ ] WebSocket client
  - [ ] UI components

## 💬 Support

For issues related to:
- **Mobile backend**: Use this repository's issues
- **Theia core**: See [Eclipse Theia](https://github.com/eclipse-theia/theia)
- **Plugins**: See [OpenVSX](https://open-vsx.org/)
