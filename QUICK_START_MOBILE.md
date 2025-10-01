# Quick Start: Mobile Development

## Your Questions Answered

### Q1: Can I create a separate repo for the KMM project?

**Answer**: ✅ **YES, you should!**

```
theia/                          # THIS REPO (backend)
└─ packages/core-mobile/        # Keep this here

theia-mobile-kmm/               # NEW REPO (mobile)
├─ shared/                      # Kotlin code
├─ androidApp/                  # Android UI
└─ iosApp/                      # iOS UI
```

**Why separate?**
- ✅ Independent development (no merge conflicts)
- ✅ Simpler CI/CD (Android/iOS vs Node.js)
- ✅ Cleaner dependencies (Gradle vs npm)
- ✅ Different teams can work independently
- ✅ Mobile repo can be public, backend private

### Q2: Will I need to keep syncing changes?

**Answer**: ❌ **NO, almost never!**

You only sync when **protocol changes** (1-2x per month):

| Change | Need Sync? |
|--------|------------|
| Fix backend bug | ❌ No |
| Update mobile UI | ❌ No |
| Add new LSP feature | ✅ Yes (protocol change) |
| Upgrade dependencies | ❌ No |
| Change message format | ✅ Yes (protocol change) |

**95% of the time**: Work in mobile repo, never touch backend repo.

### Q3: Can I dockerize the backend and work on KMM app?

**Answer**: ✅ **YES, this is the recommended workflow!**

## Recommended Setup

### Step 1: Dockerize Backend (This Repo)

```bash
# In theia repo
cd ~/IdeaProjects/theia

# Build Docker image
docker build -f docker/Dockerfile.mobile -t theia-mobile-backend:latest .

# Push to Docker Hub (optional)
docker tag theia-mobile-backend:latest yourorg/theia-mobile-backend:latest
docker push yourorg/theia-mobile-backend:latest
```

### Step 2: Create Mobile Repo

```bash
# Create new repository on GitHub/GitLab
# Clone it
git clone https://github.com/yourorg/theia-mobile-kmm.git
cd theia-mobile-kmm

# Initialize KMM project (use Android Studio wizard or manual setup)
```

### Step 3: Configure Mobile to Use Docker Backend

**Create `docker-compose.backend.yml` in mobile repo**:

```yaml
# theia-mobile-kmm/docker-compose.backend.yml
version: '3.8'

services:
  backend:
    image: theia-mobile-backend:latest  # or yourorg/theia-mobile-backend:latest
    ports:
      - "3030:3030"  # WebSocket port
    environment:
      - NODE_ENV=development
      - THEIA_MOBILE_ENABLED=true
    volumes:
      - ./test-workspace:/workspace
```

### Step 4: Daily Development Workflow

```bash
# In mobile repo (theia-mobile-kmm/)

# Terminal 1: Start backend (one command!)
docker-compose -f docker-compose.backend.yml up

# Terminal 2: Run Android app
./gradlew :androidApp:installDebug

# Terminal 3: Run iOS app
cd iosApp && xcodebuild -scheme iosApp

# That's it! Develop mobile app without touching backend code.
```

## What You DON'T Need

When working on mobile:
- ❌ Don't clone backend repo
- ❌ Don't install Node.js
- ❌ Don't run `npm install`
- ❌ Don't build Theia
- ❌ Don't understand backend code

**You just run Docker and develop mobile!**

## Directory Layout

```
~/Projects/
├── theia/                      # Backend repo (you work here occasionally)
│   ├── packages/core-mobile/   # Backend implementation
│   ├── docker/                 # Docker configuration
│   └── README.md
│
└── theia-mobile-kmm/           # Mobile repo (you work here daily)
    ├── shared/                 # Kotlin multiplatform code
    │   ├── src/
    │   │   ├── commonMain/     # Shared business logic
    │   │   ├── androidMain/    # Android-specific
    │   │   └── iosMain/        # iOS-specific
    ├── androidApp/             # Android UI (Jetpack Compose)
    ├── iosApp/                 # iOS UI (SwiftUI)
    ├── docker-compose.backend.yml  # Run backend easily
    └── README.md
```

## When Do You Touch Backend Repo?

**Only when adding new features to protocol** (rare):

### Example: Adding "Find References" Feature

**Backend work (in `theia` repo)**:

```bash
cd ~/IdeaProjects/theia

# 1. Update protocol
vim packages/core-mobile/src/common/mobile-protocol.ts
# Add: $requestReferences(uri, position): Promise<Location[]>

# 2. Implement in LSP proxy
vim packages/core-mobile/src/node/mobile-lsp-proxy.ts

# 3. Add tests
npm run mobile:test

# 4. Rebuild Docker image
docker build -f docker/Dockerfile.mobile -t theia-mobile-backend:1.1.0 .

# 5. Push image
docker push yourorg/theia-mobile-backend:1.1.0

# 6. Create release
git tag mobile-v1.1.0
git push --tags
```

