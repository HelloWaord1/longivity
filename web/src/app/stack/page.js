'use client';

import { useState } from 'react';
import { getRecommendation } from '@/lib/api';
import LoadingPulse from '@/components/LoadingPulse';

const GOALS = [
  { id: 'longevity', label: 'Longevity', desc: 'Maximize healthspan and lifespan' },
  { id: 'cognitive', label: 'Cognitive', desc: 'Brain health and performance' },
  { id: 'athletic', label: 'Athletic', desc: 'Physical performance and recovery' },
  { id: 'anti-aging', label: 'Anti-aging', desc: 'Skin, appearance, vitality' },
];

function GradeDot({ grade }) {
  const colors = { A: 'bg-grade-a', B: 'bg-grade-b', C: 'bg-grade-c', D: 'bg-grade-d' };
  const g = (grade || 'D').toUpperCase();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
      <span className={`w-2 h-2 rounded-full ${colors[g] || colors.D}`} />
      {g}
    </span>
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
      const data = await getRecommendation({ budget, age, goals: selectedGoals });
      setStack(data.stack);
    } catch (err) {
      setError('Failed to generate stack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <section className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-6">
        <h1 className="text-2xl font-semibold text-primary mb-1">Stack Builder</h1>
        <p className="text-sm text-secondary">
          Get a personalized supplement stack based on your budget, age, and goals.
        </p>
      </section>

      <div className="max-w-3xl mx-auto px-4 md:px-6 pb-16">
        {/* Form */}
        <div className="bg-bg-card border border-border rounded-lg p-5 md:p-6 mb-8">
          {/* Budget */}
          <div className="mb-6">
            <label className="text-xs font-medium text-tertiary uppercase tracking-wider block mb-3">
              Monthly budget
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="flex-1 h-1 bg-bg-hover rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <span className="text-sm font-medium text-primary w-16 text-right">${budget}/mo</span>
            </div>
          </div>

          {/* Age */}
          <div className="mb-6">
            <label className="text-xs font-medium text-tertiary uppercase tracking-wider block mb-3">
              Age
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={18}
                max={85}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="flex-1 h-1 bg-bg-hover rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <span className="text-sm font-medium text-primary w-16 text-right">{age} yrs</span>
            </div>
          </div>

          {/* Goals */}
          <div className="mb-6">
            <label className="text-xs font-medium text-tertiary uppercase tracking-wider block mb-3">
              Goals
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GOALS.map((goal) => {
                const active = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors duration-150 ${
                      active
                        ? 'border-accent/40 bg-accent/5'
                        : 'border-border hover:bg-bg-hover'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      active ? 'bg-accent border-accent' : 'border-tertiary'
                    }`}>
                      {active && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="3" strokeLinecap="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-primary">{goal.label}</div>
                      <div className="text-xs text-tertiary">{goal.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={loading || selectedGoals.length === 0}
            className="w-full py-3 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {loading ? 'Building stack...' : 'Generate stack'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 border border-grade-d/30 rounded-lg mb-6">
            <p className="text-sm text-grade-d">{error}</p>
          </div>
        )}

        {/* Results */}
        {stack && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-primary">Your Stack</h2>
                <p className="text-xs text-tertiary mt-0.5">
                  {stack.itemCount} products · ${stack.monthlyBudget}/month
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {stack.items?.map((item, i) => (
                <div key={item.name} className="bg-bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-tertiary font-medium w-5">{i + 1}.</span>
                      <h3 className="text-sm font-semibold text-primary">{item.name}</h3>
                    </div>
                    <GradeDot grade={item.evidenceGrade} />
                  </div>

                  {item.dosage && (
                    <p className="text-xs text-secondary ml-8 mb-1">{item.dosage}</p>
                  )}

                  {item.reasoning && (
                    <p className="text-xs text-tertiary ml-8 leading-relaxed">{item.reasoning}</p>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-tertiary mt-6 leading-relaxed">
              This stack is generated based on available research data. It is not medical advice.
              Consult a healthcare professional before starting any supplement regimen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
