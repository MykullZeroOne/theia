# Theia iOS Client Implementation Plan

## Executive Summary

This document outlines a comprehensive plan to add an iOS thin client application to the Eclipse Theia project. The iOS app will connect to Theia's existing backend infrastructure and support both VS Code extensions and Theia extensions with an extensible UI architecture.

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  iOS Application                     │
│  ┌────────────────────────────────────────────────┐ │
│  │         Extension Runtime (Swift/JS)           │ │
│  │  ┌──────────────┐    ┌───────────────────┐   │ │
│  │  │ UI Extension │    │ Service Extension │   │ │
│  │  │   Registry   │    │     Registry      │   │ │
│  │  └──────────────┘    └───────────────────┘   │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │      iOS Native UI Layer (SwiftUI/UIKit)      │ │
│  │  ┌──────┐ ┌────────┐ ┌─────────┐ ┌─────────┐ │ │
│  │  │Editor│ │Explorer│ │Terminal │ │WebViews │ │ │
│  │  └──────┘ └────────┘ └─────────┘ └─────────┘ │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │      RPC Protocol Layer (msgpackr/JSON)        │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │   WebSocket/HTTP Connection to Backend         │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│              Theia Backend (Node.js)                │
│  ┌────────────────────────────────────────────────┐ │
│  │         iOS Frontend Adapter Module            │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │         Existing Backend Services              │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Phase 1: Foundation & Infrastructure (Months 1-3)

### 1.1 Backend Modifications

#### Create New `packages/core-ios` Package

**Purpose**: iOS-specific frontend module and protocol adaptations

**Structure**:
```
packages/core-ios/
├── src/
│   ├── common/
│   │   ├── ios-protocol.ts          # iOS-specific RPC protocol definitions
│   │   ├── ios-types.ts              # iOS-specific type definitions
│   │   └── ios-capabilities.ts       # Device capability detection
│   ├── node/
│   │   ├── ios-backend-module.ts     # Backend DI module
│   │   ├── ios-connection-handler.ts # WebSocket connection handler
│   │   └── ios-session-manager.ts    # Session management for iOS clients
│   └── browser/
│       └── ios-bridge-protocol.ts    # Protocol definitions for iOS bridge
├── package.json
└── README.md
```

**Key Components**:

1. **iOS Connection Handler** (`ios-connection-handler.ts`)
   - Extends existing connection management
   - Handles iOS-specific authentication
   - Manages connection lifecycle for mobile devices
   - Implements reconnection logic for mobile network switches

2. **iOS RPC Protocol Adapter** (`ios-protocol.ts`)
   - Adapts Main-Ext pattern for iOS
   - Defines iOS-specific RPC interfaces
   - Handles serialization for Swift<->TypeScript boundary
   - Optimizes message batching for mobile networks

3. **iOS Session Manager** (`ios-session-manager.ts`)
   - Manages multiple iOS client connections
   - Handles session persistence across app backgrounding
   - Implements state synchronization
   - Manages resource cleanup

#### Modify `packages/plugin-ext` for iOS Support

**New Files**:
```
packages/plugin-ext/src/
├── ios/
│   ├── ios-plugin-host-adapter.ts    # Adapter for iOS plugin host
│   ├── ios-ext-impl.ts                # iOS-specific Ext implementations
│   └── ios-main-impl.ts               # iOS-specific Main implementations
└── common/
    └── ios-plugin-api-rpc.ts          # iOS RPC interfaces
```

**Modifications**:
- Update `plugin-api-rpc.ts` to include iOS proxy contexts
- Add iOS-specific capability checks in plugin activation
- Implement mobile-optimized plugin host communication

### 1.2 iOS Project Setup

#### Create `examples/ios` Directory

**Structure**:
```
examples/ios/
├── TheiaIOS/                          # Xcode project
│   ├── TheiaIOS.xcodeproj/
│   ├── TheiaIOS/
│   │   ├── App/
│   │   │   ├── TheiaApp.swift         # Main app entry
│   │   │   ├── AppDelegate.swift
│   │   │   └── SceneDelegate.swift
│   │   ├── Core/
│   │   │   ├── Connection/
│   │   │   │   ├── WebSocketManager.swift
│   │   │   │   ├── RPCClient.swift
│   │   │   │   └── MessageCodec.swift
│   │   │   ├── Extension/
│   │   │   │   ├── ExtensionManager.swift
│   │   │   │   ├── ExtensionRuntime.swift
│   │   │   │   └── ExtensionManifest.swift
│   │   │   └── State/
│   │   │       ├── WorkspaceState.swift
│   │   │       └── EditorState.swift
│   │   ├── UI/
│   │   │   ├── Components/
│   │   │   │   ├── EditorView.swift
│   │   │   │   ├── ExplorerView.swift
│   │   │   │   ├── TerminalView.swift
│   │   │   │   └── ActivityBar.swift
│   │   │   └── Extensions/
│   │   │       ├── ExtensionView.swift
│   │   │       └── ExtensionContribution.swift
│   │   ├── Bridge/
│   │   │   ├── JavaScriptCore/
│   │   │   │   ├── JSExtensionBridge.swift
│   │   │   │   └── JSContextManager.swift
│   │   │   └── Native/
│   │   │       └── NativeExtensionBridge.swift
│   │   └── Resources/
│   │       ├── Assets.xcassets/
│   │       └── Info.plist
│   ├── TheiaIOSTests/
│   └── TheiaIOSUITests/
├── package.json                        # NPM scripts for building
└── README.md
```

