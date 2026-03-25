import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/**
 * MathText Component
 * Parses a string and renders LaTeX parts using KaTeX.
 * Supports $...$ for inline math and $$...$$ for block math.
 */
const MathText = ({ text = '' }) => {
  if (typeof text !== 'string') return text;

  // Fallback: If it looks like raw TeX (starts with \ and has no $)
  // This handles exports from some editors where options are just raw TeX
  if (text.trim().startsWith('\\') && !text.includes('$')) {
    try {
      return <InlineMath math={text.trim()} />;
    } catch (e) {
      return <span>{text}</span>;
    }
  }

  // Split text by $$ (block math) and $ (inline math)
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);


  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          return <BlockMath key={index} math={math} />;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          return <InlineMath key={index} math={math} />;
        }
        // Handle newlines in the rest of the text
        return part.split('\n').map((line, i) => (
          <React.Fragment key={`${index}-${i}`}>
            {line}
            {i !== part.split('\n').length - 1 && <br />}
          </React.Fragment>
        ));
      })}
    </span>
  );
};

export default MathText;
