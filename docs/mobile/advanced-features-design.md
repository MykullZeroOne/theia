# Advanced Mobile Features Design

**Date**: 2025-01-01
**Status**: Design Document
**Platform**: Kotlin Multiplatform Mobile (KMM)

---

## Overview

This document outlines advanced features for the Theia Mobile IDE:

1. **Siri Integration** - Voice-driven coding assistance
2. **Language Stack Profiles** - Context-specific language server bundles
3. **Dynamic LSP Loading** - On-demand language server downloads
4. **Modular Plugin Architecture** - VSX-style downloadable extensions

---

## 1. Siri Integration with LSP

### Vision

"Hey Siri, find all usages of the login function"
"Hey Siri, what does this error mean?"
"Hey Siri, add a new REST endpoint for user registration"

### Architecture

```
┌─────────────────────────────────────────────┐
│              iOS Device                     │
│                                             │
│  ┌───────────────────────────────────┐     │
│  │  Siri / App Intents Framework     │     │
│  └───────────────┬───────────────────┘     │
│                  │                          │
│                  ▼                          │
│  ┌───────────────────────────────────┐     │
│  │  SiriLSPBridge (Swift)            │     │
│  │  - Parse voice commands           │     │
│  │  - Map to LSP requests            │     │
│  │  - Format responses for speech    │     │
│  └───────────────┬───────────────────┘     │
│                  │                          │
│                  ▼                          │
│  ┌───────────────────────────────────┐     │
│  │  KMM Shared LSP Client            │     │
│  │  (Kotlin)                         │     │
│  └───────────────┬───────────────────┘     │
└──────────────────┼─────────────────────────┘
                   │ WebSocket
                   ▼
          ┌───────────────────┐
          │  Theia Backend    │
          │  LSP Proxy        │
          └───────────────────┘
```

### Implementation

#### Phase 1: App Intents (iOS 16+)

**File**: `iosApp/iosApp/Intents/LSPIntents.swift`

```swift
import AppIntents
import Foundation

// MARK: - Intent Definitions

struct FindUsagesIntent: AppIntent {
    static var title: LocalizedStringResource = "Find Usages"
    static var description = IntentDescription("Find all usages of a symbol in your code")

    @Parameter(title: "Symbol Name")
    var symbolName: String

    @Parameter(title: "File Path", default: nil)
    var filePath: String?

    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Call KMM shared code
        let lspClient = LSPClientFactory.shared.client
        let locations = try await lspClient.findReferences(
            symbol: symbolName,
            file: filePath ?? lspClient.currentFile
        )

        let response = formatLocationsForSpeech(locations)
        return .result(dialog: response)
    }

    private func formatLocationsForSpeech(_ locations: [Location]) -> String {
        if locations.isEmpty {
            return "No usages found for \(symbolName)."
        } else if locations.count == 1 {
            return "Found 1 usage in \(locations[0].fileName) on line \(locations[0].line)."
        } else {
            return "Found \(locations.count) usages across \(Set(locations.map(\.fileName)).count) files."
        }
    }
}

struct ExplainErrorIntent: AppIntent {
    static var title: LocalizedStringResource = "Explain Error"
    static var description = IntentDescription("Explain the current error in your code")

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let lspClient = LSPClientFactory.shared.client
        let diagnostics = try await lspClient.getDiagnostics(file: lspClient.currentFile)

        guard let firstError = diagnostics.first(where: { $0.severity == .error }) else {
            return .result(dialog: "No errors found in the current file.")
        }

        // Use GPT-style explanation (could integrate with OpenAI or local LLM)
        let explanation = try await explainDiagnostic(firstError)
        return .result(dialog: explanation)
    }
}

struct GenerateCodeIntent: AppIntent {
    static var title: LocalizedStringResource = "Generate Code"
    static var description = IntentDescription("Generate code based on natural language description")

    @Parameter(title: "Description")
    var description: String

    @Parameter(title: "Language", default: "kotlin")
    var language: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
        // This would integrate with Copilot, TabNine, or local code generation
        let generator = CodeGenerator.shared
        let code = try await generator.generate(
            description: description,
            language: language,
            context: LSPClientFactory.shared.client.currentFile
        )

        // Insert code at cursor position
        try await LSPClientFactory.shared.client.insertText(code)

        return .result(dialog: "Generated \(code.lines.count) lines of \(language) code.")
    }
}

// MARK: - App Shortcuts

struct LSPShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: FindUsagesIntent(),
            phrases: [
                "Find usages of \(\.$symbolName) in \(.applicationName)",
                "Show me where \(\.$symbolName) is used"
            ],
            shortTitle: "Find Usages",
            systemImageName: "magnifyingglass"
        )

        AppShortcut(
            intent: ExplainErrorIntent(),
            phrases: [
                "What's this error in \(.applicationName)",
                "Explain the error in \(.applicationName)"
            ],
            shortTitle: "Explain Error",
            systemImageName: "exclamationmark.triangle"
        )

        AppShortcut(
            intent: GenerateCodeIntent(),
            phrases: [
                "Generate \(\.$description) in \(.applicationName)",
                "Create \(\.$description) code"
            ],
            shortTitle: "Generate Code",
            systemImageName: "wand.and.stars"
        )
    }
}
```

