# Kotlin Multiplatform Mobile (KMM) Architecture for Theia Mobile

## Overview

This document outlines how to build the Theia Mobile app using **Kotlin Multiplatform Mobile (KMM)** instead of React Native, while maintaining compatibility with the existing Theia backend (`@theia/core-mobile`).

## Why KMM?

### Advantages over React Native

**Performance**:
- Native compilation (no JavaScript bridge)
- Direct access to platform APIs
- Better memory management
- Native UI components (Jetpack Compose + SwiftUI)

**Code Sharing**:
- Share business logic between iOS and Android (70-90%)
- Native UI on each platform
- Single codebase for networking, state management, LSP client

**Tooling**:
- Full IDE support (IntelliJ IDEA, Android Studio, Fleet)
- Type safety with Kotlin
- Debugging across platforms
- Gradle build system

**Ecosystem**:
- Ktor for networking (multiplatform)
- SQLDelight for database (multiplatform)
- Kotlin Coroutines for async (multiplatform)
- JetBrains-maintained libraries

### Comparison with React Native

| Aspect | React Native | KMM |
|--------|--------------|-----|
| **Performance** | Good (JS bridge) | Excellent (native) |
| **Code Sharing** | 90-95% | 70-90% |
| **UI** | React components | Native (Compose/SwiftUI) |
| **Learning Curve** | Low (if know React) | Medium (learn Kotlin) |
| **Build Size** | Larger | Smaller |
| **Maturity** | Mature (2015) | Growing (2020) |
| **Community** | Large | Growing |
| **Platform Feel** | Web-like | Native |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Mobile Apps                           │
├─────────────────────────────┬───────────────────────────┤
│         iOS App             │      Android App          │
│      (Swift/SwiftUI)        │   (Kotlin/Jetpack Compose)│
│                             │                           │
│  • File Explorer View       │  • File Explorer View     │
│  • Code Editor View         │  • Code Editor View       │
│  • Terminal View            │  • Terminal View          │
│  • Settings View            │  • Settings View          │
└──────────────┬──────────────┴──────────┬────────────────┘
               │                         │
               └─────────────┬───────────┘
                             │
            ┌────────────────┴─────────────────┐
            │   Shared Kotlin Module (KMM)     │
            ├──────────────────────────────────┤
            │  • WebSocket Client (Ktor)       │
            │  • RPC Protocol Handler           │
            │  • LSP Service                    │
            │  • Session Manager                │
            │  • File System Cache              │
            │  • State Management               │
            │  • Business Logic                 │
            └──────────────┬───────────────────┘
                           │
                           │ Mobile RPC Protocol
                           │ (WebSocket)
                           │
                           ↓
            ┌──────────────────────────────────┐
            │   Theia Backend Server           │
            │   (@theia/core-mobile)           │
            ├──────────────────────────────────┤
            │  • LSP Proxy                     │
            │  • Session Manager               │
            │  • Extension Host                │
            │  • Language Servers              │
            └──────────────────────────────────┘
