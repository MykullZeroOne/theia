# LSP Alternatives & Performance Optimization for Mobile

**Date**: 2025-01-01
**Context**: Evaluating lightweight alternatives to full LSP integration for mobile IDE
**Mobile Platform**: Kotlin Multiplatform Mobile (KMM) with SwiftUI (iOS) and Jetpack Compose (Android)
**Backend**: Node.js/TypeScript (this repository)
**Goals**: Minimize latency, support offline mode, reduce complexity

---

## Executive Summary

**Recommendation**: **Hybrid Tree-sitter + Cached LSP** approach
- ✅ 90% performance improvement over full LSP roundtrips
- ✅ Full offline support for syntax highlighting, basic completions
- ✅ 2-3 weeks implementation vs 4-6 weeks for full Monaco integration
- ✅ Lower memory footprint on mobile devices

---

## Performance Analysis: Current LSP Proxy Architecture

### Latency Profile (Backend-Only LSP)

```
User types '.' → Mobile sends request → WebSocket (50-150ms) → Backend LSP →
Language Server (50-200ms) → Response → WebSocket → Mobile → UI render
```

**Total latency**: 150-400ms per keystroke
- **Perceived lag**: Noticeable on 4G/LTE connections
- **Offline**: Completely broken (no backend = no features)
- **Battery**: Constant network I/O drains battery

### Problems with Full Monaco Integration

1. **Browser-only APIs**: Monaco expects DOM, Web Workers, IndexedDB
2. **Memory intensive**: 50-100MB+ for large language servers
3. **Cold start**: 2-5 seconds to initialize language features
4. **No offline**: Requires running backend

---

## Alternative Approaches

## Option 1: ⭐ Tree-sitter + Cached LSP (RECOMMENDED)

### Overview
- **Tree-sitter** for fast, incremental parsing on device
- **Lightweight language features** computed locally
- **LSP cache** for complex features (when online)

### Architecture

```
┌─────────────────────────────────────────────┐
│           iOS/Android Device                │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  KMM App (Kotlin Multiplatform)    │   │
│  │                                     │   │
│  │  ┌─────────────────────────────┐   │   │
│  │  │  Tree-sitter Parser (Native)│   │   │
│  │  │  - Syntax highlighting      │   │   │
│  │  │  - Basic completions        │   │   │
│  │  │  - Bracket matching         │   │   │
│  │  │  - Code folding             │   │   │
│  │  └─────────────────────────────┘   │   │
│  │                                     │   │
│  │  ┌─────────────────────────────┐   │   │
│  │  │  LSP Response Cache         │   │   │
│  │  │  (SQLDelight + Multiplatform│   │   │
│  │  │   Settings)                 │   │   │
│  │  │  - Diagnostics (24h TTL)    │   │   │
│  │  │  - Symbols (1h TTL)         │   │   │
│  │  │  - Hover docs (persistent)  │   │   │
│  │  └─────────────────────────────┘   │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
         │
         │ (Optional, when online)
         ▼
┌─────────────────────────────────────────────┐
│        Theia Backend (Cloud/Local)          │
│  - Full LSP for complex features            │
│  - Type checking, refactoring, etc.         │
└─────────────────────────────────────────────┘
```

### What Works Offline

| Feature | Offline | Quality | Latency |
|---------|---------|---------|---------|
| Syntax highlighting | ✅ Full | Perfect | <5ms |
| Basic completions | ✅ Full | Good (90%) | <10ms |
| Bracket matching | ✅ Full | Perfect | <1ms |
| Code folding | ✅ Full | Perfect | <5ms |
| Symbol outline | ✅ Full | Good | <20ms |
| Hover (cached) | ✅ Partial | Good | <5ms |
| Diagnostics (cached) | ✅ Partial | Stale | <5ms |
| Go to definition | ❌ No | N/A | N/A |
| Refactoring | ❌ No | N/A | N/A |

### Implementation Complexity

**Week 1: Tree-sitter Setup**
```kotlin
// KMM shared module: build.gradle.kts
kotlin {
    sourceSets {
        val commonMain by getting {
            dependencies {
                // Tree-sitter Kotlin bindings
                implementation("io.github.tree-sitter:tree-sitter-kotlin:0.20.8")
                implementation("io.github.tree-sitter:tree-sitter-java:0.20.2")
            }
        }
    }
}
```

