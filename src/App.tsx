import React, { useState } from 'react';
import {
  BookOpen,
  Palette,
  LayoutList,
  Film,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_EXPRESSIONS,
  DEFAULT_SCENE_CONFIG,
  DEFAULT_STORYBOARD,
  PhraseItem,
  SceneConfig,
  StoryboardBeat,
} from './data/cinephraseDefaults';
import { InputStep } from './components/InputStep';
import { SceneStep } from './components/SceneStep';
import { StoryboardStep } from './components/StoryboardStep';
import { VideoStep } from './components/VideoStep';
import { FinalStep } from './components/FinalStep';

type StepId = 'input' | 'scene' | 'storyboard' | 'video' | 'final';

const STEPS: Array<{
  id: StepId;
  shortLabel: string;
  navLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'input', shortLabel: 'Input', navLabel: '1. Input', icon: BookOpen },
  { id: 'scene', shortLabel: 'Scene', navLabel: '2. Scene', icon: Palette },
  { id: 'storyboard', shortLabel: 'Story', navLabel: '3. Storyboard', icon: LayoutList },
  { id: 'video', shortLabel: 'Video', navLabel: '4. Video', icon: Film },
  { id: 'final', shortLabel: 'Final', navLabel: '5. Final', icon: Sparkles },
];

export default function App() {
  const [step, setStep] = useState<StepId>('input');
  const [expressions, setExpressions] = useState<PhraseItem[]>(DEFAULT_EXPRESSIONS);
  const [scene, setScene] = useState<SceneConfig>(DEFAULT_SCENE_CONFIG);
  const [beats, setBeats] = useState<StoryboardBeat[]>(DEFAULT_STORYBOARD);

  const goToStep = (next: StepId) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-slate-900 flex flex-col pb-20 md:pb-0">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => goToStep('input')}
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            CinePhrase
          </button>

          <nav
            aria-label="CinePhrase workflow steps"
            className="hidden md:flex items-center gap-6 text-sm font-semibold"
          >
            {STEPS.map((s) => {
              const active = step === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToStep(s.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-indigo-600 underline decoration-2 underline-offset-8'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s.navLabel}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => goToStep(step === 'video' ? 'final' : 'video')}
              className="px-4 py-2.5 min-h-[42px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {step === 'video' ? 'Final Screen' : 'Preview 30s Film'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {step === 'input' && (
          <InputStep
            expressions={expressions}
            onChange={setExpressions}
            onNext={() => goToStep('scene')}
          />
        )}

        {step === 'scene' && (
          <SceneStep
            scene={scene}
            onChange={setScene}
            onBack={() => goToStep('input')}
            onNext={() => goToStep('storyboard')}
          />
        )}

        {step === 'storyboard' && (
          <StoryboardStep
            beats={beats}
            expressions={expressions}
            scene={scene}
            onChange={setBeats}
            onBack={() => goToStep('scene')}
            onNext={() => goToStep('video')}
          />
        )}

        {step === 'video' && (
          <VideoStep
            beats={beats}
            expressions={expressions}
            styleId={scene.styleId}
            onBack={() => goToStep('storyboard')}
            onNext={() => goToStep('final')}
          />
        )}

        {step === 'final' && (
          <FinalStep
            beats={beats}
            expressions={expressions}
            styleId={scene.styleId}
            onBack={() => goToStep('video')}
            onRestartFlow={() => goToStep('input')}
          />
        )}
      </main>

      {/* Desktop Footer */}
      <footer className="hidden md:block border-t border-slate-200 bg-white py-5 px-6">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between text-sm text-slate-500">
          <span>CinePhrase · Movie Expressions to 30s Animated Short Film</span>
          <span>Made with Google AI Studio · Script by 장지원</span>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb-Zone) */}
      <nav
        aria-label="Mobile screen navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center"
      >
        {STEPS.map((s) => {
          const Icon = s.icon;
          const active = step === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goToStep(s.id)}
              className={`flex flex-col items-center justify-center h-full gap-1 cursor-pointer ${
                active ? 'text-indigo-600 font-semibold' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] leading-none">{s.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
