# Project Context

## Current Project State (2025-10-13)

**Phase**: Phase 2 - Week 6 (macOS Native Features)
**Status**: Week 6 partially complete (6.1-6.2 done, 6.3 pending)
**Tests**: 25 suites, 339 tests all passing, 75%+ coverage

### Recent Completions (2025-10-13)

1. **Markdown List Auto-Generation**: Implemented intelligent list continuation for .md files including ordered/unordered lists, checkboxes, and blockquotes with 36 comprehensive tests in markdownListUtils.test.ts.

2. **Tab Key Advanced Features**: Enhanced tab functionality with 4-space indentation, block indentation for selected text, and Shift+Tab for unindenting, improving editing efficiency for multi-line operations.

3. **Drag-Drop Recent Files Integration**: Integrated drag-and-drop functionality with recent files list, using unique identifiers and clean display names to provide seamless file access and tracking.

### Development Plan Analysis (2025-10-13)

**Comprehensive Analysis Completed**: Generated detailed development plan analyzing current project state, identifying next task (6.3: StatusBar Advanced Features), and providing actionable implementation roadmap with test coverage improvement strategies to achieve 70%+ branch coverage target.

### File Encoding Issue Analysis (2025-10-13)

**Analysis Completed**: Created comprehensive plan to fix Windows 11 .txt file encoding issue. Root cause identified as hardcoded UTF-8 encoding in file reading. Solution involves jschardet library integration for automatic encoding detection, modifying file:read IPC handler to detect and decode properly, and updating StatusBar to display detected encoding. Plan includes 5 implementation phases with detailed testing strategy.

### Recent Documents Menu & Settings Feature (2025-10-14)

**Complete + 2 Bug Fixes**: Changed "Recent Files" to "Recent Documents" with dynamic menu. Added Settings dialog (Cmd+,). Fixed: (1) CSS variables for proper style override, (2) Direct callback instead of IPC for instant apply.
Files: SettingsManager.ts, Preferences (with onSettingsChange callback), Editor with CSS variables
Status: Settings apply instantly via callback. Ready for testing.
