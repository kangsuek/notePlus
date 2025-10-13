# notePlus 0.2 - Comprehensive Development Plan & Analysis
**Generated**: 2025-10-13
**Status**: Phase 2, Week 6 - Partially Complete

---

## Executive Summary

The notePlus 0.2 project is a markdown note-taking application with integrated calculation functionality for macOS. The project is currently at **Phase 2, Week 6** with significant progress made across core features.

**Current Completion Status:**
- **Phase 1 (MVP)**: 100% Complete ✅ (Weeks 1-4)
- **Phase 2 (macOS Native)**: 50% Complete 🚀 (Week 5 complete, Week 6 partial)
- **Test Coverage**: 75%+ (exceeding 70% target) ✅
- **Test Suite**: 25 suites, 339 tests passing ✅
- **Branch Coverage**: 69.09% (just below 70% threshold - needs improvement)

---

## 1. Current Status Summary

### 1.1 Recently Completed Work (2025-10-13)

#### ✅ Markdown List Auto-Generation (Task 3.5)
- **Implementation**: 36 comprehensive tests in `markdownListUtils.test.ts`
- **Features**:
  - Unordered lists (-, *, +) with automatic continuation
  - Ordered lists with automatic numbering (1. 2. 3...)
  - Checkbox lists (- [ ], - [x]) with state preservation
  - Blockquotes (>) with automatic continuation
  - Empty list detection with Enter key to exit
  - Nested list support with indentation preservation
  - File-type specific behavior (.md/.markdown only)
- **Test Coverage**: 97.14% statements, 86.36% branches

#### ✅ Advanced Tab Key Features (Task 3.5)
- **Implementation**: Enhanced tab handling with multi-line support
- **Features**:
  - 4-space indentation (TAB_SIZE updated from 2 to 4)
  - Block indentation for selected text
  - Shift+Tab for block unindenting
  - Precise cursor positioning after tab insertion
- **Test Coverage**: Integrated into Editor component tests

#### ✅ Drag-Drop Recent Files Integration (Task 6.2)
- **Implementation**: Seamless integration with recent files list
- **Features**:
  - Unique identifiers for dropped files (dropped:filename:timestamp)
  - Clean display names for user interface
  - IPC handler for adding to recent files (recentFiles:add)
  - Automatic positioning at top of recent files list
  - File type validation and error handling
- **Test Coverage**: 10 tests in `DragAndDrop.test.tsx`

### 1.2 Current Phase: Phase 2, Week 6

**Completed Tasks:**
- ✅ 6.1: Editor ↔ Preview Bidirectional Scroll Synchronization
- ✅ 6.2: Drag & Drop File Opening

**Pending Tasks:**
- ⏳ 6.3: StatusBar Advanced Features (Priority: P2)

**Progress**: 66.7% complete (2 of 3 tasks)

### 1.3 Test Coverage Analysis

```
Overall Coverage:
- Statements: 75%+ ✅ (Target: 70%)
- Branches: 69.09% ⚠️ (Target: 70% - just below)
- Functions: 82.14% ✅
- Lines: 75.74% ✅

Critical Coverage Gaps:
1. performanceMonitor.ts: 30.43% statements, 42.1% branches
2. memoryManager.ts: 55.55% statements, 43.33% branches
3. types.ts: 0% (type definitions - acceptable)

Test Suites: 25 passed
Tests: 339 passed
```

---

## 2. Next Task Details: StatusBar Advanced Features (6.3)

### 2.1 Task Overview

**Task ID**: 6.3
**Name**: StatusBar 고급 기능 (StatusBar Advanced Features)
**Priority**: P2 (Medium)
**Estimated Duration**: 1.5 days
**Current Status**: Pending

### 2.2 Requirements from PRD

According to the progress document, Task 6.3 includes:

1. **File Encoding Detection and Display**
   - Use `chardet` or `jschardet` library for automatic detection
   - Display detected encoding in StatusBar
   - Support for UTF-8, UTF-16, EUC-KR, and other common encodings

2. **Real-time Update Optimization**
   - Apply debouncing to reduce unnecessary updates
   - Implement memoization for performance
   - Minimize re-renders

### 2.3 Current StatusBar Implementation

**File**: `/Users/kangsuek/pythonProject/notePlus0.2/src/renderer/components/StatusBar/StatusBar.tsx`

