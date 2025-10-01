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

import { Channel, Disposable, DisposableCollection } from '@theia/core/lib/common';

export class MockChannel implements Channel {
    private messageHandlers: ((data: Uint8Array) => void)[] = [];
    private closeHandlers: (() => void)[] = [];
    private errorHandlers: ((reason: any) => void)[] = [];
    private sentMessages: Uint8Array[] = [];
    private closed = false;

    onMessage(handler: (data: Uint8Array) => void): Disposable {
        this.messageHandlers.push(handler);
        return {
            dispose: () => {
                const index = this.messageHandlers.indexOf(handler);
                if (index !== -1) {
                    this.messageHandlers.splice(index, 1);
                }
            }
        };
    }

    onClose(handler: () => void): Disposable {
        this.closeHandlers.push(handler);
        return {
            dispose: () => {
                const index = this.closeHandlers.indexOf(handler);
                if (index !== -1) {
                    this.closeHandlers.splice(index, 1);
                }
            }
        };
    }

    onError(handler: (reason: any) => void): Disposable {
        this.errorHandlers.push(handler);
        return {
            dispose: () => {
                const index = this.errorHandlers.indexOf(handler);
                if (index !== -1) {
                    this.errorHandlers.splice(index, 1);
                }
            }
        };
    }

    send(data: Uint8Array): void {
        if (this.closed) {
            throw new Error('Channel is closed');
        }
        this.sentMessages.push(data);
    }

    close(): void {
        if (!this.closed) {
            this.closed = true;
            this.closeHandlers.forEach(handler => handler());
        }
    }

    // Test helper methods
    simulateMessage(data: Uint8Array): void {
        this.messageHandlers.forEach(handler => handler(data));
    }

    simulateError(reason: any): void {
        this.errorHandlers.forEach(handler => handler(reason));
    }

    getSentMessages(): Uint8Array[] {
        return [...this.sentMessages];
    }

    isClosed(): boolean {
        return this.closed;
    }

    getLastSentMessage(): Uint8Array | undefined {
        return this.sentMessages[this.sentMessages.length - 1];
    }
}
