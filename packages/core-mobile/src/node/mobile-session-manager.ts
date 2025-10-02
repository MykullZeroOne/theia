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
import { Channel, Disposable } from './mobile-connection-handler';
import { LanguageProfileManager } from './language-profile-manager';

export interface MobileSessionState {
    workspace?: string;
    openFiles: string[];
    activeFile?: string;
    cursorPosition?: {
        line: number;
        column: number;
    };
    [key: string]: any;
}

export interface MobileClientInfo {
    name: string;
    version: string;
    platform?: string;
}

export interface MobileSession {
    id: string;
    channel: Channel;
    state: MobileSessionState;
    createdAt: Date;
    lastActivityAt: Date;
    clientInfo?: MobileClientInfo;
}

interface PersistedSession {
    id: string;
    state: MobileSessionState;
    destroyedAt: Date;
    clientInfo?: MobileClientInfo;
}

@injectable()
export class MobileSessionManager implements Disposable {
    private activeSessions = new Map<string, MobileSession>();
    private persistedSessions = new Map<string, PersistedSession>();

    // Session expiration: 24 hours after destroy
    private readonly SESSION_EXPIRATION_MS = 24 * 60 * 60 * 1000;

    @inject(LanguageProfileManager)
    protected profileManager?: LanguageProfileManager;

    @postConstruct()
    protected init(): void {
        // Initialization logic if needed
    }

    async createSession(channel: Channel, clientInfo?: MobileClientInfo): Promise<MobileSession> {
        const sessionId = this.generateSessionId();
        const now = new Date();

        const session: MobileSession = {
            id: sessionId,
            channel,
            state: {
                openFiles: []
            },
            createdAt: now,
            lastActivityAt: now,
            clientInfo
        };

        this.activeSessions.set(sessionId, session);

        return session;
    }

    getSession(sessionId: string): MobileSession | undefined {
        return this.activeSessions.get(sessionId);
    }

    getAllSessions(): MobileSession[] {
        return Array.from(this.activeSessions.values());
    }

    async saveSessionState(sessionId: string, state: MobileSessionState): Promise<void> {
        const session = this.activeSessions.get(sessionId);
        
        if (session) {
            // Update active session
            session.state = state;
            session.lastActivityAt = new Date();
        }

        // Also update persisted session if it exists
        const persisted = this.persistedSessions.get(sessionId);
        if (persisted) {
            persisted.state = state;
        }
    }

    async getSessionState(sessionId: string): Promise<MobileSessionState | undefined> {
        // Check active sessions first
        const activeSession = this.activeSessions.get(sessionId);
        if (activeSession) {
            return activeSession.state;
        }

        // Check persisted sessions
        const persistedSession = this.persistedSessions.get(sessionId);
        if (persistedSession) {
            return persistedSession.state;
        }

        return undefined;
    }

    async restoreSession(sessionId: string, channel: Channel): Promise<MobileSession | undefined> {
        const persisted = this.persistedSessions.get(sessionId);
        
        if (!persisted) {
            return undefined;
        }

        const now = new Date();
        const restoredSession: MobileSession = {
            id: sessionId,
            channel,
            state: persisted.state,
            createdAt: now, // New connection time
            lastActivityAt: now,
            clientInfo: persisted.clientInfo
        };

        this.activeSessions.set(sessionId, restoredSession);

        return restoredSession;
    }

    async destroySession(sessionId: string): Promise<void> {
        const session = this.activeSessions.get(sessionId);
        
        if (session) {
            // Persist session state for potential restoration
            const persisted: PersistedSession = {
                id: session.id,
                state: session.state,
                destroyedAt: new Date(),
                clientInfo: session.clientInfo
            };

            this.persistedSessions.set(sessionId, persisted);
            this.activeSessions.delete(sessionId);
        }
    }

    async cleanupExpiredSessions(): Promise<void> {
        const now = Date.now();
        const expiredIds: string[] = [];

        for (const [id, persisted] of this.persistedSessions.entries()) {
            const age = now - persisted.destroyedAt.getTime();
            if (age > this.SESSION_EXPIRATION_MS) {
                expiredIds.push(id);
            }
        }

        // Remove expired sessions
        for (const id of expiredIds) {
            this.persistedSessions.delete(id);
        }
    }

    dispose(): void {
        this.activeSessions.clear();
        this.persistedSessions.clear();
    }

    private generateSessionId(): string {
        return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
}