```

## Project Structure

```
theia-mobile-kmm/
├── shared/                          # Shared Kotlin code
│   ├── src/
│   │   ├── commonMain/             # Platform-independent code
│   │   │   ├── kotlin/
│   │   │   │   ├── com.theia.mobile/
│   │   │   │   │   ├── network/
│   │   │   │   │   │   ├── WebSocketClient.kt
│   │   │   │   │   │   ├── RpcClient.kt
│   │   │   │   │   │   └── MessageCodec.kt
│   │   │   │   │   ├── lsp/
│   │   │   │   │   │   ├── LspService.kt
│   │   │   │   │   │   ├── LspTypes.kt
│   │   │   │   │   │   └── DiagnosticManager.kt
│   │   │   │   │   ├── session/
│   │   │   │   │   │   ├── SessionManager.kt
│   │   │   │   │   │   └── SessionState.kt
│   │   │   │   │   ├── filesystem/
│   │   │   │   │   │   ├── FileService.kt
│   │   │   │   │   │   ├── FileCache.kt
│   │   │   │   │   │   └── FileWatcher.kt
│   │   │   │   │   ├── workspace/
│   │   │   │   │   │   ├── WorkspaceManager.kt
│   │   │   │   │   │   └── WorkspaceState.kt
│   │   │   │   │   ├── state/
│   │   │   │   │   │   └── AppState.kt
│   │   │   │   │   └── util/
│   │   │   │   │       ├── Logger.kt
│   │   │   │   │       └── Extensions.kt
│   │   ├── androidMain/            # Android-specific code
│   │   │   └── kotlin/
│   │   │       └── com.theia.mobile/
│   │   │           └── Platform.kt
│   │   ├── iosMain/                # iOS-specific code
│   │   │   └── kotlin/
│   │   │       └── com.theia.mobile/
│   │   │           └── Platform.kt
│   │   ├── commonTest/             # Shared tests
│   │   │   └── kotlin/
│   │   │       └── com.theia.mobile/
│   │   │           ├── network/
│   │   │           │   └── RpcClientTest.kt
│   │   │           └── lsp/
│   │   │               └── LspServiceTest.kt
│   │   ├── androidTest/            # Android-specific tests
│   │   └── iosTest/                # iOS-specific tests
│   └── build.gradle.kts
│
├── androidApp/                      # Android application
│   ├── src/
│   │   └── main/
│   │       ├── kotlin/
│   │       │   └── com.theia.mobile.android/
│   │       │       ├── MainActivity.kt
│   │       │       ├── ui/
│   │       │       │   ├── editor/
│   │       │       │   │   └── CodeEditorScreen.kt
│   │       │       │   ├── explorer/
│   │       │       │   │   └── FileExplorerScreen.kt
│   │       │       │   ├── terminal/
│   │       │       │   │   └── TerminalScreen.kt
│   │       │       │   ├── navigation/
│   │       │       │   │   └── Navigation.kt
│   │       │       │   ├── components/
│   │       │       │   │   ├── CompletionPopup.kt
│   │       │       │   │   ├── DiagnosticOverlay.kt
│   │       │       │   │   └── HoverTooltip.kt
│   │       │       │   └── theme/
│   │       │       │       └── Theme.kt
│   │       │       └── viewmodel/
│   │       │           ├── EditorViewModel.kt
│   │       │           ├── ExplorerViewModel.kt
│   │       │           └── TerminalViewModel.kt
│   │       ├── res/
│   │       └── AndroidManifest.xml
│   └── build.gradle.kts
│
├── iosApp/                          # iOS application
│   ├── iosApp/
│   │   ├── ContentView.swift
│   │   ├── TheiaApp.swift
│   │   ├── Views/
│   │   │   ├── Editor/
│   │   │   │   └── CodeEditorView.swift
│   │   │   ├── Explorer/
│   │   │   │   └── FileExplorerView.swift
│   │   │   ├── Terminal/
│   │   │   │   └── TerminalView.swift
│   │   │   └── Components/
│   │   │       ├── CompletionPopup.swift
│   │   │       ├── DiagnosticOverlay.swift
│   │   │       └── HoverTooltip.swift
│   │   └── ViewModels/
│   │       ├── EditorViewModel.swift
│   │       ├── ExplorerViewModel.swift
│   │       └── TerminalViewModel.swift
│   └── iosApp.xcodeproj/
│
├── build.gradle.kts                 # Root build file
├── settings.gradle.kts              # Gradle settings
├── gradle.properties                # Gradle properties
└── README.md
```

## Shared Module Implementation

### 1. WebSocket Client (Ktor)

```kotlin
// shared/src/commonMain/kotlin/com/theia/mobile/network/WebSocketClient.kt

import io.ktor.client.*
import io.ktor.client.plugins.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

