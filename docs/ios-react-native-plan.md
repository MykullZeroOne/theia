# Theia iOS/Android Client - React Native Implementation Plan

## Executive Summary

This document outlines a comprehensive plan to add iOS and Android thin client applications to Eclipse Theia using **React Native**. This approach leverages Theia's existing TypeScript/React codebase, allowing significant code reuse while providing native mobile performance. The apps will connect to Theia's backend and support both VS Code and Theia extensions with an extensible UI architecture.

## Why React Native?

### Strategic Advantages

1. **Code Reuse**: Share 70-80% of code between web, iOS, and Android
2. **Existing Expertise**: Theia team already uses TypeScript and React
3. **Ecosystem**: Leverage existing React components and patterns
4. **Extension System**: Easier to adapt existing plugin system (already uses JavaScript)
5. **Faster Development**: ~40% faster than native development
6. **Dual Platform**: Get iOS **and** Android with one codebase
7. **Performance**: Near-native performance with Hermes engine
8. **Hot Reload**: Faster iteration during development

### Comparison with Native Swift

| Aspect | React Native | Native Swift/Kotlin |
|--------|--------------|---------------------|
| Code Reuse | 70-80% | 0% (separate codebases) |
| Development Speed | Fast | Slower |
| Platform Support | iOS + Android | iOS only (need separate Android) |
| Extension System | Direct integration | Requires bridges |
| Team Expertise | Existing (TS/React) | Need iOS/Android developers |
| Performance | Near-native (95%) | Native (100%) |
| UI Consistency | Shared components | Platform-specific |
| Maintenance | Single codebase | Multiple codebases |

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│         React Native Mobile App (iOS/Android)       │
│  ┌────────────────────────────────────────────────┐ │
│  │    Extension Runtime (JavaScript/TypeScript)   │ │
│  │  ┌──────────────┐    ┌───────────────────┐   │ │
│  │  │ UI Extension │    │ Service Extension │   │ │
│  │  │   Registry   │    │     Registry      │   │ │
│  │  └──────────────┘    └───────────────────┘   │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │   Shared Theia Components (TypeScript/React)  │ │
│  │  ┌──────┐ ┌────────┐ ┌─────────┐ ┌─────────┐ │ │
│  │  │Editor│ │Explorer│ │Terminal │ │Commands │ │ │
│  │  └──────┘ └────────┘ └─────────┘ └─────────┘ │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │      React Native Components (Platform UI)     │ │
│  │   - Touch-optimized    - Gesture handlers     │ │
│  │   - Native navigation  - Native modules       │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │      RPC Protocol Layer (msgpackr/JSON-RPC)   │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │   WebSocket Connection to Backend              │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│              Theia Backend (Node.js)                │
│  ┌────────────────────────────────────────────────┐ │
│  │    Mobile Frontend Adapter Module (New)        │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │         Existing Backend Services              │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Phase 1: Foundation & Setup (Months 1-2)

### 1.1 React Native Project Setup

#### Create Mobile App Structure

```
examples/mobile/
├── package.json
├── metro.config.js
├── babel.config.js
├── tsconfig.json
├── index.js                           # RN entry point
├── App.tsx                            # Root component
├── android/                           # Android native code
│   ├── app/
│   └── build.gradle
├── ios/                               # iOS native code
│   ├── TheiaMobile/
│   ├── TheiaMobile.xcodeproj/
│   └── Podfile
└── src/
    ├── mobile-main.tsx                # Mobile-specific entry
    ├── bootstrap/
    │   ├── mobile-app.tsx
    │   └── connection-setup.ts
    ├── navigation/
    │   ├── AppNavigator.tsx
    │   └── TabNavigator.tsx
    ├── screens/
    │   ├── WorkspaceScreen.tsx
    │   ├── EditorScreen.tsx
    │   ├── ExplorerScreen.tsx
    │   └── TerminalScreen.tsx
    ├── components/                    # Mobile-optimized components
    │   ├── Editor/
    │   ├── Explorer/
    │   ├── Terminal/
    │   └── common/
    ├── services/
    │   ├── connection/
    │   ├── state/
    │   └── extension/
    └── shared/                        # Shared with web/electron
        ├── plugin-api/                # From @theia/plugin-ext
        ├── core/                      # From @theia/core
        └── components/                # From @theia packages
```

#### package.json

```json
{
  "name": "@theia/mobile",
  "version": "1.65.0",
  "description": "Theia Mobile Client (React Native)",
  "main": "index.js",
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "build:android": "cd android && ./gradlew assembleRelease",
    "build:ios": "cd ios && xcodebuild -workspace TheiaMobile.xcworkspace -scheme TheiaMobile -configuration Release"
  },
  "dependencies": {
    "@theia/core": "1.65.0",
    "@theia/plugin-ext": "1.65.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "react-native-webview": "^13.6.0",
    "react-native-fs": "^2.20.0",
    "@react-native-community/netinfo": "^11.0.0",
    "react-native-gesture-handler": "^2.14.0",
    "react-native-reanimated": "^3.6.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "msgpackr": "^1.10.2",
    "react-native-code-editor": "^1.0.0"
  },
  "devDependencies": {
    "@react-native/metro-config": "^0.73.0",
    "@types/react": "^18.0.15",
    "@types/react-native": "^0.73.0",
    "typescript": "~5.4.5"
  }
}
```

