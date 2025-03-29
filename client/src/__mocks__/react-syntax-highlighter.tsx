import React from 'react';

// Mock SyntaxHighlighter component
const SyntaxHighlighter = ({ children, ...props }: any) => (
  <div data-testid="syntax-highlighter" {...props}>
    {children}
  </div>
);

export default SyntaxHighlighter;

// Mock styles
export const docco = {};
export const dark = {};