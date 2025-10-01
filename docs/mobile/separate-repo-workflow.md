# Separate Repository Workflow: KMM Mobile App + Theia Backend

## Overview

**YES**, you should create a separate repository for the KMM mobile app. This document explains:
1. Why separate repositories work better
2. How to dockerize the Theia backend
3. How the KMM app connects to the backend
4. When/if you need to sync changes

## Architecture: Two Independent Repositories

```
┌──────────────────────────────────────┐
│  Repository 1: theia (this repo)    │
│  └─ packages/core-mobile/           │  ← Backend only
│     ├─ Mobile protocol (TypeScript) │
│     ├─ LSP Proxy                    │
│     └─ Session Manager              │
│                                      │
│  Published to: Docker Hub            │
│  Image: yourorg/theia-mobile-backend │
└──────────────────────────────────────┘
                   ↑
                   │ WebSocket Protocol
                   │ (ws://localhost:3030)
                   ↓
┌──────────────────────────────────────┐
│  Repository 2: theia-mobile-kmm      │  ← NEW REPO
│  (Kotlin Multiplatform)              │
│                                      │
│  ├─ shared/                          │
│  │  └─ WebSocket client (Kotlin)    │
│  │     RPC client, LSP service      │
│  ├─ androidApp/                      │
│  │  └─ Jetpack Compose UI           │
│  └─ iosApp/                          │
│     └─ SwiftUI UI                    │
│                                      │
│  Consumes: Docker image              │
│  Connects to: ws://localhost:3030    │
└──────────────────────────────────────┘
```

## Why Separate Repositories?

### ✅ Advantages

**1. Independent Development**
- Mobile team works in KMM repo
- Backend team works in Theia repo
- No merge conflicts between teams
- Different release cycles

**2. Simpler CI/CD**
- Mobile: Android + iOS builds
- Backend: Docker image builds
- No need to build entire Theia for mobile changes

**3. Cleaner Dependencies**
- Mobile: Kotlin/Gradle dependencies
- Backend: Node.js/npm dependencies
- No cross-contamination

**4. Better Security**
- Mobile repo can be public (just UI client)
- Backend repo can be private (contains business logic)
- API keys separate

**5. Team Structure**
- Mobile devs don't need Theia setup
- Backend devs don't need Android Studio/Xcode
- Easier onboarding

### ⚠️ Trade-offs

**1. Protocol Sync**
- Need to keep protocol types in sync
- Solution: Generate types from schema (see below)

**2. Version Compatibility**
- Mobile app version must match backend version
- Solution: Semantic versioning + compatibility matrix

**3. Integration Testing**
- Can't test both in same repo
- Solution: Docker Compose for integration tests

## Do You Need to Sync Changes?

### Short Answer: **Rarely**

The mobile app is a **thin client** that:
- Only needs to know the **protocol** (WebSocket messages)
- Doesn't depend on backend implementation
- Works with any backend that implements the protocol

### When You DO Need to Sync

**Only when the protocol changes**:

| Change Type | Need Sync? | Example |
|-------------|------------|---------|
| Add new LSP feature | ✅ Yes | Add "go to type definition" |
| Fix backend bug | ❌ No | Session cleanup logic |
| Update UI | ❌ No | New editor theme |
| Change protocol message | ✅ Yes | Add field to `Diagnostic` |
| Add backend dependency | ❌ No | Upgrade TypeScript LSP |
| Update mobile UI library | ❌ No | Upgrade Jetpack Compose |

**In practice**: Protocol changes maybe 1-2 times per month during active development.

### Protocol Versioning Strategy

Use semantic versioning for the protocol:

```kotlin
// Mobile app declares protocol version
const val PROTOCOL_VERSION = "1.2.0"

// Backend checks compatibility
if (!isCompatible(clientVersion, SERVER_VERSION)) {
    throw IncompatibleVersionException()
}
```

