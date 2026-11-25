import {
  BACKGROUND_MUSIC_URL,
  TOTAL_DURATION_SEC,
  TimedLine,
} from '../data/cinephraseDefaults';

export interface TtsClipInput {
  id: string;
  speaker: string;
  mimeType: string;
  audioBase64: string;
}

interface TrimmedClip {
  buffer: AudioBuffer;
  trimStartSec: number;
  trimmedDurationSec: number;
}

export class CinePhraseAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private exportDest: MediaStreamAudioDestinationNode | null = null;

  private bgMusicBuffer: AudioBuffer | null = null;
  private bgMusicLoadedFromMp3 = false;
  private voiceClips: Record<string, TrimmedClip> = {};

  private activeSources: AudioBufferSourceNode[] = [];
  private speechFallbackTimers: number[] = [];

  private musicMuted = false;
  private voiceMuted = false;
  private musicVolume = 0.18; // Continuous 18% background level (within 15-20% requirement)

  public async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.98;

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicMuted ? 0 : this.musicVolume;

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.value = this.voiceMuted ? 0 : 1.0;

      this.musicGain.connect(this.masterGain);
      this.voiceGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (!this.bgMusicBuffer) {
      await this.loadBackgroundMusic(this.ctx);
    }

    return this.ctx;
  }

  private async loadBackgroundMusic(ctx: AudioContext): Promise<void> {
    try {
      const response = await fetch(BACKGROUND_MUSIC_URL);
      if (!response.ok) throw new Error('Failed to fetch background MP3');
      const arrayBuf = await response.arrayBuffer();
      this.bgMusicBuffer = await ctx.decodeAudioData(arrayBuf);
      this.bgMusicLoadedFromMp3 = true;
    } catch {
      this.bgMusicLoadedFromMp3 = false;
    }
  }

  public isUsingUploadedMp3(): boolean {
    return this.bgMusicLoadedFromMp3;
  }

  public getExportAudioStream(): MediaStream | null {
    if (!this.ctx || !this.masterGain) return null;
    if (!this.exportDest) {
      this.exportDest = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.exportDest);
    }
    return this.exportDest.stream;
  }

  public setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(muted ? 0 : this.musicVolume, this.ctx.currentTime, 0.03);
    }
  }

  public setVoiceMuted(muted: boolean) {
    this.voiceMuted = muted;
    if (this.voiceGain && this.ctx) {
      this.voiceGain.gain.setTargetAtTime(muted ? 0 : 1.0, this.ctx.currentTime, 0.03);
    }
  }

  public hasGeminiVoices(lineIds: string[]): boolean {
    return lineIds.length > 0 && lineIds.every((id) => Boolean(this.voiceClips[id]));
  }

  public async loadTtsClips(clips: TtsClipInput[]): Promise<Record<string, number>> {
    const ctx = await this.ensureContext();
    const durations: Record<string, number> = {};

    await Promise.all(
      clips.map(async (clip) => {
        const binaryStr = atob(clip.audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const decoded = await ctx.decodeAudioData(bytes.buffer.slice(0));
        const trimmed = this.measureSilenceBounds(decoded);
        this.voiceClips[clip.id] = trimmed;
        durations[clip.id] = trimmed.trimmedDurationSec;
      })
    );

    return durations;
  }

  private measureSilenceBounds(buffer: AudioBuffer): TrimmedClip {
    const data = buffer.getChannelData(0);
    const threshold = 0.01;
    let firstIdx = 0;
    let lastIdx = data.length - 1;

    while (firstIdx < data.length && Math.abs(data[firstIdx]) < threshold) {
      firstIdx++;
    }
    while (lastIdx > firstIdx && Math.abs(data[lastIdx]) < threshold) {
      lastIdx--;
    }

    const padSamples = Math.floor(buffer.sampleRate * 0.02);
    const startSample = Math.max(0, firstIdx - padSamples);
    const endSample = Math.min(data.length, lastIdx + padSamples);

    const trimStartSec = startSample / buffer.sampleRate;
    const trimmedDurationSec = Math.max(0.3, (endSample - startSample) / buffer.sampleRate);

    return { buffer, trimStartSec, trimmedDurationSec };
  }

  public stopAll() {
    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // Ignore already stopped sources
      }
    }
    this.activeSources = [];

    for (const timer of this.speechFallbackTimers) {
      window.clearTimeout(timer);
    }
    this.speechFallbackTimers = [];

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public async playFrom(
    offsetSec: number,
    timedLines: TimedLine[],
    playbackRate = 1.0
  ): Promise<void> {
    const ctx = await this.ensureContext();
    this.stopAll();

    const clampedOffset = Math.max(0, Math.min(TOTAL_DURATION_SEC - 0.05, offsetSec));
    const now = ctx.currentTime + 0.02;

    // 1. Play user-uploaded "Mistletoe in Midtown" continuously at 18% background level
    if (this.bgMusicBuffer && this.musicGain) {
      const musicSrc = ctx.createBufferSource();
      musicSrc.buffer = this.bgMusicBuffer;
      musicSrc.loop = this.bgMusicBuffer.duration < TOTAL_DURATION_SEC;
      musicSrc.playbackRate.value = playbackRate;

      const envGain = ctx.createGain();
      const remainingDur = (TOTAL_DURATION_SEC - clampedOffset) / playbackRate;
      envGain.gain.setValueAtTime(1.0, now);
      if (clampedOffset < 28.8) {
        const fadeStart = now + (28.8 - clampedOffset) / playbackRate;
        const fadeEnd = now + remainingDur;
        envGain.gain.setValueAtTime(1.0, fadeStart);
        envGain.gain.linearRampToValueAtTime(0.01, fadeEnd);
      }

      musicSrc.connect(envGain);
      envGain.connect(this.musicGain);

      const startInBuf = clampedOffset % this.bgMusicBuffer.duration;
      musicSrc.start(now, startInBuf, Math.max(0.05, remainingDur));
      this.activeSources.push(musicSrc);
    }

    // 2. Schedule tightly synced voice lines matching exact computed windows
    const lineIds = timedLines.map((l) => l.id);
    if (this.hasGeminiVoices(lineIds) && this.voiceGain) {
      for (const line of timedLines) {
        const trimmed = this.voiceClips[line.id];
        if (!trimmed) continue;

        const targetWindow = Math.max(0.35, line.endSec - line.startSec);
        const fitRate = trimmed.trimmedDurationSec / targetWindow;
        const effectiveVoiceRate = Math.max(0.95, Math.min(1.22, fitRate)) * playbackRate;

        if (clampedOffset >= line.endSec - 0.03) continue;

        const src = ctx.createBufferSource();
        src.buffer = trimmed.buffer;
        src.playbackRate.value = effectiveVoiceRate;

        if (line.voiceRole === 'purple') {
          src.detune.value = -55;
        } else if (line.voiceRole === 'red') {
          src.detune.value = 30;
        }

        const clipGain = ctx.createGain();
        clipGain.gain.value = 1.15;
        src.connect(clipGain);
        clipGain.connect(this.voiceGain);

        if (clampedOffset <= line.startSec) {
          const delaySec = (line.startSec - clampedOffset) / playbackRate;
          src.start(now + delaySec, trimmed.trimStartSec, trimmed.trimmedDurationSec);
        } else {
          const skipTimeline = clampedOffset - line.startSec;
          const bufOffset = trimmed.trimStartSec + (skipTimeline / playbackRate) * effectiveVoiceRate;
          const remaining = trimmed.trimStartSec + trimmed.trimmedDurationSec - bufOffset;
          if (remaining > 0.04) {
            src.start(now, bufOffset, remaining);
          }
        }
        this.activeSources.push(src);
      }
    } else if (!this.voiceMuted && 'speechSynthesis' in window) {
      for (const line of timedLines) {
        if (clampedOffset >= line.endSec - 0.1) continue;
        const delayMs = Math.max(0, ((line.startSec - clampedOffset) / playbackRate) * 1000);
        const timer = window.setTimeout(() => {
          if (this.voiceMuted) return;
          const utter = new SpeechSynthesisUtterance(line.text);
          utter.lang = 'en-US';
          utter.pitch =
            line.voiceRole === 'yellow'
              ? 1.24
              : line.voiceRole === 'red'
                ? 0.86
                : line.voiceRole === 'male_lead'
                  ? 0.88
                  : 1.04;
          utter.rate = 1.04 * playbackRate;
          utter.volume = 0.92;
          window.speechSynthesis.speak(utter);
        }, delayMs);
        this.speechFallbackTimers.push(timer);
      }
    }
  }
}