**Current Features:**
- Cursor position display (line, column)
- File encoding display (currently hardcoded to "UTF-8")
- Dirty state indicator (modified/saved)
- 3-second auto-hide for save status
- Accessibility support (ARIA labels, live regions)

**Current Props Interface:**
```typescript
interface StatusBarProps {
  cursorPosition?: { line: number; column: number };
  encoding?: string;
  isDirty?: boolean;
  showStatus?: boolean;
}
```

**Limitations:**
- Encoding is passed as prop but not auto-detected
- No debouncing on updates (relies on parent component)
- No memoization beyond React.memo
- Hardcoded "UTF-8" default

### 2.4 Acceptance Criteria

- [ ] Encoding detection works for UTF-8, UTF-16, EUC-KR, ASCII
- [ ] Encoding normalization handles variants (utf8 → UTF-8)
- [ ] Tests achieve 90%+ coverage for new code
- [ ] Integration with file operations complete
- [ ] StatusBar updates are debounced (100ms default)
- [ ] Rapid cursor movements don't cause excessive re-renders
- [ ] No visual lag or jank
- [ ] All existing tests still pass
- [ ] Branch coverage improves to 70%+

### 2.5 Files to be Modified/Created

**New Files:**
1. `/src/renderer/utils/encodingDetector.ts` - Encoding detection utility
2. `/src/renderer/utils/encodingDetector.test.ts` - Unit tests
3. `/src/renderer/hooks/useStatusBarUpdates.ts` - Optimization hook
4. `/src/renderer/hooks/useStatusBarUpdates.test.ts` - Hook tests

**Modified Files:**
1. `/src/renderer/components/StatusBar/StatusBar.tsx` - Add optimization
2. `/src/renderer/components/StatusBar/StatusBar.test.tsx` - Expand tests
3. `/src/renderer/components/Layout/MainLayout.tsx` - Pass encoding
4. `/src/renderer/utils/fileOperations.ts` - Add encoding detection
5. `/src/main/index.ts` - Update IPC handlers
6. `/src/shared/types.ts` - Update FileInfo type

### 2.6 Estimated Complexity

**Rating**: Medium

**Justification:**
- Library integration is straightforward (jschardet)
- Debouncing pattern already exists in codebase
- StatusBar component is well-structured
- Good test coverage baseline exists
- Limited UI changes required

**Risks:**
- Encoding detection may be inaccurate for small files
- Performance overhead of detection on large files
- Edge cases with mixed encodings

**Mitigation:**
- Use sample-based detection for large files
- Cache encoding results per file
- Provide manual override option (future enhancement)

---

## 3. Recommended Implementation Order

### Priority 1: Immediate Next Step (This Week)

**Task 6.3: StatusBar Advanced Features**
- **Duration**: 1.5 days
- **Rationale**: Completes Week 6, improves UX, prepares for Week 7
- **Impact**: Medium
- **Dependencies**: None

**Sub-steps:**
1. Phase 1: Setup & Library Integration (0.5 days)
   - Install jschardet
   - Create encoding detector utility
   - Write unit tests (8+ tests)

2. Phase 2: Integration with File Operations (0.5 days)
   - Update file operations to detect encoding
   - Update IPC handlers
   - Integration tests (3+ tests)

3. Phase 3: StatusBar Optimization (0.5 days)
   - Create debouncing hook
   - Update StatusBar component
   - Performance tests (6+ tests)

### Priority 2: Week 7 Tasks (Following Week)

**Task 7.1: Various File Encodings Support** (Priority: P1, 2 days)
- **Rationale**: Directly builds on 6.3, critical for international users
- **Dependencies**: Requires 6.3 completion
- **Features**:
  - Comprehensive encoding support (UTF-8, UTF-16, EUC-KR, etc.)
  - BOM (Byte Order Mark) handling
  - Encoding selection on save
  - Error handling for invalid encodings

**Task 7.2: File Watching & Auto-Refresh** (Priority: P2, 1.5 days)
- **Rationale**: Improves collaboration, prevents data loss
- **Features**:
  - File system monitoring with chokidar
  - External change detection
  - User confirmation before refresh
  - Conflict detection

**Task 7.3: Additional File Formats** (Priority: P2, 2.5 days)
- **Rationale**: Expands functionality, adds value
- **Features**:
  - PDF reading support (pdf-parse)
  - Image file insertion
  - HTML import with markdown conversion (turndown)