**Version compatibility**:
- **Major version** (1.x.x → 2.x.x): Breaking changes, must update both
- **Minor version** (1.1.x → 1.2.x): New features, backward compatible
- **Patch version** (1.1.1 → 1.1.2): Bug fixes, always compatible

## Dockerizing the Theia Backend

### Step 1: Create Production Dockerfile

You already have `docker/Dockerfile`. Let's optimize it for mobile:

```dockerfile
# docker/Dockerfile.mobile
FROM node:20-bullseye AS builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    python3 \
    openjdk-17-jdk \
    maven \
    gradle

# Install .NET SDK
RUN wget https://packages.microsoft.com/config/debian/11/packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y dotnet-sdk-8.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json lerna.json ./
COPY packages/core/package.json packages/core/
COPY packages/core-mobile/package.json packages/core-mobile/
COPY packages/filesystem/package.json packages/filesystem/
COPY packages/messages/package.json packages/messages/
COPY packages/plugin/package.json packages/plugin/
COPY packages/plugin-ext/package.json packages/plugin-ext/
COPY packages/plugin-ext-vscode/package.json packages/plugin-ext-vscode/
COPY packages/process/package.json packages/process/
COPY packages/terminal/package.json packages/terminal/
COPY packages/vsx-registry/package.json packages/vsx-registry/
COPY packages/workspace/package.json packages/workspace/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build packages
RUN npm run mobile:build

# Production stage
FROM node:20-slim

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    openjdk-17-jre \
    dotnet-runtime-8.0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./

# Environment variables
ENV NODE_ENV=production
ENV THEIA_MOBILE_ENABLED=true
ENV THEIA_MOBILE_PORT=3030
ENV VSX_REGISTRY_URL=https://open-vsx.org/api
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV DOTNET_ROOT=/usr/share/dotnet

# Expose ports
EXPOSE 3000 3030

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start backend
CMD ["node", "packages/core-mobile/lib/node/main.js"]
```

### Step 2: Create docker-compose.yml for Development

```yaml
# docker-compose.mobile.yml
version: '3.8'

services:
  theia-backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.mobile
    ports:
      - "3000:3000"   # HTTP API
      - "3030:3030"   # Mobile WebSocket
    environment:
      - NODE_ENV=development
      - THEIA_MOBILE_ENABLED=true
      - THEIA_MOBILE_PORT=3030
      - VSX_REGISTRY_URL=https://open-vsx.org/api
      - LOG_LEVEL=debug
      - WORKSPACE_ROOT=/workspace
    volumes:
      - ./workspace:/workspace   # Mount local workspace
      - ./plugins:/app/plugins   # Mount plugins directory
    networks:
      - theia-mobile
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - theia-mobile
    restart: unless-stopped

volumes:
  redis-data:

networks:
  theia-mobile:
    driver: bridge
```

### Step 3: Build and Run

```bash
# Build Docker image
docker-compose -f docker-compose.mobile.yml build

# Start backend
docker-compose -f docker-compose.mobile.yml up -d

# Check logs
docker-compose -f docker-compose.mobile.yml logs -f theia-backend

# Stop backend
docker-compose -f docker-compose.mobile.yml down
```

### Step 4: Publish to Docker Hub (Optional)

```bash
# Tag image
docker tag theia-mobile-backend:latest yourorg/theia-mobile-backend:1.0.0
docker tag theia-mobile-backend:latest yourorg/theia-mobile-backend:latest

# Push to Docker Hub
docker push yourorg/theia-mobile-backend:1.0.0
docker push yourorg/theia-mobile-backend:latest
```

## Creating the Separate KMM Repository

### Step 1: Create New Repository

```bash
# On GitHub/GitLab, create new repo: theia-mobile-kmm

# Clone locally
git clone https://github.com/yourorg/theia-mobile-kmm.git
cd theia-mobile-kmm
```

### Step 2: Initialize KMM Project

