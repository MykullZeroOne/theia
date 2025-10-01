# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eclipse Theia is an extensible framework to develop full-fledged multi-language Cloud & Desktop IDEs and tools. This is a monorepo managed with Lerna that contains the core Theia platform, extensions, and example applications.

## Prerequisites

- Node.js >= 20 and < 24
- Python3 (for node-gyp)
- Platform-specific build tools:
  - Linux: build-essential, libx11-dev, libxkbfile-dev, libsecret-1-dev
  - macOS: Xcode command line tools
  - Windows: Visual Studio build tools 17

## Common Commands

### Initial Setup
```bash
npm install                    # Install dependencies, link packages, compute references
npm run compile                # Compile all TypeScript packages
npm run download:plugins       # Download plugins for examples
```

### Building
```bash
npm run build                  # Build everything (compile + applications)
npm run build:browser          # Build browser example
npm run build:electron         # Build Electron example
npm run all                    # Install, lint, build everything
```

### Running Examples
```bash
npm run start:browser          # Start browser example (http://localhost:3000)
npm run start:electron         # Start Electron example
cd examples/browser && npm run start   # Alternative: run from example dir
```

### Development Workflow
```bash
npm run watch                  # Watch all packages and rebuild on change
npm run watch:browser          # Watch browser example only
npm run watch:electron         # Watch Electron example only

# Watch specific package
npx lerna run watch --scope @theia/package-name

# Watch package with its dependencies
npx lerna run watch --scope @theia/package-name --include-filtered-dependencies --parallel
```

### Testing
```bash
npm run test                   # Run all tests
npm run test:theia             # Test Theia packages only (excluding examples)
npm run test:browser           # Test browser example
npm run test:electron          # Test Electron example
npm run test:playwright        # Run Playwright UI tests

# Test specific package
npx lerna run test --scope @theia/package-name

# Test with watch mode (if configured)
npx lerna run test:watch --scope @theia/extension-name
```

### Linting
```bash
npm run lint                   # Lint all packages
npm run lint:fix               # Auto-fix linting issues
```

### Building Individual Packages
```bash
# From root
npx lerna run compile --scope @theia/core

# From package directory
cd packages/core && npm run compile
```

### Cleaning
```bash
npm run clean                  # Clean build artifacts
npm run rebuild:clean          # Clean browser modules
npm run lint:clean             # Clean ESLint cache
```

### Electron-Specific
```bash
npm run rebuild:browser        # Rebuild native modules for browser
npm run rebuild:electron       # Rebuild native modules for Electron
```

## Repository Structure

### Top-Level Directories

- **`packages/`** - Runtime packages (core and extensions)
  - Each package is a Theia extension with `theiaExtensions` in package.json
  - Extensions can have modules for different platforms: `browser/`, `node/`, `electron-browser/`, `electron-node/`, `electron-main/`, `common/`

- **`dev-packages/`** - Development-time packages
  - `@theia/cli` - Command line tool to manage Theia applications
  - `@theia/ext-scripts` - Shared scripts for runtime packages
  - `@theia/re-exports` - Re-export mechanism tooling

- **`examples/`** - Example applications
  - `browser/` - Browser-based IDE example
  - `electron/` - Electron-based IDE example
  - `api-samples/`, `api-tests/`, `playwright/` - Testing and samples

- **`doc/`** - Documentation
- **`scripts/`** - Build and utility scripts
- **`configs/`** - Shared configuration files

### Code Organization by Platform

Theia separates code by target platform within each package:

- **`common/`** - Basic JavaScript APIs, runs everywhere
- **`browser/`** - Requires browser DOM APIs
  - Can use: `common`
- **`node/`** - Requires Node.js APIs
  - Can use: `common`
- **`electron-node/`** - Electron-specific Node.js code
  - Can use: `common`, `node`
- **`electron-browser/`** - Electron renderer process APIs
  - Can use: `common`, `browser`
- **`electron-main/`** - Electron main process APIs
  - Can use: `electron-node`, `common`, `node`

## Architecture Patterns

### Theia Extensions

Extensions declare modules in their `package.json`:

```json
{
  "theiaExtensions": [{
    "frontend": "lib/browser/module",
    "backend": "lib/node/module",
    "frontendElectron": "lib/electron-browser/module",
    "backendElectron": "lib/electron-main/module"
  }]
}
```

### Dependency Injection

- Uses InversifyJS for dependency injection
- Use property injection, not constructor injection (to avoid breaking changes)
- Always add `.inSingletonScope()` for singletons
- Use `@postConstruct()` decorated methods instead of constructors for initialization
- Use `ContributionProvider` instead of `@multiInject`
- Prefer classes over interface + symbol patterns (except for remote services)

