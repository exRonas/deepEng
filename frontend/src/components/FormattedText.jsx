import React from 'react';

const FormattedText = ({ text }) => {
  if (!text) return null;

  // Split by specific line breaks or just handle them in loop
  // We want to group list items
  const lines = text.split('\n');
  const elements = [];
  let currentList = null;

  lines.forEach((line, idx) => {
    // Check for list item markers: "- ", "* ", "1. "
    const listMatch = line.trim().match(/^[-*]\s+(.+)/);

    if (listMatch) {
      if (!currentList) {
        currentList = [];
        elements.push({ type: 'list', items: currentList });
      }
      currentList.push(listMatch[1]);
    } else {
      currentList = null;
      if (line.trim() === '') {
        elements.push({ type: 'break' });
      } else {
        // Normal paragraph
        elements.push({ type: 'paragraph', content: line });
      }
    }
  });

  // Helper to parse bold (**...**) and italic (*...*)
  const parseInline = (str) => {
    if (!str) return '';
    
    // We split by bold tokens first
    const parts = str.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      // Simple italic check inside non-bold parts
      const italicParts = part.split(/(\*.*?\*)/g);
       return italicParts.map((subPart, j) => {
           if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2) {
               return <em key={`${i}-${j}`}>{subPart.slice(1, -1)}</em>;
           }
           return subPart;
       });
    });
  };

  return (
    <div className="formatted-text" style={{ lineHeight: '1.6', fontSize: 'inherit' }}>
      {elements.map((el, idx) => {
        if (el.type === 'list') {
          return (
            <ul key={idx} style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              {el.items.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>{parseInline(item)}</li>
              ))}
            </ul>
          );
        } else if (el.type === 'break') {
            return <div key={idx} style={{ height: '0.5rem' }} />;
        } else {
          return (
            <div key={idx} style={{ marginBottom: '0.25rem', whiteSpace: 'pre-wrap' }}>
              {parseInline(el.content)}
            </div>
          );
        }
      })}
    </div>
  );
};

export default FormattedText;