### 1.2 Shared Code Extraction

#### Create `packages/core-mobile` Package

**Purpose**: Shared mobile infrastructure and platform-agnostic code

```typescript
// packages/core-mobile/src/common/mobile-protocol.ts

export namespace MobileRPC {
    export const CONTEXT = {
        MOBILE_MAIN: 'MOBILE_MAIN',
        MOBILE_EXT: 'MOBILE_EXT'
    };

    export interface MobileMainContext {
        // UI operations optimized for mobile
        $showTextDocument(uri: string, options?: MobileTextDocumentShowOptions): Promise<void>;
        $updateLayout(layout: MobileLayout): Promise<void>;
        $registerComponent(component: MobileComponentDescriptor): Promise<void>;
        $showToast(message: string, type: 'info' | 'warning' | 'error'): Promise<void>;
        $vibrate(pattern: number[]): Promise<void>;
        $requestPermission(permission: MobilePermission): Promise<boolean>;
    }

    export interface MobileExtContext {
        $onDidChangeTextDocument(uri: string, changes: TextDocumentContentChangeEvent[]): void;
        $onDidChangeOrientation(orientation: 'portrait' | 'landscape'): void;
        $onDidEnterBackground(): void;
        $onDidEnterForeground(): void;
        $executeCommand(command: string, ...args: any[]): Promise<any>;
    }

    export interface MobileLayout {
        orientation: 'portrait' | 'landscape';
        screenSize: { width: number; height: number };
        safeAreaInsets: { top: number; bottom: number; left: number; right: number };
        splitView?: {
            enabled: boolean;
            ratio: number;
        };
    }

    export interface MobileComponentDescriptor {
        id: string;
        type: 'view' | 'panel' | 'modal';
        contribution: {
            title: string;
            icon?: string;
            location: 'tab' | 'drawer' | 'floating';
        };
        renderer: 'react' | 'webview';
        component?: React.ComponentType;
        webviewOptions?: WebviewOptions;
    }

    export type MobilePermission =
        | 'camera'
        | 'photoLibrary'
        | 'location'
        | 'notifications'
        | 'microphone';
}
```

#### Mobile Frontend Module

```typescript
// packages/core-mobile/src/node/mobile-backend-module.ts

import { ContainerModule } from '@theia/core/shared/inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { MobileConnectionHandler } from './mobile-connection-handler';
import { MobileSessionManager } from './mobile-session-manager';

export default new ContainerModule(bind => {
    bind(MobileConnectionHandler).toSelf().inSingletonScope();
    bind(MobileSessionManager).toSelf().inSingletonScope();

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler('/services/mobile', () =>
            ctx.container.get(MobileConnectionHandler)
        )
    ).inSingletonScope();
});
```

```typescript
// packages/core-mobile/src/node/mobile-connection-handler.ts

import { injectable, inject } from '@theia/core/shared/inversify';
import { RpcProtocol } from '@theia/core/lib/common/message-rpc/rpc-protocol';
import { Channel } from '@theia/core/lib/common/message-rpc/channel';

@injectable()
export class MobileConnectionHandler {
    @inject(MobileSessionManager)
    protected readonly sessionManager: MobileSessionManager;

    async handleConnection(channel: Channel): Promise<void> {
        const protocol = new RpcProtocol(channel, this.createRequestHandler(), {
            // Use msgpackr for efficient mobile communication
            encoder: new MsgPackMessageEncoder(),
            decoder: new MsgPackMessageDecoder()
        });

        const session = await this.sessionManager.createSession(protocol);

        // Setup mobile-specific handlers
        this.setupMobileHandlers(protocol, session);
    }

    private createRequestHandler() {
        return async (method: string, args: any[]): Promise<any> => {
            // Handle mobile-specific requests
            switch (method) {
                case 'mobile/initialize':
                    return this.handleInitialize(args[0]);
                case 'mobile/requestCapabilities':
                    return this.handleCapabilities();
                default:
                    throw new Error(`Unknown method: ${method}`);
            }
        };
    }

    private async handleInitialize(options: MobileInitializeOptions) {
        return {
            serverCapabilities: {
                textDocumentSync: 2, // Incremental
                completionProvider: { triggerCharacters: ['.', ':', '<'] },
                hoverProvider: true,
                definitionProvider: true,
                // ... other capabilities
            },
            mobileCapabilities: {
                offlineMode: true,
                backgroundSync: true,
                gestureSupport: true,
                hapticFeedback: true
            }
        };
    }
}
```

### 1.3 Connection Management

#### WebSocket Manager for React Native