### Re-Exports Mechanism

Import common dependencies from `@theia/core/shared/` to ensure version consistency:

```typescript
import { injectable } from '@theia/core/shared/inversify';
import { React } from '@theia/core/shared/React';
```

This prevents version conflicts and ensures stability across extensions.

## Key Contribution Points

Extensions contribute functionality through well-defined contribution points:

- `CommandContribution` - Register commands
- `MenuContribution` - Register menu items
- `KeybindingContribution` - Register keybindings
- `ColorContribution` - Register theme colors
- `TabBarToolbarContribution` - Toolbar items
- `FrontendApplicationContribution` - Lifecycle hooks

## Debugging

### Browser Example
- Use VS Code launch configuration: "Launch Browser Backend"
- For frontend: Start backend with `npm run start`, then use browser devtools or "Launch Browser Frontend" config

### Electron Example
- Backend: "Launch Electron Backend" configuration
- Frontend: Start backend, then "Attach to Electron Frontend" or Help -> Toggle Electron Developer Tools
- Combined: "Launch Electron Backend & Frontend"

### Plugin Host
- Pass `--hosted-plugin-inspect=9339` to backend
- Use "Attach to Plugin Host" launch configuration

### IPC Servers
- Pass `--${server-name}-inspect` to backend
- Run with `--log-level=debug` to see server names and PIDs

## VS Code Extension Support

Theia supports the VS Code Extension protocol. Test VS Code extensions by:

1. Place extensions in `plugins/` directory or configure in `package.json`
2. Run `npm run download:plugins` to fetch configured plugins
3. Start with `--plugins=local-dir:path/to/plugins`

Use `@stubbed` tag in JSDoc for API implementations that are not fully implemented yet.

## Important Conventions

### Naming
- PascalCase for types and enums
- camelCase for functions, methods, properties, variables
- Use whole words, avoid abbreviations
- Lower-case, dash-separated file names (e.g., `document-provider.ts`)
- Name files after the main type they export
- Give unique names to avoid conflicts in search

### Event Names
Follow pattern: `on[Will|Did]VerbNoun?`

### Localization
Always use `nls.localize(key, defaultValue, ...args)` or `nls.localizeByDefault(defaultValue)` for user-facing strings

### URI/Path Handling
- Always pass URIs (as strings) between frontend and backend, never paths
- Use `FileService.fsPath` on frontend to get paths from URIs
- Use `FileUri.fsPath` on backend only
- Always define explicit URI schemes
- Use `LabelProvider.getLongName(uri)` for human-readable full paths
- Use `Path` API on frontend for path manipulation (not Node.js `path` module)

### CSS/Theming
- Use `lower-case-with-dashes` for CSS classes
- Prefix global classes with `theia-`
- Never use inline styles or hard-coded colors
- Reference VS Code colors with `var(--theia-color-name)` (convert dots to dashes)
- Register new colors via `ColorContribution` and derive from existing VS Code colors

### React
- Don't bind functions in event handlers (causes re-renders)
- Use arrow function properties: `protected onClick = () => { ... }`

## Testing Structure

- `src/*/foo.spec.ts` - Unit tests for foo.ts (published)
- `src/*/test/` - Test helpers, mocks, fixtures
- `src/*/*.slow-spec.ts` - Slow/integration tests (unpublished)
- `src/*/*.ui-spec.ts` - UI tests (unpublished)
- `test-resources/` - Test resources and scripts

## Monorepo Workflow

This is a Lerna monorepo with npm workspaces. When working across packages:

1. Changes to one package require recompilation
2. Use `npm run watch` to auto-rebuild on changes
3. Use `--scope` with lerna commands to target specific packages
4. TypeScript project references are automatically computed via `npm run compute-references`
5. After `npm install`, references are computed and `afterInstall` scripts run

## Pull Request Guidelines

Before creating a PR:

1. Discuss approach in a GitHub issue first
2. Follow coding guidelines in `doc/coding-guidelines.md`
3. Sign commits with `git commit -s` (Eclipse Contributor Agreement required)
4. Ensure tests pass and linting is clean
5. Update documentation if needed

## Useful Documentation

- [doc/Developing.md](doc/Developing.md) - Development guide
- [doc/Testing.md](doc/Testing.md) - Testing guidelines
- [doc/coding-guidelines.md](doc/coding-guidelines.md) - Code style
- [doc/code-organization.md](doc/code-organization.md) - Platform separation
- [doc/api-testing.md](doc/api-testing.md) - API integration testing
- API docs: https://eclipse-theia.github.io/theia/docs/next/index.html
- Website: https://theia-ide.org/docs/