#### Key iOS Components

1. **WebSocketManager.swift**
   - Manages WebSocket connection to backend
   - Handles reconnection with exponential backoff
   - Implements ping/pong heartbeat
   - Manages network reachability

2. **RPCClient.swift**
   - Implements RPC protocol client
   - Handles message encoding/decoding (msgpackr compatible)
   - Manages request/response correlation
   - Implements cancellation tokens

3. **ExtensionManager.swift**
   - Discovers and loads extensions
   - Manages extension lifecycle
   - Provides extension isolation
   - Handles extension dependencies

4. **ExtensionRuntime.swift**
   - Provides API namespace to extensions
   - Manages extension activation
   - Handles extension contribution points
   - Implements extension sandboxing

### 1.3 Communication Protocol

#### iOS RPC Protocol Specification

**Message Format** (compatible with existing msgpackr encoding):

```typescript
// packages/core-ios/src/common/ios-protocol.ts

export namespace IosRPC {
    export const CONTEXT = {
        IOS_MAIN: 'IOS_MAIN',
        IOS_EXT: 'IOS_EXT'
    };

    export interface IosMainContext {
        $showTextDocument(uri: string, options?: TextDocumentShowOptions): Promise<void>;
        $updateEditorLayout(layout: EditorLayout): Promise<void>;
        $registerUIComponent(component: UIComponentDescriptor): Promise<void>;
        $updateStatusBar(items: StatusBarItem[]): Promise<void>;
        $showQuickPick(items: QuickPickItem[], options?: QuickPickOptions): Promise<string | undefined>;
    }

    export interface IosExtContext {
        $onDidChangeTextDocument(uri: string, changes: TextDocumentContentChangeEvent[]): void;
        $onDidChangeViewState(state: ViewState): void;
        $executeCommand(command: string, ...args: any[]): Promise<any>;
    }

    export interface UIComponentDescriptor {
        id: string;
        type: 'view' | 'widget' | 'panel';
        contribution: {
            title: string;
            icon?: string;
            location: 'sidebar' | 'panel' | 'editor' | 'statusbar';
        };
        renderer?: 'native' | 'webview';
        webviewOptions?: WebviewOptions;
    }
}
```

**Swift RPC Implementation**:

```swift
// examples/ios/TheiaIOS/Core/Connection/RPCClient.swift

protocol RPCProtocol {
    func sendRequest<T: Decodable>(_ method: String, params: [Any]) async throws -> T
    func sendNotification(_ method: String, params: [Any]) async throws
    func registerHandler(_ method: String, handler: @escaping ([Any]) async throws -> Any)
}

class TheiaRPCClient: RPCProtocol {
    private let webSocket: WebSocketManager
    private let encoder: MessagePackEncoder
    private let decoder: MessagePackDecoder
    private var pendingRequests: [String: CheckedContinuation<Any, Error>] = [:]
    private var handlers: [String: ([Any]) async throws -> Any] = [:]

    // Implementation details...
}
```

## Phase 2: Core UI Framework (Months 4-6)

### 2.1 SwiftUI Component System

#### Base UI Architecture

**Create reusable SwiftUI components**:

```swift
// examples/ios/TheiaIOS/UI/Components/EditorView.swift

struct TheiaEditorView: View {
    @ObservedObject var document: TextDocument
    @StateObject private var extensionHost: ExtensionHost

    var body: some View {
        VStack(spacing: 0) {
            // Extension-contributed toolbars
            ExtensionToolbarView(contributions: extensionHost.toolbarContributions)

            // Main editor
            CodeEditorView(document: document)
                .overlay(extensionOverlays)

            // Extension-contributed panels
            ExtensionPanelView(contributions: extensionHost.panelContributions)
        }
    }

    @ViewBuilder
    var extensionOverlays: some View {
        ForEach(extensionHost.overlayContributions) { contribution in
            ExtensionOverlayView(contribution: contribution)
        }
    }
}
```

#### Extension Contribution Points

**UI Extension API**:

```swift
// examples/ios/TheiaIOS/Core/Extension/UIExtensionAPI.swift

protocol UIExtensionAPI {
    // Register custom views
    func registerTreeDataProvider(viewId: String, provider: TreeDataProvider) async throws
    func registerWebviewViewProvider(viewId: String, provider: WebviewViewProvider) async throws
    func registerCustomEditor(viewType: String, provider: CustomEditorProvider) async throws

    // Contribute to UI
    func registerCommand(id: String, handler: @escaping CommandHandler) async throws
    func createStatusBarItem(alignment: StatusBarAlignment, priority: Int) -> StatusBarItem
    func createTreeView(viewId: String, options: TreeViewOptions) -> TreeView
    func createWebviewPanel(viewType: String, title: String, options: WebviewOptions) -> WebviewPanel

    // Notifications
    func showInformationMessage(_ message: String, actions: [String]) async -> String?
    func showWarningMessage(_ message: String, actions: [String]) async -> String?
    func showErrorMessage(_ message: String, actions: [String]) async -> String?
}
```

### 2.2 Extension Host Implementation

#### JavaScript Extension Runtime

**Use JavaScriptCore for extensions**:

```swift
// examples/ios/TheiaIOS/Bridge/JavaScriptCore/JSExtensionBridge.swift

class JSExtensionHost {
    private let context: JSContext
    private let rpcClient: TheiaRPCClient

    init(rpcClient: TheiaRPCClient) {
        self.rpcClient = rpcClient
        self.context = JSContext()
        setupAPI()
    }

    private func setupAPI() {
        // Expose Theia/VSCode API to extensions
        let theiaAPI: @convention(block) () -> JSValue = {
            return self.createTheiaAPI()
        }
        context.setObject(theiaAPI, forKeyedSubscript: "acquireTheiaApi" as NSString)

        // Expose communication bridge
        let rpcBridge: @convention(block) (String, [Any]) -> JSValue = { method, args in
            return self.invokeRPC(method: method, args: args)
        }
        context.setObject(rpcBridge, forKeyedSubscript: "__rpcCall" as NSString)
    }

    func loadExtension(manifest: ExtensionManifest, mainScript: String) async throws {
        // Load and execute extension code
        context.evaluateScript(mainScript)

        // Call activation function if defined
        if let activationEvents = manifest.activationEvents {
            for event in activationEvents {
                try await activateExtension(for: event)
            }
        }
    }
}
```

#### Native Swift Extension Runtime

**For performance-critical extensions**:

```swift
// examples/ios/TheiaIOS/Bridge/Native/NativeExtensionBridge.swift

protocol NativeExtension {
    var manifest: ExtensionManifest { get }
    func activate(context: ExtensionContext) async throws
    func deactivate() async throws
}

class NativeExtensionHost {
    private var loadedExtensions: [String: NativeExtension] = [:]

    func registerExtension(_ extension: NativeExtension) {
        loadedExtensions[extension.manifest.id] = extension
    }

    func activateExtension(id: String, context: ExtensionContext) async throws {
        guard let ext = loadedExtensions[id] else {
            throw ExtensionError.notFound(id)
        }
        try await ext.activate(context: context)
    }
}
```

## Phase 3: Extension System (Months 7-9)

### 3.1 Extension Discovery & Loading

#### Extension Marketplace Integration

**Connect to OpenVSX**:

```swift
// examples/ios/TheiaIOS/Core/Extension/ExtensionMarketplace.swift

class ExtensionMarketplace {
    private let baseURL = "https://open-vsx.org/api"

    func searchExtensions(query: String) async throws -> [ExtensionSearchResult] {
        // Query OpenVSX API
        let url = URL(string: "\(baseURL)/search?query=\(query)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode([ExtensionSearchResult].self, from: data)
    }

    func downloadExtension(id: String, version: String) async throws -> URL {
        // Download VSIX from OpenVSX
        let downloadURL = URL(string: "\(baseURL)/\(id)/\(version)/file")!
        let (tempURL, _) = try await URLSession.shared.download(from: downloadURL)

        // Extract and install
        let installURL = try await extractVSIX(from: tempURL)
        return installURL
    }

    private func extractVSIX(from url: URL) async throws -> URL {
        // VSIX is a ZIP file - extract to app's extensions directory
        let destURL = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Extensions")

        try FileManager.default.unzipItem(at: url, to: destURL)
        return destURL
    }
}
```

#### Extension Manifest Parsing