```typescript
// examples/mobile/src/services/connection/websocket-manager.ts

import { MsgPackMessageEncoder, MsgPackMessageDecoder } from '@theia/core/lib/common/message-rpc/rpc-message-encoder';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { Deferred } from '@theia/core/lib/common/promise-util';
import NetInfo from '@react-native-community/netinfo';

export class MobileWebSocketManager {
    private ws?: WebSocket;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 10;
    private readonly encoder = new MsgPackMessageEncoder();
    private readonly decoder = new MsgPackMessageDecoder();

    private readonly onMessageEmitter = new Emitter<Uint8Array>();
    private readonly onErrorEmitter = new Emitter<Error>();
    private readonly onCloseEmitter = new Emitter<void>();
    private readonly onConnectEmitter = new Emitter<void>();

    readonly onMessage: Event<Uint8Array> = this.onMessageEmitter.event;
    readonly onError: Event<Error> = this.onErrorEmitter.event;
    readonly onClose: Event<void> = this.onCloseEmitter.event;
    readonly onConnect: Event<void> = this.onConnectEmitter.event;

    constructor(private serverUrl: string) {
        this.setupNetworkListener();
    }

    async connect(): Promise<void> {
        const deferred = new Deferred<void>();

        try {
            this.ws = new WebSocket(this.serverUrl);
            this.ws.binaryType = 'arraybuffer';

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.onConnectEmitter.fire();
                deferred.resolve();
            };

            this.ws.onmessage = (event) => {
                const data = new Uint8Array(event.data);
                this.onMessageEmitter.fire(data);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.onErrorEmitter.fire(new Error('WebSocket error'));
                deferred.reject(error);
            };

            this.ws.onclose = () => {
                console.log('WebSocket closed');
                this.onCloseEmitter.fire();
                this.attemptReconnect();
            };

            // Timeout after 10 seconds
            setTimeout(() => {
                if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                    deferred.reject(new Error('Connection timeout'));
                }
            }, 10000);

        } catch (error) {
            deferred.reject(error);
        }

        return deferred.promise;
    }

    send(data: Uint8Array): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(data.buffer);
        } else {
            throw new Error('WebSocket is not connected');
        }
    }

    close(): void {
        this.ws?.close();
        this.ws = undefined;
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectAttempts++;

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.connect().catch(err => {
                console.error('Reconnection failed:', err);
            });
        }, delay);
    }

    private setupNetworkListener(): void {
        // Listen for network changes
        NetInfo.addEventListener(state => {
            if (state.isConnected && !this.ws) {
                console.log('Network restored, attempting to reconnect');
                this.connect().catch(err => {
                    console.error('Failed to reconnect after network restore:', err);
                });
            }
        });
    }
}
```

## Phase 2: Core UI Components (Months 3-5)

### 2.1 Adapt Existing Theia Components for Mobile

#### Mobile-Optimized Editor

```typescript
// examples/mobile/src/components/Editor/MobileEditorWidget.tsx

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { EditorWidget } from '@theia/editor/lib/browser/editor-widget';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';

interface MobileEditorWidgetProps {
    uri: string;
    content: string;
    language: string;
    onChange?: (content: string) => void;
    onSave?: () => void;
}

export const MobileEditorWidget: React.FC<MobileEditorWidgetProps> = ({
    uri,
    content,
    language,
    onChange,
    onSave
}) => {
    const [editorMode, setEditorMode] = useState<'simple' | 'monaco'>('simple');
    const webViewRef = useRef<WebView>(null);

    // For simple text files, use native text input
    if (editorMode === 'simple') {
        return (
            <SimpleTextEditor
                content={content}
                onChange={onChange}
                onSave={onSave}
                onUpgrade={() => setEditorMode('monaco')}
            />
        );
    }

    // For complex editing, use Monaco via WebView
    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{
                    html: generateMonacoHTML(content, language, uri)
                }}
                onMessage={(event) => {
                    const message = JSON.parse(event.nativeEvent.data);
                    handleMonacoMessage(message, onChange, onSave);
                }}
                style={styles.webview}
                javaScriptEnabled
                domStorageEnabled
            />
        </View>
    );
};

// Simple editor for basic text files
const SimpleTextEditor: React.FC<{
    content: string;
    onChange?: (content: string) => void;
    onSave?: () => void;
    onUpgrade: () => void;
}> = ({ content, onChange, onSave, onUpgrade }) => {
    const [text, setText] = useState(content);

    return (
        <View style={styles.container}>
            <View style={styles.toolbar}>
                <TouchableOpacity onPress={onSave}>
                    <Text>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onUpgrade}>
                    <Text>Full Editor</Text>
                </TouchableOpacity>
            </View>
            <TextInput
                style={styles.textInput}
                value={text}
                onChangeText={(newText) => {
                    setText(newText);
                    onChange?.(newText);
                }}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                fontFamily={Platform.select({ ios: 'Menlo', android: 'monospace' })}
            />
        </View>
    );
};

function generateMonacoHTML(content: string, language: string, uri: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        body { margin: 0; padding: 0; overflow: hidden; }
        #container { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <div id="container"></div>
    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"></script>
    <script>
        require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
        require(['vs/editor/editor.main'], function() {
            const editor = monaco.editor.create(document.getElementById('container'), {
                value: ${JSON.stringify(content)},
                language: ${JSON.stringify(language)},
                theme: 'vs-dark',
                fontSize: 14,
                minimap: { enabled: false },
                scrollbar: {
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10
                },
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                automaticLayout: true,
                // Mobile-friendly settings
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                tabCompletion: 'on',
                wordBasedSuggestions: true,
                parameterHints: { enabled: true }
            });

            // Send changes to React Native
            editor.onDidChangeModelContent(() => {
                const content = editor.getValue();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'contentChange',
                    content
                }));
            });

            // Listen for commands from React Native
            window.addEventListener('message', (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'setValue') {
                    editor.setValue(message.content);
                } else if (message.type === 'save') {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'save',
                        content: editor.getValue()
                    }));
                }
            });
        });
    </script>
</body>
</html>
    `;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e1e1e'
    },
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: '#2d2d2d'
    },
    webview: {
        flex: 1
    },
    textInput: {
        flex: 1,
        padding: 10,
        fontSize: 14,
        color: '#d4d4d4',
        backgroundColor: '#1e1e1e'
    }
});
```

#### Mobile File Explorer

```typescript
// examples/mobile/src/components/Explorer/MobileFileExplorer.tsx

