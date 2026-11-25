import React from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import {
  CAST_GALLERY,
  SceneConfig,
  STYLE_PRESETS,
} from '../data/cinephraseDefaults';
import { CastPortrait } from './CharacterPortraits';

interface SceneStepProps {
  scene: SceneConfig;
  onChange: (next: SceneConfig) => void;
  onBack: () => void;
  onNext: () => void;
}

export function SceneStep({ scene, onChange, onBack, onNext }: SceneStepProps) {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-slate-500">
          Step 2 of 5 · World, Cast &amp; Animation Style
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
          Design Your Miniature Story World
        </h1>
        <p className="text-base text-slate-600 max-w-2xl">
          Customize the place, cast, and situation, then choose the visual animation style for your 30-second clip.
        </p>
      </div>

      {/* Style Menu */}
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          Animation Style Preset
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STYLE_PRESETS.map((preset) => {
            const selected = scene.styleId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange({ ...scene, styleId: preset.id })}
                className={`text-left rounded-2xl p-5 border transition-all flex flex-col justify-between gap-3 cursor-pointer min-h-[140px] ${
                  selected
                    ? 'bg-indigo-50/70 border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-indigo-700">
                      {preset.badge}
                    </span>
                    {selected && (
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    {preset.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editable Place, Characters, Situation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          Scene Setup
        </h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Place &amp; Lighting</span>
          <textarea
            rows={2}
            value={scene.place}
            onChange={(e) => onChange({ ...scene, place: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-500 focus:outline-none text-base text-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Characters</span>
          <textarea
            rows={3}
            value={scene.charactersSummary}
            onChange={(e) => onChange({ ...scene, charactersSummary: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-500 focus:outline-none text-base text-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Situation</span>
          <textarea
            rows={3}
            value={scene.situation}
            onChange={(e) => onChange({ ...scene, situation: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-500 focus:outline-none text-base text-slate-900"
          />
        </label>
      </div>

      {/* Collectible Figure Character Gallery */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Collectible Figure Cast (Consistent Across All 4 Beats)
          </h2>
          <p className="text-sm text-slate-600">
            Original sculpted vinyl figure designs with smooth matte-porcelain skin and glossy eyes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAST_GALLERY.map((char) => (
            <div
              key={char.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] w-full overflow-hidden border-b border-slate-100">
                <CastPortrait role={char.role} />
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">{char.tag}</p>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    {char.name}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{char.details}</p>
                <div className="mt-auto pt-2 flex items-center gap-1.5">
                  {char.swatches.map((hex) => (
                    <span
                      key={hex}
                      className="w-4 h-4 rounded-sm border border-slate-200"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[52px] rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-base font-semibold text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Input
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[52px] rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold transition-colors shadow-sm cursor-pointer"
        >
          Next: Edit Storyboard
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
