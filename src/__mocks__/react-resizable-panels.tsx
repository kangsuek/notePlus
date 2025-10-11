import React from 'react';

export const PanelGroup: React.FC<any> = ({ children }) => (
  <div data-testid="mock-panel-group">{children}</div>
);

export const Panel: React.FC<any> = ({ children }) => (
  <div data-testid="mock-panel">{children}</div>
);

export const PanelResizeHandle: React.FC<any> = () => (
  <div data-testid="mock-panel-resize-handle" style={{ width: '4px', cursor: 'col-resize' }} />
);