**Option A: Use KMM Wizard**
```bash
# Using Android Studio:
# File → New → New Project → Kotlin Multiplatform App
# Or use IntelliJ IDEA Fleet
```

**Option B: Use Gradle Plugin**
```bash
# Create project manually
mkdir -p shared/src/{commonMain,androidMain,iosMain}/kotlin
mkdir -p androidApp/src/main/kotlin
mkdir -p iosApp
```

### Step 3: Project Structure

```
theia-mobile-kmm/
├── .github/
│   └── workflows/
│       ├── android.yml          # Android CI/CD
│       └── ios.yml              # iOS CI/CD
├── shared/                      # Shared Kotlin code
│   ├── src/
│   │   ├── commonMain/
│   │   │   └── kotlin/com/theia/mobile/
│   │   │       ├── network/
│   │   │       ├── lsp/
│   │   │       └── protocol/    # Generated from schema
│   │   ├── androidMain/
│   │   └── iosMain/
│   └── build.gradle.kts
├── androidApp/                  # Android app
│   └── build.gradle.kts
├── iosApp/                      # iOS app
│   └── iosApp.xcodeproj/
├── protocol/                    # Protocol definitions
│   ├── schema.json              # OpenAPI/JSON Schema
│   └── generate.sh              # Code generation script
├── docker-compose.backend.yml   # For local backend
├── README.md
├── build.gradle.kts
└── settings.gradle.kts
```

### Step 4: Add Backend as Submodule (Optional)

If you want to run backend locally:

```bash
cd theia-mobile-kmm

# Add backend as git submodule
git submodule add https://github.com/yourorg/theia.git backend

# Create docker-compose for local development
cat > docker-compose.backend.yml <<EOF
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      dockerfile: docker/Dockerfile.mobile
    ports:
      - "3030:3030"
EOF
```

**But better**: Just use Docker image directly!

### Step 5: Configuration File

Create `config.yml` in KMM repo:

```yaml
# theia-mobile-kmm/config.yml

backend:
  # For local development
  local:
    url: ws://localhost:3030
    timeout: 10000

  # For staging
  staging:
    url: wss://staging.theia.yourorg.com
    timeout: 10000

  # For production
  production:
    url: wss://mobile.theia.yourorg.com
    timeout: 10000

protocol:
  version: "1.0.0"
  minSupportedVersion: "1.0.0"

features:
  enableOfflineMode: true
  enableSessionPersistence: true
  maxSessionAge: 86400000  # 24 hours
```

## Development Workflow

### Scenario 1: Working on Mobile UI Only

**No backend changes needed**

```bash
# Terminal 1: Start backend (once)
cd ~/theia-mobile-kmm
docker-compose -f docker-compose.backend.yml up

# Terminal 2: Run Android app
./gradlew :androidApp:installDebug
adb shell am start -n com.theia.mobile/.MainActivity

# Terminal 3: Run iOS app
cd iosApp
xcodebuild -scheme iosApp -configuration Debug

# Make UI changes in shared/ or androidApp/ or iosApp/
# Hot reload works automatically
```

**You never touch the backend repo!**

### Scenario 2: Protocol Change Required

**Backend team adds new feature**

```bash
# In theia repo (backend)
cd ~/IdeaProjects/theia

# 1. Update protocol
vim packages/core-mobile/src/common/mobile-protocol.ts
# Add new method: $requestReferences

# 2. Implement in LSP proxy
vim packages/core-mobile/src/node/mobile-lsp-proxy.ts

# 3. Add tests
vim packages/core-mobile/src/node/mobile-lsp-proxy.spec.ts

# 4. Update protocol schema
vim protocol/mobile-rpc.schema.json
# Add references endpoint

# 5. Commit and tag
git add .
git commit -m "[mobile] feat: add find references support"
git tag mobile-protocol-v1.1.0
git push --tags

# 6. Rebuild Docker image
docker build -f docker/Dockerfile.mobile -t yourorg/theia-mobile-backend:1.1.0 .
docker push yourorg/theia-mobile-backend:1.1.0

# 7. Update schema in mobile repo (one-time sync)
cp protocol/mobile-rpc.schema.json ~/theia-mobile-kmm/protocol/
```

