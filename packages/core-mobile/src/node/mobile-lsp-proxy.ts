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

import { MobileSession } from './mobile-session-manager';
import { MobileRPC } from '../common/mobile-protocol';
import { Disposable } from './mobile-connection-handler';

/**
 * LSP Proxy service that bridges Language Server Protocol events
 * between the backend (Theia/VS Code extensions) and mobile clients.
 *
 * Forwards LSP events (diagnostics, completions, hover, etc.) to mobile
 * and handles LSP requests from mobile clients.
 */
export class MobileLSPProxy implements Disposable {
    protected disposables: Disposable[] = [];
    protected session?: MobileSession;
    protected disposed = false;

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
     * Forward diagnostics (errors, warnings) to mobile client.
     * @param uri Document URI
     * @param diagnostics List of diagnostics
     * @returns true if forwarded successfully, false if disposed
     */
    async forwardDiagnostics(uri: string, diagnostics: MobileRPC.Diagnostic[]): Promise<boolean> {
        if (this.disposed || !this.session) {
            return false;
        }

        try {
            // In future: send via session.channel
            // For now, just validate that we can process the data
            if (!uri || typeof uri !== 'string') {
                return false;
            }

            // Validate diagnostics
            if (!Array.isArray(diagnostics)) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error forwarding diagnostics:', error);
            return false;
        }
    }

    /**
     * Handle completion request from mobile client.
     * @param uri Document URI
     * @param position Cursor position
     * @returns Completion list
     */
    async handleCompletionRequest(uri: string, position: MobileRPC.Position): Promise<MobileRPC.CompletionList> {
        if (this.disposed || !this.session) {
            return { isIncomplete: false, items: [] };
        }

        try {
            // Validate inputs
            if (!uri || typeof uri !== 'string' || uri.length === 0) {
                return { isIncomplete: false, items: [] };
            }

            if (!position || typeof position.line !== 'number' || typeof position.character !== 'number') {
                return { isIncomplete: false, items: [] };
            }

            // In future: delegate to language service
            // For now: return empty list
            return { isIncomplete: false, items: [] };
        } catch (error) {
            console.error('Error handling completion request:', error);
            return { isIncomplete: false, items: [] };
        }
    }

    /**
     * Handle hover request from mobile client.
     * @param uri Document URI
     * @param position Cursor position
     * @returns Hover information or null
     */
    async handleHoverRequest(uri: string, position: MobileRPC.Position): Promise<MobileRPC.Hover | null> {
        if (this.disposed || !this.session) {
            return null;
        }

        try {
            // Validate inputs
            if (!uri || typeof uri !== 'string' || uri.length === 0) {
                return null;
            }

            if (!position || typeof position.line !== 'number' || typeof position.character !== 'number') {
                return null;
            }

            // In future: delegate to language service
            return null;
        } catch (error) {
            console.error('Error handling hover request:', error);
            return null;
        }
    }

    /**
     * Handle definition request from mobile client.
     * @param uri Document URI
     * @param position Cursor position
     * @returns Array of definition locations
     */
    async handleDefinitionRequest(uri: string, position: MobileRPC.Position): Promise<MobileRPC.Location[]> {
        if (this.disposed || !this.session) {
            return [];
        }

        try {
            // Validate inputs
            if (!uri || typeof uri !== 'string' || uri.length === 0) {
                return [];
            }

            if (!position || typeof position.line !== 'number' || typeof position.character !== 'number') {
                return [];
            }

            // In future: delegate to language service
            return [];
        } catch (error) {
            console.error('Error handling definition request:', error);
            return [];
        }
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