class WebSocketClient(
    private val serverUrl: String,
    private val httpClient: HttpClient = HttpClient {
        install(WebSockets)
    }
) {
    private var session: DefaultClientWebSocketSession? = null
    private val _messages = MutableSharedFlow<ByteArray>()
    val messages: Flow<ByteArray> = _messages.asSharedFlow()

    private val _connectionState = MutableSharedFlow<ConnectionState>()
    val connectionState: Flow<ConnectionState> = _connectionState.asSharedFlow()

    suspend fun connect() {
        try {
            _connectionState.emit(ConnectionState.Connecting)

            httpClient.webSocket(serverUrl) {
                session = this
                _connectionState.emit(ConnectionState.Connected)

                // Receive messages
                for (frame in incoming) {
                    when (frame) {
                        is Frame.Binary -> {
                            _messages.emit(frame.data)
                        }
                        is Frame.Close -> {
                            _connectionState.emit(ConnectionState.Disconnected)
                            break
                        }
                        else -> {}
                    }
                }
            }
        } catch (e: Exception) {
            _connectionState.emit(ConnectionState.Error(e))
        }
    }

    suspend fun send(data: ByteArray) {
        session?.send(Frame.Binary(true, data))
            ?: throw IllegalStateException("Not connected")
    }

    suspend fun disconnect() {
        session?.close()
        session = null
        _connectionState.emit(ConnectionState.Disconnected)
    }
}

sealed class ConnectionState {
    object Connecting : ConnectionState()
    object Connected : ConnectionState()
    object Disconnected : ConnectionState()
    data class Error(val exception: Exception) : ConnectionState()
}
```

### 2. RPC Client (MessagePack)

```kotlin
// shared/src/commonMain/kotlin/com/theia/mobile/network/RpcClient.kt

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.Serializable
import org.msgpack.core.MessagePack
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

@Serializable
data class RpcRequest(
    val id: String,
    val method: String,
    val params: List<Any?>
)

@Serializable
data class RpcResponse(
    val id: String,
    val result: Any?,
    val error: RpcError?
)

@Serializable
data class RpcError(
    val code: Int,
    val message: String
)

class RpcClient(private val webSocketClient: WebSocketClient) {
    private val pendingRequests = mutableMapOf<String, ContinuationWrapper>()
    private var nextId = 0

    init {
        // Listen for responses
        webSocketClient.messages.collect { data ->
            val response = MessageCodec.decodeResponse(data)
            pendingRequests.remove(response.id)?.let { wrapper ->
                if (response.error != null) {
                    wrapper.continuation.resumeWithException(
                        RpcException(response.error.message)
                    )
                } else {
                    wrapper.continuation.resume(response.result)
                }
            }
        }
    }

    suspend fun <T> request(method: String, vararg params: Any?): T {
        return suspendCancellableCoroutine { continuation ->
            val id = (nextId++).toString()
            val request = RpcRequest(id, method, params.toList())

            pendingRequests[id] = ContinuationWrapper(continuation)

            val encoded = MessageCodec.encodeRequest(request)
            webSocketClient.send(encoded)

            continuation.invokeOnCancellation {
                pendingRequests.remove(id)
            }
        }
    }

    suspend fun notify(method: String, vararg params: Any?) {
        val notification = RpcNotification(method, params.toList())
        val encoded = MessageCodec.encodeNotification(notification)
        webSocketClient.send(encoded)
    }

    private data class ContinuationWrapper(
        val continuation: CancellableContinuation<Any?>
    )
}

class RpcException(message: String) : Exception(message)
```

### 3. LSP Service

```kotlin
// shared/src/commonMain/kotlin/com/theia/mobile/lsp/LspService.kt

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class Position(val line: Int, val character: Int)
data class Range(val start: Position, val end: Position)

data class Diagnostic(
    val range: Range,
    val severity: DiagnosticSeverity,
    val message: String,
    val source: String?
)

enum class DiagnosticSeverity { ERROR, WARNING, INFORMATION, HINT }

data class CompletionItem(
    val label: String,
    val kind: CompletionItemKind,
    val detail: String?,
    val insertText: String?
)

enum class CompletionItemKind {
    TEXT, METHOD, FUNCTION, CONSTRUCTOR, FIELD, VARIABLE, CLASS,
    INTERFACE, MODULE, PROPERTY
}

data class CompletionList(
    val isIncomplete: Boolean,
    val items: List<CompletionItem>
)