### Priority 3: Future Tasks (Weeks 8+)

**Week 8: Search & Export** (Phase 3)
- Task 8.1: Text Search (P0) - 2 days
- Task 8.2: Find & Replace (P1) - 1.5 days
- Task 8.3: Regex Search (P2) - 1 day
- Task 8.4: PDF Export (P1) - 1.5 days
- Task 8.5: HTML Export (P2) - 1 day

**Week 9: Advanced Editing** (Phase 3)
- Task 9.1: Syntax Highlighting (P1) - 2 days
- Task 9.2: Auto-completion (P2) - 2 days
- Task 9.3: Code Block Execution (P3) - 2 days

---

## 4. Technical Considerations

### 4.1 Potential Challenges

**Challenge 1: Encoding Detection Accuracy**
- **Issue**: Small files may not have enough data for accurate detection
- **Solution**: Use minimum sample size, provide manual override option
- **Test Strategy**: Create test files with various encodings and sizes

**Challenge 2: Performance Impact**
- **Issue**: Encoding detection on large files could slow file opening
- **Solution**:
  - Async detection with loading indicator
  - Sample-based detection (first N bytes)
  - Cache results per file path
- **Test Strategy**: Performance benchmarks with large files (>10MB)

**Challenge 3: Branch Coverage Gap**
- **Issue**: Current branch coverage at 69.09%, below 70% target
- **Solution**:
  - Focus on covering edge cases in performanceMonitor.ts
  - Add error path tests for memoryManager.ts
  - Review and test conditional branches
- **Target**: Achieve 70%+ branch coverage by end of Week 6

### 4.2 Design Decisions

**Decision 1: jschardet vs chardet**
- **Chosen**: jschardet
- **Rationale**:
  - Pure JavaScript (no native dependencies)
  - Better Electron compatibility
  - Active maintenance
  - Smaller bundle size
- **Trade-off**: Slightly less accurate than native chardet

**Decision 2: Debounce Timing**
- **Chosen**: 100ms default, configurable
- **Rationale**:
  - Balances responsiveness with performance
  - Imperceptible to users (<150ms threshold)
  - Can be tuned per component
- **Trade-off**: May feel slightly delayed on very slow machines

**Decision 3: Encoding Display Format**
- **Chosen**: Uppercase, normalized (e.g., "UTF-8" not "utf8")
- **Rationale**:
  - Industry standard (VS Code, Sublime Text)
  - Consistent with macOS conventions
  - More professional appearance
- **Trade-off**: Requires normalization logic

### 4.3 Testing Strategy

**Unit Tests:**
- encodingDetector.ts: 8 tests minimum
  - UTF-8 detection
  - UTF-16 detection (BE/LE)
  - EUC-KR detection
  - ASCII detection
  - Fallback behavior
  - Normalization
  - Edge cases (empty, binary)

- useStatusBarUpdates.ts: 6 tests minimum
  - Debouncing behavior
  - Rapid updates coalesced
  - Final state correct
  - Configurable delay
  - Memory leaks prevented

- StatusBar component: expand existing 9 tests to 12+
  - Encoding display
  - Debounced updates
  - Performance

**Integration Tests:**
- File open → encoding detection → StatusBar display: 3 tests
- Large file performance: 2 tests
- Error handling: 2 tests

**Coverage Targets:**
- New code: 90%+ coverage
- Overall: Maintain 75%+ statements
- Branch coverage: Achieve 70%+ (currently 69.09%)

**Performance Tests:**
- StatusBar re-render frequency (<10 per second during rapid typing)
- Encoding detection time (<100ms for typical files)
- Memory usage (no leaks, stable over time)

### 4.4 Integration Points

**IPC Channels:**
- Update `file:open` response to include encoding
- Update `file:save` to accept encoding parameter (future)

**State Management:**
- MainLayout holds encoding state
- Passed to StatusBar via props
- Updated on file open/save

**Error Handling:**
- Graceful fallback to UTF-8
- User-friendly error messages
- Logging for debugging

---

## 5. Action Plan for Task 6.3

### Phase 1: Setup & Library Integration (0.5 days)

**Step 1: Install Dependencies**
```bash
npm install jschardet
npm install --save-dev @types/jschardet
```