import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileNode } from '@theia/filesystem/lib/browser/file-tree';
import Swipeable from 'react-native-gesture-handler/Swipeable';

interface MobileFileExplorerProps {
    fileService: FileService;
    rootUri: string;
    onFileSelect: (uri: string) => void;
}

export const MobileFileExplorer: React.FC<MobileFileExplorerProps> = ({
    fileService,
    rootUri,
    onFileSelect
}) => {
    const [files, setFiles] = useState<FileNode[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadFiles();
    }, [rootUri]);

    const loadFiles = async () => {
        // Load file tree from backend
        const stat = await fileService.resolve(rootUri);
        if (stat?.children) {
            setFiles(stat.children as FileNode[]);
        }
    };

    const toggleFolder = async (uri: string) => {
        const expanded = new Set(expandedFolders);
        if (expanded.has(uri)) {
            expanded.delete(uri);
        } else {
            expanded.add(uri);
            // Load children if not loaded
            const stat = await fileService.resolve(uri);
            // Update files with children...
        }
        setExpandedFolders(expanded);
    };

    const renderRightActions = (uri: string) => (
        <View style={styles.rightActions}>
            <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(uri)}
            >
                <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.actionButton, styles.renameButton]}
                onPress={() => handleRename(uri)}
            >
                <Text style={styles.actionText}>Rename</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <FlatList
            data={files}
            keyExtractor={(item) => item.uri}
            renderItem={({ item }) => (
                <Swipeable renderRightActions={() => renderRightActions(item.uri)}>
                    <TouchableOpacity
                        style={[
                            styles.fileItem,
                            { paddingLeft: 10 + (item.depth * 20) }
                        ]}
                        onPress={() => {
                            if (item.isDirectory) {
                                toggleFolder(item.uri);
                            } else {
                                onFileSelect(item.uri);
                            }
                        }}
                    >
                        <Text style={styles.fileName}>
                            {item.isDirectory ? '📁 ' : '📄 '}
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                </Swipeable>
            )}
        />
    );
};

const styles = StyleSheet.create({
    fileItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        backgroundColor: '#1e1e1e'
    },
    fileName: {
        color: '#d4d4d4',
        fontSize: 16
    },
    rightActions: {
        flexDirection: 'row'
    },
    actionButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 80
    },
    deleteButton: {
        backgroundColor: '#f44336'
    },
    renameButton: {
        backgroundColor: '#2196F3'
    },
    actionText: {
        color: 'white',
        fontWeight: 'bold'
    }
});
```

#### Mobile Terminal

```typescript
// examples/mobile/src/components/Terminal/MobileTerminal.tsx

import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, ScrollView, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TerminalService } from '@theia/terminal/lib/browser/base/terminal-service';

interface MobileTerminalProps {
    terminalService: TerminalService;
    terminalId: string;
}

export const MobileTerminal: React.FC<MobileTerminalProps> = ({
    terminalService,
    terminalId
}) => {
    const [output, setOutput] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        // Connect to terminal
        const terminal = terminalService.getById(terminalId);
        if (!terminal) return;

        // Listen for output
        const disposable = terminal.onData(data => {
            setOutput(prev => [...prev, data]);
            // Auto-scroll to bottom
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });

        return () => disposable.dispose();
    }, [terminalId]);

    const handleSubmit = () => {
        if (!input.trim()) return;

        // Send input to terminal
        const terminal = terminalService.getById(terminalId);
        terminal?.sendText(input + '\n');

        // Clear input
        setInput('');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
        >
            <ScrollView
                ref={scrollViewRef}
                style={styles.output}
                contentContainerStyle={styles.outputContent}
            >
                {output.map((line, index) => (
                    <Text key={index} style={styles.outputLine}>
                        {line}
                    </Text>
                ))}
            </ScrollView>

            <View style={styles.inputContainer}>
                <Text style={styles.prompt}>$</Text>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={handleSubmit}
                    returnKeyType="send"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Enter command..."
                    placeholderTextColor="#666"
                />
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000'
    },
    output: {
        flex: 1
    },
    outputContent: {
        padding: 10
    },
    outputLine: {
        color: '#0f0',
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
        fontSize: 12
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#333',
        padding: 10,
        backgroundColor: '#1a1a1a'
    },
    prompt: {
        color: '#0f0',
        marginRight: 10,
        fontSize: 16,
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' })
    },
    input: {
        flex: 1,
        color: '#0f0',
        fontSize: 14,
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
        padding: 5
    }
});
```

### 2.2 Navigation Structure

```typescript
// examples/mobile/src/navigation/AppNavigator.tsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

