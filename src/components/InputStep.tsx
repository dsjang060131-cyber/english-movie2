import React from 'react';
import { AlertTriangle, Plus, Trash2, ArrowRight, RotateCcw } from 'lucide-react';
import { DEFAULT_EXPRESSIONS, PhraseItem } from '../data/cinephraseDefaults';

interface InputStepProps {
  expressions: PhraseItem[];
  onChange: (next: PhraseItem[]) => void;
  onNext: () => void;
}

export function InputStep({ expressions, onChange, onNext }: InputStepProps) {
  const filledCount = expressions.filter((e) => e.expression.trim().length > 0).length;
  const distinctMovies = new Set(
    expressions
      .map((e) => e.movie.trim().toLowerCase())
      .filter((m) => m.length > 0)
  );

  const tooFewExpressions = filledCount < 5;
  const onlyOneMovie = distinctMovies.size <= 1;
  const hasWarning = tooFewExpressions || onlyOneMovie;

  const updateItem = (id: string, field: keyof PhraseItem, value: string) => {
    onChange(expressions.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addExpression = () => {
    onChange([
      ...expressions,
      {
        id: `expr-${Date.now()}`,
        expression: '',
        meaning: '',
        movie: '',
      },
    ]);
  };

  const removeExpression = (id: string) => {
    onChange(expressions.filter((item) => item.id !== id));
  };

  const resetDefaults = () => {
    onChange(DEFAULT_EXPRESSIONS);
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-slate-500">
            Step 1 of 5 · Expression Input
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Movie Expressions You Want to Speak
          </h1>
          <p className="text-base text-slate-600 max-w-2xl">
            Add at least 5 English expressions from 2 or more movies. We will weave them naturally into your 30-second animated clip.
          </p>
        </div>

        <button
          type="button"
          onClick={resetDefaults}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Reset 6 Defaults
        </button>
      </div>

      {/* Warning Banner when < 5 expressions or <= 1 movie */}
      {hasWarning && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 flex items-start gap-3 text-amber-950"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-sm sm:text-base">
            <p className="font-semibold">Heads up before building your story</p>
            <ul className="list-disc pl-5 space-y-0.5 text-amber-900">
              {tooFewExpressions && (
                <li>
                  You currently have {filledCount} expression{filledCount === 1 ? '' : 's'}. Please enter at least 5 expressions.
                </li>
              )}
              {onlyOneMovie && (
                <li>
                  You only have {distinctMovies.size} movie listed. Mix expressions from at least 2 different movies for a richer crossover story.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Expression Cards List */}
      <div className="flex flex-col gap-4">
        {expressions.map((item, idx) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 shadow-xs"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-500 font-mono tabular-nums">
                Expression {String(idx + 1).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => removeExpression(item.id)}
                aria-label={`Remove expression ${idx + 1}`}
                className="inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-xl text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <label className="md:col-span-5 flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">English Expression</span>
                <input
                  type="text"
                  value={item.expression}
                  onChange={(e) => updateItem(item.id, 'expression', e.target.value)}
                  placeholder="e.g., Everything feels kind of meh today."
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-500 focus:outline-none text-base font-medium text-slate-900"
                />
              </label>

              <label className="md:col-span-4 flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Korean Meaning</span>
                <input
                  type="text"
                  value={item.meaning}
                  onChange={(e) => updateItem(item.id, 'meaning', e.target.value)}
                  placeholder="예: 오늘은 왠지 모든 게 시큰둥하네."
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-500 focus:outline-none text-base text-slate-800"
                />
              </label>

              <label className="md:col-span-3 flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Movie Title</span>
                <input
                  type="text"
                  value={item.movie}
                  onChange={(e) => updateItem(item.id, 'movie', e.target.value)}
                  placeholder="e.g., Inside Out"
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-500 focus:outline-none text-base text-slate-800"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={addExpression}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[52px] rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-base font-semibold text-slate-800 transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Expression
        </button>

        <div className="flex items-center justify-between sm:justify-end gap-4">
          <span className="text-sm text-slate-500 font-medium tabular-nums">
            {filledCount} expressions · {distinctMovies.size} {distinctMovies.size === 1 ? 'movie' : 'movies'}
          </span>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[52px] rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold transition-colors shadow-sm cursor-pointer"
          >
            Next: Scene &amp; Style
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