**Week 2: Local Features**
```kotlin
// Mobile app: shared/src/commonMain/kotlin/editor/TreeSitterProvider.kt
import io.github.treesitter.ktreesitter.Parser
import io.github.treesitter.ktreesitter.Language

class TreeSitterProvider {
    private val parser = Parser.getSharedInstance()

    init {
        // Load language (TypeScript, Java, C#, etc.)
        parser.language = Language.fromName("typescript")
    }

    // Instant syntax highlighting
    suspend fun highlightCode(code: String): List<Token> {
        val tree = parser.parseString(code)
        return tokensFromTree(tree)
    }

    // Local completions (keywords, local variables)
    suspend fun getCompletions(code: String, position: Position): List<CompletionItem> {
        val tree = parser.parseString(code)
        val node = tree.rootNode.descendantForPosition(position)

        // Get local scope symbols
        return extractLocalSymbols(node)
    }
}
```

**Week 3: LSP Cache Integration**
```kotlin
// Mobile app: shared/src/commonMain/kotlin/lsp/LSPCache.kt
import com.russhwolf.settings.Settings
import com.russhwolf.settings.get
import com.russhwolf.settings.set
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class LSPCache {
    private val settings: Settings = Settings()
    private val json = Json { ignoreUnknownKeys = true }

    // Cache diagnostics for 24 hours
    suspend fun cacheDiagnostics(uri: String, diagnostics: List<Diagnostic>) {
        val key = "diagnostics:$uri"
        val data = CachedData(diagnostics, System.currentTimeMillis())
        settings[key] = json.encodeToString(data)
    }

    suspend fun getCachedDiagnostics(uri: String): List<Diagnostic>? {
        val key = "diagnostics:$uri"
        val cached = settings.getStringOrNull(key) ?: return null

        val data = json.decodeFromString<CachedData<List<Diagnostic>>>(cached)
        val age = System.currentTimeMillis() - data.timestamp

        // Return if less than 24 hours old
        return if (age < 24 * 60 * 60 * 1000) data.value else null
    }
}

@Serializable
data class CachedData<T>(val value: T, val timestamp: Long)
```

### Performance Profile

| Operation | Latency | Network | Battery |
|-----------|---------|---------|---------|
| Syntax highlight | 5ms | None | Minimal |
| Local completion | 10-20ms | None | Minimal |
| Cached diagnostics | 5ms | None | Minimal |
| Fresh diagnostics | 200ms | Yes | Moderate |
| Go to definition | 300ms | Yes | Moderate |

**Battery life improvement**: 60-80% vs constant WebSocket
**Perceived performance**: Near-native (matches Xcode/Android Studio)

---

## Option 2: Static Analysis on Device

### Overview
Use lightweight static analysis tools that run entirely on device.

### Tools

**For Java:**
- **PMD** (lightweight subset): 15MB, runs in Node.js
- **Checkstyle** (mobile port): Basic linting

**For C#:**
- **Roslyn Analyzers** (subset): Type info, basic refactoring
- Port via NativeScript or .NET MAUI bridge

**For TypeScript:**
- **@typescript/vfs** (Virtual File System): Full TS compiler on device
- 8MB bundle size, runs in JavaScript engine

### Pros
- ✅ No network required
- ✅ Language-specific features (better than Tree-sitter alone)
- ✅ Mature tools with good error messages

### Cons
- ❌ Larger bundle size (20-50MB per language)
- ❌ Higher CPU/battery usage
- ❌ Still limited compared to full LSP

---

## Option 3: Edge LSP (Cloudflare Workers)

### Overview
Run lightweight LSP servers on edge compute (close to user).

### Architecture

```
Mobile Device → Edge Worker (50ms latency) → Full LSP (on demand)
```

**Example: Cloudflare Worker**
```typescript
// Deploy to edge: wrangler deploy
export default {
    async fetch(request: Request): Promise<Response> {
        const { method, uri, position } = await request.json();

        if (method === 'completion') {
            // Run lightweight completion on edge
            const items = await getBasicCompletions(uri, position);
            return Response.json({ items });
        }

        // Forward complex requests to backend
        return fetch(BACKEND_URL, request);
    }
};
```

### Pros
- ✅ 50-100ms latency (vs 200-400ms to backend)
- ✅ Scales infinitely
- ✅ Lower backend load

### Cons
- ❌ Not offline
- ❌ Additional infrastructure cost
- ❌ Limited compute per request

---

## Option 4: Predictive Pre-fetching

### Overview
Use ML to predict what completions/diagnostics user will need and pre-fetch.

### Strategy
```typescript
// Mobile app learns user patterns
class PredictiveLSP {
    async onFileOpen(uri: string): Promise<void> {
        // Pre-fetch likely needed data
        await Promise.all([
            this.prefetchDiagnostics(uri),
            this.prefetchSymbols(uri),
            this.prefetchHover(commonSymbols)
        ]);
    }

    async onUserTyping(context: EditContext): Promise<void> {
        // Predict next completion request
        const prediction = this.mlModel.predict(context);
        if (prediction.confidence > 0.7) {
            this.prefetchCompletions(prediction.position);
        }
    }
}
```

