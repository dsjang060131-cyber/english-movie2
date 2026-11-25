import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Pencil,
  Check,
  RefreshCw,
  RotateCcw,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  DEFAULT_STORYBOARD,
  PhraseItem,
  SceneConfig,
  STYLE_PRESETS,
  StoryboardBeat,
  VoiceRole,
  getRoleAccent,
} from '../data/cinephraseDefaults';

interface StoryboardStepProps {
  beats: StoryboardBeat[];
  expressions: PhraseItem[];
  scene: SceneConfig;
  onChange: (next: StoryboardBeat[]) => void;
  onBack: () => void;
  onNext: () => void;
}

const VOICE_ROLE_OPTIONS: Array<{ value: VoiceRole; label: string }> = [
  { value: 'yellow', label: 'Yellow figure' },
  { value: 'green', label: 'Green figure' },
  { value: 'purple', label: 'Purple figure' },
  { value: 'red', label: 'Red figure' },
  { value: 'male_lead', label: 'Male Lead' },
  { value: 'female_lead', label: 'Female Protagonist' },
];

export function StoryboardStep({
  beats,
  expressions,
  scene,
  onChange,
  onBack,
  onNext,
}: StoryboardStepProps) {
  const [editingBeatId, setEditingBeatId] = useState<string | null>(null);
  const [regeneratingBeatId, setRegeneratingBeatId] = useState<string | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);

  const allDialogueText = beats
    .flatMap((b) => b.lines.map((l) => l.text))
    .join(' ');
  const totalWordCount = allDialogueText.trim().split(/\s+/).filter(Boolean).length;

  const activeExpressions = expressions
    .map((e) => e.expression.trim())
    .filter(Boolean);

  const normalizeQ = (s: string) =>
    s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');

  const matchedExpressions = activeExpressions.filter((expr) => {
    const clean = normalizeQ(expr).replace(/[.,!?]+$/, '').toLowerCase();
    return normalizeQ(allDialogueText).toLowerCase().includes(clean);
  });

  const updateBeatScene = (beatId: string, sceneDescription: string) => {
    onChange(beats.map((b) => (b.id === beatId ? { ...b, sceneDescription } : b)));
  };

  const updateLine = (
    beatId: string,
    lineId: string,
    patch: Partial<{ speaker: string; voiceRole: VoiceRole; text: string }>
  ) => {
    onChange(
      beats.map((b) =>
        b.id === beatId
          ? {
              ...b,
              lines: b.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
            }
          : b
      )
    );
  };

  const addLine = (beatId: string) => {
    onChange(
      beats.map((b) =>
        b.id === beatId
          ? {
              ...b,
              lines: [
                ...b.lines,
                {
                  id: `${beatId}-l-${Date.now()}`,
                  speaker: 'Female Protagonist',
                  voiceRole: 'female_lead',
                  text: 'New line here.',
                },
              ],
            }
          : b
      )
    );
  };

  const removeLine = (beatId: string, lineId: string) => {
    onChange(
      beats.map((b) =>
        b.id === beatId
          ? { ...b, lines: b.lines.filter((l) => l.id !== lineId) }
          : b
      )
    );
  };

  const handleRegenerateBeat = async (beat: StoryboardBeat) => {
    setRegeneratingBeatId(beat.id);
    setRegenError(null);
    try {
      const styleName =
        STYLE_PRESETS.find((s) => s.id === scene.styleId)?.name ||
        '3D Collectible Figure Animation';
      const otherBeatsSummary = beats
        .filter((b) => b.id !== beat.id)
        .map(
          (b) =>
            `Beat ${b.beatNumber} (${b.title}): ${b.lines.map((l) => `${l.speaker}: "${l.text}"`).join(' / ')}`
        )
        .join('\n');

      const res = await fetch('/api/storyboard/regenerate-beat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beatNumber: beat.beatNumber,
          beatLabel: beat.title,
          timeRange: beat.timeRange,
          place: scene.place,
          situation: scene.situation,
          styleName,
          expressions: expressions.filter((e) => e.expression.trim()),
          otherBeatsSummary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to regenerate beat');
      }

      const validRoles = new Set<VoiceRole>([
        'yellow',
        'green',
        'purple',
        'red',
        'female_lead',
        'male_lead',
      ]);

      const nextLines = Array.isArray(data.lines)
        ? data.lines.map(
            (
              l: { speaker?: string; voiceRole?: string; text?: string },
              idx: number
            ) => ({
              id: `${beat.id}-r-${Date.now()}-${idx}`,
              speaker: l.speaker || 'Female Protagonist',
              voiceRole: validRoles.has(l.voiceRole as VoiceRole)
                ? (l.voiceRole as VoiceRole)
                : 'female_lead',
              text: l.text || '',
            })
          )
        : beat.lines;

      onChange(
        beats.map((b) =>
          b.id === beat.id
            ? {
                ...b,
                sceneDescription: data.sceneDescription || b.sceneDescription,
                lines: nextLines,
              }
            : b
        )
      );
    } catch (err) {
      setRegenError(
        err instanceof Error ? err.message : 'Failed to regenerate beat'
      );
    } finally {
      setRegeneratingBeatId(null);
    }
  };

  const renderHighlightedLine = (text: string) => {
    const cleanText = text.replace(/\*\*/g, '');
    const lower = normalizeQ(cleanText).toLowerCase();
    for (const expr of activeExpressions) {
      const cleanExpr = normalizeQ(expr).replace(/[.,!?]+$/, '');
      const idx = lower.indexOf(cleanExpr.toLowerCase());
      if (idx >= 0) {
        const before = cleanText.slice(0, idx);
        const match = cleanText.slice(idx, idx + cleanExpr.length);
        const after = cleanText.slice(idx + cleanExpr.length);
        return (
          <>
            {before}
            <mark className="bg-amber-200/80 text-slate-950 px-1 rounded font-bold">
              {match}
            </mark>
            {after}
          </>
        );
      }
    }
    return cleanText;
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-slate-500">
            Step 3 of 5 · 30-Second Storyboard (4 Beats)
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Review, Edit, or Regenerate Your 4 Beats
          </h1>
          <p className="text-base text-slate-600 max-w-2xl">
            Every target expression is highlighted. Keep total spoken dialogue around 60–70 words for tight 135–145 WPM audio-visual sync.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChange(DEFAULT_STORYBOARD)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Default Script
        </button>
      </div>

      {/* Live Dialogue Metrics Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4 text-sm">
        <div className="flex flex-wrap items-center gap-4 text-slate-700">
          <span>
            <strong className="font-semibold text-slate-900 tabular-nums">
              {totalWordCount} words
            </strong>{' '}
            spoken (target 60–70 words)
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span>
            <strong className="font-semibold text-slate-900 tabular-nums">
              {matchedExpressions.length} / {activeExpressions.length}
            </strong>{' '}
            expressions included verbatim
          </span>
        </div>

        <span className="text-slate-500 font-mono tabular-nums">
          0:00 – 0:30 · 4 Beats
        </span>
      </div>

      {regenError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-800">
          {regenError}
        </div>
      )}

      {/* 4 Beat Cards */}
      <div className="flex flex-col gap-5">
        {beats.map((beat) => {
          const isEditing = editingBeatId === beat.id;
          const isRegenerating = regeneratingBeatId === beat.id;

          return (
            <article
              key={beat.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-bold text-slate-900">
                    Beat {beat.beatNumber}: {beat.title}
                  </span>
                  <span className="text-sm font-mono tabular-nums text-indigo-700 font-semibold">
                    {beat.timeRange}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingBeatId(isEditing ? null : beat.id)
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    {isEditing ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        Done
                      </>
                    ) : (
                      <>
                        <Pencil className="w-4 h-4" />
                        Edit Beat
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleRegenerateBeat(beat)}
                    disabled={isRegenerating}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-sm font-medium text-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`}
                    />
                    {isRegenerating ? 'Regenerating…' : 'Regenerate Beat'}
                  </button>
                </div>
              </div>

              {/* Scene Description */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  Scene &amp; Camera Direction
                </span>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={beat.sceneDescription}
                    onChange={(e) => updateBeatScene(beat.id, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none text-base text-slate-800"
                  />
                ) : (
                  <p className="text-base leading-relaxed text-slate-700">
                    {beat.sceneDescription}
                  </p>
                )}
              </div>

              {/* Lines & Subtitles */}
              <div className="flex flex-col gap-2.5 pt-1">
                <span className="text-xs font-semibold text-slate-500">
                  English Lines &amp; Burned-in Subtitles
                </span>

                <div className="flex flex-col gap-3">
                  {beat.lines.map((line) => (
                    <div
                      key={line.id}
                      className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 flex flex-col gap-2"
                    >
                      {isEditing ? (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <select
                            value={line.voiceRole}
                            onChange={(e) => {
                              const role = e.target.value as VoiceRole;
                              const label =
                                VOICE_ROLE_OPTIONS.find((o) => o.value === role)
                                  ?.label || line.speaker;
                              updateLine(beat.id, line.id, {
                                voiceRole: role,
                                speaker: label,
                              });
                            }}
                            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800"
                          >
                            {VOICE_ROLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            value={line.text}
                            onChange={(e) =>
                              updateLine(beat.id, line.id, {
                                text: e.target.value,
                              })
                            }
                            className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-base text-slate-900"
                          />

                          {beat.lines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLine(beat.id, line.id)}
                              aria-label="Remove line"
                              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3">
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 shrink-0 min-w-[145px]">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: getRoleAccent(line.voiceRole),
                              }}
                              aria-hidden="true"
                            />
                            {line.speaker}:
                          </span>
                          <p className="text-base font-medium text-slate-900 leading-snug">
                            “{renderHighlightedLine(line.text)}”
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => addLine(beat.id)}
                    className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Line
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[52px] rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-base font-semibold text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Scene
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[52px] rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold transition-colors shadow-sm cursor-pointer"
        >
          Generate 30s Video
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