#### Phase 2: KMM Bridge to LSP

**File**: `shared/src/commonMain/kotlin/siri/SiriLSPBridge.kt`

```kotlin
class SiriLSPBridge(
    private val lspClient: LSPClient,
    private val treeS Parser: TreeSitterProvider
) {
    /**
     * Find all references to a symbol
     * Maps to LSP textDocument/references request
     */
    suspend fun findReferences(symbol: String, file: String): List<Location> {
        // Try local first (Tree-sitter)
        val localRefs = treeSitterProvider.findLocalReferences(symbol, file)

        // Then query backend for cross-file references
        return if (lspClient.isOnline()) {
            val position = findSymbolPosition(symbol, file)
            lspClient.requestReferences(file, position)
        } else {
            localRefs
        }
    }

    /**
     * Get diagnostics for current file
     */
    suspend fun getDiagnostics(file: String): List<Diagnostic> {
        return lspCache.getCachedDiagnostics(file)
            ?: lspClient.requestDiagnostics(file)
    }

    /**
     * Get code actions (quick fixes) for diagnostic
     */
    suspend fun getCodeActions(diagnostic: Diagnostic): List<CodeAction> {
        return lspClient.requestCodeActions(
            uri = diagnostic.uri,
            range = diagnostic.range,
            context = CodeActionContext(diagnostics = listOf(diagnostic))
        )
    }
}
```

### Voice Command Examples

| User Says | Intent | LSP Action |
|-----------|--------|-----------|
| "Find usages of login method" | FindUsagesIntent | `textDocument/references` |
| "What does this error mean?" | ExplainErrorIntent | `textDocument/diagnostic` + AI explanation |
| "Go to definition of UserRepository" | GoToDefinitionIntent | `textDocument/definition` |
| "Show me all TODOs" | FindTodosIntent | `workspace/symbol` with filter |
| "Create a REST endpoint for user profile" | GenerateCodeIntent | Code generation + insert |
| "Format this file" | FormatDocumentIntent | `textDocument/formatting` |
| "Rename variable user to currentUser" | RenameSymbolIntent | `textDocument/rename` |

### Android Voice Integration

**File**: `androidApp/src/main/kotlin/voice/VoiceCommandService.kt`

```kotlin
import android.speech.RecognizerIntent
import androidx.activity.result.ActivityResultLauncher

class VoiceCommandService(
    private val siriLSPBridge: SiriLSPBridge
) {
    fun handleVoiceCommand(command: String) {
        when {
            command.contains("find usages", ignoreCase = true) -> {
                val symbol = extractSymbol(command)
                scope.launch {
                    val locations = siriLSPBridge.findReferences(symbol, currentFile)
                    showResults(locations)
                }
            }

            command.contains("explain error", ignoreCase = true) -> {
                scope.launch {
                    val diagnostics = siriLSPBridge.getDiagnostics(currentFile)
                    explainError(diagnostics.firstOrNull())
                }
            }

            // ... more command patterns
        }
    }
}
```

---

## 2. Language Stack Profiles

### Vision

Instead of loading ALL language servers, user selects a **stack profile**:
- **Java Full Stack**: Java, SQL, JavaScript, HTML, CSS
- **.NET Full Stack**: C#, SQL, TypeScript, HTML, CSS
- **Mobile Dev**: Kotlin, Swift, XML, Gradle
- **Data Science**: Python, R, SQL, JSON

### Architecture

