import React from 'react';
import type { StatusBarProps } from '@renderer/types';
import './StatusBar.css';

const StatusBar: React.FC<StatusBarProps> = React.memo(
  ({
    cursorPosition = { line: 1, column: 1 },
    encoding = 'UTF-8',
    isDirty = false,
    showStatus = false,
  }) => {
    // EUC-KR을 ANSI로 표시 변환
    const displayEncoding = encoding === 'EUC-KR' || encoding === 'CP949' ? 'ANSI' : encoding;

    return (
      <div className="status-bar" data-testid="status-bar" role="status" aria-live="polite">
        <div className="status-left">
          <span
            aria-label={`커서 위치: ${cursorPosition.line}번째 줄, ${cursorPosition.column}번째 칸`}
          >
            줄 {cursorPosition.line}, 칸 {cursorPosition.column}
          </span>
        </div>
        <div className="status-center">{/* 가운데 영역 (필요시 추가) */}</div>
        <div className="status-right">
          {showStatus && (
            <span
              className="status-modified"
              aria-label={isDirty ? '파일이 수정됨' : '파일이 저장됨'}
            >
              {isDirty ? '수정됨' : '저장됨'}
            </span>
          )}
          <span className="status-encoding" aria-label={`파일 인코딩: ${displayEncoding}`}>
            {displayEncoding}
          </span>
        </div>
      </div>
    );
  }
);

StatusBar.displayName = 'StatusBar';

export default StatusBar;