data class Hover(
    val contents: String,
    val range: Range?
)

data class Location(
    val uri: String,
    val range: Range
)

class LspService(private val rpcClient: RpcClient) {
    private val _diagnostics = MutableStateFlow<Map<String, List<Diagnostic>>>(emptyMap())
    val diagnostics: StateFlow<Map<String, List<Diagnostic>>> = _diagnostics.asStateFlow()

    init {
        // Listen for diagnostic updates from backend
        listenForDiagnostics()
    }

    private fun listenForDiagnostics() {
        // RPC notification handler
        rpcClient.onNotification("showDiagnostics") { params ->
            val uri = params[0] as String
            val diags = params[1] as List<Diagnostic>

            val updated = _diagnostics.value.toMutableMap()
            updated[uri] = diags
            _diagnostics.value = updated
        }
    }

    suspend fun requestCompletion(uri: String, position: Position): CompletionList {
        return rpcClient.request("requestCompletion", uri, position)
    }

    suspend fun requestHover(uri: String, position: Position): Hover? {
        return rpcClient.request("requestHover", uri, position)
    }

    suspend fun requestDefinition(uri: String, position: Position): List<Location> {
        return rpcClient.request("requestDefinition", uri, position)
    }

    suspend fun notifyTextChange(uri: String, changes: List<TextChange>) {
        rpcClient.notify("onDidChangeTextDocument", uri, changes)
    }

    suspend fun requestFormatting(uri: String, options: FormattingOptions): List<TextEdit> {
        return rpcClient.request("requestFormatting", uri, options)
    }

    fun getDiagnostics(uri: String): List<Diagnostic> {
        return _diagnostics.value[uri] ?: emptyList()
    }
}

data class TextChange(
    val range: Range,
    val text: String
)

data class FormattingOptions(
    val tabSize: Int,
    val insertSpaces: Boolean
)

data class TextEdit(
    val range: Range,
    val newText: String
)
```

### 4. Session Manager

```kotlin
// shared/src/commonMain/kotlin/com/theia/mobile/session/SessionManager.kt

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class Session(
    val id: String,
    val workspaceUri: String,
    val openFiles: List<String>,
    val activeFile: String?,
    val createdAt: Long,
    val lastActivityAt: Long
)

class SessionManager(
    private val rpcClient: RpcClient,
    private val storage: SessionStorage
) {
    private val _currentSession = MutableStateFlow<Session?>(null)
    val currentSession: StateFlow<Session?> = _currentSession.asStateFlow()

    suspend fun createSession(workspaceUri: String): Session {
        val session: Session = rpcClient.request(
            "mobile/createSession",
            workspaceUri
        )

        _currentSession.value = session
        storage.saveSession(session)

        return session
    }

    suspend fun restoreSession(sessionId: String): Session? {
        val session: Session? = rpcClient.request(
            "mobile/restoreSession",
            sessionId
        )

        if (session != null) {
            _currentSession.value = session
            storage.saveSession(session)
        }

        return session
    }

    suspend fun openFile(uri: String) {
        val session = _currentSession.value ?: return

        rpcClient.notify("mobile/openFile", session.id, uri)

        val updated = session.copy(
            openFiles = session.openFiles + uri,
            activeFile = uri,
            lastActivityAt = System.currentTimeMillis()
        )

        _currentSession.value = updated
        storage.saveSession(updated)
    }

    suspend fun closeFile(uri: String) {
        val session = _currentSession.value ?: return

        rpcClient.notify("mobile/closeFile", session.id, uri)

        val updated = session.copy(
            openFiles = session.openFiles - uri,
            activeFile = if (session.activeFile == uri) null else session.activeFile,
            lastActivityAt = System.currentTimeMillis()
        )

        _currentSession.value = updated
        storage.saveSession(updated)
    }

    suspend fun endSession() {
        val session = _currentSession.value ?: return

        rpcClient.notify("mobile/endSession", session.id)

        storage.deleteSession(session.id)
        _currentSession.value = null
    }
}