```swift
// examples/ios/TheiaIOS/Core/Extension/ExtensionManifest.swift

struct ExtensionManifest: Codable {
    let name: String
    let displayName: String?
    let version: String
    let publisher: String
    let engines: [String: String]
    let activationEvents: [String]?
    let main: String?
    let contributes: ExtensionContributions?

    // iOS-specific fields
    let ios: IOSExtensionConfig?

    struct IOSExtensionConfig: Codable {
        let runtime: ExtensionRuntime // "javascript" or "native"
        let minVersion: String
        let capabilities: [String]?
        let nativeModule: String? // For Swift-based extensions
    }

    struct ExtensionContributions: Codable {
        let commands: [Command]?
        let views: [String: ViewContribution]?
        let viewsContainers: [String: ViewContainer]?
        let menus: [String: [MenuContribution]]?
        let keybindings: [KeyBinding]?
        let configuration: Configuration?
        let languages: [Language]?
        let grammars: [Grammar]?
        let themes: [Theme]?
    }
}
```

### 3.2 Extension API Implementation

#### VS Code API Compatibility Layer

**Implement VS Code API surface**:

```typescript
// packages/core-ios/src/common/vscode-api-ios.ts

export namespace IosVSCodeAPI {
    // Core namespaces that need iOS-specific implementations
    export interface WindowAPI {
        showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>;
        showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>;
        showErrorMessage(message: string, ...items: string[]): Promise<string | undefined>;
        showQuickPick(items: string[] | QuickPickItem[], options?: QuickPickOptions): Promise<string | QuickPickItem | undefined>;
        showInputBox(options?: InputBoxOptions): Promise<string | undefined>;
        createOutputChannel(name: string): OutputChannel;
        createStatusBarItem(alignment?: StatusBarAlignment, priority?: number): StatusBarItem;
        createTerminal(options: TerminalOptions): Terminal;
        createWebviewPanel(viewType: string, title: string, showOptions: ViewColumn | ShowOptions, options?: WebviewPanelOptions): WebviewPanel;
        registerTreeDataProvider<T>(viewId: string, treeDataProvider: TreeDataProvider<T>): Disposable;
        registerWebviewViewProvider(viewId: string, provider: WebviewViewProvider, options?: WebviewViewProviderOptions): Disposable;
    }

    export interface WorkspaceAPI {
        readonly workspaceFolders: WorkspaceFolder[] | undefined;
        readonly textDocuments: TextDocument[];
        onDidOpenTextDocument: Event<TextDocument>;
        onDidCloseTextDocument: Event<TextDocument>;
        onDidChangeTextDocument: Event<TextDocumentChangeEvent>;
        openTextDocument(uri: Uri): Promise<TextDocument>;
        applyEdit(edit: WorkspaceEdit): Promise<boolean>;
        registerFileSystemProvider(scheme: string, provider: FileSystemProvider): Disposable;
    }

    export interface LanguagesAPI {
        registerCompletionItemProvider(selector: DocumentSelector, provider: CompletionItemProvider, ...triggerCharacters: string[]): Disposable;
        registerHoverProvider(selector: DocumentSelector, provider: HoverProvider): Disposable;
        registerDefinitionProvider(selector: DocumentSelector, provider: DefinitionProvider): Disposable;
        registerCodeActionsProvider(selector: DocumentSelector, provider: CodeActionProvider, metadata?: CodeActionProviderMetadata): Disposable;
    }
}
```

**Swift-side API Bridge**:

```swift
// examples/ios/TheiaIOS/Core/Extension/VSCodeAPIBridge.swift

@objc protocol VSCodeAPI {
    var window: WindowAPI { get }
    var workspace: WorkspaceAPI { get }
    var languages: LanguagesAPI { get }
    var commands: CommandsAPI { get }
}

class VSCodeAPIImpl: NSObject, VSCodeAPI {
    private let rpcClient: TheiaRPCClient

    lazy var window: WindowAPI = WindowAPIImpl(rpcClient: rpcClient)
    lazy var workspace: WorkspaceAPI = WorkspaceAPIImpl(rpcClient: rpcClient)
    lazy var languages: LanguagesAPI = LanguagesAPIImpl(rpcClient: rpcClient)
    lazy var commands: CommandsAPI = CommandsAPIImpl(rpcClient: rpcClient)

    init(rpcClient: TheiaRPCClient) {
        self.rpcClient = rpcClient
    }
}
```

### 3.3 Custom Theia Extension API

**iOS-specific extensions**:

```swift
// examples/ios/TheiaIOS/Core/Extension/TheiaIOSAPI.swift

protocol TheiaIOSExtensionAPI {
    // iOS-specific UI contributions
    func registerSwiftUIView(id: String, viewBuilder: @escaping () -> AnyView) async throws
    func registerContextMenuProvider(provider: ContextMenuProvider) async throws
    func registerGestureHandler(type: GestureType, handler: @escaping GestureHandler) async throws

    // Mobile-specific features
    func requestCameraAccess() async throws -> Bool
    func requestPhotoLibraryAccess() async throws -> Bool
    func shareFile(url: URL) async throws
    func openURLInSafari(url: URL) async throws

    // Haptic feedback
    func provideFeedback(type: HapticFeedbackType) async throws

    // System integration
    func registerShortcut(id: String, title: String, icon: String) async throws
    func registerShareExtension(id: String, handler: @escaping ShareHandler) async throws
}
```

