# Minimal Theia Mobile Backend Structure

This is a streamlined Theia backend focused on:
- Mobile client support (WebSocket/RPC)
- VSX plugin ecosystem
- Java language support
- C#/.NET language support
- Docker deployment

## Packages Kept (11 core packages)

### Core Functionality
- **@theia/core** - Core Theia framework
- **@theia/core-mobile** - Mobile backend support (our package)

### File System & Workspace
- **@theia/filesystem** - File system operations
- **@theia/workspace** - Workspace management

### Plugin System
- **@theia/plugin** - Base plugin infrastructure
- **@theia/plugin-ext** - Plugin extension runtime
- **@theia/plugin-ext-vscode** - VS Code extension compatibility
- **@theia/vsx-registry** - OpenVSX marketplace integration

### Supporting Services
- **@theia/messages** - Message passing system
- **@theia/process** - Process spawning (for LSP servers)
- **@theia/terminal** - Terminal support

## Packages Removed (64 packages)

### AI Packages (19 removed)
All `ai-*` packages removed as they're not needed for mobile backend:
- ai-anthropic, ai-chat, ai-chat-ui, ai-claude-code
- ai-code-completion, ai-core, ai-core-ui, ai-editor
- ai-google, ai-history, ai-hugging-face, ai-ide
- ai-llamafile, ai-mcp, ai-mcp-server, ai-mcp-ui
- ai-ollama, ai-openai, ai-test

### UI/Frontend Packages (15 removed)
- browser (redundant with core)
- console, debug, editor, editor-preview
- external-terminal, markers, monaco
- navigator, outline, output, preferences
- property-view, scm, scm-extra, search-in-workspace

### Development Packages (8 removed)
- plugin-dev, plugin-metrics
- api-tests, playwright
- test, toolbar
- dev-packages/ovsx-client
- dev-packages/localization-manager

### Optional Features (22 removed)
- bulk-edit, callhierarchy, collaboration
- getting-started, keymaps, memory-inspector
- metrics, mini-browser, notebook
- remote, remote-wsl, scanoss
- secondary-window, task, test
- timeline, toolbar, typehierarchy
- userstorage, variable-resolver

## Language Support Strategy

### Java
- Eclipse JDT Language Server via VSX plugin
- Maven/Gradle support
- JDK 17 in Docker image

### C#/.NET
- OmniSharp Language Server via VSX plugin
- .NET SDK 8.0 in Docker image
- NuGet package support

### Additional Languages (via VSX)
All other languages supported through VSX plugins:
- Python, JavaScript/TypeScript, Go, Rust, etc.
- No need for dedicated Theia packages

## Directory Structure

```
theia-mobile-backend/
├── packages/
│   ├── core/
│   ├── core-mobile/           # Our package
│   ├── filesystem/
│   ├── messages/
│   ├── plugin/
│   ├── plugin-ext/
│   ├── plugin-ext-vscode/
│   ├── vsx-registry/
│   ├── workspace/
│   ├── process/
│   └── terminal/
├── dev-packages/
│   ├── application-package/
│   ├── cli/
│   └── ext-scripts/
├── configs/
│   ├── base.tsconfig.json
│   └── warnings.tsconfig.json
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .dockerignore
├── plugins/                   # VSX plugins directory
│   ├── java/                  # Java LSP
│   └── csharp/                # C# OmniSharp
├── workspace/                 # Default workspace
├── docs/
│   └── mobile/
├── package.json               # Minimal dependencies
├── lerna.json
└── README.md
```

## Removed Directories

```
❌ examples/browser/
❌ examples/electron/
❌ examples/playwright/
❌ sample-plugins/
❌ doc/ (old docs)
❌ .vscode/
❌ .idea/
❌ .theia/
```

## Size Reduction

- **Before**: 77 packages
- **After**: 11 packages
- **Reduction**: 85% fewer packages
- **Disk space**: ~70-80% reduction

## Docker Image Layers

1. **Base**: Node.js 20 (Debian Bullseye)
2. **System deps**: Build tools, git, curl
3. **Java**: OpenJDK 17 + Maven + Gradle
4. **.NET**: .NET SDK 8.0
5. **npm deps**: Install package dependencies
6. **Build**: Compile TypeScript
7. **Runtime**: Start backend server

## Environment Variables

### Required
- `THEIA_WORKSPACE` - Workspace directory path
- `THEIA_MOBILE_ENABLED` - Enable mobile endpoints

### Optional
- `VSX_REGISTRY_URL` - Custom VSX registry (default: open-vsx.org)
- `JAVA_HOME` - Java installation path
- `DOTNET_ROOT` - .NET installation path
- `NODE_ENV` - Node environment (production/development)

## Port Mapping

- **3000** - Main Theia backend HTTP/WebSocket
- **3030** - Mobile-specific WebSocket endpoint
- **6379** - Redis (optional, for session storage)

## Plugin Installation

### Via VSX Registry (Automatic)
```javascript
// Mobile client requests plugin
await vsx.install('redhat.java');
await vsx.install('ms-dotnettools.csharp');
```

### Via Docker Volume
```bash
# Mount plugins directory
docker-compose up -d
docker exec theia-mobile-backend \
  wget -P /app/plugins/java \
  https://open-vsx.org/.../redhat.java-1.x.vsix
```

## Build & Run

### Development
```bash
npm install
npm run build
npm start
```

### Docker
```bash
cd docker
docker-compose up -d
```

### Docker Build Only
```bash
docker build -f docker/Dockerfile -t theia-mobile-backend .
docker run -p 3000:3000 -p 3030:3030 theia-mobile-backend
```

## Integration with Mobile App

The mobile app (`theia-mobile` repository) connects to:
- **HTTP API**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:3030`
- **Mobile RPC**: Uses `@theia/core-mobile` protocol

## Next Steps

1. Test minimal build
2. Configure Java LSP
3. Configure C# OmniSharp
4. Test VSX plugin installation
5. Create production Docker image
6. Set up CI/CD for Docker builds
