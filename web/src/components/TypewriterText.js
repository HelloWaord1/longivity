'use client';

import { useTypewriter } from '@/lib/hooks';

function simpleMarkdown(text) {
  if (!text) return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/### (.*?)$/gm, '<h3 class="text-base font-semibold text-white mt-4 mb-1">$1</h3>')
    .replace(/## (.*?)$/gm, '<h2 class="text-lg font-semibold text-white mt-4 mb-2">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/^- (.*?)$/gm, '<div class="flex items-start gap-2 ml-2 mb-1"><span class="text-accent mt-0.5 shrink-0">→</span><span>$1</span></div>')
    .replace(/^---$/gm, '<hr class="border-border/30 my-4" />')
    .replace(/\n\n/g, '<br /><br />')
    .replace(/\n/g, '<br />');
}

export default function TypewriterText({ text, speed = 12, className = '' }) {
  const { displayed, done } = useTypewriter(text, speed);

  return (
    <div className={`prose-answer ${className}`}>
      <span dangerouslySetInnerHTML={{ __html: simpleMarkdown(displayed) }} />
      {!done && (
        <span className="inline-block w-1.5 h-5 bg-accent ml-0.5 animate-typewriter-cursor align-middle" />
      )}
    </div>
  );
}