**Mobile team updates to new protocol**

```bash
# In theia-mobile-kmm repo
cd ~/theia-mobile-kmm

# 1. Pull latest schema (if not copied)
curl -O https://raw.githubusercontent.com/yourorg/theia/mobile-protocol-v1.1.0/protocol/mobile-rpc.schema.json

# 2. Generate Kotlin types
./protocol/generate.sh

# 3. Implement new feature
vim shared/src/commonMain/kotlin/com/theia/mobile/lsp/LspService.kt
# Add requestReferences method

# 4. Update UI
vim androidApp/src/main/kotlin/com/theia/mobile/android/ui/editor/EditorScreen.kt
# Add "Find References" button

# 5. Update backend version in config
vim config.yml
# minSupportedVersion: "1.1.0"

# 6. Test against new backend
docker-compose -f docker-compose.backend.yml pull
docker-compose -f docker-compose.backend.yml up
```

**This happens maybe once a month.**

### Scenario 3: Testing Integration

Use Docker Compose to test together:

```bash
# In theia-mobile-kmm repo
cd ~/theia-mobile-kmm

# Create integration test compose file
cat > docker-compose.test.yml <<EOF
version: '3.8'
services:
  backend:
    image: yourorg/theia-mobile-backend:latest
    ports:
      - "3030:3030"
    environment:
      - NODE_ENV=test

  mobile-test:
    build: .
    depends_on:
      - backend
    environment:
      - BACKEND_URL=ws://backend:3030
    command: ./gradlew test
EOF

# Run integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Protocol Synchronization (Automatic)

### Option 1: JSON Schema + Code Generation

**In theia repo, define schema**:

```json
// theia/protocol/mobile-rpc.schema.json
{
  "definitions": {
    "Position": {
      "type": "object",
      "properties": {
        "line": { "type": "integer" },
        "character": { "type": "integer" }
      },
      "required": ["line", "character"]
    },
    "CompletionRequest": {
      "type": "object",
      "properties": {
        "method": { "const": "requestCompletion" },
        "params": {
          "type": "object",
          "properties": {
            "uri": { "type": "string" },
            "position": { "$ref": "#/definitions/Position" }
          }
        }
      }
    }
  }
}
```

**In mobile repo, generate Kotlin types**:

```bash
#!/bin/bash
# theia-mobile-kmm/protocol/generate.sh

# Use jsonschema2poko or similar
npm install -g quicktype

quicktype \
  --src protocol/mobile-rpc.schema.json \
  --lang kotlin \
  --out shared/src/commonMain/kotlin/com/theia/mobile/protocol/Generated.kt \
  --framework kotlinx-serialization
```

**Types stay in sync automatically!**

### Option 2: Shared npm Package

**In theia repo, publish types**:

```bash
# theia/packages/core-mobile/package.json
{
  "name": "@theia/core-mobile",
  "version": "1.0.0",
  "main": "lib/common/index.js",
  "types": "lib/common/index.d.ts"
}

# Publish to npm
npm publish
```

**In mobile repo, generate from .d.ts**:

```bash
# Use dukat to convert TypeScript to Kotlin
npm install -g dukat

dukat \
  node_modules/@theia/core-mobile/lib/common/mobile-protocol.d.ts \
  -d shared/src/commonMain/kotlin
```

### Option 3: Manual Sync (Simplest)

Just copy-paste types when protocol changes (rare).

```bash
# When protocol changes, copy to mobile repo
cp ~/IdeaProjects/theia/packages/core-mobile/src/common/mobile-protocol.ts \
   ~/theia-mobile-kmm/protocol/reference.ts

