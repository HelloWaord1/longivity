'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { consultStack } from '@/lib/api';
import { useProtocol } from '@/lib/ProtocolContext';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content:
    "Let's build your personalized longevity stack. First, what are your primary health goals? (e.g., longevity, cognitive performance, athletic recovery, anti-aging)",
};

// Fallback questions when the API is down
const FALLBACK_QUESTIONS = [
  {
    field: 'goals',
    question:
      "Let's build your personalized longevity stack. First, what are your primary health goals? (e.g., longevity, cognitive performance, athletic recovery, anti-aging)",
  },
  {
    field: 'age',
    question: 'What is your age and biological sex?',
  },
  {
    field: 'budget',
    question:
      'What is your monthly budget for supplements? (e.g., $50, $100, $200+)',
  },
  {
    field: 'currentSupplements',
    question:
      'Are you currently taking any supplements? If so, which ones?',
  },
  {
    field: 'conditions',
    question:
      'Do you have any health conditions, concerns, or allergies we should know about?',
  },
];

function GradeDot({ grade }) {
  const colors = {
    A: 'bg-grade-a',
    B: 'bg-grade-b',
    C: 'bg-grade-c',
    D: 'bg-grade-d',
  };
  const g = (grade || 'D').toUpperCase();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
      <span className={`w-2 h-2 rounded-full ${colors[g] || colors.D}`} />
      {g}
    </span>
  );
}

function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');

  // bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // paragraphs (lines not already wrapped)
  html = html
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<li')
      )
        return trimmed;
      return `<p>${trimmed}</p>`;
    })
    .join('\n');

  // line breaks within paragraphs
  html = html.replace(/\n/g, '<br/>');

  return html;
}

