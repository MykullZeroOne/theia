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

import { ContainerModule } from '@theia/core/shared/inversify';
import { MobileConnectionHandler } from './mobile-connection-handler';
import { MobileSessionManager } from './mobile-session-manager';
import { MobileLSPProxy } from './mobile-lsp-proxy';

/**
 * Inversify module for mobile backend services.
 *
 * Binds:
 * - MobileConnectionHandler: Manages WebSocket connections from mobile clients
 * - MobileSessionManager: Manages session lifecycle and state persistence
 * - MobileLSPProxy: Bridges Language Server Protocol between backend and mobile
 *
 * All services are bound in singleton scope for efficient resource management.
 */
export const MobileBackendModule = new ContainerModule(bind => {
    bind(MobileConnectionHandler).toSelf().inSingletonScope();
    bind(MobileSessionManager).toSelf().inSingletonScope();
    bind(MobileLSPProxy).toSelf().inSingletonScope();
});