```
┌─────────────────────────────────────────────┐
│           Mobile App Settings               │
│                                             │
│  [ Select Your Stack ]                     │
│                                             │
│  ○ Java Full Stack                         │
│    └─ Java, SQL, JS, HTML, CSS (80MB)     │
│                                             │
│  ● .NET Full Stack                         │
│    └─ C#, SQL, TS, HTML, CSS (75MB)       │
│                                             │
│  ○ Mobile Dev                              │
│    └─ Kotlin, Swift, XML (60MB)           │
│                                             │
│  ○ Custom                                  │
│    └─ [+] Add Languages...                │
│                                             │
└─────────────────────────────────────────────┘
```

### Implementation

#### Profile Definitions

**File**: `shared/src/commonMain/kotlin/profiles/LanguageStackProfile.kt`

```kotlin
@Serializable
data class LanguageStackProfile(
    val id: String,
    val name: String,
    val description: String,
    val languages: List<LanguageConfig>,
    val estimatedSize: Long, // bytes
    val icon: String
) {
    companion object {
        val JAVA_FULL_STACK = LanguageStackProfile(
            id = "java-fullstack",
            name = "Java Full Stack",
            description = "Backend Java, SQL, Frontend JS/HTML/CSS",
            languages = listOf(
                LanguageConfig(
                    id = "java",
                    name = "Java",
                    extensions = listOf("java"),
                    lspServer = "eclipse.jdt.ls",
                    treeSitterGrammar = "tree-sitter-java",
                    downloadUrl = "https://cdn.theia.io/lsp/java-lsp-v1.0.0.zip",
                    size = 45_000_000 // 45MB
                ),
                LanguageConfig(
                    id = "sql",
                    name = "SQL",
                    extensions = listOf("sql"),
                    lspServer = "sql-language-server",
                    treeSitterGrammar = "tree-sitter-sql",
                    downloadUrl = "https://cdn.theia.io/lsp/sql-lsp-v1.0.0.zip",
                    size = 5_000_000 // 5MB
                ),
                LanguageConfig(
                    id = "javascript",
                    name = "JavaScript",
                    extensions = listOf("js", "jsx"),
                    lspServer = "typescript-language-server", // TS server supports JS
                    treeSitterGrammar = "tree-sitter-javascript",
                    downloadUrl = "https://cdn.theia.io/lsp/ts-lsp-v1.0.0.zip",
                    size = 20_000_000 // 20MB
                ),
                LanguageConfig(
                    id = "html",
                    name = "HTML",
                    extensions = listOf("html", "htm"),
                    lspServer = "vscode-html-languageserver",
                    treeSitterGrammar = "tree-sitter-html",
                    downloadUrl = "https://cdn.theia.io/lsp/html-lsp-v1.0.0.zip",
                    size = 5_000_000 // 5MB
                ),
                LanguageConfig(
                    id = "css",
                    name = "CSS",
                    extensions = listOf("css", "scss"),
                    lspServer = "vscode-css-languageserver",
                    treeSitterGrammar = "tree-sitter-css",
                    downloadUrl = "https://cdn.theia.io/lsp/css-lsp-v1.0.0.zip",
                    size = 5_000_000 // 5MB
                )
            ),
            estimatedSize = 80_000_000, // 80MB total
            icon = "java-icon"
        )

        val DOTNET_FULL_STACK = LanguageStackProfile(
            id = "dotnet-fullstack",
            name = ".NET Full Stack",
            description = "C# backend, SQL, TypeScript/HTML/CSS frontend",
            languages = listOf(
                LanguageConfig(
                    id = "csharp",
                    name = "C#",
                    extensions = listOf("cs"),
                    lspServer = "omnisharp",
                    treeSitterGrammar = "tree-sitter-c-sharp",
                    downloadUrl = "https://cdn.theia.io/lsp/omnisharp-v1.0.0.zip",
                    size = 50_000_000 // 50MB
                ),
                // ... SQL, TypeScript, HTML, CSS configs
            ),
            estimatedSize = 75_000_000,
            icon = "dotnet-icon"
        )

        val MOBILE_DEV = LanguageStackProfile(
            id = "mobile-dev",
            name = "Mobile Development",
            description = "Kotlin for Android, Swift for iOS",
            languages = listOf(
                LanguageConfig(
                    id = "kotlin",
                    name = "Kotlin",
                    extensions = listOf("kt", "kts"),
                    lspServer = "kotlin-language-server",
                    treeSitterGrammar = "tree-sitter-kotlin",
                    downloadUrl = "https://cdn.theia.io/lsp/kotlin-lsp-v1.0.0.zip",
                    size = 30_000_000
                ),
                LanguageConfig(
                    id = "swift",
                    name = "Swift",
                    extensions = listOf("swift"),
                    lspServer = "sourcekit-lsp",
                    treeSitterGrammar = "tree-sitter-swift",
                    downloadUrl = "https://cdn.theia.io/lsp/swift-lsp-v1.0.0.zip",
                    size = 25_000_000
                ),
                // ... XML, Gradle configs
            ),
            estimatedSize = 60_000_000,
            icon = "mobile-icon"
        )

        fun allProfiles() = listOf(
            JAVA_FULL_STACK,
            DOTNET_FULL_STACK,
            MOBILE_DEV
        )
    }
}

@Serializable
data class LanguageConfig(
    val id: String,
    val name: String,
    val extensions: List<String>,
    val lspServer: String,
    val treeSitterGrammar: String,
    val downloadUrl: String,
    val size: Long
)
```