// Screens
import { WorkspaceScreen } from '../screens/WorkspaceScreen';
import { EditorScreen } from '../screens/EditorScreen';
import { ExplorerScreen } from '../screens/ExplorerScreen';
import { TerminalScreen } from '../screens/TerminalScreen';
import { ExtensionsScreen } from '../screens/ExtensionsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
    <Tab.Navigator
        screenOptions={{
            tabBarStyle: { backgroundColor: '#1e1e1e' },
            tabBarActiveTintColor: '#007acc',
            tabBarInactiveTintColor: '#888',
            headerStyle: { backgroundColor: '#2d2d2d' },
            headerTintColor: '#fff'
        }}
    >
        <Tab.Screen
            name="Explorer"
            component={ExplorerScreen}
            options={{
                tabBarIcon: ({ color }) => <Text style={{ color }}>📁</Text>
            }}
        />
        <Tab.Screen
            name="Editor"
            component={EditorScreen}
            options={{
                tabBarIcon: ({ color }) => <Text style={{ color }}>📝</Text>
            }}
        />
        <Tab.Screen
            name="Terminal"
            component={TerminalScreen}
            options={{
                tabBarIcon: ({ color }) => <Text style={{ color }}>⌨️</Text>
            }}
        />
        <Tab.Screen
            name="Extensions"
            component={ExtensionsScreen}
            options={{
                tabBarIcon: ({ color }) => <Text style={{ color }}>🧩</Text>
            }}
        />
    </Tab.Navigator>
);

export const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false
                }}
            >
                <Stack.Screen name="Workspace" component={WorkspaceScreen} />
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ headerShown: true }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
```

## Phase 3: Extension System (Months 6-8)

### 3.1 Extension Runtime for React Native

#### Extension Manager

```typescript
// examples/mobile/src/services/extension/ExtensionManager.ts

import { injectable, inject } from '@theia/core/shared/inversify';
import { PluginDeployer } from '@theia/plugin-ext/lib/common/plugin-protocol';
import { HostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import RNFS from 'react-native-fs';

@injectable()
export class MobileExtensionManager {
    @inject(PluginDeployer)
    protected readonly pluginDeployer: PluginDeployer;

    @inject(HostedPluginSupport)
    protected readonly hostedPluginSupport: HostedPluginSupport;

    private extensionsPath: string;

    constructor() {
        // Extensions stored in app's documents directory
        this.extensionsPath = `${RNFS.DocumentDirectoryPath}/extensions`;
        this.ensureExtensionsDirectory();
    }

    private async ensureExtensionsDirectory(): Promise<void> {
        const exists = await RNFS.exists(this.extensionsPath);
        if (!exists) {
            await RNFS.mkdir(this.extensionsPath);
        }
    }

    async installExtension(vsixUrl: string): Promise<string> {
        // Download VSIX
        const filename = vsixUrl.split('/').pop() || 'extension.vsix';
        const downloadPath = `${this.extensionsPath}/${filename}`;

        await RNFS.downloadFile({
            fromUrl: vsixUrl,
            toFile: downloadPath
        }).promise;

        // Extract VSIX (it's a ZIP file)
        const extractPath = `${this.extensionsPath}/${filename.replace('.vsix', '')}`;
        await this.extractVSIX(downloadPath, extractPath);

        // Parse package.json
        const manifestPath = `${extractPath}/extension/package.json`;
        const manifestContent = await RNFS.readFile(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);

        // Deploy extension
        await this.pluginDeployer.deploy('file://' + extractPath);

        return manifest.name;
    }

    async loadInstalledExtensions(): Promise<void> {
        const extensions = await RNFS.readDir(this.extensionsPath);

        for (const ext of extensions) {
            if (ext.isDirectory()) {
                try {
                    await this.pluginDeployer.deploy('file://' + ext.path);
                } catch (error) {
                    console.error(`Failed to load extension ${ext.name}:`, error);
                }
            }
        }
    }

    async uninstallExtension(extensionId: string): Promise<void> {
        const extensionPath = `${this.extensionsPath}/${extensionId}`;
        await RNFS.unlink(extensionPath);
    }

    private async extractVSIX(vsixPath: string, targetPath: string): Promise<void> {
        // Use native module or JS library to extract ZIP
        // For simplicity, assuming a helper function
        await unzipFile(vsixPath, targetPath);
    }
}
```

### 3.2 Extension API Bridge

**Reuse existing plugin-ext infrastructure with mobile-specific adaptations**:

```typescript
// packages/core-mobile/src/browser/mobile-plugin-ext-frontend-module.ts

import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { HostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import { MobilePluginSupport } from './mobile-plugin-support';
import { MobileMainPluginApiProvider } from './mobile-main-plugin-api-provider';
import { MAIN_RPC_CONTEXT } from '@theia/plugin-ext/lib/common/plugin-api-rpc';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // Replace hosted plugin support with mobile version
    bind(MobilePluginSupport).toSelf().inSingletonScope();
    rebind(HostedPluginSupport).toService(MobilePluginSupport);
    bind(FrontendApplicationContribution).toService(MobilePluginSupport);

    // Register mobile-specific Main API providers
    bind(MobileMainPluginApiProvider).toSelf().inSingletonScope();
    bind(MAIN_RPC_CONTEXT.MOBILE_MAIN).toService(MobileMainPluginApiProvider);
});
```

```typescript
// packages/core-mobile/src/browser/mobile-main-plugin-api-provider.ts

import { injectable } from '@theia/core/shared/inversify';
import { RPCProtocol } from '@theia/core/lib/common/message-rpc/rpc-protocol';
import { Vibration, PermissionsAndroid, Platform } from 'react-native';
import { MobileRPC } from '../common/mobile-protocol';