## Phase 4: Advanced Features (Months 10-12)

### 4.1 Code Editor Implementation

#### Monaco-like Editor for iOS

**Options**:

1. **WebView-based Monaco**: Embed actual Monaco editor
   - Pros: Full compatibility, rich features
   - Cons: Performance on older devices, memory usage

2. **Native Swift Code Editor**: Build custom editor
   - Pros: Better performance, native feel
   - Cons: Feature parity takes time

**Recommended: Hybrid Approach**

```swift
// examples/ios/TheiaIOS/UI/Components/CodeEditorView.swift

enum EditorMode {
    case native  // For simple editing
    case monaco  // For full IDE features
}

struct CodeEditorView: View {
    @State private var mode: EditorMode = .native
    let document: TextDocument

    var body: some View {
        Group {
            switch mode {
            case .native:
                NativeCodeEditor(document: document)
                    .overlay(alignment: .topTrailing) {
                        Button("Full IDE") {
                            mode = .monaco
                        }
                    }
            case .monaco:
                MonacoWebEditor(document: document)
                    .overlay(alignment: .topTrailing) {
                        Button("Simple") {
                            mode = .native
                        }
                    }
            }
        }
    }
}

struct NativeCodeEditor: UIViewRepresentable {
    let document: TextDocument

    func makeUIView(context: Context) -> CodeEditView {
        let editor = CodeEditView()
        editor.delegate = context.coordinator
        return editor
    }

    func updateUIView(_ uiView: CodeEditView, context: Context) {
        uiView.text = document.content
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(document: document)
    }

    class Coordinator: NSObject, CodeEditViewDelegate {
        let document: TextDocument

        init(document: TextDocument) {
            self.document = document
        }

        func textDidChange(_ text: String) {
            document.content = text
        }
    }
}
```

### 4.2 Terminal Integration

**Implement terminal support**:

```swift
// examples/ios/TheiaIOS/UI/Components/TerminalView.swift

struct TerminalView: View {
    @StateObject private var terminal: TerminalSession

    var body: some View {
        VStack(spacing: 0) {
            // Terminal output
            TerminalOutputView(session: terminal)

            // Input bar
            TerminalInputBar(session: terminal)
        }
    }
}

class TerminalSession: ObservableObject {
    @Published var output: AttributedString = ""
    private let rpcClient: TheiaRPCClient
    private let terminalId: String

    init(rpcClient: TheiaRPCClient) {
        self.rpcClient = rpcClient
        self.terminalId = UUID().uuidString
    }

    func connect() async throws {
        // Create terminal on backend
        try await rpcClient.sendRequest(
            "terminal/create",
            params: ["id": terminalId, "rows": 24, "cols": 80]
        )

        // Listen for output
        rpcClient.registerHandler("terminal/\(terminalId)/data") { [weak self] params in
            guard let self = self,
                  let data = params.first as? String else { return }

            await MainActor.run {
                self.appendOutput(data)
            }
        }
    }

    func sendInput(_ text: String) async throws {
        try await rpcClient.sendNotification(
            "terminal/\(terminalId)/input",
            params: [text]
        )
    }
}
```

### 4.3 File System Integration

**iOS file system bridge**:

```swift
// examples/ios/TheiaIOS/Core/FileSystem/FileSystemBridge.swift

class IOSFileSystemProvider {
    private let rpcClient: TheiaRPCClient

    func registerFileSystemProvider() async throws {
        // Register iOS file system access
        try await rpcClient.sendRequest(
            "filesystem/registerProvider",
            params: ["scheme": "ios", "capabilities": capabilities]
        )

        // Handle file operations
        rpcClient.registerHandler("filesystem/ios/readFile") { params in
            try await self.readFile(uri: params[0] as! String)
        }

        rpcClient.registerHandler("filesystem/ios/writeFile") { params in
            try await self.writeFile(
                uri: params[0] as! String,
                content: params[1] as! Data
            )
        }

        // Register handlers for: readDirectory, createDirectory, delete, rename, etc.
    }

    private func readFile(uri: String) async throws -> Data {
        let url = try parseIOSUri(uri)
        return try Data(contentsOf: url)
    }

    // Integration with iOS Files app
    func presentDocumentPicker() -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(
            forOpeningContentTypes: [.item]
        )
        return picker
    }
}
```

### 4.4 State Persistence & Offline Support

**Implement robust state management**:

```swift
// examples/ios/TheiaIOS/Core/State/StatePersistence.swift

class WorkspaceStatePersistence {
    private let defaults = UserDefaults.standard
    private let fileManager = FileManager.default

    func saveWorkspaceState(_ state: WorkspaceState) async throws {
        let encoder = JSONEncoder()
        let data = try encoder.encode(state)

        // Save to UserDefaults for quick access
        defaults.set(data, forKey: "workspace_state_\(state.id)")

        // Also save to file for larger data
        let stateURL = try stateFileURL(for: state.id)
        try data.write(to: stateURL)
    }

    func loadWorkspaceState(id: String) async throws -> WorkspaceState? {
        // Try UserDefaults first
        if let data = defaults.data(forKey: "workspace_state_\(id)") {
            let decoder = JSONDecoder()
            return try decoder.decode(WorkspaceState.self, from: data)
        }

        // Fallback to file
        let stateURL = try stateFileURL(for: id)
        guard fileManager.fileExists(atPath: stateURL.path) else {
            return nil
        }

        let data = try Data(contentsOf: stateURL)
        let decoder = JSONDecoder()
        return try decoder.decode(WorkspaceState.self, from: data)
    }
}

struct WorkspaceState: Codable {
    let id: String
    let name: String
    let serverURL: URL
    let openFiles: [String]
    let editorLayout: EditorLayout
    let extensionStates: [String: Data]
    let lastModified: Date
}
```

## Phase 5: Testing & Polish (Months 13-15)

### 5.1 Testing Strategy

#### Unit Tests

```swift
// examples/ios/TheiaIOSTests/RPCClientTests.swift

class RPCClientTests: XCTestCase {
    var rpcClient: TheiaRPCClient!
    var mockWebSocket: MockWebSocketManager!

    override func setUp() {
        mockWebSocket = MockWebSocketManager()
        rpcClient = TheiaRPCClient(webSocket: mockWebSocket)
    }

    func testSendRequest() async throws {
        // Test RPC request/response cycle
        let expectation = XCTestExpectation(description: "RPC response")

        Task {
            let result: String = try await rpcClient.sendRequest(
                "test/method",
                params: ["arg1", "arg2"]
            )
            XCTAssertEqual(result, "expected_response")
            expectation.fulfill()
        }

        // Simulate response from server
        mockWebSocket.simulateReceive(message: """
            {"type": "response", "id": "...", "result": "expected_response"}
        """)

        await fulfillment(of: [expectation], timeout: 5.0)
    }
}
```

#### Integration Tests

```swift
// examples/ios/TheiaIOSTests/ExtensionIntegrationTests.swift

class ExtensionIntegrationTests: XCTestCase {
    func testLoadExtension() async throws {
        // Test loading a real extension
        let marketplace = ExtensionMarketplace()
        let url = try await marketplace.downloadExtension(
            id: "vscode.typescript-language-features",
            version: "latest"
        )

        let manager = ExtensionManager()
        try await manager.installExtension(from: url)

        let manifest = try await manager.getExtensionManifest(
            id: "vscode.typescript-language-features"
        )
        XCTAssertNotNil(manifest)
    }
}
```

#### UI Tests

```swift
// examples/ios/TheiaIOSUITests/EditorUITests.swift

class EditorUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        app = XCUIApplication()
        app.launch()
    }

    func testOpenFile() throws {
        // Navigate to file explorer
        app.buttons["Explorer"].tap()

        // Open a file
        app.tables.cells.firstMatch.tap()

        // Verify editor opens
        let editor = app.textViews["CodeEditor"]
        XCTAssertTrue(editor.exists)
        XCTAssertTrue(editor.isHittable)
    }

    func testExtensionContribution() throws {
        // Open command palette
        app.buttons["CommandPalette"].tap()

        // Search for extension-contributed command
        let searchField = app.searchFields.firstMatch
        searchField.tap()
        searchField.typeText("Extension Command")

        // Verify command appears
        let command = app.tables.cells.containing(.staticText, identifier: "Extension Command").firstMatch
        XCTAssertTrue(command.exists)
    }
}
```

### 5.2 Performance Optimization

#### Implement performance monitoring

```swift
// examples/ios/TheiaIOS/Core/Performance/PerformanceMonitor.swift

class PerformanceMonitor {
    static let shared = PerformanceMonitor()

    func measureRPCLatency(method: String) async -> TimeInterval {
        let start = Date()
        // Perform RPC call
        let end = Date()
        let latency = end.timeIntervalSince(start)

        // Log metrics
        logMetric(name: "rpc.latency", value: latency, tags: ["method": method])

        return latency
    }

    func measureExtensionActivation(extensionId: String) async -> TimeInterval {
        let start = Date()
        // Activate extension
        let end = Date()
        let duration = end.timeIntervalSince(start)

        logMetric(name: "extension.activation", value: duration, tags: ["id": extensionId])

        return duration
    }

    private func logMetric(name: String, value: Double, tags: [String: String]) {
        // Send to analytics service or local logging
        print("📊 \(name): \(value)s - \(tags)")
    }
}
```