#### Profile Manager

**File**: `shared/src/commonMain/kotlin/profiles/ProfileManager.kt`

```kotlin
class ProfileManager(
    private val downloader: LSPDownloader,
    private val storage: ProfileStorage,
    private val lspRegistry: LSPRegistry
) {
    private val _activeProfile = MutableStateFlow<LanguageStackProfile?>(null)
    val activeProfile: StateFlow<LanguageStackProfile?> = _activeProfile.asStateFlow()

    /**
     * Switch to a different language stack profile
     * Downloads missing LSP servers, unloads unused ones
     */
    suspend fun switchProfile(profile: LanguageStackProfile) {
        val currentProfile = _activeProfile.value

        // Calculate what needs to change
        val toDownload = profile.languages.filter { !isLanguageInstalled(it) }
        val toUnload = currentProfile?.languages?.filter { lang ->
            profile.languages.none { it.id == lang.id }
        } ?: emptyList()

        // Show progress to user
        emit ProgressEvent.ProfileSwitch(
            downloading = toDownload.size,
            unloading = toUnload.size,
            totalSize = toDownload.sumOf { it.size }
        )

        // Unload old LSP servers
        toUnload.forEach { lang ->
            lspRegistry.unload(lang.id)
        }

        // Download and load new LSP servers
        toDownload.forEach { lang ->
            val lspPath = downloader.download(lang)
            lspRegistry.load(lang.id, lspPath)
        }

        // Update active profile
        storage.saveActiveProfile(profile)
        _activeProfile.value = profile

        emit ProgressEvent.ProfileSwitchComplete(profile.name)
    }

    /**
     * Add a single language to current profile (custom mode)
     */
    suspend fun addLanguage(language: LanguageConfig) {
        val current = _activeProfile.value ?: return

        if (!isLanguageInstalled(language)) {
            val lspPath = downloader.download(language)
            lspRegistry.load(language.id, lspPath)
        }

        val updated = current.copy(
            languages = current.languages + language
        )
        storage.saveActiveProfile(updated)
        _activeProfile.value = updated
    }

    private suspend fun isLanguageInstalled(language: LanguageConfig): Boolean {
        return storage.isLSPInstalled(language.id)
    }
}
```

---

## 3. Dynamic LSP Loading

### Vision

Download language servers on-demand, similar to browser extensions:
- User opens a `.java` file → "Download Java LSP? (45MB)"
- User switches from Java to C# project → "Switch to .NET profile?"
- Offline mode → Use Tree-sitter only

### Architecture

```
┌─────────────────────────────────────────────┐
│           File Open: Main.java              │
│                                             │
│  ┌───────────────────────────────────┐     │
│  │ Java LSP not installed            │     │
│  │                                   │     │
│  │ Download Java LSP? (45MB)         │     │
│  │                                   │     │
│  │ [Download] [Use Basic Features]   │     │
│  └───────────────────────────────────┘     │
│                                             │
│  While downloading:                        │
│  • Tree-sitter provides syntax highlight   │
│  • Local completions available             │
│  • Full LSP features after download        │
│                                             │
└─────────────────────────────────────────────┘
```

### Implementation

#### LSP Downloader

**File**: `shared/src/commonMain/kotlin/lsp/LSPDownloader.kt`