# Manually translate to Kotlin (one-time, maybe monthly)
# Or use AI assistant to translate TypeScript → Kotlin
```

## CI/CD Setup

### Backend CI (GitHub Actions)

```yaml
# theia/.github/workflows/mobile-backend.yml
name: Mobile Backend

on:
  push:
    branches: [main, minimal-mobile-backend]
    paths:
      - 'packages/core-mobile/**'
      - 'docker/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run mobile:test

  docker:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - uses: docker/build-push-action@v4
        with:
          context: .
          file: docker/Dockerfile.mobile
          push: true
          tags: |
            yourorg/theia-mobile-backend:latest
            yourorg/theia-mobile-backend:${{ github.sha }}
```

### Mobile CI (GitHub Actions)

```yaml
# theia-mobile-kmm/.github/workflows/build.yml
name: Build Mobile App

on:
  push:
    branches: [main, develop]

jobs:
  test-shared:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          distribution: 'zulu'
          java-version: '17'
      - run: ./gradlew :shared:test

  android:
    needs: test-shared
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          distribution: 'zulu'
          java-version: '17'
      - run: ./gradlew :androidApp:assembleDebug
      - run: ./gradlew :androidApp:test

  ios:
    needs: test-shared
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd iosApp && xcodebuild test
```

## Recommended Workflow

### Day-to-Day Development

```
Mobile Developer:
1. Pull latest backend Docker image
2. Start backend: docker-compose up
3. Work in KMM repo exclusively
4. Never touch backend repo

Backend Developer:
1. Work in Theia repo
2. Update @theia/core-mobile
3. Rebuild Docker image
4. Push to Docker Hub
5. Notify mobile team (if protocol changed)
```

### When Protocol Changes (Rare)

```
Backend Developer:
1. Update protocol + LSP proxy
2. Update schema file
3. Tag release: mobile-protocol-v1.x.x
4. Push Docker image with new tag
5. Create GitHub release with changelog

Mobile Developer:
1. Pull latest schema
2. Regenerate types (automatic)
3. Update LspService to use new features
4. Update config.yml min version
5. Test against new backend Docker image
```

## Summary

### ✅ Separate Repository Strategy

**Backend Repo** (`theia`):
- Owned by backend team
- Publishes Docker images
- Defines protocol schema
- Independent release cycle

**Mobile Repo** (`theia-mobile-kmm`):
- Owned by mobile team
- Consumes Docker images
- Implements protocol client
- Independent release cycle

### 🔄 Sync Frequency

- **Code**: Never sync (independent codebases)
- **Protocol**: Sync when protocol changes (1-2x per month)
- **Testing**: Use Docker Compose for integration tests

### 🐳 Docker Workflow

**For Mobile Development**:
```bash
# One command to start backend
docker run -p 3030:3030 yourorg/theia-mobile-backend:latest

# Or with docker-compose
docker-compose -f docker-compose.backend.yml up
```

**No need to**:
- Clone backend repo
- Install Node.js
- Build Theia
- Understand backend code

### 📋 Checklist for Separate Repos

- [ ] Create `theia-mobile-kmm` repository
- [ ] Set up KMM project structure
- [ ] Create `docker-compose.backend.yml` to run backend
- [ ] Add backend Docker image to compose file
- [ ] Create protocol schema (JSON Schema)
- [ ] Set up code generation for types
- [ ] Configure CI/CD for mobile
- [ ] Document protocol versioning
- [ ] Create integration test suite

**You're ready to develop independently!** 🚀

---

**Next Steps**:
1. Dockerize backend: `docker build -f docker/Dockerfile.mobile`
2. Push to Docker Hub: `docker push yourorg/theia-mobile-backend`
3. Create KMM repo: `git init theia-mobile-kmm`
4. Run backend via Docker: `docker run -p 3030:3030 yourorg/theia-mobile-backend`
5. Start mobile development: `./gradlew :androidApp:installDebug`
