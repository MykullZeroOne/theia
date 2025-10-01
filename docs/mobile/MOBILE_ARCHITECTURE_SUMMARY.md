# Mobile Architecture Summary

**Last Updated**: 2025-01-01
**Status**: Backend Phase Complete (Phase 1.5), Mobile App in Planning

---

## Overview

Theia Mobile is a **two-repository architecture** with a backend in this repo and a separate mobile app built with **Kotlin Multiplatform Mobile (KMM)**.

---

## Repository Structure

### 1. Backend Repository (THIS REPO)

**Location**: `packages/core-mobile/`
**Technology**: Node.js, TypeScript, InversifyJS
**Purpose**: Mobile RPC Protocol, LSP Proxy, WebSocket connection handling

**What's Implemented** (Phase 1.5 Complete):
- ✅ Mobile RPC Protocol with LSP types
- ✅ WebSocket connection handler
- ✅ Session management
- ✅ LSP Proxy service (foundation)
- ✅ DI module (InversifyJS)
- ✅ 127 passing tests (75% coverage)

**Key Files**:
- `src/common/mobile-protocol.ts` - Protocol definitions
- `src/node/mobile-lsp-proxy.ts` - LSP event forwarding
- `src/node/mobile-connection-handler.ts` - Connection lifecycle
- `src/node/mobile-backend-module.ts` - DI bindings

### 2. Mobile App Repository (SEPARATE, TO BE CREATED)

**Location**: New `theia-mobile` repository
**Technology**: Kotlin Multiplatform Mobile (KMM)
**UI Frameworks**:
- iOS: SwiftUI
- Android: Jetpack Compose

**Code Sharing**: 70-80% shared Kotlin code
- Networking (Ktor WebSocket client)
- Business logic (LSP cache, Tree-sitter integration)
- Data models (protocol types)

**Platform-specific**: 20-30%
- UI (SwiftUI vs Jetpack Compose)
- Platform APIs (File system, notifications)

---

## Technology Stack

### Backend (This Repo)
```
Node.js 20
TypeScript 5.x
InversifyJS (DI)
Jest + ts-jest (testing)
MessagePack (serialization)
```

### Mobile App (Separate Repo)
```
Kotlin Multiplatform 1.9+
Ktor (WebSocket client)
SQLDelight (local database)
Multiplatform Settings (preferences)
Tree-sitter (syntax parsing)
Kotlin Serialization (JSON)

iOS:
  - SwiftUI
  - Xcode 15+
  - iOS 16+

Android:
  - Jetpack Compose
  - Android Studio
  - API 26+ (Android 8.0+)
```

---

## Communication Protocol

### Mobile RPC Protocol

**Transport**: WebSocket (binary MessagePack frames)
**Direction**: Bidirectional

**Backend → Mobile** (`MobileMainContext`):
```typescript
$showTextDocument(uri: string): Promise<void>
$updateLayout(layout: MobileLayout): Promise<void>
$showDiagnostics(uri: string, diagnostics: Diagnostic[]): Promise<void>
$showCompletions(completions: CompletionList): Promise<void>
$showHover(hover: Hover | null): Promise<void>
$showCodeActions(actions: CodeAction[]): Promise<void>
$applyWorkspaceEdit(edit: WorkspaceEdit): Promise<boolean>
// ... more methods
```

**Mobile → Backend** (`MobileExtContext`):
```typescript
$onDidChangeTextDocument(uri: string, changes: TextEdit[]): Promise<void>
$executeCommand(command: string, args: any[]): Promise<any>
$requestCompletion(uri: string, position: Position): Promise<CompletionList>
$requestHover(uri: string, position: Position): Promise<Hover | null>
$requestDefinition(uri: string, position: Position): Promise<Location[]>
$requestCodeActions(uri: string, range: Range, context: CodeActionContext): Promise<CodeAction[]>
$requestFormatting(uri: string, options: FormattingOptions): Promise<TextEdit[]>
// ... more methods
```

### Type Conversion

TypeScript types in backend are manually mirrored in Kotlin:

**TypeScript** (`packages/core-mobile/src/common/mobile-protocol.ts`):
```typescript
export interface Position {
    line: number;
    character: number;
}
```

**Kotlin** (`theia-mobile/shared/src/commonMain/kotlin/protocol/Types.kt`):
```kotlin
@Serializable
data class Position(
    val line: Int,
    val character: Int
)
```

---

## Language Features Strategy

**Goal**: Minimize latency, support offline mode, reduce complexity

### Hybrid Approach: Tree-sitter + LSP Cache