```kotlin
class LSPDownloader(
    private val httpClient: HttpClient,
    private val fileSystem: FileSystem,
    private val cache: DownloadCache
) {
    /**
     * Download LSP server package
     * Returns local file path when complete
     */
    suspend fun download(language: LanguageConfig): String = withContext(Dispatchers.IO) {
        val cacheKey = "${language.id}-${language.downloadUrl.hashCode()}"

        // Check cache first
        cache.get(cacheKey)?.let { return@withContext it }

        val tempFile = fileSystem.createTempFile("lsp-${language.id}")
        val targetSize = language.size
        var downloadedBytes = 0L

        httpClient.prepareGet(language.downloadUrl).execute { response ->
            val channel = response.bodyAsChannel()

            while (!channel.isClosedForRead) {
                val packet = channel.readRemaining(DEFAULT_BUFFER_SIZE.toLong())

                while (!packet.isEmpty) {
                    val bytes = packet.readBytes()
                    fileSystem.appendBytes(tempFile, bytes)
                    downloadedBytes += bytes.size

                    // Emit progress
                    emitProgress(language.id, downloadedBytes, targetSize)
                }
            }
        }

        // Extract ZIP
        val extractedPath = fileSystem.extract(tempFile, "lsp/${language.id}")

        // Verify integrity
        verifyLSPPackage(extractedPath, language)

        // Cache path
        cache.put(cacheKey, extractedPath)

        return@withContext extractedPath
    }

    private suspend fun emitProgress(languageId: String, current: Long, total: Long) {
        val percent = (current.toDouble() / total * 100).toInt()
        emit(DownloadProgress(languageId, percent, current, total))
    }

    private fun verifyLSPPackage(path: String, language: LanguageConfig) {
        // Check that essential files exist
        val required = listOf("package.json", "server.js")
        required.forEach { file ->
            if (!fileSystem.exists("$path/$file")) {
                throw LSPPackageCorruptedException("Missing required file: $file")
            }
        }
    }
}

sealed class DownloadProgress(
    val languageId: String,
    val percent: Int,
    val current: Long,
    val total: Long
)
```

#### Auto-Download Trigger

**File**: `shared/src/commonMain/kotlin/editor/FileOpenHandler.kt`

```kotlin
class FileOpenHandler(
    private val profileManager: ProfileManager,
    private val lspRegistry: LSPRegistry,
    private val downloader: LSPDownloader
) {
    suspend fun handleFileOpen(file: File) {
        val extension = file.extension
        val language = LanguageRegistry.findByExtension(extension)

        if (language == null) {
            // Unknown file type, use plain text
            return
        }

        val isInstalled = lspRegistry.isInstalled(language.id)

        if (!isInstalled) {
            // Show prompt to user
            val userChoice = showDownloadPrompt(language)

            when (userChoice) {
                DownloadChoice.DOWNLOAD_NOW -> {
                    downloadAndActivate(language)
                }
                DownloadChoice.USE_BASIC -> {
                    // Use Tree-sitter only
                    activateBasicFeatures(language)
                }
                DownloadChoice.DOWNLOAD_LATER -> {
                    activateBasicFeatures(language)
                    scheduleBackgroundDownload(language)
                }
            }
        } else {
            // LSP already installed, activate it
            lspRegistry.activate(language.id, file)
        }
    }

    private suspend fun downloadAndActivate(language: LanguageConfig) {
        showDownloadProgress(language)

        try {
            val lspPath = downloader.download(language)
            lspRegistry.install(language.id, lspPath)
            lspRegistry.activate(language.id, currentFile)

            showSuccess("${language.name} LSP installed!")
        } catch (e: Exception) {
            showError("Failed to download ${language.name} LSP: ${e.message}")
            activateBasicFeatures(language)
        }
    }
}

enum class DownloadChoice {
    DOWNLOAD_NOW,
    USE_BASIC,
    DOWNLOAD_LATER
}
```

---

## 4. Modular Plugin Architecture (VSX-Style)

### Vision

App has a plugin marketplace like VS Code:
- Browse extensions (themes, language packs, tools)
- One-click install
- Auto-update
- Sandboxed execution

### Architecture