export default function StackPage() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [healthProfile, setHealthProfile] = useState({});
  const [stack, setStack] = useState(null);
  const [protocolSaved, setProtocolSaved] = useState(false);
  const [fallbackStep, setFallbackStep] = useState(0);
  const [useFallback, setUseFallback] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { saveProtocol, isInProtocol } = useProtocol();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, stack]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    if (useFallback) {
      handleFallback(text, newMessages);
      return;
    }

    try {
      const data = await consultStack({
        messages: newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        healthProfile,
      });

      const assistantMessage = {
        role: 'assistant',
        content: data.message,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.healthProfile) {
        setHealthProfile((prev) => ({ ...prev, ...data.healthProfile }));
      }

      if (data.stackReady && data.stack) {
        setStack(data.stack);
      }
    } catch (err) {
      // Switch to fallback mode
      setUseFallback(true);
      handleFallback(text, newMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleFallback = (text, currentMessages) => {
    // Store the answer in the profile
    const currentField = FALLBACK_QUESTIONS[fallbackStep]?.field;
    if (currentField) {
      setHealthProfile((prev) => ({ ...prev, [currentField]: text }));
    }

    const nextStep = fallbackStep + 1;
    setFallbackStep(nextStep);

    if (nextStep < FALLBACK_QUESTIONS.length) {
      const nextQuestion = FALLBACK_QUESTIONS[nextStep].question;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: nextQuestion },
      ]);
    } else {
      // All questions answered — generate a basic recommendation
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Thanks for the information. Generating your personalized stack now...',
        },
      ]);
      generateFallbackStack(text);
    }
    setLoading(false);
  };

  const generateFallbackStack = async (lastAnswer) => {
    // Try to call the /recommend endpoint with collected data
    try {
      const profile = { ...healthProfile, conditions: lastAnswer };
      const budgetMatch = (profile.budget || '').match(/\d+/);
      const budgetNum = budgetMatch ? parseInt(budgetMatch[0], 10) : 100;
      const ageMatch = (profile.age || '').match(/\d+/);
      const ageNum = ageMatch ? parseInt(ageMatch[0], 10) : 30;

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        'https://longivity-production.up.railway.app';
      const res = await fetch(`${API_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: budgetNum,
          age: ageNum,
          goals: (profile.goals || '').split(/[,;]+/).map((g) => g.trim().toLowerCase()),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.stack?.items) {
          const stackItems = data.stack.items.map((item) => ({
            name: item.name,
            slug: item.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, ''),
            dosage: item.dosage,
            monthlyCost: null,
            evidenceGrade: item.evidenceGrade,
            reasoning: item.reasoning,
          }));
          setStack(stackItems);
          setMessages((prev) => [
            ...prev.slice(0, -1),
            {
              role: 'assistant',
              content: `Based on your profile, here is your recommended stack. You can save it as your protocol.`,
            },
          ]);
          return;
        }
      }
    } catch {
      // ignore
    }

    setMessages((prev) => [
      ...prev.slice(0, -1),
      {
        role: 'assistant',
        content:
          'We could not generate a recommendation right now. Please try again later or browse our products page to build your own stack.',
      },
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveAsProtocol = () => {
    const stackItems = (Array.isArray(stack) ? stack : stack?.items || []).map((item) => ({
      name: item.name,
      slug:
        item.slug ||
        item.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      dosage: item.dosage,
      monthlyCost: item.monthlyCost || null,
      evidenceGrade: item.evidenceGrade,
      reasoning: item.reasoning || null,
    }));

    saveProtocol(stackItems, {
      goals: healthProfile.goals || null,
      budget: healthProfile.budget || null,
      age: healthProfile.age || null,
    });

    setProtocolSaved(true);
  };

  const getSlug = (item) =>
    item.slug ||
    item.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <section className="max-w-3xl mx-auto w-full px-4 md:px-6 pt-6 pb-3">
        <h1 className="text-2xl font-semibold text-primary mb-1">
          Build Your Stack
        </h1>
        <p className="text-sm text-secondary">
          Our AI analyzes your health profile to create a personalized longevity
          protocol.
        </p>
      </section>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto w-full space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-bg-hover text-primary'
                    : 'bg-bg-card border border-border text-secondary'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div
                    className="prose-answer text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(msg.content),
                    }}
                  />
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-bg-card border border-border rounded-lg px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
                  <span
                    className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"
                    style={{ animationDelay: '0.4s' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stack results */}
          {stack && (
            <div className="animate-fade-in">
              <div className="space-y-3">
                {(Array.isArray(stack) ? stack : stack.items || []).map(
                  (item, i) => {
                    const slug = getSlug(item);
                    return (
                      <div
                        key={slug + i}
                        className="bg-bg-card border border-border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-tertiary font-medium w-5">
                              {i + 1}.
                            </span>
                            <h3 className="text-sm font-semibold text-primary">
                              {item.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <GradeDot grade={item.evidenceGrade} />
                          </div>
                        </div>

                        {item.dosage && (
                          <p className="text-xs text-secondary ml-8 mb-1">
                            {item.dosage}
                          </p>
                        )}

                        {item.monthlyCost != null && (
                          <p className="text-xs text-tertiary ml-8 mb-1">
                            ${item.monthlyCost}/month
                          </p>
                        )}

                        {item.reasoning && (
                          <p className="text-xs text-tertiary ml-8 leading-relaxed mb-2">
                            {item.reasoning}
                          </p>
                        )}
                      </div>
                    );
                  }
                )}
              </div>

              {/* Save as protocol / View protocol */}
              <div className="mt-6 flex flex-col gap-3">
                {!protocolSaved ? (
                  <button
                    onClick={handleSaveAsProtocol}
                    className="w-full py-3 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors duration-150 min-h-[44px]"
                  >
                    Save as Protocol
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-bg-card border border-accent/30 rounded-lg p-4 text-center">
                      <p className="text-sm text-primary font-medium mb-1">Protocol saved</p>
                      <p className="text-xs text-tertiary">Your stack has been saved as your active protocol.</p>
                    </div>
                    <Link
                      href="/protocol"
                      className="block w-full py-3 text-center bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors duration-150 min-h-[44px]"
                    >
                      View your protocol
                    </Link>
                  </div>
                )}
              </div>

              <p className="text-xs text-tertiary mt-6 leading-relaxed">
                This stack is generated based on available research data. It is
                not medical advice. Consult a healthcare professional before
                starting any supplement regimen.
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {!stack && (
        <div className="border-t border-border bg-bg px-4 md:px-6 py-3">
          <div className="max-w-3xl mx-auto w-full flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              disabled={loading}
              className="flex-1 px-4 py-3 bg-bg-card border border-border rounded-lg text-sm text-primary placeholder-tertiary outline-none focus:border-accent/50 transition-colors duration-150 min-h-[44px]"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 min-h-[44px] shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