**Mobile work (in `theia-mobile-kmm` repo)**:

```bash
cd ~/theia-mobile-kmm

# 1. Update Docker image version
vim docker-compose.backend.yml
# Change: image: yourorg/theia-mobile-backend:1.1.0

# 2. Add Kotlin type
vim shared/src/commonMain/kotlin/com/theia/mobile/lsp/LspService.kt
# Add: suspend fun requestReferences(uri: String, position: Position): List<Location>

# 3. Update UI
vim androidApp/src/main/kotlin/.../EditorScreen.kt
# Add "Find References" button

# 4. Test
docker-compose -f docker-compose.backend.yml up
./gradlew :androidApp:installDebug
```

**This happens maybe once a month.**

## Protocol Sync (Automatic)

To avoid manual copying, use code generation:

```bash
# In backend repo: Export protocol schema
cd ~/IdeaProjects/theia
npm run mobile:export-schema
# Generates: protocol/mobile-rpc.schema.json

# In mobile repo: Generate Kotlin types
cd ~/theia-mobile-kmm
./protocol/generate.sh
# Reads schema, generates Kotlin types automatically
```

**Types stay in sync automatically!**

## Comparison: Monorepo vs Separate Repos

| Aspect | Monorepo | Separate Repos (Recommended) |
|--------|----------|------------------------------|
| Setup | Complex | Simple |
| Mobile dev experience | Need full Theia setup | Just Docker |
| CI/CD | Build everything | Independent pipelines |
| Team independence | Coupled | Decoupled |
| Protocol sync | Automatic (same repo) | Manual/automated (schema) |
| Security | Backend + mobile together | Can separate private/public |
| Recommended for | Small teams | Separate teams |

## Production Deployment

### Backend (Docker)

```bash
# Deploy to cloud (AWS/GCP/Azure)
docker run -d \
  -p 3030:3030 \
  -e NODE_ENV=production \
  yourorg/theia-mobile-backend:latest
```

### Mobile

```bash
# Android: Publish to Play Store
./gradlew :androidApp:bundleRelease

# iOS: Publish to App Store
cd iosApp && xcodebuild archive
```

**Backend and mobile deploy independently!**

## Testing Strategy

### Unit Tests

```bash
# Backend tests (in theia repo)
npm run mobile:test

# Mobile tests (in theia-mobile-kmm repo)
./gradlew :shared:test
./gradlew :androidApp:test
cd iosApp && xcodebuild test
```

### Integration Tests

Use Docker Compose:

```yaml
# theia-mobile-kmm/docker-compose.test.yml
version: '3.8'
services:
  backend:
    image: yourorg/theia-mobile-backend:latest
    ports:
      - "3030:3030"

  mobile-test:
    build: .
    depends_on:
      - backend
    command: ./gradlew test
```

```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Summary

### ✅ What You Should Do

1. **Create separate mobile repo** (`theia-mobile-kmm`)
2. **Dockerize backend** in this repo
3. **Mobile uses Docker** via docker-compose
4. **Work independently** 95% of the time
5. **Sync protocol** only when needed (1-2x/month)

### ❌ What You DON'T Do

1. ❌ Keep mobile in monorepo
2. ❌ Clone backend for mobile dev
3. ❌ Manually sync code daily
4. ❌ Build Theia for mobile changes
5. ❌ Complex merge conflicts

### 🎯 Result

**Mobile developer experience**:
```bash
# One command to start
docker-compose up

# Develop mobile app
# Never touch backend
# Ship independently
```

**Backend developer experience**:
```bash
# Update backend
# Build Docker image
# Push to registry
# Mobile team pulls automatically
```

**Everyone happy!** 🎉

---

## Next Steps

1. **Finish Phase 1.5** in this repo:
   - [ ] Implement LSP Proxy
   - [ ] Add comprehensive tests
   - [ ] Build Docker image

2. **Create mobile repo**:
   - [ ] Initialize KMM project
   - [ ] Add docker-compose for backend
   - [ ] Implement WebSocket client
   - [ ] Build simple editor UI

3. **Test integration**:
   - [ ] Run Docker backend
   - [ ] Connect mobile app
   - [ ] Verify LSP features work

**Estimated time**:
- Phase 1.5 (LSP Proxy): 2 weeks
- Mobile POC: 2 weeks
- Feature parity: 6-8 weeks

**Total**: ~3 months to production-ready mobile app

---

**Questions?** See detailed guides:
- `docs/mobile/separate-repo-workflow.md` - Complete workflow guide
- `docs/mobile/kmm-architecture.md` - KMM implementation details
- `LSP_ARCHITECTURE.md` - How extensions work
- `MINIMAL_STRUCTURE.md` - Current backend status
