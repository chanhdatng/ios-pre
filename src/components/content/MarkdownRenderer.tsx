import { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Simple markdown renderer for flashcard content
// Supports: code blocks, bold, bullet points, line breaks
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const rendered = useMemo(() => {
    if (!content) return null;

    // Split by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // Code block
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
        if (match) {
          const [, lang, code] = match;
          return (
            <pre
              key={index}
              className="my-3 p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] overflow-x-auto text-body-small"
            >
              <code className="font-mono text-[var(--color-text-primary)]">
                {code.trim()}
              </code>
            </pre>
          );
        }
      }

      // Regular text - process inline markdown
      return (
        <div key={index} className="markdown-text">
          {processInlineMarkdown(part)}
        </div>
      );
    });
  }, [content]);

  return <div className={`markdown-content ${className}`}>{rendered}</div>;
}

// Process inline markdown (bold, bullets, line breaks)
function processInlineMarkdown(text: string) {
  const lines = text.split('\n');

  return lines.map((line, lineIndex) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      return <br key={lineIndex} />;
    }

    // Bullet point
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.match(/^\d+\.\s/)) {
      const bulletContent = trimmed.replace(/^[\*\-]\s+/, '').replace(/^\d+\.\s+/, '');
      return (
        <div key={lineIndex} className="flex gap-2 my-1 ml-4">
          <span className="text-[var(--color-text-tertiary)]">•</span>
          <span>{processBoldText(bulletContent)}</span>
        </div>
      );
    }

    // Section header (ends with :)
    if (trimmed.endsWith(':') && trimmed.length < 50 && !trimmed.includes('.')) {
      return (
        <p key={lineIndex} className="font-semibold mt-4 mb-2 text-[var(--color-text-primary)]">
          {processBoldText(trimmed)}
        </p>
      );
    }

    // Regular paragraph
    return (
      <p key={lineIndex} className="my-1">
        {processBoldText(line)}
      </p>
    );
  });
}

// Process bold text (**text** or __text__)
function processBoldText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-[var(--color-text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('__') && part.endsWith('__')) {
      return (
        <strong key={index} className="font-semibold text-[var(--color-text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Process inline code `code`
    return processInlineCode(part, index);
  });
}

// Process inline code (`code`)
function processInlineCode(text: string, keyPrefix: number): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={`${keyPrefix}-${index}`}
          className="px-1.5 py-0.5 bg-[var(--color-surface-secondary)] rounded text-body-small font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={`${keyPrefix}-${index}`}>{part}</span>;
  });
}