interface SessionStorage {
    suspend fun saveSession(session: Session)
    suspend fun loadSession(sessionId: String): Session?
    suspend fun deleteSession(sessionId: String)
}
```

## Platform-Specific UI

### Android (Jetpack Compose)

```kotlin
// androidApp/src/main/kotlin/com/theia/mobile/android/ui/editor/CodeEditorScreen.kt

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.theia.mobile.lsp.Diagnostic
import com.theia.mobile.lsp.Position

@Composable
fun CodeEditorScreen(
    fileUri: String,
    viewModel: EditorViewModel = viewModel()
) {
    val editorState by viewModel.editorState.collectAsState()
    val diagnostics by viewModel.diagnostics.collectAsState()

    LaunchedEffect(fileUri) {
        viewModel.openFile(fileUri)
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Editor toolbar
        EditorToolbar(
            onSave = { viewModel.saveFile() },
            onFormat = { viewModel.formatDocument() }
        )

        // Code editor
        CodeEditor(
            text = editorState.text,
            diagnostics = diagnostics,
            onTextChange = { text ->
                viewModel.updateText(text)
            },
            onCompletionRequest = { position ->
                viewModel.requestCompletion(position)
            },
            modifier = Modifier.weight(1f)
        )

        // Completion popup
        if (editorState.completions.isNotEmpty()) {
            CompletionPopup(
                items = editorState.completions,
                onSelect = { item ->
                    viewModel.applyCompletion(item)
                },
                onDismiss = { viewModel.dismissCompletions() }
            )
        }

        // Diagnostic panel
        if (diagnostics.isNotEmpty()) {
            DiagnosticPanel(
                diagnostics = diagnostics,
                onDiagnosticClick = { diagnostic ->
                    viewModel.navigateToDiagnostic(diagnostic)
                }
            )
        }
    }
}

@Composable
fun CodeEditor(
    text: String,
    diagnostics: List<Diagnostic>,
    onTextChange: (String) -> Unit,
    onCompletionRequest: (Position) -> Unit,
    modifier: Modifier = Modifier
) {
    // Custom code editor implementation
    // Could use WebView with Monaco or custom text field
    BasicTextField(
        value = text,
        onValueChange = onTextChange,
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        textStyle = MaterialTheme.typography.bodyMedium.copy(
            fontFamily = FontFamily.Monospace
        )
    )

    // Overlay diagnostics
    DiagnosticOverlay(diagnostics = diagnostics)
}
```

### iOS (SwiftUI)

```swift
// iosApp/iosApp/Views/Editor/CodeEditorView.swift

import SwiftUI
import shared

struct CodeEditorView: View {
    let fileUri: String
    @StateObject private var viewModel: EditorViewModel

    init(fileUri: String) {
        self.fileUri = fileUri
        _viewModel = StateObject(wrappedValue: EditorViewModel(fileUri: fileUri))
    }

    var body: some View {
        VStack(spacing: 0) {
            // Editor toolbar
            EditorToolbar(
                onSave: { viewModel.saveFile() },
                onFormat: { viewModel.formatDocument() }
            )

            // Code editor
            CodeEditorTextView(
                text: $viewModel.text,
                diagnostics: viewModel.diagnostics,
                onTextChange: { text in
                    viewModel.updateText(text: text)
                },
                onCompletionRequest: { position in
                    viewModel.requestCompletion(position: position)
                }
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            // Completion popup
            if !viewModel.completions.isEmpty {
                CompletionPopup(
                    items: viewModel.completions,
                    onSelect: { item in
                        viewModel.applyCompletion(item: item)
                    },
                    onDismiss: { viewModel.dismissCompletions() }
                )
            }

            // Diagnostic panel
            if !viewModel.diagnostics.isEmpty {
                DiagnosticPanel(
                    diagnostics: viewModel.diagnostics,
                    onDiagnosticTap: { diagnostic in
                        viewModel.navigateToDiagnostic(diagnostic: diagnostic)
                    }
                )
            }
        }
        .onAppear {
            viewModel.openFile()
        }
    }
}

struct CodeEditorTextView: UIViewRepresentable {
    @Binding var text: String
    let diagnostics: [Diagnostic]
    let onTextChange: (String) -> Void
    let onCompletionRequest: (Position) -> Void

