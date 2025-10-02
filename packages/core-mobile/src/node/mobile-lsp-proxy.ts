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

import { injectable, inject } from '@theia/core/shared/inversify';
import { MobileSession } from './mobile-session-manager';
import { MobileRPC } from '../common/mobile-protocol';
import { Disposable } from './mobile-connection-handler';
import { LanguageProfileManager } from './language-profile-manager';
import { LanguageDetector } from './language-detector';

/**
 * LSP Proxy service that bridges Language Server Protocol events
 * between the backend (Theia/VS Code extensions) and mobile clients.
 *
 * Forwards LSP events (diagnostics, completions, hover, etc.) to mobile
 * and handles LSP requests from mobile clients.
 *
 * Filters LSP requests based on the active language profile to ensure
 * only languages in the active profile are processed.
 */
@injectable()
export class MobileLSPProxy implements Disposable {
    protected disposables: Disposable[] = [];
    protected session?: MobileSession;
    protected disposed = false;

    @inject(LanguageProfileManager)
    protected readonly profileManager!: LanguageProfileManager;

    @inject(LanguageDetector)
    protected readonly languageDetector!: LanguageDetector;

    /**
     * Attach LSP proxy to a mobile session.
     * Sets up event listeners and request handlers.
     */
    async attach(session: MobileSession): Promise<void> {
        // Dispose previous attachments
        this.dispose();

        this.session = session;
        this.disposed = false;

        // LSP event forwarding will be implemented in future iterations
        // when we integrate with Theia's language services
    }

    /**
     * Check if a file should be processed based on active language profile.
     * @param uri Document URI
     * @returns true if file's language is in the active profile
     * @throws Error if file's language is not in active profile
     */
    protected shouldProcessFile(uri: string): boolean {
        // Detect language from file extension
        const languageId = this.languageDetector.detectLanguage(uri);

        // If language cannot be detected, don't process
        if (!languageId) {
            throw new Error(`Cannot detect language for file: ${uri}`);
        }

        // Check if language is active in current profile
        const isActive = this.profileManager.isLanguageActive(languageId);

        if (!isActive) {
            throw new Error(
                `Language '${languageId}' is not active in the current profile. ` +
                `Please switch to a profile that includes this language.`
            );
        }

        return true;
    }

    /**
     * Forward diagnostics (errors, warnings) to mobile client.
     * Filters diagnostics based on active language profile.
     * @param uri Document URI
     * @param diagnostics List of diagnostics
     * @returns true if forwarded successfully, false if disposed or filtered
     */
    async forwardDiagnostics(uri: string, diagnostics: MobileRPC.Diagnostic[]): Promise<boolean> {
        if (this.disposed || !this.session) {
            return false;
        }

        try {
            // Validate inputs
            if (!uri || typeof uri !== 'string') {
                return false;
            }

            if (!Array.isArray(diagnostics)) {
                return false;
            }

            // Check if file should be processed based on active profile
            if (!this.shouldProcessFile(uri)) {
                return false;
            }

            // In future: send via session.channel
            // For now, just validate that we can process the data
            return true;
        } catch (error) {
            // If filtering fails (language not active), return false but don't log error
            if (error instanceof Error && error.message.includes('not active')) {
                return false;
            }
            console.error('Error forwarding diagnostics:', error);
            return false;
        }
    }

    /**
     * Handle completion request from mobile client.
     * Filters requests based on active language profile.
     * @param uri Document URI
     * @param position Cursor position
     * @returns Completion list
     * @throws Error if file's language is not in active profile
     */
    async handleCompletionRequest(uri: string, position: MobileRPC.Position): Promise<MobileRPC.CompletionList> {
        if (this.disposed || !this.session) {
            return { isIncomplete: false, items: [] };
        }

        // Validate inputs
        if (!uri || typeof uri !== 'string' || uri.length === 0) {
            throw new Error('Invalid URI');
        }

        if (!position || typeof position.line !== 'number' || typeof position.character !== 'number') {
            throw new Error('Invalid position');
        }

        // Check if file should be processed based on active profile
        this.shouldProcessFile(uri);

        // In future: delegate to language service
        // For now: return empty list
        return { isIncomplete: false, items: [] };
    }