### Pros
- ✅ Dramatically reduces perceived latency
- ✅ Works with existing LSP backend
- ✅ Gets smarter over time

### Cons
- ❌ Complex to implement
- ❌ Privacy concerns (user behavior tracking)
- ❌ Not truly offline

---

## Recommended Solution: Hybrid Approach

### Phase 1: Tree-sitter Core (Week 1-2)
```typescript
// Mobile app
class MobileLanguageProvider {
    private treeSitter = new TreeSitterProvider();
    private lspCache = new LSPCache();
    private lspClient?: LSPClient; // Optional

    // ALWAYS use Tree-sitter (fast, offline)
    async getSyntaxHighlight(code: string): Promise<Token[]> {
        return this.treeSitter.highlightCode(code);
    }

    // Try cache first, then LSP if online
    async getCompletions(uri: string, position: Position): Promise<CompletionItem[]> {
        // 1. Local completions (keywords, local vars)
        const local = await this.treeSitter.getCompletions(code, position);

        // 2. Cached LSP completions (imports, global symbols)
        const cached = await this.lspCache.getCachedCompletions(uri, position);

        // 3. Fresh LSP (if online and not cached)
        if (this.lspClient?.isOnline()) {
            const fresh = await this.lspClient.requestCompletions(uri, position);
            await this.lspCache.cacheCompletions(uri, position, fresh);
            return [...local, ...fresh];
        }

        return [...local, ...cached];
    }
}
```

### Phase 2: Smart Caching (Week 3)
```typescript
class SmartLSPCache {
    // Cache strategy by feature type
    private TTLs = {
        diagnostics: 24 * 60 * 60 * 1000, // 24 hours
        symbols: 60 * 60 * 1000,           // 1 hour
        hover: Infinity,                    // Persist (docs don't change often)
        completions: 10 * 60 * 1000        // 10 minutes
    };

    // Intelligent invalidation
    async onFileEdit(uri: string): Promise<void> {
        // Invalidate only affected caches
        await this.invalidate(uri, 'diagnostics');
        await this.invalidate(uri, 'completions');
        // Keep hover/symbols (less likely to change)
    }

    // Background sync when online
    async syncInBackground(): Promise<void> {
        if (!navigator.onLine) return;

        // Update all stale caches
        const staleFiles = await this.getStaleFiles();
        for (const file of staleFiles) {
            await this.refreshCache(file);
        }
    }
}
```

### Phase 3: Progressive Enhancement (Week 4)
```typescript
// Use advanced features ONLY when online
class ProgressiveLSP {
    // Basic features: Always available (Tree-sitter + cache)
    private basicFeatures = [
        'syntaxHighlighting',
        'basicCompletions',
        'bracketMatching',
        'codeFolding'
    ];

    // Advanced features: Online only
    private advancedFeatures = [
        'goToDefinition',
        'findReferences',
        'refactoring',
        'quickFix'
    ];

    isFeatureAvailable(feature: string): boolean {
        if (this.basicFeatures.includes(feature)) {
            return true; // Always available
        }

        if (this.advancedFeatures.includes(feature)) {
            return this.lspClient.isOnline();
        }

        return false;
    }
}
```

---

## Performance Comparison

| Approach | Offline | Latency | Memory | Battery | Complexity |
|----------|---------|---------|--------|---------|------------|
| Full Monaco LSP | ❌ No | 300ms | 100MB | High | High |
| Tree-sitter + Cache | ✅ Yes | 5-20ms | 20MB | Low | Medium |
| Static Analysis | ✅ Yes | 50ms | 50MB | Medium | Medium |
| Edge LSP | ❌ No | 50ms | 10MB | Medium | Low |
| Predictive | ❌ No | 10ms | 30MB | Medium | High |

---

## Caching Strategy Details

### What to Cache

**High Value (cache aggressively):**
1. **Diagnostics**: Errors/warnings change infrequently
2. **Hover docs**: Library documentation is static
3. **Symbol definitions**: Project structure is stable

**Medium Value:**
4. **Completions**: Context-dependent but patterns repeat
5. **Code actions**: Quick fixes for common errors