    func makeUIView(context: Context) -> UITextView {
        let textView = UITextView()
        textView.font = UIFont.monospacedSystemFont(ofSize: 14, weight: .regular)
        textView.autocapitalizationType = .none
        textView.autocorrectionType = .no
        textView.smartDashesType = .no
        textView.smartQuotesType = .no
        textView.delegate = context.coordinator
        return textView
    }

    func updateUIView(_ uiView: UITextView, context: Context) {
        if uiView.text != text {
            uiView.text = text
        }

        // Apply diagnostic highlighting
        highlightDiagnostics(in: uiView, diagnostics: diagnostics)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(
            text: $text,
            onTextChange: onTextChange,
            onCompletionRequest: onCompletionRequest
        )
    }

    class Coordinator: NSObject, UITextViewDelegate {
        @Binding var text: String
        let onTextChange: (String) -> Void
        let onCompletionRequest: (Position) -> Void

        init(
            text: Binding<String>,
            onTextChange: @escaping (String) -> Void,
            onCompletionRequest: @escaping (Position) -> Void
        ) {
            _text = text
            self.onTextChange = onTextChange
            self.onCompletionRequest = onCompletionRequest
        }

        func textViewDidChange(_ textView: UITextView) {
            text = textView.text
            onTextChange(textView.text)
        }
    }

    private func highlightDiagnostics(in textView: UITextView, diagnostics: [Diagnostic]) {
        // Apply red underlines for errors, etc.
    }
}
```

## ViewModels (Shared via KMM)

```kotlin
// shared/src/commonMain/kotlin/com/theia/mobile/viewmodel/EditorViewModel.kt

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class EditorState(
    val text: String = "",
    val cursorPosition: Position = Position(0, 0),
    val completions: List<CompletionItem> = emptyList(),
    val isLoading: Boolean = false
)

class EditorViewModel(
    private val fileUri: String,
    private val lspService: LspService,
    private val fileService: FileService
) {
    private val _editorState = MutableStateFlow(EditorState())
    val editorState: StateFlow<EditorState> = _editorState.asStateFlow()

    private val _diagnostics = MutableStateFlow<List<Diagnostic>>(emptyList())
    val diagnostics: StateFlow<List<Diagnostic>> = _diagnostics.asStateFlow()

    init {
        // Subscribe to diagnostics for this file
        viewModelScope.launch {
            lspService.diagnostics.collect { diagMap ->
                _diagnostics.value = diagMap[fileUri] ?: emptyList()
            }
        }
    }

    fun openFile() {
        viewModelScope.launch {
            _editorState.value = _editorState.value.copy(isLoading = true)

            try {
                val content = fileService.readFile(fileUri)
                _editorState.value = _editorState.value.copy(
                    text = content,
                    isLoading = false
                )
            } catch (e: Exception) {
                // Handle error
                _editorState.value = _editorState.value.copy(isLoading = false)
            }
        }
    }

    fun updateText(text: String) {
        _editorState.value = _editorState.value.copy(text = text)

        // Notify backend of changes
        viewModelScope.launch {
            val changes = calculateChanges(_editorState.value.text, text)
            lspService.notifyTextChange(fileUri, changes)
        }
    }

    fun requestCompletion(position: Position) {
        viewModelScope.launch {
            val completions = lspService.requestCompletion(fileUri, position)
            _editorState.value = _editorState.value.copy(
                completions = completions.items
            )
        }
    }

    fun applyCompletion(item: CompletionItem) {
        // Apply completion to text
        val newText = applyCompletionToText(
            _editorState.value.text,
            _editorState.value.cursorPosition,
            item
        )

        _editorState.value = _editorState.value.copy(
            text = newText,
            completions = emptyList()
        )
    }

    fun formatDocument() {
        viewModelScope.launch {
            val edits = lspService.requestFormatting(
                fileUri,
                FormattingOptions(tabSize = 4, insertSpaces = true)
            )

            val formattedText = applyTextEdits(_editorState.value.text, edits)
            _editorState.value = _editorState.value.copy(text = formattedText)
        }
    }

    private fun calculateChanges(oldText: String, newText: String): List<TextChange> {
        // Calculate text changes for LSP
        // ...
    }

    private fun applyCompletionToText(
        text: String,
        position: Position,
        item: CompletionItem
    ): String {
        // Apply completion to text
        // ...
    }

    private fun applyTextEdits(text: String, edits: List<TextEdit>): String {
        // Apply text edits
        // ...
    }
}
```

## Build Configuration

### Root build.gradle.kts

```kotlin
// build.gradle.kts

plugins {
    kotlin("multiplatform") version "1.9.20" apply false
    kotlin("android") version "1.9.20" apply false
    id("com.android.application") version "8.1.2" apply false
    id("com.android.library") version "8.1.2" apply false
    kotlin("plugin.serialization") version "1.9.20" apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven("https://maven.pkg.jetbrains.space/public/p/ktor/eap")
    }
}
```

### Shared module build.gradle.kts

```kotlin
// shared/build.gradle.kts

