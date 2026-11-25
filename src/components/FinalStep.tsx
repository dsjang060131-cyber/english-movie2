import React, { useMemo, useRef } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { CinePhrasePlayer } from './CinePhrasePlayer';
import {
  AnimationStyleId,
  PhraseItem,
  StoryboardBeat,
  computeTightTimeline,
} from '../data/cinephraseDefaults';

interface FinalStepProps {
  beats: StoryboardBeat[];
  expressions: PhraseItem[];
  styleId: AnimationStyleId;
  onBack: () => void;
  onRestartFlow: () => void;
}

export function FinalStep({
  beats,
  expressions,
  styleId,
  onBack,
  onRestartFlow,
}: FinalStepProps) {
  const jumpRef = useRef<(sec: number) => void>(() => {});
  const timeline = useMemo(() => computeTightTimeline(beats), [beats]);

  const findTimeForExpression = (expr: string): number => {
    const normalizeQ = (s: string) =>
      s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
    const clean = normalizeQ(expr).trim().replace(/[.,!?]+$/, '').toLowerCase();
    if (!clean) return 0;
    const match = timeline.find((line) =>
      normalizeQ(line.text).toLowerCase().includes(clean)
    );
    return match ? match.startSec : 0;
  };

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-slate-500">
          Step 5 of 5 · Final Film &amp; Expression Review
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
          Your 30-Second CinePhrase Film Is Ready
        </h1>
        <p className="text-base text-slate-600 max-w-2xl">
          Play your completed film, download it with burned-in subtitles and music, or tap any expression below to jump straight to that moment.
        </p>
      </div>

      <CinePhrasePlayer
        beats={beats}
        expressions={expressions}
        styleId={styleId}
        mode="final"
        externalJumpRef={jumpRef}
      />

      {/* Expression Study Cards */}
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Expression Review Cards
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expressions
            .filter((e) => e.expression.trim().length > 0)
            .map((item) => {
              const sec = findTimeForExpression(item.expression);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    jumpRef.current(sec);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-left bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-5 flex flex-col justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{item.movie || 'Movie Clip'}</span>
                      <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {sec.toFixed(1)}s
                      </span>
                    </div>
                    <p className="font-display text-lg font-bold text-slate-900">
                      “{item.expression}”
                    </p>
                    <p className="text-sm text-slate-600">{item.meaning}</p>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Required Credit Line */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center">
        <p className="font-display text-base sm:text-lg font-semibold text-slate-800">
          Made with Google AI Studio · Script by 장지원
        </p>
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[52px] rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-base font-semibold text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Video
        </button>

        <button
          type="button"
          onClick={onRestartFlow}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[52px] rounded-2xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-base font-semibold transition-colors cursor-pointer"
        >
          Edit Expressions &amp; Create Another
        </button>
      </div>
    </section>
  );
}