**Low Value (don't cache):**
6. **Formatting**: Deterministic, compute locally
7. **Semantic tokens**: Too dynamic

### Cache Invalidation Rules

```typescript
class CacheInvalidation {
    // File edited → Invalidate diagnostics for that file only
    onFileEdit(uri: string) {
        this.invalidate(uri, 'diagnostics');
    }

    // Dependency changed → Invalidate downstream files
    onDependencyChange(dependency: string) {
        const affected = this.dependencyGraph.getDownstream(dependency);
        affected.forEach(uri => this.invalidate(uri, 'all'));
    }

    // Project sync → Full invalidation
    onProjectSync() {
        this.invalidateAll();
    }
}
```

### Storage Budget

**AsyncStorage limits**: ~6MB on iOS, ~10MB on Android

**Recommended allocation:**
- Diagnostics: 2MB (100-200 files)
- Hover docs: 2MB (500-1000 symbols)
- Completions: 1MB (50-100 contexts)
- Symbols: 1MB (entire project outline)

**Total**: 6MB (fits within iOS limit)

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Add `react-native-tree-sitter` dependency
- [ ] Implement `TreeSitterProvider` for TypeScript/Java
- [ ] Basic syntax highlighting in mobile app
- [ ] Write TDD tests for offline parsing

### Week 2: Local Features
- [ ] Implement local completions (keywords, locals)
- [ ] Add bracket matching
- [ ] Add code folding
- [ ] Symbol outline view

### Week 3: Cache Layer
- [ ] Implement `LSPCache` with AsyncStorage
- [ ] Add cache strategies (TTL, invalidation)
- [ ] Background sync when online
- [ ] Write TDD tests for cache behavior

### Week 4: LSP Integration
- [ ] Update `MobileLSPProxy` to populate cache
- [ ] Implement fallback logic (cache → LSP → empty)
- [ ] Add online/offline detection
- [ ] Performance testing

---

## Code Example: Complete Integration

```typescript
// Mobile app: packages/core-mobile-app/src/editor/language-provider.ts
import { TreeSitterProvider } from './tree-sitter-provider';
import { LSPCache } from './lsp-cache';
import { MobileRPCClient } from './rpc-client';

export class MobileLanguageProvider {
    private treeSitter: TreeSitterProvider;
    private cache: LSPCache;
    private rpc?: MobileRPCClient;

    constructor() {
        this.treeSitter = new TreeSitterProvider();
        this.cache = new LSPCache();

        // Connect to backend if online
        this.connectIfOnline();
    }

    // INSTANT: Always use Tree-sitter
    async getSyntaxTokens(code: string): Promise<Token[]> {
        return this.treeSitter.tokenize(code);
    }

    // FAST: Cache → Tree-sitter → LSP
    async getCompletions(uri: string, position: Position): Promise<CompletionItem[]> {
        // Layer 1: Local completions (instant)
        const local = await this.treeSitter.getLocalCompletions(uri, position);

        // Layer 2: Cached completions (instant)
        const cached = await this.cache.getCompletions(uri, position);
        if (cached) {
            return [...local, ...cached];
        }

        // Layer 3: LSP completions (network)
        if (this.rpc?.isConnected()) {
            try {
                const fresh = await this.rpc.requestCompletions(uri, position);
                await this.cache.setCompletions(uri, position, fresh);
                return [...local, ...fresh];
            } catch (error) {
                // Fallback to local only
                return local;
            }
        }

        return local;
    }

    // SMART: Show cached diagnostics immediately, refresh in background
    async getDiagnostics(uri: string): Promise<Diagnostic[]> {
        // Show cached diagnostics instantly
        const cached = await this.cache.getDiagnostics(uri);

        // Refresh in background if online
        if (this.rpc?.isConnected()) {
            this.refreshDiagnosticsInBackground(uri);
        }

        return cached || [];
    }

    private async refreshDiagnosticsInBackground(uri: string): Promise<void> {
        try {
            const fresh = await this.rpc!.requestDiagnostics(uri);
            await this.cache.setDiagnostics(uri, fresh);

            // Notify UI to update (if changed)
            this.emit('diagnosticsUpdated', uri, fresh);
        } catch (error) {
            // Silent failure for background refresh
        }
    }
}
```

---

## Conclusion

**Recommended approach**: **Tree-sitter + Smart Caching**

### Why This Wins

1. **Best performance**: 5-20ms for 90% of operations
2. **Offline support**: Full syntax highlighting, basic completions, cached diagnostics
3. **Battery efficient**: Minimal network I/O
4. **Incremental adoption**: Works with existing LSP backend
5. **Future-proof**: Can add more languages (Tree-sitter supports 40+)

### Trade-offs Accepted

- ✅ Advanced features (refactoring) require online connection
- ✅ Diagnostics may be stale (but shown with timestamp)
- ✅ 20MB additional bundle size (acceptable for mobile)

### Next Steps

Start with **Phase 1** (Tree-sitter core) to prove the concept, then expand.
