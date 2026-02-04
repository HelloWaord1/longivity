'use client';

function simpleMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr />')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');
}

export default function TypewriterText({ text, className = '' }) {
  return (
    <div className={`prose-answer ${className}`}>
      <span dangerouslySetInnerHTML={{ __html: simpleMarkdown(text) }} />
    </div>
  );
}
