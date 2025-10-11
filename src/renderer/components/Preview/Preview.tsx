import React, { forwardRef } from 'react';
import MarkdownPreview from './MarkdownPreview';
import './Preview.css';

interface PreviewProps {
  markdown?: string;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
}

const Preview = React.memo(
  forwardRef<HTMLDivElement, PreviewProps>(({ markdown = '', onScroll }, ref) => {
    return (
      <div className="preview-section" data-testid="preview-section">
        <div className="preview-header">
          <h3>Preview</h3>
        </div>
        <div className="preview-content" ref={ref} onScroll={onScroll}>
          <MarkdownPreview markdown={markdown} />
        </div>
      </div>
    );
  })
);

Preview.displayName = 'Preview';

export default Preview;
