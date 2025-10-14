# notePlus Project Context

## Current Project State

notePlus is an Electron-based Markdown editor with real-time preview, file management, and encoding detection capabilities.

### Recent Updates (2025-10-14)

**Encoding Display Enhancement - COMPLETED**
- Changed encoding display from "EUC-KR" to "ANSI" for user-friendly presentation
- Created encodingMapper utility to map internal encoding names to display names
- EUC-KR, CP949, windows-1252, and ISO-8859-1 now display as "ANSI"
- Internal encoding detection logic remains unchanged
- Added comprehensive tests for encoding display mapping
- All 13 StatusBar tests passing including new ANSI display tests

**File Encoding Detection Feature - COMPLETED** (2025-10-13)
- Implemented automatic file encoding detection using jschardet library
- Added support for UTF-8, UTF-16LE, UTF-16BE, EUC-KR, CP949, Windows-1252, and ISO-8859-1 encodings
- StatusBar now displays actual detected encoding instead of hardcoded "UTF-8"

## Key Architecture

### Main Process (src/main/)
- **index.ts**: IPC handlers for file operations with encoding detection
- **utils/encodingDetector.ts**: Automatic encoding detection with BOM support
- **RecentFilesManager.ts**: Recent files tracking

### Renderer Process (src/renderer/)
- **components/Layout/MainLayout.tsx**: Main application layout with file operations
- **components/StatusBar/StatusBar.tsx**: Displays cursor position and file encoding
- **utils/fileOperations.ts**: File I/O utilities with encoding support
- **utils/encodingMapper.ts**: Maps internal encoding names to user-friendly display names

### Test Suite
- 351 total tests (all passing)
- 12 encoding detector unit tests
- Test fixtures for various encodings in tests/fixtures/encodings/

## Requirements

### Completed Features
1. Markdown editor with syntax highlighting
2. Real-time preview with scroll synchronization
3. File operations (new, open, save, save as)
4. Recent files tracking
5. Drag-and-drop file support
6. Tab key handling for lists
7. Automatic encoding detection (UTF-8, UTF-16LE, UTF-16BE, EUC-KR, CP949, etc.)
8. Encoding display in StatusBar with user-friendly names (ANSI for EUC-KR/CP949/windows-1252)

### Pending Features
- Manual encoding selection override
- Save with different encoding options
- Encoding conversion on save
