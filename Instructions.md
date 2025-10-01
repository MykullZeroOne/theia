# Theia Mobile App Development Guidelines

Audience: JetBrains AI Chat Assistant working on this repository.

This document captures project-specific guidance for building, testing, and developing the Theia Mobile App fork. It complements the docs in /docs.

Repository layout (selected):
- Parent: Eclipse Theia IDE fork
- Mobile App: React Native application (iOS-focused initially, Android later)
- Shared docs: ./docs (see references below)

## 1. Development Approach

### 1.1 Test-Driven Development (TDD)
- Adopt TDD for all new features and bug fixes.
- Follow the red-green-refactor cycle:
  1. Red: Write a failing test that defines the expected behavior.
  2. Green: Implement the minimal code to make the test pass.
  3. Refactor: Improve the code while ensuring tests remain passing.

- Use Jest for unit tests in React Native.
- Prefer fast, deterministic unit tests; reserve integration tests for end-to-end flows.

### 1.2 Branching and Version Control
- Create a new branch for each feature or bug fix (e.g., `feature/mobile-editor-view`).
- Commit frequently with descriptive messages (e.g., "Add basic file explorer component").
- Use semantic commit messages: `feat:`, `fix:`, `refactor:`, `test:`, etc.
- Merge via pull requests after code review.

### 1.3 React Native Setup
- Focus on iOS first; ensure compatibility with iPadOS.
- Use Expo for easier development and testing on devices.
- Target React Native version 0.72+ for better performance and support.
- Configure Metro bundler appropriately for Theia assets.

## 2. Testing and TDD in this repo

### 2.1 Conventions
- Use Jest with React Native Testing Library for component and logic tests.
- Place tests alongside source files (e.g., `Component.test.tsx` next to `Component.tsx`).
- Mock external dependencies (e.g., Theia backend API calls).

### 2.2 Quickstart TDD loop
1. Red — Write a failing test in the relevant module.
2. Green — Implement the smallest change to pass.
3. Refactor — Improve the code and tests while keeping green.

Commands:
- Run all tests: `npm test`
- Run specific test: `npm test Component.test.tsx`
- Watch mode: `npm test -- --watch`

### 2.3 Example: Mobile File Explorer Component
This small example demonstrates TDD for a new component.

Test (src/components/FileExplorer.test.tsx):

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import FileExplorer from './FileExplorer';

describe('FileExplorer', () => {
  it('displays file list and handles selection', () => {
    const mockFiles = ['file1.txt', 'file2.js'];
    const onSelect = jest.fn();

    render(<FileExplorer files={mockFiles} onSelect={onSelect} />);

    expect(screen.getByText('file1.txt')).toBeTruthy();
    expect(screen.getByText('file2.js')).toBeTruthy();

    fireEvent.press(screen.getByText('file1.txt'));
    expect(onSelect).toHaveBeenCalledWith('file1.txt');
  });
});
```

Implementation (src/components/FileExplorer.tsx):

```typescript
import React from 'react';
import { FlatList, TouchableOpacity, Text } from 'react-native';

interface FileExplorerProps {
  files: string[];
  onSelect: (file: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, onSelect }) => {
  return (
    <FlatList
      data={files}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onSelect(item)}>
          <Text>{item}</Text>
        </TouchableOpacity>
      )}
    />
  );
};

export default FileExplorer;
```

Running the example:
- npm test FileExplorer.test.tsx
- Expected: Tests pass.

## 3. Adding and executing new tests
- Unit tests: Co-locate under src/
- Integration tests: Under src/__tests__/integration/
- E2E tests: Use Detox for iOS/Android device simulation.

## 4. Code Quality
- Follow TypeScript strict mode.
- Use ESLint and Prettier for consistent code style.
- Prefer functional components with hooks over class components.
- Implement error boundaries for robust UI.

## 5. Integration with Theia Backend
- Communicate with Theia server via WebSocket or REST API.
- Ensure mobile app can load and edit files from Theia workspace.
- Handle offline scenarios gracefully.

## 6. Deployment
- Use Expo Application Services (EAS) for builds.
- Separate builds for iOS and Android.
- Automate releases via GitHub Actions or similar.