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

import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { MobileSessionManager } from './mobile-session-manager';
import { MobileLSPProxy } from './mobile-lsp-proxy';
import { LanguageProfileManager } from './language-profile-manager';

// Minimal type definitions for testing - will be replaced with actual @theia/core imports
// when the full project is built
export interface Disposable {
    dispose(): void;
}

export class DisposableCollection implements Disposable {
    protected readonly disposables: Disposable[] = [];

    push(disposable: Disposable): Disposable {
        this.disposables.push(disposable);
        return disposable;
    }

    dispose(): void {
        while (this.disposables.length > 0) {
            this.disposables.pop()!.dispose();
        }
    }
}

export interface Event<T> {
    (listener: (e: T) => any): Disposable;
}

export class Emitter<T> {
    private listeners: Array<(e: T) => any> = [];

    get event(): Event<T> {
        return (listener: (e: T) => any) => {
            this.listeners.push(listener);
            return {
                dispose: () => {
                    const index = this.listeners.indexOf(listener);
                    if (index !== -1) {
                        this.listeners.splice(index, 1);
                    }
                }
            };
        };
    }

    fire(event: T): void {
        this.listeners.forEach(listener => listener(event));
    }

    dispose(): void {
        this.listeners = [];
    }
}

export interface Channel {
    onMessage(handler: (data: Uint8Array) => void): Disposable;
    onClose(handler: () => void): Disposable;
    onError(handler: (reason: any) => void): Disposable;
    send(data: Uint8Array): void;
    close(): void;
}

export interface MobileInitializeOptions {
    clientInfo: {
        name: string;
        version: string;
    };
    capabilities: Record<string, any>;
}

export interface MobileCapabilities {
    offlineMode: boolean;
    backgroundSync: boolean;
    gestureSupport: boolean;
    hapticFeedback: boolean;
}

export interface MobileConnection {
    id: string;
    channel: Channel;
    createdAt: Date;
}

@injectable()
export class MobileConnectionHandler {
    protected readonly connections = new Map<string, MobileConnection>();
    protected readonly disposables = new Map<string, DisposableCollection>();
    protected readonly onErrorEmitter = new Emitter<Error>();

    readonly onError: Event<Error> = this.onErrorEmitter.event;

    @inject(MobileSessionManager)
    protected sessionManager?: MobileSessionManager;

    @inject(MobileLSPProxy)
    protected lspProxy?: MobileLSPProxy;

    @inject(LanguageProfileManager)
    protected profileManager?: LanguageProfileManager;

    @postConstruct()
    protected init(): void {
        // Initialization logic if needed
    }

    async handleConnection(channel: Channel): Promise<void> {
        const connectionId = this.generateConnectionId();
        const disposables = new DisposableCollection();

        try {
            const connection: MobileConnection = {
                id: connectionId,
                channel,
                createdAt: new Date()
            };

            // Create session for this connection (if session manager available)
            if (this.sessionManager) {
                const session = await this.sessionManager.createSession(channel);

                // Attach LSP proxy to session (if LSP proxy available)
                if (this.lspProxy) {
                    await this.lspProxy.attach(session);

                    // Ensure LSP proxy is disposed when connection closes
                    disposables.push({
                        dispose: () => {
                            this.lspProxy?.dispose();
                        }
                    });
                }
            }

            disposables.push(channel.onClose(() => {
                this.cleanupConnection(connectionId);
            }));

            disposables.push(channel.onError((error: any) => {
                this.onErrorEmitter.fire(error instanceof Error ? error : new Error(String(error)));
            }));

            this.connections.set(connectionId, connection);
            this.disposables.set(connectionId, disposables);
        } catch (error) {
            disposables.dispose();
            throw error;
        }
    }

    getActiveConnections(): MobileConnection[] {
        return Array.from(this.connections.values());
    }

    async handleRequest(method: string, args: any[]): Promise<any> {
        return this.createRequestHandler()(method, args);
    }

    protected createRequestHandler() {
        return async (method: string, args: any[]): Promise<any> => {
            if (!method || method.length === 0) {
                throw new Error('Method name is required');
            }

            switch (method) {
                case 'mobile/initialize':
                    return this.handleInitialize(args[0]);
                case 'mobile/requestCapabilities':
                    return this.handleCapabilities();
                case '$getAvailableProfiles':
                    return this.handleGetAvailableProfiles();
                case '$getActiveProfile':
                    return this.handleGetActiveProfile();
                case '$switchProfile':
                    return this.handleSwitchProfile(args[0]);
                default:
                    throw new Error(`Unknown method: ${method}`);
            }
        };
    }

    protected async handleInitialize(options: MobileInitializeOptions): Promise<{
        serverCapabilities: any;
        mobileCapabilities: MobileCapabilities;
    }> {
        if (!options || !options.clientInfo) {
            throw new Error('Invalid initialize options');
        }

        return {
            serverCapabilities: {
                textDocumentSync: 2, // Incremental
                completionProvider: { triggerCharacters: ['.', ':', '<'] },
                hoverProvider: true,
                definitionProvider: true,
                documentSymbolProvider: true,
                workspaceSymbolProvider: true,
                referencesProvider: true,
                documentFormattingProvider: true
            },
            mobileCapabilities: {
                offlineMode: true,
                backgroundSync: true,
                gestureSupport: true,
                hapticFeedback: true
            }
        };
    }

    protected async handleCapabilities(): Promise<MobileCapabilities> {
        return {
            offlineMode: true,
            backgroundSync: true,
            gestureSupport: true,
            hapticFeedback: true
        };
    }

    protected cleanupConnection(connectionId: string): void {
        const disposables = this.disposables.get(connectionId);
        if (disposables) {
            disposables.dispose();
            this.disposables.delete(connectionId);
        }
        this.connections.delete(connectionId);
    }

    protected generateConnectionId(): string {
        return `mobile-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Handle $getAvailableProfiles RPC method
     */
    protected handleGetAvailableProfiles() {
        if (!this.profileManager) {
            throw new Error('Profile manager not available');
        }
        return this.profileManager.getAvailableProfiles();
    }

    /**
     * Handle $getActiveProfile RPC method
     */
    protected handleGetActiveProfile() {
        if (!this.profileManager) {
            throw new Error('Profile manager not available');
        }
        return this.profileManager.getActiveProfile();
    }

    /**
     * Handle $switchProfile RPC method
     */
    protected async handleSwitchProfile(request: any) {
        if (!this.profileManager) {
            throw new Error('Profile manager not available');
        }
        await this.profileManager.switchProfile(request);
    }

    dispose(): void {
        this.disposables.forEach(disposables => disposables.dispose());
        this.disposables.clear();
        this.connections.clear();
        this.onErrorEmitter.dispose();
    }
}