**Step 2: Create Encoding Detector Utility**
- Create `/src/renderer/utils/encodingDetector.ts`
- Implement `detectEncoding()` function
- Implement `normalizeEncoding()` function
- Add comprehensive JSDoc comments

**Step 3: Write Unit Tests**
- Create `/src/renderer/utils/encodingDetector.test.ts`
- Test UTF-8, UTF-16, EUC-KR, ASCII detection
- Test edge cases (empty files, binary files)
- Test normalization logic
- Achieve 90%+ coverage

**Acceptance Criteria:**
- [ ] jschardet installed and typed
- [ ] Encoding detector utility created
- [ ] 8+ unit tests written and passing
- [ ] 90%+ test coverage
- [ ] No TypeScript errors

### Phase 2: Integration with File Operations (0.5 days)

**Step 4: Update File Operations**
- Modify `/src/renderer/utils/fileOperations.ts`
- Update `readFile()` to detect and return encoding
- Update IPC response types to include encoding
- Handle encoding errors gracefully

**Step 5: Update Main Process**
- Modify `/src/main/index.ts` IPC handlers
- Return encoding in `file:open` response
- Add encoding to FileInfo type

**Step 6: Integration Tests**
- Test file open with encoding detection
- Test encoding passed to StatusBar
- Test fallback to UTF-8 on detection failure

**Acceptance Criteria:**
- [ ] File operations return encoding
- [ ] IPC handlers updated
- [ ] Integration tests pass
- [ ] No breaking changes

### Phase 3: StatusBar Optimization (0.5 days)

**Step 7: Create Optimization Hook**
- Create `/src/renderer/hooks/useStatusBarUpdates.ts`
- Implement debouncing (use-debounce or custom)
- Add memoization
- Make delay configurable

**Step 8: Update StatusBar Component**
- Use useStatusBarUpdates hook
- Display detected encoding
- Maintain existing functionality

**Step 9: Update Tests**
- Expand `/src/renderer/components/StatusBar/StatusBar.test.tsx`
- Test encoding display
- Test debouncing behavior
- Test performance improvements

**Acceptance Criteria:**
- [ ] Debouncing hook created and tested
- [ ] StatusBar uses optimized updates
- [ ] All tests pass (existing + new)
- [ ] No visual regression

### Phase 4: Testing & Documentation (2 hours)

**Step 10: End-to-End Testing**
- Test complete flow: open file → detect → display
- Test various file encodings
- Test large files
- Test performance

**Step 11: Update Documentation**
- Update progress-status.md
- Update context.md
- Document encoding detection behavior

**Step 12: Code Review & Cleanup**
- Review all changes
- Remove debug code
- Ensure consistent code style

**Acceptance Criteria:**
- [ ] E2E tests pass
- [ ] Documentation updated
- [ ] Code reviewed and clean
- [ ] Ready for next task

---

## 6. Success Metrics

### 6.1 Functional Metrics

**Encoding Detection:**
- [ ] Correctly detects UTF-8, UTF-16 (BE/LE)
- [ ] Correctly detects EUC-KR, ASCII
- [ ] Fallback to UTF-8 works correctly
- [ ] Detection completes in <100ms for typical files
- [ ] Detection completes in <500ms for large files (1-10MB)

**StatusBar Performance:**
- [ ] Cursor position updates are debounced
- [ ] No visual lag or stutter
- [ ] Memory usage stable (no leaks)
- [ ] Re-render frequency reduced by 70%+

### 6.2 Test Metrics

**Coverage:**
- [ ] encodingDetector.ts: 90%+ statements, 85%+ branches
- [ ] useStatusBarUpdates.ts: 90%+ statements, 85%+ branches
- [ ] Overall branch coverage: 70%+ (currently 69.09%)
- [ ] Overall statement coverage: 75%+ maintained

**Test Count:**
- [ ] 8+ new tests for encoding detection
- [ ] 6+ new tests for StatusBar optimization
- [ ] 3+ integration tests
- [ ] All 339 existing tests still pass
- [ ] Total: 356+ tests

### 6.3 Quality Metrics

**Code Quality:**
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Consistent code style (Prettier)
- [ ] Comprehensive JSDoc comments

**User Experience:**
- [ ] Encoding displayed accurately
- [ ] StatusBar responds quickly (<100ms perceived)
- [ ] No performance regression
- [ ] Error messages are user-friendly

---

## 7. Risk Assessment & Mitigation

### 7.1 Technical Risks

