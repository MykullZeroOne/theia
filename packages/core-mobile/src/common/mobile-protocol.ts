// *****************************************************************************
// Copyright (C) 2024 EclipseSource and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

export namespace MobileRPC {
    export const CONTEXT = {
        MOBILE_MAIN: 'MOBILE_MAIN',
        MOBILE_EXT: 'MOBILE_EXT'
    };

    export interface MobileMainContext {
        $showTextDocument(uri: string, options?: MobileTextDocumentShowOptions): Promise<void>;
        $updateLayout(layout: MobileLayout): Promise<void>;
        $registerComponent(component: MobileComponentDescriptor): Promise<void>;
        $showToast(message: string, type: 'info' | 'warning' | 'error'): Promise<void>;
        $vibrate(pattern: number[]): Promise<void>;
        $requestPermission(permission: MobilePermission): Promise<boolean>;

        // LSP: Backend → Mobile events
        /** Show diagnostics (errors, warnings) for a document */
        $showDiagnostics(uri: string, diagnostics: Diagnostic[]): Promise<void>;
        /** Show completion items at cursor position */
        $showCompletions(completions: CompletionList): Promise<void>;
        /** Show hover information */
        $showHover(hover: Hover | null): Promise<void>;
        /** Show code actions (quick fixes) */
        $showCodeActions(actions: CodeAction[]): Promise<void>;
        /** Apply workspace edit (refactoring) */
        $applyWorkspaceEdit(edit: WorkspaceEdit): Promise<boolean>;
    }

    export interface MobileExtContext {
        $onDidChangeTextDocument(uri: string, changes: TextDocumentContentChangeEvent[]): void;
        $onDidChangeOrientation(orientation: 'portrait' | 'landscape'): void;
        $onDidEnterBackground(): void;
        $onDidEnterForeground(): void;
        $executeCommand(command: string, ...args: any[]): Promise<any>;

        // LSP: Mobile → Backend requests
        /** Request completions at position */
        $requestCompletion(uri: string, position: Position): Promise<CompletionList>;
        /** Request hover info at position */
        $requestHover(uri: string, position: Position): Promise<Hover | null>;
        /** Request definition locations */
        $requestDefinition(uri: string, position: Position): Promise<Location[]>;
        /** Request code actions at range */
        $requestCodeActions(uri: string, range: Range, context: CodeActionContext): Promise<CodeAction[]>;
        /** Request document formatting */
        $requestFormatting(uri: string, options: FormattingOptions): Promise<TextEdit[]>;
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
        component?: any;
        webviewOptions?: any;
    }

    export type MobilePermission =
        | 'camera'
        | 'photoLibrary'
        | 'location'
        | 'notifications'
        | 'microphone';

    export interface MobileTextDocumentShowOptions {
        selection?: { start: number; end: number };
        preserveFocus?: boolean;
        preview?: boolean;
    }

    export interface TextDocumentContentChangeEvent {
        range?: { start: number; end: number };
        rangeLength?: number;
        text: string;
    }

    // ========================================================================
    // LSP Protocol Types
    // ========================================================================

    /** Position in a text document expressed as zero-based line and character offset */
    export interface Position {
        /** Line position in a document (zero-based) */
        line: number;
        /** Character offset on a line in a document (zero-based) */
        character: number;
    }

    /** A range in a text document expressed as (zero-based) start and end positions */
    export interface Range {
        /** The range's start position */
        start: Position;
        /** The range's end position */
        end: Position;
    }

    /** Represents a diagnostic, such as a compiler error or warning */
    export interface Diagnostic {
        /** The range at which the message applies */
        range: Range;
        /** The diagnostic's severity */
        severity?: DiagnosticSeverity;
        /** The diagnostic's code, which might appear in the user interface */
        code?: string | number;
        /** A human-readable string describing the source of this diagnostic */
        source?: string;
        /** The diagnostic's message */
        message: string;
        /** An array of related diagnostic information */
        relatedInformation?: DiagnosticRelatedInformation[];
        /** Additional metadata about the diagnostic */
        tags?: DiagnosticTag[];
    }