plugins {
    kotlin("multiplatform")
    kotlin("plugin.serialization")
    id("com.android.library")
}

kotlin {
    androidTarget {
        compilations.all {
            kotlinOptions {
                jvmTarget = "17"
            }
        }
    }

    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach {
        it.binaries.framework {
            baseName = "shared"
            isStatic = true
        }
    }

    sourceSets {
        val commonMain by getting {
            dependencies {
                // Ktor for networking
                implementation("io.ktor:ktor-client-core:2.3.5")
                implementation("io.ktor:ktor-client-websockets:2.3.5")

                // Serialization
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")

                // MessagePack
                implementation("org.msgpack:msgpack-core:0.9.5")

                // Coroutines
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

                // DateTime
                implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.4.1")

                // SQLDelight for local storage
                implementation("app.cash.sqldelight:runtime:2.0.0")
            }
        }

        val androidMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-android:2.3.5")
                implementation("app.cash.sqldelight:android-driver:2.0.0")
            }
        }

        val iosMain by creating {
            dependencies {
                implementation("io.ktor:ktor-client-darwin:2.3.5")
                implementation("app.cash.sqldelight:native-driver:2.0.0")
            }
        }

        val commonTest by getting {
            dependencies {
                implementation(kotlin("test"))
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
            }
        }
    }
}

android {
    namespace = "com.theia.mobile"
    compileSdk = 34
    defaultConfig {
        minSdk = 24
    }
}
```

## Testing Strategy

### Shared Module Tests

```kotlin
// shared/src/commonTest/kotlin/com/theia/mobile/lsp/LspServiceTest.kt

import kotlin.test.*
import kotlinx.coroutines.test.runTest

class LspServiceTest {

    @Test
    fun `should request completions from backend`() = runTest {
        val mockRpcClient = MockRpcClient()
        val lspService = LspService(mockRpcClient)

        val expectedCompletions = CompletionList(
            isIncomplete = false,
            items = listOf(
                CompletionItem(
                    label = "console",
                    kind = CompletionItemKind.VARIABLE,
                    detail = "console object",
                    insertText = "console"
                )
            )
        )

        mockRpcClient.mockResponse("requestCompletion", expectedCompletions)

        val result = lspService.requestCompletion(
            uri = "file:///test.ts",
            position = Position(line = 10, character = 5)
        )

        assertEquals(expectedCompletions, result)
        assertEquals("requestCompletion", mockRpcClient.lastMethod)
    }