#### On-Device (Tree-sitter)
✅ **Instant**, works offline:
- Syntax highlighting (<5ms)
- Basic completions (<10ms)
- Bracket matching (<1ms)
- Code folding (<5ms)
- Symbol outline (<20ms)

#### Cached (From Backend LSP)
✅ **Fast** (cached), works offline with stale data:
- Diagnostics (24h TTL)
- Hover documentation (persistent)
- Symbol definitions (1h TTL)
- Completion items (10min TTL)

#### Backend (Full LSP)
❌ **Requires connection**, 200-400ms latency:
- Go to definition
- Find references
- Refactoring
- Quick fixes

### Performance Comparison

| Feature | Full LSP | Tree-sitter + Cache | Improvement |
|---------|----------|---------------------|-------------|
| Syntax highlighting | 300ms | 5ms | **60x faster** |
| Basic completions | 200ms | 10ms | **20x faster** |
| Diagnostics | 300ms | 5ms (cached) | **60x faster** |
| Battery drain | High | Minimal | **60-80% less** |
| Offline support | ❌ None | ✅ 90% features | N/A |

---

## Development Workflow

### Backend Developer (TypeScript)

1. Work in `packages/core-mobile/`
2. Follow TDD (Jest tests)
3. Commit to feature branches
4. Changes are immediately available to mobile team (no sync needed)

```bash
cd packages/core-mobile
npm test              # Run tests
npm run compile       # Build
```

### Mobile Developer (Kotlin/KMM)

1. Work in separate `theia-mobile` repository
2. Use Dockerized backend for testing
3. 95% independent development (no sync with backend)

```bash
# Start backend via Docker
docker-compose -f docker-compose.backend.yml up

# Run mobile app
./gradlew :androidApp:installDebug  # Android
open iosApp/iosApp.xcworkspace       # iOS (Xcode)
```

**Sync Frequency**: Only when protocol changes (~1-2x per month)

---

## Project Phases

### ✅ Phase 0: Project Setup (Complete)
- Created `@theia/core-mobile` package
- Basic npm scripts
- Folder structure

### ✅ Phase 1: Core Backend Support (Complete)
- Mobile RPC protocol
- WebSocket connection handler
- Session management
- DI module

### ✅ Phase 1.5: LSP Proxy (Complete)
- Extended protocol with LSP types
- Implemented MobileLSPProxy service
- Integrated into connection lifecycle
- 127 passing tests

### ⏳ Phase 2: Language Service Integration (Next)
**Option A**: Full Monaco integration (4-6 weeks)
**Option B**: Tree-sitter + Cache (2-3 weeks) ⭐ RECOMMENDED

### 🔜 Phase 3: Mobile App (Separate Repo)
1. Create `theia-mobile` repository
2. Initialize KMM project with Kotlin Multiplatform wizard
3. Implement WebSocket client (Ktor)
4. Implement Tree-sitter integration
5. Implement LSP cache
6. Build UI (SwiftUI + Jetpack Compose)

### 🔜 Phase 4: VSX Plugin Support
- Java language server integration
- C#/.NET language server integration
- Plugin host communication

---

## Key Documents

### In This Repository