@injectable()
export class MobileMainPluginApiProvider implements MobileRPC.MobileMainContext {
    private rpcProtocol: RPCProtocol;

    setRPCProtocol(protocol: RPCProtocol): void {
        this.rpcProtocol = protocol;
    }

    async $showToast(message: string, type: 'info' | 'warning' | 'error'): Promise<void> {
        // Use React Native's Toast or custom implementation
        if (Platform.OS === 'android') {
            const { ToastAndroid } = require('react-native');
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            // iOS toast implementation
            // Could use Alert or custom toast component
        }
    }

    async $vibrate(pattern: number[]): Promise<void> {
        Vibration.vibrate(pattern);
    }

    async $requestPermission(permission: MobileRPC.MobilePermission): Promise<boolean> {
        if (Platform.OS === 'android') {
            const androidPermission = this.mapToAndroidPermission(permission);
            const granted = await PermissionsAndroid.request(androidPermission);
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
            // iOS permission handling
            // Would use react-native-permissions or similar
            return false;
        }
    }

    async $registerComponent(component: MobileRPC.MobileComponentDescriptor): Promise<void> {
        // Register component in mobile UI registry
        // Extensions can contribute custom views
        console.log('Registering mobile component:', component.id);
    }

    // ... other mobile-specific implementations
}
```

### 3.3 Extension Marketplace Integration

```typescript
// examples/mobile/src/screens/ExtensionsScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SearchBar } from 'react-native-elements';

interface Extension {
    id: string;
    name: string;
    displayName: string;
    description: string;
    version: string;
    publisher: string;
    downloadUrl: string;
    installed: boolean;
}

export const ExtensionsScreen: React.FC = () => {
    const [extensions, setExtensions] = useState<Extension[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const searchExtensions = async (query: string) => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://open-vsx.org/api/-/search?query=${encodeURIComponent(query)}&size=50`
            );
            const data = await response.json();

            const exts: Extension[] = data.extensions.map((ext: any) => ({
                id: `${ext.namespace}.${ext.name}`,
                name: ext.name,
                displayName: ext.displayName || ext.name,
                description: ext.description,
                version: ext.version,
                publisher: ext.namespace,
                downloadUrl: ext.files.download,
                installed: false // Check against installed extensions
            }));

            setExtensions(exts);
        } catch (error) {
            console.error('Failed to search extensions:', error);
        } finally {
            setLoading(false);
        }
    };

    const installExtension = async (extension: Extension) => {
        try {
            // Install via ExtensionManager
            const extensionManager = getExtensionManager();
            await extensionManager.installExtension(extension.downloadUrl);

            // Update UI
            setExtensions(prev =>
                prev.map(ext =>
                    ext.id === extension.id ? { ...ext, installed: true } : ext
                )
            );
        } catch (error) {
            console.error('Failed to install extension:', error);
            alert(`Failed to install ${extension.displayName}`);
        }
    };

    return (
        <View style={styles.container}>
            <SearchBar
                placeholder="Search extensions..."
                onChangeText={setSearchQuery}
                onSubmitEditing={() => searchExtensions(searchQuery)}
                value={searchQuery}
                platform="default"
                containerStyle={styles.searchContainer}
                inputContainerStyle={styles.searchInput}
            />

            {loading ? (
                <ActivityIndicator size="large" color="#007acc" style={styles.loading} />
            ) : (
                <FlatList
                    data={extensions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.extensionItem}>
                            <View style={styles.extensionInfo}>
                                <Text style={styles.extensionName}>{item.displayName}</Text>
                                <Text style={styles.extensionPublisher}>{item.publisher}</Text>
                                <Text style={styles.extensionDescription} numberOfLines={2}>
                                    {item.description}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.installButton,
                                    item.installed && styles.installedButton
                                ]}
                                onPress={() => installExtension(item)}
                                disabled={item.installed}
                            >
                                <Text style={styles.buttonText}>
                                    {item.installed ? 'Installed' : 'Install'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e1e1e'
    },
    searchContainer: {
        backgroundColor: '#2d2d2d',
        borderTopWidth: 0,
        borderBottomWidth: 0
    },
    searchInput: {
        backgroundColor: '#3c3c3c'
    },
    loading: {
        flex: 1,
        justifyContent: 'center'
    },
    extensionItem: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        alignItems: 'center'
    },
    extensionInfo: {
        flex: 1,
        marginRight: 10
    },
    extensionName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    extensionPublisher: {
        color: '#888',
        fontSize: 14,
        marginTop: 2
    },
    extensionDescription: {
        color: '#aaa',
        fontSize: 12,
        marginTop: 5
    },
    installButton: {
        backgroundColor: '#007acc',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5
    },
    installedButton: {
        backgroundColor: '#555'
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold'
    }
});
```

## Phase 4: Platform-Specific Features (Months 9-11)

### 4.1 iOS-Specific Features

```typescript
// examples/mobile/src/platform/ios/IOSNativeModule.ts

import { NativeModules } from 'react-native';

const { TheiaIOSBridge } = NativeModules;

export class IOSFeatures {
    // Share Sheet
    static async shareFile(filePath: string): Promise<void> {
        return TheiaIOSBridge.shareFile(filePath);
    }

    // Files App Integration
    static async openInFiles(filePath: string): Promise<void> {
        return TheiaIOSBridge.openInFiles(filePath);
    }