    @Test
    fun `should receive diagnostic notifications`() = runTest {
        val mockRpcClient = MockRpcClient()
        val lspService = LspService(mockRpcClient)

        val diagnostics = listOf(
            Diagnostic(
                range = Range(
                    start = Position(0, 0),
                    end = Position(0, 5)
                ),
                severity = DiagnosticSeverity.ERROR,
                message = "Undefined variable",
                source = "typescript"
            )
        )

        // Simulate diagnostic notification
        mockRpcClient.simulateNotification(
            "showDiagnostics",
            "file:///test.ts",
            diagnostics
        )

        val result = lspService.getDiagnostics("file:///test.ts")
        assertEquals(diagnostics, result)
    }
}
```

## Migration Path from React Native

### Phase 1: Proof of Concept (2 weeks)

1. **Setup KMM project**:
   ```bash
   # Use KMM wizard
   ./gradlew :shared:build
   ```

2. **Implement core networking**:
   - WebSocket client (Ktor)
   - RPC protocol handler
   - Basic LSP types

3. **Create simple UI**:
   - Android: Jetpack Compose text editor
   - iOS: SwiftUI text editor
   - Test connection to Theia backend

### Phase 2: Feature Parity (6-8 weeks)

4. **Implement LSP service**:
   - Completion requests
   - Diagnostic handling
   - Hover, definition, formatting

5. **Build UI components**:
   - File explorer
   - Code editor with syntax highlighting
   - Terminal emulator
   - Completion popup
   - Diagnostic panel

6. **Add session management**:
   - Session creation/restoration
   - File operations
   - State persistence

### Phase 3: Polish & Testing (4 weeks)

7. **Performance optimization**:
   - Network request batching
   - UI rendering optimization
   - Memory management

8. **Comprehensive testing**:
   - Unit tests (shared module)
   - UI tests (Android/iOS)
   - Integration tests
   - Performance tests

9. **Platform-specific features**:
   - Android: Material Design 3
   - iOS: Native look and feel
   - Accessibility support

## Advantages of KMM for Theia Mobile

### 1. Direct Backend Integration

- **Type Safety**: Share protocol types between Kotlin backend and mobile
- **Code Reuse**: Same LSP service logic on all platforms
- **Consistency**: Single source of truth for business logic

### 2. Performance

- **No Bridge**: Direct native calls (vs JS bridge in React Native)
- **Faster Rendering**: Native UI components
- **Better Battery**: No JavaScript engine overhead

### 3. Future-Proofing

- **JetBrains Support**: Fleet IDE uses similar architecture
- **Growing Ecosystem**: More libraries going multiplatform
- **Desktop Support**: Can target JVM for desktop app

### 4. Developer Experience

- **Type Safety**: Kotlin's strong type system
- **IDE Support**: Full IntelliJ IDEA/Fleet support
- **Debugging**: Native debugger on each platform

## Comparison with React Native Approach

| Aspect | React Native | KMM |
|--------|--------------|-----|
| **Shared Code** | 90-95% | 70-80% |
| **UI Framework** | React (JS) | Native (Compose/SwiftUI) |
| **Performance** | Good | Excellent |
| **Type Safety** | TypeScript | Kotlin |
| **Backend Sync** | Manual types | Shared types |
| **Build Size** | ~20-30 MB | ~10-15 MB |
| **Maturity** | High | Medium |
| **Learning Curve** | Low (React devs) | Medium (Kotlin) |
| **Native Feel** | Web-like | Native |

## Conclusion

KMM provides a compelling alternative to React Native for Theia Mobile:

**Choose KMM if**:
- You value performance and native feel
- You want type-safe integration with backend
- Your team knows Kotlin (or JVM languages)
- You want smaller app size
- You plan desktop support later

**Choose React Native if**:
- Your team knows React/JavaScript
- You want faster initial development
- You need maximum code sharing (95%+)
- Community size is critical
- You want web version too

**Recommendation**: For Theia Mobile, **KMM is the better choice** because:
1. Type-safe integration with Theia backend
2. Better performance for code editing
3. Native UI for professional IDE experience
4. Future JetBrains ecosystem alignment (Fleet)
5. Potential desktop support with Compose Multiplatform

The 10-20% platform-specific UI code (70-80% shared in KMM vs 90-95% in React Native) is offset by better performance, native feel, and type safety benefits.

---

**Next Steps**:
1. Create proof-of-concept KMM project
2. Implement WebSocket + RPC client
3. Build simple editor UI on both platforms
4. Test with Theia backend
5. Measure performance vs React Native POC
6. Make final decision based on results