    /** The diagnostic's severity */
    export enum DiagnosticSeverity {
        /** Reports an error */
        Error = 1,
        /** Reports a warning */
        Warning = 2,
        /** Reports an information */
        Information = 3,
        /** Reports a hint */
        Hint = 4
    }

    /** Additional metadata about the diagnostic */
    export enum DiagnosticTag {
        /** Unused or unnecessary code */
        Unnecessary = 1,
        /** Deprecated or obsolete code */
        Deprecated = 2
    }

    /** Represents a related message and source code location for a diagnostic */
    export interface DiagnosticRelatedInformation {
        /** The location of this related diagnostic information */
        location: Location;
        /** The message of this related diagnostic information */
        message: string;
    }

    /** Represents a location inside a resource */
    export interface Location {
        uri: string;
        range: Range;
    }

    /** Represents a collection of completion items */
    export interface CompletionList {
        /** This list is not complete. Further typing should result in recomputing this list */
        isIncomplete: boolean;
        /** The completion items */
        items: CompletionItem[];
    }

    /** A completion item represents a text snippet that is proposed to complete text */
    export interface CompletionItem {
        /** The label of this completion item */
        label: string;
        /** The kind of this completion item */
        kind?: CompletionItemKind;
        /** A human-readable string with additional information */
        detail?: string;
        /** A human-readable string that represents a doc-comment */
        documentation?: string | MarkupContent;
        /** A string that should be inserted into a document when selecting this completion */
        insertText?: string;
        /** A string that is used when filtering a set of completion items */
        filterText?: string;
        /** A string that is used when comparing this item with other items */
        sortText?: string;
    }

    /** The kind of a completion entry */
    export enum CompletionItemKind {
        Text = 1,
        Method = 2,
        Function = 3,
        Constructor = 4,
        Field = 5,
        Variable = 6,
        Class = 7,
        Interface = 8,
        Module = 9,
        Property = 10,
        Unit = 11,
        Value = 12,
        Enum = 13,
        Keyword = 14,
        Snippet = 15,
        Color = 16,
        File = 17,
        Reference = 18,
        Folder = 19,
        EnumMember = 20,
        Constant = 21,
        Struct = 22,
        Event = 23,
        Operator = 24,
        TypeParameter = 25
    }

    /** The result of a hover request */
    export interface Hover {
        /** The hover's content */
        contents: string | MarkupContent;
        /** An optional range */
        range?: Range;
    }

    /** A `MarkupContent` literal represents a string value with a markup kind */
    export interface MarkupContent {
        /** The type of the Markup */
        kind: 'plaintext' | 'markdown';
        /** The content itself */
        value: string;
    }

    /** A code action represents a change that can be performed in code */
    export interface CodeAction {
        /** A short, human-readable, title for this code action */
        title: string;
        /** The kind of the code action */
        kind?: string;
        /** The diagnostics that this code action resolves */
        diagnostics?: Diagnostic[];
        /** The workspace edit this code action performs */
        edit?: WorkspaceEdit;
        /** A command this code action executes */
        command?: Command;
    }

    /** A workspace edit represents changes to many resources managed in the workspace */
    export interface WorkspaceEdit {
        /** Holds changes to existing resources */
        changes?: { [uri: string]: TextEdit[] };
    }

    /** A textual edit applicable to a text document */
    export interface TextEdit {
        /** The range of the text document to be manipulated */
        range: Range;
        /** The string to be inserted */
        newText: string;
    }

    /** Represents a reference to a command */
    export interface Command {
        /** Title of the command */
        title: string;
        /** The identifier of the actual command handler */
        command: string;
        /** Arguments that the command handler should be invoked with */
        arguments?: any[];
    }