    /**
     * Handle hover request from mobile client.
     * Filters requests based on active language profile.
     * @param uri Document URI
     * @param position Cursor position
     * @returns Hover information or null
     * @throws Error if file's language is not in active profile
     */
    async handleHoverRequest(uri: string, position: MobileRPC.Position): Promise<MobileRPC.Hover | null> {
        if (this.disposed || !this.session) {
            return null;
        }

        // Validate inputs
        if (!uri || typeof uri !== 'string' || uri.length === 0) {
            throw new Error('Invalid URI');
        }

        if (!position || typeof position.line !== 'number' || typeof position.character !== 'number') {
            throw new Error('Invalid position');
        }

        // Check if file should be processed based on active profile
        this.shouldProcessFile(uri);

        // In future: delegate to language service
        return null;
    }

    /**
     * Handle definition request from mobile client.
     * Filters requests based on active language profile.
     * @param uri Document URI
     * @param position Cursor position
     * @returns Array of definition locations
     * @throws Error if file's language is not in active profile
     */
    async handleDefinitionRequest(uri: string, position: MobileRPC.Position): Promise<MobileRPC.Location[]> {
        if (this.disposed || !this.session) {
            return [];
        }

        // Validate inputs
        if (!uri || typeof uri !== 'string' || uri.length === 0) {
            throw new Error('Invalid URI');
        }

        if (!position || typeof position.line !== 'number' || typeof position.character !== 'number') {
            throw new Error('Invalid position');
        }

        // Check if file should be processed based on active profile
        this.shouldProcessFile(uri);

        // In future: delegate to language service
        return [];
    }

    /**
     * Handle code actions request from mobile client.
     * @param uri Document URI
     * @param range Text range
     * @param context Code action context (diagnostics, etc.)
     * @returns Array of code actions
     */
    async handleCodeActionsRequest(
        uri: string,
        range: MobileRPC.Range,
        context: MobileRPC.CodeActionContext
    ): Promise<MobileRPC.CodeAction[]> {
        if (this.disposed || !this.session) {
            return [];
        }

        try {
            // Validate inputs
            if (!uri || typeof uri !== 'string' || uri.length === 0) {
                return [];
            }

            if (!range || !range.start || !range.end) {
                return [];
            }

            // In future: delegate to language service
            return [];
        } catch (error) {
            console.error('Error handling code actions request:', error);
            return [];
        }
    }

    /**
     * Handle formatting request from mobile client.
     * @param uri Document URI
     * @param options Formatting options (tab size, spaces, etc.)
     * @returns Array of text edits
     */
    async handleFormattingRequest(uri: string, options: MobileRPC.FormattingOptions): Promise<MobileRPC.TextEdit[]> {
        if (this.disposed || !this.session) {
            return [];
        }

        try {
            // Validate inputs
            if (!uri || typeof uri !== 'string' || uri.length === 0) {
                return [];
            }

            if (!options || typeof options.tabSize !== 'number') {
                return [];
            }

            // In future: delegate to language service
            return [];
        } catch (error) {
            console.error('Error handling formatting request:', error);
            return [];
        }
    }

    /**
     * Handle text document change notification from mobile client.
     * @param uri Document URI
     * @param changes Array of text changes
     */
    async handleTextDocumentChange(uri: string, changes: any[]): Promise<void> {
        if (this.disposed || !this.session) {
            return;
        }

        try {
            // Validate inputs
            if (!uri || typeof uri !== 'string' || uri.length === 0) {
                return;
            }

            if (!Array.isArray(changes)) {
                return;
            }

            // In future: notify language servers of changes
        } catch (error) {
            console.error('Error handling text document change:', error);
        }
    }

    /**
     * Dispose the LSP proxy and clean up resources.
     */
    dispose(): void {
        if (this.disposed) {
            return;
        }

        this.disposed = true;

        // Dispose all event subscriptions
        this.disposables.forEach(d => {
            try {
                d.dispose();
            } catch (error) {
                console.error('Error disposing LSP proxy handler:', error);
            }
        });

        this.disposables = [];
        this.session = undefined;
    }
}