    // Shortcuts Integration
    static async registerShortcut(shortcut: {
        id: string;
        title: string;
        subtitle?: string;
    }): Promise<void> {
        return TheiaIOSBridge.registerShortcut(shortcut);
    }

    // Handoff Support
    static async setupHandoff(activity: {
        type: string;
        title: string;
        webpageURL?: string;
        userInfo: Record<string, any>;
    }): Promise<void> {
        return TheiaIOSBridge.setupHandoff(activity);
    }
}
```

**Native iOS Bridge** (Objective-C/Swift):

```swift
// ios/TheiaMobile/TheiaIOSBridge.swift

import Foundation
import UIKit

@objc(TheiaIOSBridge)
class TheiaIOSBridge: NSObject {
    @objc
    func shareFile(_ filePath: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        guard let url = URL(string: filePath) else {
            rejecter("INVALID_PATH", "Invalid file path", nil)
            return
        }

        DispatchQueue.main.async {
            let activityVC = UIActivityViewController(
                activityItems: [url],
                applicationActivities: nil
            )

            if let rootVC = UIApplication.shared.keyWindow?.rootViewController {
                rootVC.present(activityVC, animated: true) {
                    resolver(nil)
                }
            }
        }
    }

    @objc
    func registerShortcut(_ shortcut: NSDictionary, resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
        guard let id = shortcut["id"] as? String,
              let title = shortcut["title"] as? String else {
            rejecter("INVALID_SHORTCUT", "Invalid shortcut data", nil)
            return
        }

        let shortcutItem = UIApplicationShortcutItem(
            type: id,
            localizedTitle: title,
            localizedSubtitle: shortcut["subtitle"] as? String,
            icon: nil,
            userInfo: nil
        )

        UIApplication.shared.shortcutItems = [shortcutItem]
        resolver(nil)
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
```

### 4.2 Android-Specific Features

```typescript
// examples/mobile/src/platform/android/AndroidNativeModule.ts

import { NativeModules } from 'react-native';

const { TheiaAndroidBridge } = NativeModules;

export class AndroidFeatures {
    // App Shortcuts
    static async addShortcut(shortcut: {
        id: string;
        label: string;
        icon: string;
        action: string;
    }): Promise<void> {
        return TheiaAndroidBridge.addShortcut(shortcut);
    }

    // File Provider
    static async shareFile(filePath: string): Promise<void> {
        return TheiaAndroidBridge.shareFile(filePath);
    }

    // Recent Files
    static async addToRecents(file: {
        path: string;
        mimeType: string;
        displayName: string;
    }): Promise<void> {
        return TheiaAndroidBridge.addToRecents(file);
    }
}
```

## Phase 5: Testing & Release (Months 12-15)

### 5.1 Testing Strategy

```typescript
// examples/mobile/__tests__/integration/connection.test.ts

import { MobileWebSocketManager } from '../../src/services/connection/websocket-manager';

describe('WebSocket Connection', () => {
    let wsManager: MobileWebSocketManager;

    beforeEach(() => {
        wsManager = new MobileWebSocketManager('ws://localhost:3000');
    });

    afterEach(() => {
        wsManager.close();
    });

    test('should connect to server', async () => {
        const connected = await wsManager.connect();
        expect(wsManager.isConnected()).toBe(true);
    });

    test('should handle reconnection on disconnect', async () => {
        await wsManager.connect();

        // Simulate disconnection
        wsManager.close();

        // Should attempt reconnection
        await new Promise(resolve => setTimeout(resolve, 2000));
        expect(wsManager.isConnected()).toBe(true);
    });

    test('should send and receive messages', async () => {
        await wsManager.connect();

        const receivedMessages: any[] = [];
        wsManager.onMessage(msg => receivedMessages.push(msg));

        wsManager.send({ type: 'test', data: 'hello' });

        await new Promise(resolve => setTimeout(resolve, 100));
        expect(receivedMessages.length).toBeGreaterThan(0);
    });
});
```

### 5.2 Performance Optimization

```typescript
// examples/mobile/src/performance/PerformanceMonitor.ts

import { performance } from 'react-native-performance';

export class MobilePerformanceMonitor {
    private metrics: Map<string, number[]> = new Map();

    measureRender(componentName: string): () => void {
        const start = performance.now();

        return () => {
            const end = performance.now();
            const duration = end - start;
            this.recordMetric(`render.${componentName}`, duration);

            if (duration > 16.67) { // > 1 frame at 60fps
                console.warn(`Slow render in ${componentName}: ${duration.toFixed(2)}ms`);
            }
        };
    }

    measureRPC(method: string): () => void {
        const start = performance.now();

        return () => {
            const end = performance.now();
            const duration = end - start;
            this.recordMetric(`rpc.${method}`, duration);

            if (duration > 100) {
                console.warn(`Slow RPC call ${method}: ${duration.toFixed(2)}ms`);
            }
        };
    }

    private recordMetric(name: string, value: number): void {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name)!.push(value);
    }

    getMetrics(name: string): { avg: number; min: number; max: number; p95: number } {
        const values = this.metrics.get(name) || [];
        if (values.length === 0) {
            return { avg: 0, min: 0, max: 0, p95: 0 };
        }

        const sorted = [...values].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);

        return {
            avg: sum / values.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            p95: sorted[Math.floor(sorted.length * 0.95)]
        };
    }
}
```

## Repository Structure

```
theia/
├── packages/
│   ├── core-mobile/                   # NEW: Mobile-specific core
│   │   ├── src/
│   │   │   ├── common/
│   │   │   │   ├── mobile-protocol.ts
│   │   │   │   └── mobile-types.ts
│   │   │   ├── node/
│   │   │   │   ├── mobile-backend-module.ts
│   │   │   │   ├── mobile-connection-handler.ts
│   │   │   │   └── mobile-session-manager.ts
│   │   │   └── browser/
│   │   │       ├── mobile-frontend-module.ts
│   │   │       └── mobile-plugin-support.ts
│   │   └── package.json
│   ├── plugin-ext-mobile/             # NEW: Mobile plugin extensions
│   └── [existing packages...]
├── examples/
│   ├── mobile/                        # NEW: React Native app
│   │   ├── android/
│   │   ├── ios/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   ├── services/
│   │   │   ├── navigation/
│   │   │   └── shared/               # Shared with web/electron
│   │   ├── package.json
│   │   └── metro.config.js
│   ├── browser/
│   ├── electron/
│   └── [existing examples...]
└── [existing structure...]
```

## Development Workflow

### npm Scripts (root package.json)

```json
{
  "scripts": {
    "mobile:install": "cd examples/mobile && npm install",
    "mobile:start": "cd examples/mobile && npm start",
    "mobile:android": "cd examples/mobile && npm run android",
    "mobile:ios": "cd examples/mobile && npm run ios",
    "mobile:build:android": "cd examples/mobile && npm run build:android",
    "mobile:build:ios": "cd examples/mobile && npm run build:ios",
    "mobile:test": "cd examples/mobile && npm test",
    "build:mobile-backend": "lerna run compile --scope @theia/core-mobile"
  }
}
```

## Timeline & Milestones

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Foundation** | 2 months | ✅ RN project setup<br>✅ WebSocket connection<br>✅ Basic RPC protocol |
| **Phase 2: Core UI** | 3 months | ✅ Editor component<br>✅ File explorer<br>✅ Terminal<br>✅ Navigation |
| **Phase 3: Extensions** | 3 months | ✅ Extension manager<br>✅ Marketplace integration<br>✅ Plugin API bridge |
| **Phase 4: Platform Features** | 3 months | ✅ iOS/Android specific features<br>✅ Native modules<br>✅ OS integration |
| **Phase 5: Testing & Release** | 4 months | ✅ Testing suite<br>✅ Performance optimization<br>✅ Documentation<br>✅ App store submission |
| **Total** | **15 months** | Production-ready mobile apps |

## Advantages of React Native Approach

### 1. **Code Reuse** (70-80%)
- Shared TypeScript/React code
- Reuse existing Theia components
- Single extension system

### 2. **Developer Experience**
- Existing Theia team expertise
- Faster development cycle
- Hot reload during development

### 3. **Dual Platform**
- iOS + Android from one codebase
- Shared UI components
- Consistent UX across platforms

### 4. **Extension Ecosystem**
- Direct JS/TS extension support
- No translation layer needed
- Easier for extension developers

### 5. **Maintenance**
- Single mobile codebase
- Shared bug fixes
- Unified feature development

## Comparison: React Native vs Native

| Factor | React Native | Native (Swift/Kotlin) |
|--------|--------------|----------------------|
| **Development Time** | 15 months | 24+ months (12 per platform) |
| **Team Required** | 3-4 developers | 6-8 developers (3-4 per platform) |
| **Code Sharing** | 70-80% | 0% (separate codebases) |
| **Maintenance Effort** | Low (one codebase) | High (two codebases) |
| **Extension Support** | Native (JS/TS) | Requires bridges |
| **Performance** | 95% of native | 100% native |
| **Platform Support** | iOS + Android | iOS OR Android |
| **Existing Expertise** | ✅ Full | ❌ Need to hire |
| **Future Updates** | Synchronized | Separate timelines |

## Success Criteria

1. **Performance**
   - App launch < 3 seconds
   - 60fps UI rendering
   - RPC latency < 100ms
   - Memory < 250MB typical

2. **Extension Compatibility**
   - 90% of top 100 VS Code extensions work
   - Extension installation < 30 seconds
   - Support for webview extensions

3. **User Experience**
   - Touch-optimized UI
   - Gesture support
   - Keyboard support (external)
   - Split-screen (iPad/Android tablets)

4. **Stability**
   - < 1% crash rate
   - Graceful network handling
   - Proper state persistence
   - Background task support

## Conclusion

**Recommendation: Use React Native**

The React Native approach is strongly recommended for Theia's mobile client because:

1. ✅ **Leverages existing expertise**: Theia team knows TypeScript and React
2. ✅ **Maximizes code reuse**: 70-80% shared code reduces development time
3. ✅ **Dual platform**: Get iOS AND Android, not just iOS
4. ✅ **Faster to market**: ~15 months vs 24+ months for native
5. ✅ **Easier maintenance**: One codebase instead of two
6. ✅ **Extension ecosystem**: Direct JavaScript/TypeScript support
7. ✅ **Cost effective**: Requires fewer developers
8. ✅ **Near-native performance**: 95% of native is sufficient for an IDE

The only scenario where native would be better is if absolute peak performance is required, but for a thin client IDE, React Native provides more than adequate performance while offering significant development and maintenance advantages.
