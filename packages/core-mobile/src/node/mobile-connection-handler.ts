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

import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { RpcProtocol } from '@theia/core/lib/common/message-rpc/rpc-protocol';
import { Channel } from '@theia/core/lib/common/message-rpc/channel';
import { MsgPackMessageEncoder, MsgPackMessageDecoder } from '@theia/core/lib/common/message-rpc/rpc-message-encoder';
import { Disposable, DisposableCollection, Emitter, Event } from '@theia/core/lib/common';

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
    protocol: RpcProtocol;
    createdAt: Date;
}

@injectable()
export class MobileConnectionHandler {
    protected readonly connections = new Map<string, MobileConnection>();
    protected readonly disposables = new Map<string, DisposableCollection>();
    protected readonly onErrorEmitter = new Emitter<Error>();

    readonly onError: Event<Error> = this.onErrorEmitter.event;

    @postConstruct()
    protected init(): void {
        // Initialization logic if needed
    }

    async handleConnection(channel: Channel): Promise<void> {
        const connectionId = this.generateConnectionId();
        const disposables = new DisposableCollection();

        try {
            const protocol = new RpcProtocol(channel, this.createRequestHandler(), {
                encoder: new MsgPackMessageEncoder(),
                decoder: new MsgPackMessageDecoder()
            });

            const connection: MobileConnection = {
                id: connectionId,
                protocol,
                createdAt: new Date()
            };

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

    dispose(): void {
        this.disposables.forEach(disposables => disposables.dispose());
        this.disposables.clear();
        this.connections.clear();
        this.onErrorEmitter.dispose();
    }
}