```
┌─────────────────────────────────────────────┐
│           Plugin Marketplace                │
│                                             │
│  🔍 Search plugins...                      │
│                                             │
│  ┌───────────────────────────────────┐     │
│  │ 🇯🇵 Japanese Language Pack         │     │
│  │ ⭐⭐⭐⭐⭐ (1.2K) • 2MB              │     │
│  │ [Install]                         │     │
│  └───────────────────────────────────┘     │
│                                             │
│  ┌───────────────────────────────────┐     │
│  │ 🎨 Dracula Theme                  │     │
│  │ ⭐⭐⭐⭐⭐ (15K) • 500KB            │     │
│  │ [Installed] ✓                     │     │
│  └───────────────────────────────────┘     │
│                                             │
│  ┌───────────────────────────────────┐     │
│  │ ⚡ Kotlin Enhanced                │     │
│  │ ⭐⭐⭐⭐☆ (800) • 15MB             │     │
│  │ Better Kotlin support + snippets  │     │
│  │ [Install]                         │     │
│  └───────────────────────────────────┘     │
│                                             │
└─────────────────────────────────────────────┘
```

### Implementation

#### Plugin Manifest

**Format**: `plugin.json` (VSX-compatible)

```json
{
  "name": "kotlin-enhanced",
  "displayName": "Kotlin Enhanced",
  "version": "1.5.0",
  "publisher": "theia-mobile",
  "description": "Enhanced Kotlin support with snippets and refactorings",
  "categories": ["Programming Languages"],
  "keywords": ["kotlin", "android", "jvm"],
  "icon": "icon.png",
  "engines": {
    "theia-mobile": "^1.0.0"
  },
  "contributes": {
    "languages": [{
      "id": "kotlin",
      "extensions": [".kt", ".kts"],
      "configuration": "./language-configuration.json"
    }],
    "grammars": [{
      "language": "kotlin",
      "scopeName": "source.kotlin",
      "path": "./syntaxes/kotlin.tmLanguage.json"
    }],
    "snippets": [{
      "language": "kotlin",
      "path": "./snippets/kotlin.json"
    }],
    "commands": [{
      "command": "kotlin.refactor.extractFunction",
      "title": "Kotlin: Extract Function"
    }],
    "keybindings": [{
      "command": "kotlin.refactor.extractFunction",
      "key": "cmd+shift+m",
      "when": "editorLangId == kotlin"
    }]
  },
  "main": "./extension.js",
  "activationEvents": [
    "onLanguage:kotlin"
  ],
  "dependencies": {
    "tree-sitter-kotlin": "^0.20.0"
  }
}
```

#### Plugin Manager

**File**: `shared/src/commonMain/kotlin/plugins/PluginManager.kt`

```kotlin
class PluginManager(
    private val registry: PluginRegistry,
    private val downloader: PluginDownloader,
    private val sandboxExecutor: PluginSandbox
) {
    /**
     * Install plugin from marketplace
     */
    suspend fun installPlugin(pluginId: String): Result<InstalledPlugin> {
        // Download plugin package
        val packagePath = downloader.download(pluginId)

        // Parse manifest
        val manifest = parseManifest(packagePath)

        // Verify compatibility
        if (!isCompatible(manifest)) {
            return Result.failure(IncompatiblePluginException(manifest.version))
        }

        // Extract to plugins directory
        val installPath = fileSystem.extract(packagePath, "plugins/${pluginId}")

        // Register plugin
        val plugin = InstalledPlugin(
            id = pluginId,
            manifest = manifest,
            path = installPath,
            enabled = true
        )
        registry.register(plugin)

        // Activate if activation event matches
        if (shouldActivateNow(plugin)) {
            activatePlugin(plugin)
        }

        return Result.success(plugin)
    }

    /**
     * Activate plugin (load and execute)
     */
    suspend fun activatePlugin(plugin: InstalledPlugin) {
        val mainFile = "${plugin.path}/${plugin.manifest.main}"

        // Execute in sandbox
        sandboxExecutor.execute(mainFile) { api ->
            // Provide API to plugin
            api.provideCommands(commandRegistry)
            api.provideLanguages(languageRegistry)
            api.provideThemes(themeRegistry)
        }

        registry.markActivated(plugin.id)
    }
}

@Serializable
data class InstalledPlugin(
    val id: String,
    val manifest: PluginManifest,
    val path: String,
    val enabled: Boolean,
    val installedAt: Long = System.currentTimeMillis()
)
```

---

## Implementation Roadmap

