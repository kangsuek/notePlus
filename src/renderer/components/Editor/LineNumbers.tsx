import React from 'react';
import type { LineNumbersProps } from '@renderer/types';

const LineNumbers: React.FC<LineNumbersProps> = ({ lineWraps, currentLine }) => {
  return (
    <div className="line-numbers" data-testid="line-numbers">
      {lineWraps.map((lineInfo, index) => (
        <div
          key={index}
          className={`line-number ${
            lineInfo.logicalLineNumber === currentLine && !lineInfo.isWrapped
              ? 'line-number-active'
              : ''
          }`}
          data-testid={
            lineInfo.isWrapped
              ? `line-number-wrapped-${index}`
              : `line-number-${lineInfo.logicalLineNumber}`
          }
        >
          {/* 자동 줄바꿈된 줄은 빈칸, 아니면 줄번호 표시 */}
          {lineInfo.isWrapped ? '' : lineInfo.logicalLineNumber}
        </div>
      ))}
    </div>
  );
};

export default React.memo(LineNumbers);