    /** Contains additional information about the context in which a code action is run */
    export interface CodeActionContext {
        /** An array of diagnostics */
        diagnostics: Diagnostic[];
        /** Requested kind of actions to return */
        only?: string[];
    }

    /** Value-object describing what options formatting should use */
    export interface FormattingOptions {
        /** Size of a tab in spaces */
        tabSize: number;
        /** Prefer spaces over tabs */
        insertSpaces: boolean;
        /** Signature for further properties */
        [key: string]: boolean | number | string;
    }

    // ==========================================
    // Language Stack Profiles
    // ==========================================

    /**
     * Configuration for a single programming language
     * Includes LSP server info, Tree-sitter grammar, and download details
     */
    export interface LanguageConfig {
        /** Unique language identifier (e.g., 'java', 'typescript') */
        id: string;
        /** Display name */
        name: string;
        /** File extensions for this language */
        extensions: string[];
        /** LSP server identifier */
        lspServer: string;
        /** Tree-sitter grammar identifier */
        treeSitterGrammar: string;
        /** Download URL for LSP server package */
        downloadUrl: string;
        /** Package size in bytes */
        size: number;
    }

    /**
     * A curated collection of languages for a specific development stack
     * (e.g., "Java Full Stack" = Java + SQL + JS + HTML + CSS)
     */
    export interface LanguageStackProfile {
        /** Unique profile identifier */
        id: string;
        /** Display name */
        name: string;
        /** Description of what this profile includes */
        description: string;
        /** Languages included in this profile */
        languages: LanguageConfig[];
        /** Total estimated download size in bytes */
        estimatedSize: number;
        /** Icon identifier */
        icon: string;
    }

    /**
     * Request to switch to a different language stack profile
     */
    export interface ProfileSwitchRequest {
        /** ID of profile to switch to */
        profileId: string;
    }

    /**
     * Progress update during profile switching
     */
    export interface ProfileSwitchProgress {
        /** Current phase of the switch process */
        phase: 'downloading' | 'installing' | 'unloading' | 'complete' | 'error';
        /** Language currently being processed */
        languageId: string;
        /** Progress percentage (0-100) */
        percent: number;
        /** Bytes downloaded so far */
        downloadedBytes: number;
        /** Total bytes to download */
        totalBytes: number;
        /** Error message (if phase is 'error') */
        error?: string;
    }

    /**
     * Information about the currently active profile
     */
    export interface ActiveProfileInfo {
        /** Active profile ID */
        profileId: string;
        /** Languages currently installed */
        installedLanguages: string[];
        /** Total installed size in bytes */
        totalSize: number;
        /** Timestamp of last profile switch */
        lastSwitched: number;
    }

    /**
     * Predefined language stack profiles
     */
    export namespace LanguageProfiles {
        export const JAVA_FULL_STACK: LanguageStackProfile = {
            id: 'java-fullstack',
            name: 'Java Full Stack',
            description: 'Backend Java, SQL, Frontend JS/HTML/CSS',
            languages: [
                {
                    id: 'java',
                    name: 'Java',
                    extensions: ['java'],
                    lspServer: 'eclipse.jdt.ls',
                    treeSitterGrammar: 'tree-sitter-java',
                    downloadUrl: 'https://cdn.theia.io/lsp/java-lsp-v1.0.0.zip',
                    size: 45_000_000 // 45MB
                },
                {
                    id: 'sql',
                    name: 'SQL',
                    extensions: ['sql'],
                    lspServer: 'sql-language-server',
                    treeSitterGrammar: 'tree-sitter-sql',
                    downloadUrl: 'https://cdn.theia.io/lsp/sql-lsp-v1.0.0.zip',
                    size: 5_000_000 // 5MB
                },
                {
                    id: 'javascript',
                    name: 'JavaScript',
                    extensions: ['js', 'jsx'],
                    lspServer: 'typescript-language-server',
                    treeSitterGrammar: 'tree-sitter-javascript',
                    downloadUrl: 'https://cdn.theia.io/lsp/ts-lsp-v1.0.0.zip',
                    size: 20_000_000 // 20MB
                },
                {
                    id: 'html',
                    name: 'HTML',
                    extensions: ['html', 'htm'],
                    lspServer: 'vscode-html-languageserver',
                    treeSitterGrammar: 'tree-sitter-html',
                    downloadUrl: 'https://cdn.theia.io/lsp/html-lsp-v1.0.0.zip',
                    size: 5_000_000 // 5MB
                },
                {
                    id: 'css',
                    name: 'CSS',
                    extensions: ['css', 'scss', 'sass'],
                    lspServer: 'vscode-css-languageserver',
                    treeSitterGrammar: 'tree-sitter-css',
                    downloadUrl: 'https://cdn.theia.io/lsp/css-lsp-v1.0.0.zip',
                    size: 5_000_000 // 5MB
                }
            ],
            estimatedSize: 80_000_000, // 80MB
            icon: 'java-icon'
        };