### Phase 1: Language Stack Profiles (2 weeks)
- [ ] Define profile data structures
- [ ] Implement profile manager
- [ ] Create UI for profile selection
- [ ] Add profile switching logic
- [ ] Test with Java and .NET profiles

### Phase 2: Dynamic LSP Loading (3 weeks)
- [ ] Implement LSP downloader
- [ ] Add download progress UI
- [ ] Integrate with file open handler
- [ ] Add background download scheduler
- [ ] Test with spotty network

### Phase 3: Siri Integration (iOS, 2 weeks)
- [ ] Define App Intents
- [ ] Implement SiriLSPBridge
- [ ] Add voice command parsers
- [ ] Test with common phrases
- [ ] Add Android voice support

### Phase 4: Plugin Marketplace (4 weeks)
- [ ] Design plugin manifest format
- [ ] Implement plugin downloader
- [ ] Create plugin sandbox
- [ ] Build marketplace UI
- [ ] Add plugin discovery/search

---

## Storage Requirements

### Per-Language LSP Sizes

| Language | LSP Server | Tree-sitter | Total |
|----------|-----------|-------------|-------|
| Java | 45MB | 2MB | 47MB |
| C# | 50MB | 2MB | 52MB |
| Kotlin | 30MB | 2MB | 32MB |
| Swift | 25MB | 2MB | 27MB |
| TypeScript | 20MB | 2MB | 22MB |
| Python | 15MB | 2MB | 17MB |
| SQL | 5MB | 1MB | 6MB |
| HTML | 5MB | 1MB | 6MB |
| CSS | 5MB | 1MB | 6MB |

### Profile Sizes

| Profile | Languages | Total Size |
|---------|-----------|------------|
| Java Full Stack | 5 | 80MB |
| .NET Full Stack | 5 | 75MB |
| Mobile Dev | 4 | 60MB |
| Data Science | 4 | 55MB |

### Recommendations

**Device Storage Strategy**:
- Minimum: 1 active profile (~80MB)
- Recommended: 2-3 profiles (~200MB)
- Maximum: All languages (~300MB)

**Network Usage**:
- Initial setup: 80-300MB (one-time)
- Profile switch: 20-80MB (occasional)
- Plugin install: 1-50MB (varies)

---

## User Experience Flow

### Scenario 1: New User, Java Developer

```
1. First launch → "Select your development stack"
2. User selects "Java Full Stack"
3. Download progress: "Downloading Java LSP (45MB)..."
4. Download progress: "Downloading SQL LSP (5MB)..."
5. Complete: "Ready to code! Open a .java file to start"
6. User opens MainActivity.java
7. Full LSP features available immediately
```

### Scenario 2: Context Switch (Java → C#)

```
1. User working in Java project
2. Opens .cs file in different project
3. Prompt: "C# LSP not installed. Download now? (50MB)"
4. User: "Yes, download"
5. Meanwhile: Tree-sitter provides basic syntax highlighting
6. Download completes → Full C# LSP features activate
7. Optional: "Switch to .NET Full Stack profile?"
```

### Scenario 3: Siri Workflow

```
1. User coding in Xcode, gets error
2. "Hey Siri, explain this error in Theia"
3. Siri: "The error says 'Unresolved reference: LoginRepository'.
   This usually means the class is not imported or doesn't exist.
   Would you like me to search for it?"
4. User: "Yes, find it"
5. Siri: "Found LoginRepository in package com.example.auth.
   Say 'add import' to fix this."
6. User: "Add import"
7. Siri: "Import added. The error should be resolved."
```

---

## Security Considerations

### LSP Download Security
- ✅ HTTPS-only downloads
- ✅ Package signature verification
- ✅ Hash validation (SHA-256)
- ✅ Sandboxed execution

### Plugin Sandbox
- ✅ Restricted file system access
- ✅ No network access (except declared)
- ✅ Permission prompts for sensitive APIs
- ✅ Resource limits (CPU, memory)

---

## Next Steps

**Immediate** (this month):
1. Implement profile manager (backend)
2. Design profile selection UI

**Short-term** (next quarter):
1. Build LSP downloader
2. Add Siri integration (iOS)

**Long-term** (6 months):
1. Launch plugin marketplace
2. Add AI code generation

Would you like me to start implementing any of these features? I recommend starting with **Language Stack Profiles** since it provides immediate value and is foundational for the other features.
