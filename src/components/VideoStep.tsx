import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CinePhrasePlayer } from './CinePhrasePlayer';
import {
  AnimationStyleId,
  PhraseItem,
  STYLE_PRESETS,
  StoryboardBeat,
} from '../data/cinephraseDefaults';

interface VideoStepProps {
  beats: StoryboardBeat[];
  expressions: PhraseItem[];
  styleId: AnimationStyleId;
  onBack: () => void;
  onNext: () => void;
}

export function VideoStep({
  beats,
  expressions,
  styleId,
  onBack,
  onNext,
}: VideoStepProps) {
  const activeStyle =
    STYLE_PRESETS.find((s) => s.id === styleId)?.name ||
    '3D Collectible Figure Animation';

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-slate-500">
          Step 4 of 5 · 4-Beat Sequential Video &amp; Tight Sync
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
          Watch Your 30-Second Clip in {activeStyle}
        </h1>
        <p className="text-base text-slate-600 max-w-2xl">
          All four beats play in order with 135–145 WPM English voices, “Mistletoe in Midtown” at low background volume, and word-for-word burned-in subtitles.
        </p>
      </div>

      <CinePhrasePlayer
        beats={beats}
        expressions={expressions}
        styleId={styleId}
        mode="video"
      />

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[52px] rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-base font-semibold text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Storyboard
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[52px] rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold transition-colors shadow-sm cursor-pointer"
        >
          Next: Final Screen &amp; Download
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