**Risk 1: Encoding Detection Failures**
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**:
  - Implement robust fallback to UTF-8
  - Log detection failures for debugging
  - Add manual encoding override (future)
  - Test with diverse file set

**Risk 2: Performance Degradation**
- **Probability**: Low
- **Impact**: High
- **Mitigation**:
  - Use sample-based detection for large files
  - Async detection with loading indicator
  - Performance benchmarks before/after
  - Optimize critical path

**Risk 3: Branch Coverage Not Meeting Threshold**
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**:
  - Focus on edge cases in performanceMonitor.ts
  - Add error path tests
  - Review uncovered branches systematically
  - Allocate time for coverage improvement

### 7.2 Schedule Risks

**Risk 4: Task Takes Longer Than Estimated**
- **Probability**: Low
- **Impact**: Low
- **Mitigation**:
  - Well-defined scope
  - Similar work done before
  - Buffer time included (1.5 days for 1 day work)
  - Can defer optimizations if needed

### 7.3 Integration Risks

**Risk 5: Breaking Changes to Existing Code**
- **Probability**: Low
- **Impact**: High
- **Mitigation**:
  - Comprehensive test suite
  - Backward compatible changes
  - Feature flags for rollback
  - Code review before merge

---

## 8. Post-Task 6.3 Roadmap

### Immediate Next (Week 7)

**Week 7 Goal**: Complete macOS native features

1. **Task 7.1: Various File Encodings** (P1, 2 days)
   - Build on Task 6.3 encoding detection
   - Add encoding selection on save
   - BOM handling
   - Comprehensive encoding support

2. **Task 7.2: File Watching** (P2, 1.5 days)
   - chokidar integration
   - External change detection
   - Auto-refresh with user confirmation

3. **Task 7.3: Additional File Formats** (P2, 2.5 days)
   - PDF reading (pdf-parse)
   - Image insertion
   - HTML import (turndown)

**Estimated Completion**: End of Week 7 (2025-11-21)

### Medium Term (Phase 3: Weeks 8-9)

**Week 8: Search & Export**
- Text search with highlighting
- Find & replace functionality
- Regex support
- PDF/HTML export

**Week 9: Advanced Editing**
- Syntax highlighting (Prism.js/highlight.js)
- Auto-completion
- Code block execution (optional)

**Estimated Completion**: End of Week 9 (2025-12-05)

### Long Term (Phase 4: Weeks 10-12)

**Week 10-12: Cloud & Extensions**
- Settings system
- iCloud synchronization
- Google Drive/Dropbox integration
- Plugin architecture
- Theme system
- App Store preparation

**Estimated Completion**: End of Week 12 (2025-12-26)

---

## 9. Conclusion & Recommendations

### Summary

The notePlus 0.2 project is in excellent shape with:
- Strong foundation (100% Phase 1 complete)
- Robust test suite (25 suites, 339 tests, 75%+ coverage)
- Clear roadmap and priorities
- Well-documented codebase
- Active development momentum

**Next immediate action: Complete Task 6.3 (StatusBar Advanced Features)**

### Key Recommendations

1. **Proceed with Task 6.3 immediately**
   - Well-defined scope
   - Manageable complexity (Medium)
   - Clear dependencies
   - Completes Week 6

2. **Focus on branch coverage improvement**
   - Currently at 69.09%, just below 70% target
   - Add tests for performanceMonitor.ts and memoryManager.ts
   - Include edge case testing in new code

3. **Maintain test-first approach**
   - Continue TDD methodology
   - Write tests before implementation
   - Aim for 90%+ coverage on new code

4. **Plan for Task 7.1 encoding work**
   - Task 6.3 lays groundwork
   - Encoding selection on save
   - Comprehensive format support

5. **Monitor performance metrics**
   - Track app startup time
   - Measure memory usage
   - Profile large file operations

### Success Indicators

By end of Week 6 (after Task 6.3):
- ✅ Week 6 fully complete (3/3 tasks)
- ✅ Branch coverage at 70%+
- ✅ Test count at 356+
- ✅ Encoding detection functional
- ✅ StatusBar optimized
- ✅ Ready to start Phase 2, Week 7

---

**Report Prepared By**: Claude (Sonnet 4.5)
**Report Date**: 2025-10-13
**Next Review**: After Task 6.3 completion
**Status**: Ready for implementation ✅
