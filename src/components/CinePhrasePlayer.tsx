import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Music,
  Captions,
  RefreshCw,
} from 'lucide-react';
import {
  CinePhraseAudioEngine,
  TtsClipInput,
} from '../audio/cinephraseAudioEngine';
import { renderCinePhraseFrame } from '../canvas/renderCinePhraseScene';
import {
  AnimationStyleId,
  PhraseItem,
  StoryboardBeat,
  TOTAL_DURATION_SEC,
  computeTightTimeline,
} from '../data/cinephraseDefaults';

interface CinePhrasePlayerProps {
  beats: StoryboardBeat[];
  expressions: PhraseItem[];
  styleId: AnimationStyleId;
  mode: 'video' | 'final';
  externalJumpRef?: React.MutableRefObject<(sec: number) => void>;
}

export function CinePhrasePlayer({
  beats,
  expressions,
  styleId,
  mode,
  externalJumpRef,
}: CinePhrasePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<CinePhraseAudioEngine | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);

  const [measuredDurations, setMeasuredDurations] = useState<
    Record<string, number>
  >({});
  const [ttsStatus, setTtsStatus] = useState<'loading' | 'ready' | 'fallback'>(
    'loading'
  );
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const timeRef = useRef(0);
  const playingRef = useRef(false);
  const lastRafRef = useRef<number | null>(null);

  if (!audioRef.current) {
    audioRef.current = new CinePhraseAudioEngine();
  }

  const targetExpressions = useMemo(
    () => expressions.map((e) => e.expression).filter((s) => s.trim().length > 0),
    [expressions]
  );

  const timedLines = useMemo(
    () => computeTightTimeline(beats, measuredDurations),
    [beats, measuredDurations]
  );

  const timedLinesRef = useRef(timedLines);
  timedLinesRef.current = timedLines;

  // Fingerprint current dialogue lines so TTS automatically updates if user edits or regenerates beats
  const linesSignature = useMemo(
    () =>
      beats
        .flatMap((b) =>
          b.lines.map((l) => `${l.id}:${l.voiceRole}:${l.text.trim()}`)
        )
        .join('|'),
    [beats]
  );

  const synthesizeVoices = useCallback(async () => {
    setTtsStatus('loading');
    setTtsError(null);
    try {
      const payloadLines = beats.flatMap((b) =>
        b.lines.map((l) => ({
          id: l.id,
          speaker: l.speaker,
          voiceRole: l.voiceRole,
          text: l.text,
        }))
      );

      const res = await fetch('/api/tts/cinephrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: payloadLines }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.clips)) {
        throw new Error(data.error || 'Voiceover synthesis failed');
      }
      const durations = await audioRef.current?.loadTtsClips(
        data.clips as TtsClipInput[]
      );
      if (durations) {
        setMeasuredDurations(durations);
      }
      setTtsStatus('ready');
    } catch (err) {
      setTtsError(
        err instanceof Error ? err.message : 'Unable to reach voice service'
      );
      setTtsStatus('fallback');
    }
  }, [beats]);

  useEffect(() => {
    void synthesizeVoices();
    return () => {
      audioRef.current?.stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesSignature]);

  const drawFrameAt = useCallback(
    (t: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      renderCinePhraseFrame(ctx, t, {
        styleId,
        showSubtitles,
        targetExpressions,
        timedLines: timedLinesRef.current,
      });
    },
    [styleId, showSubtitles, targetExpressions]
  );

  useEffect(() => {
    drawFrameAt(timeRef.current);
  }, [drawFrameAt, timedLines]);

  const startPlaybackFrom = useCallback(
    async (startSec: number) => {
      const clamped =
        startSec >= TOTAL_DURATION_SEC - 0.05 ? 0 : Math.max(0, startSec);
      timeRef.current = clamped;
      setCurrentTime(clamped);
      playingRef.current = true;
      setIsPlaying(true);
      lastRafRef.current = performance.now();

      try {
        await audioRef.current?.playFrom(clamped, timedLinesRef.current, 1.0);
      } catch {
        // Visual playback continues cleanly
      }
    },
    []
  );

  const pausePlayback = useCallback(() => {
    playingRef.current = false;
    setIsPlaying(false);
    lastRafRef.current = null;
    audioRef.current?.stopAll();
  }, []);

  const seekTo = useCallback(
    (sec: number, autoPlay?: boolean) => {
      const clamped = Math.max(0, Math.min(TOTAL_DURATION_SEC, sec));
      timeRef.current = clamped;
      setCurrentTime(clamped);
      drawFrameAt(clamped);

      if (autoPlay || playingRef.current) {
        void startPlaybackFrom(clamped);
      }
    },
    [drawFrameAt, startPlaybackFrom]
  );

  useEffect(() => {
    if (externalJumpRef) {
      externalJumpRef.current = (sec: number) => seekTo(sec, true);
    }
  }, [externalJumpRef, seekTo]);

  const handleTogglePlay = useCallback(() => {
    if (isExporting) return;
    if (playingRef.current) {
      pausePlayback();
    } else {
      void startPlaybackFrom(timeRef.current);
    }
  }, [isExporting, pausePlayback, startPlaybackFrom]);

  const handleExportVideo = useCallback(async () => {
    if (isExporting) return;
    const canvas = canvasRef.current;
    const engine = audioRef.current;
    if (!canvas || !engine) return;

    pausePlayback();
    setIsExporting(true);
    setExportProgress(0);

    try {
      await engine.ensureContext();
      const audioStream = engine.getExportAudioStream();
      const canvasStream = canvas.captureStream(60);
      const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
      if (audioStream) tracks.push(...audioStream.getAudioTracks());
      const combined = new MediaStream(tracks);

      const mime =
        [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
        ].find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      const recorder = new MediaRecorder(combined, {
        mimeType: mime,
        videoBitsPerSecond: 5_000_000,
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      const stoppedPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
      });

      timeRef.current = 0;
      setCurrentTime(0);
      drawFrameAt(0);

      recorder.start(100);
      await engine.playFrom(0, timedLinesRef.current, 1.0);

      const startMs = performance.now();
      await new Promise<void>((resolve) => {
        const step = (now: number) => {
          const elapsed = (now - startMs) / 1000;
          const clamped = Math.min(TOTAL_DURATION_SEC, elapsed);
          timeRef.current = clamped;
          setCurrentTime(clamped);
          drawFrameAt(clamped);
          setExportProgress(Math.round((clamped / TOTAL_DURATION_SEC) * 100));

          if (elapsed < TOTAL_DURATION_SEC) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(step);
      });

      engine.stopAll();
      recorder.stop();
      const blob = await stoppedPromise;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cinephrase-30s-christmas-clip.webm';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [drawFrameAt, isExporting, pausePlayback]);

  useEffect(() => {
    let rafId = 0;
    const tick = (now: number) => {
      if (playingRef.current && !isExporting) {
        const prev = lastRafRef.current ?? now;
        const dt = (now - prev) / 1000;
        lastRafRef.current = now;

        const nextTime = timeRef.current + dt;
        if (nextTime >= TOTAL_DURATION_SEC) {
          timeRef.current = TOTAL_DURATION_SEC;
          setCurrentTime(TOTAL_DURATION_SEC);
          drawFrameAt(TOTAL_DURATION_SEC);
          pausePlayback();
        } else {
          timeRef.current = nextTime;
          setCurrentTime(nextTime);
          drawFrameAt(nextTime);
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [drawFrameAt, isExporting, pausePlayback]);

  const toggleMusic = () => {
    const next = !musicMuted;
    setMusicMuted(next);
    audioRef.current?.setMusicMuted(next);
  };

  const toggleVoice = () => {
    const next = !voiceMuted;
    setVoiceMuted(next);
    audioRef.current?.setVoiceMuted(next);
  };

  const progressPct = (currentTime / TOTAL_DURATION_SEC) * 100;
  const activeBeat =
    beats.find((b) => currentTime >= b.startSec && currentTime < b.endSec) ??
    beats[beats.length - 1];

  return (
    <div className="flex flex-col gap-5">
      {/* 16:9 Cinema Stage */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-lg">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          onClick={handleTogglePlay}
          className="w-full h-full block cursor-pointer"
        />

        {!isPlaying && !isExporting && currentTime === 0 && (
          <button
            type="button"
            onClick={handleTogglePlay}
            className="absolute inset-0 flex items-center justify-center bg-slate-950/25 hover:bg-slate-950/15 transition-colors cursor-pointer group"
          >
            <span className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/95 text-slate-900 font-bold text-base shadow-xl group-hover:scale-105 transition-transform">
              <Play className="w-5 h-5 text-indigo-600 fill-indigo-600" />
              Play 30s CinePhrase Film
            </span>
          </button>
        )}

        {isExporting && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 pointer-events-none">
            <p className="text-base font-semibold text-white">
              Rendering 30s Clip with Voiceover, Mistletoe in Midtown &amp; Subtitles…
            </p>
            <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-75"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <span className="font-mono text-sm tabular-nums text-amber-300">
              {exportProgress}%
            </span>
          </div>
        )}
      </div>

      {/* 4-Beat Sequential Clip Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {beats.map((beat) => {
          const isCurrent = activeBeat?.id === beat.id;
          return (
            <button
              key={beat.id}
              type="button"
              onClick={() => seekTo(beat.startSec, true)}
              className={`text-left rounded-2xl p-3.5 border transition-colors min-h-[56px] cursor-pointer ${
                isCurrent
                  ? 'bg-indigo-50 border-indigo-500 text-slate-900'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-medium">
                <span className={isCurrent ? 'text-indigo-700 font-semibold' : 'text-slate-500'}>
                  Clip {beat.beatNumber}
                </span>
                <span className="font-mono tabular-nums text-slate-500">
                  {beat.timeRange}
                </span>
              </div>
              <p className="font-display text-sm font-bold mt-0.5 truncate">
                {beat.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Transport Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <input
            type="range"
            min={0}
            max={TOTAL_DURATION_SEC}
            step={0.01}
            value={currentTime}
            disabled={isExporting}
            onChange={(e) => seekTo(parseFloat(e.target.value), false)}
            aria-label="30-second video timeline"
            className="cinema-scrubber w-full"
            style={{
              background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${progressPct}%, #E2E8F0 ${progressPct}%, #E2E8F0 100%)`,
              height: '6px',
              borderRadius: '9999px',
            }}
          />

          <div className="flex items-center justify-between text-sm text-slate-600">
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {currentTime.toFixed(2)}s / {TOTAL_DURATION_SEC.toFixed(2)}s
            </span>
            <span className="text-xs sm:text-sm text-slate-500">
              Now playing: Beat {activeBeat?.beatNumber} ({activeBeat?.title})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleTogglePlay}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <button
              type="button"
              onClick={() => seekTo(0, true)}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Restart
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleVoice}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                voiceMuted
                  ? 'bg-slate-50 border-slate-200 text-slate-400'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              Voice
            </button>

            <button
              type="button"
              onClick={toggleMusic}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                musicMuted
                  ? 'bg-slate-50 border-slate-200 text-slate-400'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Music className="w-4 h-4" />
              BGM (18%)
            </button>

            <button
              type="button"
              onClick={() => setShowSubtitles((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                showSubtitles
                  ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <Captions className="w-4 h-4" />
              Subtitles
            </button>

            {mode === 'final' && (
              <button
                type="button"
                onClick={() => void handleExportVideo()}
                disabled={isExporting}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-base font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-amber-400" />
                {isExporting ? 'Downloading…' : 'Download Video (.webm)'}
              </button>
            )}
          </div>
        </div>

        {/* Audio Sync Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-slate-500">
          <span>
            {ttsStatus === 'ready' &&
              '135–145 WPM crisp English voiceover synced tightly with “Mistletoe in Midtown” (18% BGM).'}
            {ttsStatus === 'loading' &&
              'Synthesizing tight-sync English voiceover clips for all 4 beats…'}
            {ttsStatus === 'fallback' &&
              `Preview voice mode active (${ttsError || 'Gemini TTS unavailable'}).`}
          </span>

          <button
            type="button"
            onClick={() => void synthesizeVoices()}
            disabled={ttsStatus === 'loading'}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${ttsStatus === 'loading' ? 'animate-spin' : ''}`}
            />
            Resync Voices
          </button>
        </div>
      </div>
    </div>
  );
}