1. **`/docs/mobile-tdd-implementation-plan.md`** - Overall implementation plan
2. **`/docs/mobile/kmm-architecture.md`** - KMM architecture and code examples
3. **`/docs/mobile/separate-repo-workflow.md`** - Two-repo workflow details
4. **`/docs/mobile/lsp-alternatives-performance.md`** - Language features performance analysis
5. **`/LSP_ARCHITECTURE.md`** - LSP proxy architecture guide
6. **`/QUICK_START_MOBILE.md`** - Quick reference for common questions
7. **`.zencoder/rules/guidelines.md`** - Development guidelines (this doc's source)

### To Be Created (Mobile Repo)

1. `README.md` - Mobile app overview
2. `CONTRIBUTING.md` - Contribution guide
3. `docs/SETUP.md` - Development environment setup
4. `docs/ARCHITECTURE.md` - Mobile app architecture

---

## Testing Strategy

### Backend (Jest)
```bash
cd packages/core-mobile
npm test                    # All tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # Coverage report
```

**Test Organization**:
- `src/common/*.spec.ts` - Protocol and type tests
- `src/node/*.spec.ts` - Service tests
- `test/package.spec.js` - Package validation

**Current Stats**: 127 tests, 75% coverage

### Mobile (Kotlin Test + Platform Tests)
```kotlin
// Shared tests (KMM)
class LSPCacheTest {
    @Test
    fun `should cache diagnostics`() = runTest {
        val cache = LSPCache()
        cache.cacheDiagnostics("file.ts", diagnostics)
        val result = cache.getCachedDiagnostics("file.ts")
        assertEquals(diagnostics, result)
    }
}

// iOS tests (XCTest)
class EditorViewTests: XCTestCase {
    func testSyntaxHighlighting() {
        // SwiftUI UI tests
    }
}

// Android tests (JUnit)
@RunWith(AndroidJUnit4::class)
class EditorViewTest {
    @Test
    fun syntaxHighlighting() {
        // Jetpack Compose UI tests
    }
}
```

---

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| WebSocket connection time | <500ms | ✅ Achieved |
| LSP request latency | <100ms | ⏳ In progress |
| Syntax highlighting | <10ms | 🔜 Tree-sitter |
| Memory usage (mobile) | <100MB | 🔜 To measure |
| Battery drain | <5%/hour | 🔜 To measure |
| Offline feature coverage | 90% | 🔜 Tree-sitter |

---

## Deployment

### Backend
```bash
# Docker image
docker build -t theia-mobile-backend .
docker push registry.example.com/theia-mobile-backend:latest

# Kubernetes deployment
kubectl apply -f k8s/backend-deployment.yaml
```

### Mobile App

**iOS** (via Xcode + Fastlane):
```bash
cd iosApp
fastlane beta  # TestFlight
fastlane release  # App Store
```

**Android** (via Gradle + Google Play):
```bash
./gradlew :androidApp:bundleRelease
# Upload AAB to Google Play Console
```

---

## Next Steps

### Immediate (Backend)
1. ✅ Phase 1.5 complete - LSP Proxy implemented
2. ⏳ Decide: Tree-sitter + Cache vs Full Monaco (recommend Tree-sitter)
3. ⏳ Implement chosen approach
4. ⏳ Integration testing with mock mobile client

### Short-term (Mobile App - 1 month)
1. Create `theia-mobile` repository
2. Initialize KMM project
3. Implement WebSocket client with Ktor
4. Implement Tree-sitter integration
5. Implement LSP cache layer
6. Build basic editor UI (read-only)

### Medium-term (Mobile App - 2-3 months)
1. Full editor with editing support
2. File explorer
3. Terminal integration
4. Settings UI
5. Offline mode indicator
6. Beta testing (TestFlight + Google Play Beta)

### Long-term (4+ months)
1. VSX plugin support (Java, C#)
2. Git integration
3. Debugging support
4. Multi-window support (iPadOS)
5. Public release

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-12 | KMM instead of React Native | Better performance, type safety, 70-80% code sharing |
| 2024-12 | Two-repo architecture | Independent release cycles, cleaner tooling |
| 2025-01 | Tree-sitter + LSP cache | 90% performance improvement, offline support, 2-3 weeks vs 4-6 |

---

## FAQs

### Q: Why KMM instead of React Native?
**A**: KMM offers:
- Native performance (no JavaScript bridge)
- Type-safe backend integration (Kotlin ↔ TypeScript types)
- SwiftUI/Compose for platform-specific UI (better than React Native paper)
- 70-80% code sharing (networking, business logic, caching)

### Q: Do I need to sync the mobile repo with backend?
**A**: Almost never. Only when the Mobile RPC Protocol changes (~1-2x per month).

### Q: Can the mobile app work offline?
**A**: Yes, with Tree-sitter + LSP cache:
- 90% of features work offline (syntax, completions, cached diagnostics)
- 10% require connection (refactoring, cross-file navigation)

### Q: How do we handle breaking protocol changes?
**A**: Semantic versioning + compatibility layers:
1. Backend publishes `@theia/core-mobile` v2.0.0 with breaking changes
2. Mobile app updates dependency when ready
3. Backend supports v1 and v2 protocols during transition

### Q: What's the mobile app bundle size?
**A**: Estimated:
- iOS: 20-30MB (SwiftUI + Tree-sitter + WebSocket)
- Android: 15-25MB (Jetpack Compose + Tree-sitter + WebSocket)

### Q: Which IDEs support KMM development?
**A**:
- **iOS**: Xcode (for iOS app) + IntelliJ IDEA/Android Studio (for shared Kotlin)
- **Android**: Android Studio (first-class KMM support)
- Can use Fleet or AppCode as alternatives

---

## Contact / Support

- **Backend questions**: See `packages/core-mobile/README.md`
- **Mobile app questions**: See `theia-mobile/README.md` (when created)
- **Architecture discussions**: GitHub Issues
- **Protocol changes**: RFC process (create issue with `[RFC]` prefix)
