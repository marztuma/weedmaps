'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const EFFECTS_OPTIONS = [
  'Relaxed', 'Happy', 'Energetic', 'Creative', 'Focused',
  'Sleepy', 'Uplifted', 'Calm', 'Euphoric', 'Pain Relief'
];

const POTENCY_LEVELS = [
  { value: 0, label: 'Low (0-10% THC)' },
  { value: 1, label: 'Medium (10-20% THC)' },
  { value: 2, label: 'High (20%+ THC)' },
];

const USAGE_TIMES = [
  { value: 'morning', label: '☀️ Morning', categories: ['flower', 'vape'] },
  { value: 'afternoon', label: '🌤️ Afternoon', categories: ['flower', 'vape'] },
  { value: 'evening', label: '🌙 Evening', categories: ['flower', 'edibles', 'vape'] },
  { value: 'night', label: '🌃 Before Bed', categories: ['edibles', 'flower'] },
];

const BUDGETS = [
  { value: 1500, label: 'Budget ($0-15)' },
  { value: 2500, label: 'Mid-range ($15-25)' },
  { value: 5000, label: 'Premium ($25+)' },
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'First-time user', maxThc: 10 },
  { value: 'occasional', label: 'Occasional consumer', maxThc: 20 },
  { value: 'regular', label: 'Regular consumer', maxThc: 100 },
];

export default function StrainQuiz({ products = [] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    effects: [],
    potency: null,
    time: null,
    budget: null,
    experience: null,
  });
  const [results, setResults] = useState(null);

  const updateAnswer = (key, value, isMulti = false) => {
    setAnswers(prev => ({
      ...prev,
      [key]: isMulti
        ? prev[key].includes(value)
          ? prev[key].filter(e => e !== value)
          : [...prev[key], value]
        : value
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return answers.effects.length > 0;
      case 1: return answers.potency !== null;
      case 2: return answers.time !== null;
      case 3: return answers.budget !== null;
      case 4: return answers.experience !== null;
      default: return false;
    }
  };

  const getMatches = () => {
    if (step < 5) return [];

    const usageTime = USAGE_TIMES.find(t => t.value === answers.time);
    const experience = EXPERIENCE_LEVELS.find(e => e.value === answers.experience);
    const potencyLevel = POTENCY_LEVELS[answers.potency];

    const potencyRanges = [
      { min: 0, max: 10 },
      { min: 10, max: 20 },
      { min: 20, max: 100 },
    ];
    const range = potencyRanges[answers.potency];

    let matched = products.filter(p => {
      // Match effects (case-insensitive)
      const hasEffect = answers.effects.some(e =>
        p.effects?.some(pEffect => pEffect.toLowerCase() === e.toLowerCase())
      );
      if (!hasEffect) return false;

      // Match THC range
      if (p.thc < range.min || p.thc > range.max) return false;

      // Match experience level max THC
      if (p.thc > experience.maxThc) return false;

      // Match budget
      if (p.price > answers.budget / 100) return false;

      // Match category for usage time
      if (!usageTime.categories.includes(p.category)) return false;

      return true;
    });

    // Sort by rating/relevance and return top 6
    return matched
      .sort((a, b) => {
        // Prioritize products with more matching effects
        const aMatchCount = answers.effects.filter(e =>
          a.effects?.some(pe => pe.toLowerCase() === e.toLowerCase())
        ).length;
        const bMatchCount = answers.effects.filter(e =>
          b.effects?.some(pe => pe.toLowerCase() === e.toLowerCase())
        ).length;
        return bMatchCount - aMatchCount;
      })
      .slice(0, 6);
  };

  const matched = getMatches();

  if (results) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-linen to-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Your Perfect Strain Match</h1>
            <p className="text-lg text-gray-600">Based on your preferences</p>
          </div>

          {matched.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-4">No products match your preferences right now.</p>
              <button
                onClick={() => { setStep(0); setResults(null); }}
                className="inline-block px-6 py-2 bg-orange text-white rounded-full hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4">
                {matched.map(product => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.brand}</p>
                        <div className="flex gap-3 mt-2 flex-wrap">
                          <span className="text-sm bg-orange/10 text-orange px-2 py-1 rounded">
                            THC: {product.thc}%
                          </span>
                          {product.effects?.slice(0, 2).map((effect, i) => (
                            <span key={i} className="text-sm bg-purple/10 text-purple px-2 py-1 rounded">
                              {effect}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange">${product.price}</div>
                        <Link
                          href={`/product/${product.slug}`}
                          className="mt-3 inline-block px-4 py-2 bg-orange text-white text-sm rounded-full hover:opacity-90 transition-opacity"
                        >
                          View Product
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-6 border-t">
                <button
                  onClick={() => { setStep(0); setResults(null); }}
                  className="text-orange hover:underline font-medium"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const questions = [
    {
      title: 'What effects are you looking for?',
      subtitle: 'Select all that apply',
      type: 'multi',
      key: 'effects',
      options: EFFECTS_OPTIONS.map(e => ({ label: e, value: e })),
    },
    {
      title: 'What potency level do you prefer?',
      subtitle: 'Choose your comfort zone',
      type: 'single',
      key: 'potency',
      options: POTENCY_LEVELS.map(p => ({ label: p.label, value: p.value })),
    },
    {
      title: 'When do you want to use it?',
      subtitle: 'Time of day matters',
      type: 'single',
      key: 'time',
      options: USAGE_TIMES.map(t => ({ label: t.label, value: t.value })),
    },
    {
      title: 'What\'s your budget?',
      subtitle: 'Per product',
      type: 'single',
      key: 'budget',
      options: BUDGETS.map(b => ({ label: b.label, value: b.value })),
    },
    {
      title: 'What\'s your experience level?',
      subtitle: 'Helps us recommend the right potency',
      type: 'single',
      key: 'experience',
      options: EXPERIENCE_LEVELS.map(e => ({ label: e.label, value: e.value })),
    },
  ];

  const question = questions[step];
  const answerKey = question.key;
  const currentAnswer = answers[answerKey];

  return (
    <div className="min-h-screen bg-gradient-to-b from-linen to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Progress */}
        <div className="mb-12">
          <div className="flex gap-1 mb-4">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-orange' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600">Question {step + 1} of {questions.length}</p>
        </div>

        {/* Question */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-2">{question.title}</h2>
          <p className="text-gray-600">{question.subtitle}</p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-12">
          {question.options.map((option) => {
            const isSelected = question.type === 'multi'
              ? currentAnswer.includes(option.value)
              : currentAnswer === option.value;

            return (
              <button
                key={option.value}
                onClick={() => updateAnswer(answerKey, option.value, question.type === 'multi')}
                className={`w-full p-4 rounded-lg border-2 text-left font-medium transition-all ${
                  isSelected
                    ? 'border-orange bg-orange/5 text-orange'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-orange/30'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="px-6 py-3 border border-gray-300 rounded-full font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => {
              if (step < questions.length - 1) {
                setStep(step + 1);
              } else {
                setResults(true);
              }
            }}
            disabled={!canProceed()}
            className="flex-1 px-6 py-3 bg-orange text-white rounded-full font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {step === questions.length - 1 ? 'See My Results' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