### 5.3 Documentation

#### Create comprehensive docs

**Structure**:
```
docs/ios/
├── getting-started.md           # Setup and first run
├── architecture.md               # Architecture overview
├── extension-development.md      # Creating iOS extensions
├── api-reference.md              # API documentation
├── contributing.md               # Contribution guidelines
├── troubleshooting.md            # Common issues
└── examples/
    ├── simple-extension/         # Hello World extension
    ├── ui-contribution/          # UI extension example
    └── native-extension/         # Native Swift extension
```

## Repository Structure Changes

### New Directory Layout

```
theia/
├── packages/
│   ├── core-ios/                 # NEW: iOS backend support
│   ├── plugin-ext/
│   │   └── src/
│   │       └── ios/              # NEW: iOS plugin extensions
│   └── [existing packages...]
├── examples/
│   ├── ios/                      # NEW: iOS application
│   ├── browser/
│   ├── electron/
│   └── [existing examples...]
├── dev-packages/
│   └── ios-cli/                  # NEW: iOS development tools
├── doc/
│   └── ios/                      # NEW: iOS documentation
└── [existing files...]
```

## Development Workflow Integration

### npm Scripts

Add to root `package.json`:

```json
{
  "scripts": {
    "build:ios-backend": "lerna run compile --scope @theia/core-ios",
    "build:ios-app": "cd examples/ios && xcodebuild -project TheiaIOS.xcodeproj -scheme TheiaIOS -configuration Debug",
    "watch:ios-backend": "lerna run watch --scope @theia/core-ios",
    "test:ios-backend": "lerna run test --scope @theia/core-ios",
    "start:ios-backend": "cd examples/browser && npm run start -- --ios-support"
  }
}
```

### CI/CD Integration

Add GitHub Actions workflow:

```yaml
# .github/workflows/ios.yml

name: iOS Build

on:
  push:
    branches: [master, ios-development]
    paths:
      - 'packages/core-ios/**'
      - 'examples/ios/**'
  pull_request:
    paths:
      - 'packages/core-ios/**'
      - 'examples/ios/**'

jobs:
  build-ios-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build:ios-backend
      - run: npm run test:ios-backend

  build-ios-app:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Build iOS backend
        run: npm run build:ios-backend
      - name: Build iOS app
        run: |
          cd examples/ios
          xcodebuild -project TheiaIOS.xcodeproj \
            -scheme TheiaIOS \
            -configuration Debug \
            -sdk iphonesimulator \
            build
      - name: Run iOS tests
        run: |
          cd examples/ios
          xcodebuild test \
            -project TheiaIOS.xcodeproj \
            -scheme TheiaIOS \
            -destination 'platform=iOS Simulator,name=iPhone 15'
```

## Extension Development Guide

### Creating an iOS-Compatible Extension

#### Example: Custom View Extension

**Extension Structure**:
```
my-theia-extension/
├── package.json
├── src/
│   ├── extension.ts              # VS Code entry point
│   ├── ios/
│   │   ├── extension.swift       # iOS-specific code
│   │   └── Views/
│   │       └── CustomView.swift
│   └── common/
│       └── api.ts
└── ios/
    └── manifest.json             # iOS-specific manifest
```

**package.json**:
```json
{
  "name": "my-theia-extension",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.80.0",
    "theiaPlugin": "^1.65.0"
  },
  "activationEvents": [
    "onView:myCustomView"
  ],
  "contributes": {
    "views": {
      "explorer": [
        {
          "id": "myCustomView",
          "name": "My Custom View"
        }
      ]
    }
  },
  "main": "./dist/extension.js",
  "ios": {
    "runtime": "native",
    "main": "./ios/Extension.swift",
    "minVersion": "1.0.0"
  }
}
```

**Swift Implementation**:
```swift
// ios/Extension.swift

import TheiaIOSExtensionSDK

@objc(MyTheiaExtension)
class MyTheiaExtension: NSObject, TheiaExtension {
    func activate(context: ExtensionContext) async throws {
        // Register custom view
        try await context.window.registerTreeDataProvider(
            viewId: "myCustomView",
            provider: MyTreeDataProvider()
        )
    }
}

class MyTreeDataProvider: TreeDataProvider {
    func getChildren(element: TreeItem?) async throws -> [TreeItem] {
        if element == nil {
            // Root items
            return [
                TreeItem(label: "Item 1", collapsibleState: .collapsed),
                TreeItem(label: "Item 2", collapsibleState: .none)
            ]
        }
        return []
    }

    func getTreeItem(element: TreeItem) async throws -> TreeItem {
        return element
    }
}
```

