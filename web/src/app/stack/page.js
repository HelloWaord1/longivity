'use client';

import { useState } from 'react';
import { getRecommendation, getGradeColor, getCategoryEmoji } from '@/lib/api';
import LoadingPulse from '@/components/LoadingPulse';

const GOALS = [
  { id: 'longevity', label: 'Longevity', emoji: '🧬', desc: 'Maximize healthspan & lifespan' },
  { id: 'cognitive', label: 'Cognitive', emoji: '🧠', desc: 'Brain health & performance' },
  { id: 'athletic', label: 'Athletic', emoji: '💪', desc: 'Physical performance & recovery' },
  { id: 'anti-aging', label: 'Anti-Aging', emoji: '✨', desc: 'Skin, appearance, vitality' },
];

const BUDGET_PRESETS = [
  { value: 30, label: '$30/mo', tier: 'Essential' },
  { value: 50, label: '$50/mo', tier: 'Standard' },
  { value: 100, label: '$100/mo', tier: 'Premium' },
  { value: 200, label: '$200/mo', tier: 'Advanced' },
  { value: 500, label: '$500/mo', tier: 'Comprehensive' },
];

function StackItem({ item, index }) {
  const grade = getGradeColor(item.evidenceGrade);
  const emoji = getCategoryEmoji(item.category);

  return (
    <div
      className="glass-card-hover p-5 animate-fade-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Number badge */}
        <div className="shrink-0 w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent font-bold text-lg">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-white">{item.name}</h3>
            <span className={`grade-badge ${grade.class} shrink-0`}>
              Grade {item.evidenceGrade}
            </span>
          </div>

          {/* Category + Dosage */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="category-badge">
              {emoji} {item.category}
            </span>
            {item.dosage && (
              <span className="text-sm text-accent flex items-center gap-1.5">
                💊 {item.dosage}
              </span>
            )}
          </div>

          {/* Reasoning */}
          {item.reasoning && (
            <p className="text-sm text-muted leading-relaxed">
              {item.reasoning}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StackPage() {
  const [budget, setBudget] = useState(100);
  const [age, setAge] = useState(30);
  const [selectedGoals, setSelectedGoals] = useState(['longevity']);
  const [stack, setStack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleGoal = (goalId) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleGenerate = async () => {
    if (selectedGoals.length === 0) return;
    
    setLoading(true);
    setError(null);
    setStack(null);

    try {
      const data = await getRecommendation({
        budget,
        age,
        goals: selectedGoals,
      });
      setStack(data.stack);
    } catch (err) {
      setError('Failed to generate stack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8 relative">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🧪</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Stack Builder</h1>
          </div>
          <p className="text-muted max-w-2xl">
            Get a personalized longevity supplement stack optimized for your budget, age, and goals.
            Every recommendation is backed by evidence-graded research.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        {/* Configuration card */}
        <div className="glass-card p-6 sm:p-8 mb-8">
          {/* Budget */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-white mb-4">
              Monthly Budget
            </label>
            
            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setBudget(preset.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    budget === preset.value
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'bg-bg-hover border border-border/50 text-muted hover:text-white hover:border-border'
                  }`}
                >
                  {preset.label}
                  <span className="text-[10px] ml-1.5 opacity-60">{preset.tier}</span>
                </button>
              ))}
            </div>

            {/* Slider */}
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={10}
                max={1000}
                step={10}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="flex-1 h-2 bg-bg-hover rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                           [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.3)]"
              />
              <div className="flex items-center gap-1 bg-bg-hover px-4 py-2 rounded-xl min-w-[100px]">
                <span className="text-accent font-bold text-lg">${budget}</span>
                <span className="text-muted text-xs">/mo</span>
              </div>
            </div>
          </div>

          {/* Age */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-white mb-4">
              Age
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={18}
                max={85}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="flex-1 h-2 bg-bg-hover rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                           [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.3)]"
              />
              <div className="bg-bg-hover px-4 py-2 rounded-xl min-w-[80px] text-center">
                <span className="text-white font-bold text-lg">{age}</span>
                <span className="text-muted text-xs ml-1">yrs</span>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-white mb-4">
              Goals <span className="text-muted font-normal">(select one or more)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GOALS.map((goal) => {
                const active = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
                      active
                        ? 'border-accent/30 bg-accent/5'
                        : 'border-border/50 bg-bg-hover hover:border-border'
                    }`}
                  >
                    <span className="text-2xl">{goal.emoji}</span>
                    <div>
                      <div className={`font-medium ${active ? 'text-accent' : 'text-white'}`}>
                        {goal.label}
                      </div>
                      <div className="text-xs text-muted">{goal.desc}</div>
                    </div>
                    {active && (
                      <div className="ml-auto">
                        <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-[#0a0a0f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || selectedGoals.length === 0}
            className="w-full btn-primary text-lg py-4 disabled:opacity-40 disabled:cursor-not-allowed
                       flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-[#0a0a0f]/30 border-t-[#0a0a0f] rounded-full animate-spin" />
                Building your stack...
              </>
            ) : (
              <>
                🧪 Generate Personalized Stack
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="glass-card p-4 border-grade-d/30 mb-8">
            <p className="text-grade-d text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {stack && (
          <div className="animate-fade-up">
            {/* Stack header */}
            <div className="glass-card p-6 mb-6 glow-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Your {stack.tier} Stack
                  </h2>
                  <p className="text-muted text-sm">
                    {stack.itemCount} products optimized for ${stack.monthlyBudget}/month
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center px-4 py-2 bg-bg-hover rounded-xl">
                    <div className="text-accent font-bold text-lg">{stack.itemCount}</div>
                    <div className="text-[10px] text-muted">Products</div>
                  </div>
                  <div className="text-center px-4 py-2 bg-bg-hover rounded-xl">
                    <div className="text-accent font-bold text-lg">${stack.monthlyBudget}</div>
                    <div className="text-[10px] text-muted">Monthly</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stack items */}
            <div className="space-y-4">
              {stack.items?.map((item, i) => (
                <StackItem key={item.name} item={item} index={i} />
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mt-8 p-4 bg-bg-card/50 rounded-xl border border-border/30">
              <p className="text-xs text-muted/60 leading-relaxed">
                ⚠️ This stack is generated by AI based on available research data. It is not medical advice. 
                Individual responses to supplements vary. Consult a healthcare professional before starting 
                any supplement regimen, especially if you have existing health conditions or take medications.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
