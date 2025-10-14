# Encoding Display Enhancement - Implementation Complete

## Task Overview
Changed encoding display from "EUC-KR" to "ANSI" in the UI while maintaining internal encoding detection logic.

## Files Modified

### Created Files
- `src/renderer/utils/encodingMapper.ts`
  - New utility function `getEncodingDisplayName()` to map internal encoding names to user-friendly display names
  - Maps EUC-KR, CP949, windows-1252, ISO-8859-1 → "ANSI"
  - UTF encodings remain unchanged for display

- `src/renderer/utils/encodingMapper.test.ts`
  - Comprehensive unit tests for encoding mapper (11 test cases)
  - Tests all mapped encodings and edge cases
  - All tests passing

### Modified Files
- `src/renderer/components/StatusBar/StatusBar.tsx`
  - Imported and integrated `getEncodingDisplayName()` utility
  - Display encoding now uses mapped name instead of raw encoding value
  - aria-label updated to reflect display encoding

- `src/renderer/components/StatusBar/StatusBar.test.tsx`
  - Added 4 new test cases for encoding display mapping
  - Tests verify ANSI display for EUC-KR, CP949, windows-1252
  - Tests verify UTF-16LE displays correctly
  - All 13 tests passing

- `docs/tasks/context.md`
  - Updated project documentation with encoding display enhancement
  - Added encodingMapper to architecture documentation

- `.claude/docs/tasks/context.md`
  - Updated agent context with implementation details

## Test Results
```
✓ StatusBar.test.tsx: 13 tests passing (4 new ANSI display tests)
✓ encodingMapper.test.ts: 11 tests passing (new file)
✓ Total: 24 tests for encoding functionality
✓ Backward compatibility maintained
✓ No existing tests broken
```

## Technical Decisions
1. **Utility Function Approach**: Created separate encodingMapper utility for clean separation of concerns
2. **Display vs Internal**: Internal encoding detection unchanged; only display layer modified
3. **Mapping Strategy**: All Windows/Asian legacy encodings mapped to "ANSI" for user familiarity
4. **Extensibility**: Easy to add more encoding mappings in the future

## Implementation Details

### Encoding Mapping Logic
The `getEncodingDisplayName()` function provides a simple mapping from internal encoding names to user-friendly display names:
- EUC-KR → ANSI
- CP949 → ANSI
- windows-1252 → ANSI
- ISO-8859-1 → ANSI
- UTF-* → unchanged (UTF-8, UTF-16LE, UTF-16BE, etc.)

### Why ANSI?
ANSI is a more familiar term for users, especially in Windows environments where "ANSI" typically refers to the system's default encoding for legacy applications. While technically EUC-KR, CP949, and windows-1252 are different encodings, they all fall under the category of single-byte or double-byte character encodings that users commonly refer to as "ANSI."

## Next Steps
Consider adding:
1. Manual encoding selection dropdown in StatusBar
2. Encoding conversion on save feature
3. Encoding preferences in settings panel