## Migration Strategy for Existing Extensions

### Compatibility Matrix

| Extension Feature | Web/Electron | iOS Support | Notes |
|-------------------|--------------|-------------|-------|
| Commands | ✅ | ✅ | Full support |
| Views (Tree) | ✅ | ✅ | SwiftUI rendering |
| Webview | ✅ | ✅ | WKWebView wrapper |
| Text Editor | ✅ | ⚠️ | Limited features |
| Terminal | ✅ | ⚠️ | Read-only initially |
| File System | ✅ | ⚠️ | iOS sandbox restrictions |
| Debug | ✅ | ❌ | Not supported initially |
| Tasks | ✅ | ⚠️ | Backend execution only |
| Language Features | ✅ | ✅ | Via Language Server |

### Extension Testing Checklist

- [ ] Test extension loading on iOS
- [ ] Verify command contributions work
- [ ] Check view rendering (if applicable)
- [ ] Test webview content (if used)
- [ ] Verify file system operations respect iOS sandbox
- [ ] Check resource usage (memory, CPU)
- [ ] Test on different iOS versions
- [ ] Test on different device sizes (iPhone, iPad)

## Security Considerations

### iOS App Sandbox

1. **File System Access**
   - Limited to app container
   - User documents via Document Picker
   - iCloud Drive integration

2. **Network Access**
   - Require user approval for backend connections
   - Support certificate pinning
   - Implement TLS 1.3

3. **Extension Sandboxing**
   - Run extensions in isolated contexts
   - Limit system API access
   - Implement permission system

### Backend Authentication

```swift
// examples/ios/TheiaIOS/Core/Auth/AuthenticationManager.swift

class AuthenticationManager {
    func authenticate(serverURL: URL) async throws -> AuthToken {
        // Support multiple auth methods
        let method = try await detectAuthMethod(serverURL)

        switch method {
        case .oauth:
            return try await performOAuth(serverURL)
        case .token:
            return try await performTokenAuth(serverURL)
        case .certificate:
            return try await performCertAuth(serverURL)
        }
    }

    private func performOAuth(_ serverURL: URL) async throws -> AuthToken {
        // Use ASWebAuthenticationSession for OAuth
        // Store tokens in Keychain
    }
}
```

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1: Foundation | 3 months | Backend modules, iOS project, RPC protocol |
| Phase 2: Core UI | 3 months | SwiftUI components, extension host |
| Phase 3: Extension System | 3 months | Marketplace, API implementation |
| Phase 4: Advanced Features | 3 months | Editor, terminal, file system |
| Phase 5: Testing & Polish | 3 months | Tests, optimization, documentation |
| **Total** | **15 months** | Production-ready iOS client |

## Success Criteria

1. **Extension Compatibility**
   - 80% of top 50 VS Code extensions work on iOS
   - Extension marketplace integrated
   - Extension installation < 30 seconds

2. **Performance**
   - App launch < 3 seconds
   - Connection establishment < 2 seconds
   - RPC latency < 100ms
   - Smooth 60fps scrolling

3. **User Experience**
   - Intuitive touch-first interface
   - Gesture support for common actions
   - Keyboard support for external keyboards
   - iPad split-screen support

4. **Stability**
   - < 1% crash rate
   - Handles network interruptions gracefully
   - Proper memory management (< 200MB typical usage)

## Future Enhancements

### Post-MVP Features

1. **iPadOS Optimizations**
   - Multi-window support
   - Drag & drop between apps
   - Keyboard shortcuts overlay
   - Trackpad/mouse support

2. **Apple Pencil Integration**
   - Diagram drawing in markdown
   - Handwriting recognition
   - Markup tools for code review

3. **Offline Mode**
   - Local TypeScript compilation
   - Cached language servers
   - Offline extension updates

4. **Collaboration Features**
   - Live Share integration
   - Code review on mobile
   - Real-time collaboration

5. **watchOS Companion**
   - Build notifications
   - Quick commands
   - Code snippet viewer

## Conclusion

This plan provides a comprehensive roadmap for adding iOS support to Eclipse Theia. The phased approach ensures steady progress while maintaining quality and extensibility. The architecture leverages Theia's existing backend infrastructure while providing a native, performant iOS experience with full extension support.

Key differentiators:
- ✅ True native iOS app (not just webview wrapper)
- ✅ Full VS Code extension compatibility
- ✅ Extensible UI through extensions
- ✅ Leverages existing Theia backend
- ✅ Support for both JavaScript and native Swift extensions
- ✅ Integration with iOS ecosystem (Files app, share sheet, etc.)

This positions Theia as a unique offering in the mobile IDE space, bringing desktop-class extension support to iOS devices.
