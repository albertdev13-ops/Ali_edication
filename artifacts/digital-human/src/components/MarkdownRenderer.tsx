import React from 'react';

type MarkdownProps = {
  content: string;
};

// Extremely lightweight markdown renderer since we don't have react-markdown
// Only handles code blocks, basic bold/italic, and paragraphs
export function MarkdownRenderer({ content }: MarkdownProps) {
  const processContent = (text: string) => {
    // Code blocks
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'code', lang: match[1], content: match[2] });
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    if (parts.length === 0) {
      parts.push({ type: 'text', content: text });
    }

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <div key={index} className="relative group my-4 rounded-md overflow-hidden border border-border/50">
            <div className="flex items-center justify-between px-4 py-1 bg-muted/50 text-xs text-muted-foreground border-b border-border/50">
              <span>{part.lang || 'text'}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(part.content)}
                className="hover:text-primary transition-colors focus:outline-none"
                title="Copy to clipboard"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 bg-muted/20 overflow-x-auto text-sm font-mono text-primary/90">
              <code>{part.content}</code>
            </pre>
          </div>
        );
      }

      // Process basic inline markdown for text parts
      let htmlContent = part.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted/50 px-1 py-0.5 rounded text-primary text-sm">$1</code>')
        .replace(/\n\n/g, '</p><p class="my-2">')
        .replace(/\n/g, '<br/>');

      return (
        <div 
          key={index}
          className="prose prose-invert max-w-none text-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: `<p class="my-2">${htmlContent}</p>` }}
        />
      );
    });
  };

  return <div className="markdown-body">{processContent(content)}</div>;
}