        export const DOTNET_FULL_STACK: LanguageStackProfile = {
            id: 'dotnet-fullstack',
            name: '.NET Full Stack',
            description: 'C# backend, SQL, TypeScript/HTML/CSS frontend',
            languages: [
                {
                    id: 'csharp',
                    name: 'C#',
                    extensions: ['cs'],
                    lspServer: 'omnisharp',
                    treeSitterGrammar: 'tree-sitter-c-sharp',
                    downloadUrl: 'https://cdn.theia.io/lsp/omnisharp-v1.0.0.zip',
                    size: 50_000_000 // 50MB
                },
                {
                    id: 'sql',
                    name: 'SQL',
                    extensions: ['sql'],
                    lspServer: 'sql-language-server',
                    treeSitterGrammar: 'tree-sitter-sql',
                    downloadUrl: 'https://cdn.theia.io/lsp/sql-lsp-v1.0.0.zip',
                    size: 5_000_000
                },
                {
                    id: 'typescript',
                    name: 'TypeScript',
                    extensions: ['ts', 'tsx'],
                    lspServer: 'typescript-language-server',
                    treeSitterGrammar: 'tree-sitter-typescript',
                    downloadUrl: 'https://cdn.theia.io/lsp/ts-lsp-v1.0.0.zip',
                    size: 20_000_000
                }
            ],
            estimatedSize: 75_000_000,
            icon: 'dotnet-icon'
        };

        export const MOBILE_DEV: LanguageStackProfile = {
            id: 'mobile-dev',
            name: 'Mobile Development',
            description: 'Kotlin for Android, Swift for iOS',
            languages: [
                {
                    id: 'kotlin',
                    name: 'Kotlin',
                    extensions: ['kt', 'kts'],
                    lspServer: 'kotlin-language-server',
                    treeSitterGrammar: 'tree-sitter-kotlin',
                    downloadUrl: 'https://cdn.theia.io/lsp/kotlin-lsp-v1.0.0.zip',
                    size: 30_000_000
                },
                {
                    id: 'swift',
                    name: 'Swift',
                    extensions: ['swift'],
                    lspServer: 'sourcekit-lsp',
                    treeSitterGrammar: 'tree-sitter-swift',
                    downloadUrl: 'https://cdn.theia.io/lsp/swift-lsp-v1.0.0.zip',
                    size: 25_000_000
                }
            ],
            estimatedSize: 55_000_000,
            icon: 'mobile-icon'
        };

        export const ALL_PROFILES = [
            JAVA_FULL_STACK,
            DOTNET_FULL_STACK,
            MOBILE_DEV
        ];

        export function findById(id: string): LanguageStackProfile | undefined {
            return ALL_PROFILES.find(p => p.id === id);
        }
    }
}
