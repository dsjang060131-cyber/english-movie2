export const TOTAL_DURATION_SEC = 30.0;
export const BACKGROUND_MUSIC_URL = '/assets/aistudio/Mistletoe_in_Midtown_69230ea2.mp3';

export type AnimationStyleId = '3d-figure' | '2d-cel' | 'clay' | 'watercolor';

export type VoiceRole =
  | 'yellow'
  | 'green'
  | 'purple'
  | 'red'
  | 'female_lead'
  | 'male_lead';

export interface PhraseItem {
  id: string;
  expression: string;
  meaning: string;
  movie: string;
}

export interface StylePreset {
  id: AnimationStyleId;
  name: string;
  badge: string;
  description: string;
}

export interface SceneConfig {
  place: string;
  charactersSummary: string;
  situation: string;
  styleId: AnimationStyleId;
}

export interface StoryboardLine {
  id: string;
  speaker: string;
  voiceRole: VoiceRole;
  text: string;
}

export interface StoryboardBeat {
  id: string;
  beatNumber: 1 | 2 | 3 | 4;
  title: string;
  timeRange: string;
  startSec: number;
  endSec: number;
  dialogueWindowStart: number;
  dialogueWindowEnd: number;
  sceneDescription: string;
  lines: StoryboardLine[];
}

export interface TimedLine {
  id: string;
  beatNumber: 1 | 2 | 3 | 4;
  speaker: string;
  voiceRole: VoiceRole;
  text: string;
  startSec: number;
  endSec: number;
  accentHex: string;
}

export const DEFAULT_EXPRESSIONS: PhraseItem[] = [
  {
    id: 'expr-1',
    expression: 'Everything feels kind of meh today.',
    meaning: '오늘은 왠지 모든 게 시큰둥하네.',
    movie: 'Inside Out',
  },
  {
    id: 'expr-2',
    expression: 'That gives me the ick.',
    meaning: '그거 진짜 정떨어진다.',
    movie: 'Inside Out',
  },
  {
    id: 'expr-3',
    expression: 'That really crossed the line.',
    meaning: '그건 진짜 선 넘었지.',
    movie: 'Inside Out',
  },
  {
    id: 'expr-4',
    expression: 'Spick and span',
    meaning: '티끌 하나 없이 깨끗한',
    movie: 'Notting Hill',
  },
  {
    id: 'expr-5',
    expression: 'Get cleaned up',
    meaning: '(옷·몸을) 좀 닦다, 정돈하다',
    movie: 'Notting Hill',
  },
  {
    id: 'expr-6',
    expression: 'I’m confident that',
    meaning: '나는 ~라고 확신해',
    movie: 'Notting Hill',
  },
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: '3d-figure',
    name: '3D Collectible Figure Animation',
    badge: 'Default Preset',
    description:
      'Finely sculpted designer art toys / vinyl collectible figures with smooth matte-porcelain skin, glossy expressive eyes, delicate fabric textures, and warm miniature lighting.',
  },
  {
    id: '2d-cel',
    name: '2D Animation',
    badge: 'Storybook Cel',
    description:
      'Expressive hand-drawn 2D cel animation with clean outlines, soft pastel shading, and warm winter glow.',
  },
  {
    id: 'clay',
    name: 'Clay Animation',
    badge: 'Stop-Motion',
    description:
      'Handcrafted polymer clay figures inside tactile miniature sets with soft studio key lighting.',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    badge: 'Painted Paper',
    description:
      'Gentle watercolor washes with subtle paper texture and delicate ink contours.',
  },
];

export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  place:
    'A miniature glowing Christmas downtown street & a glowing futuristic 3D Mind Headquarters control room inside the protagonist’s head.',
  charactersSummary:
    'Female Protagonist (pretty Korean university girl in cozy cream-beige wool coat & knit scarf), Male Lead (handsome young Korean man with strictly short, clean-cut men’s haircut—short sides, neat back neckline, lightly styled short front bangs—sharp jawline, captivating dark eyes & tailored charcoal wool coat over turtleneck), plus 4 chibi Mind HQ figures (Golden-Yellow fairy, Mint-Green chic bob, Lavender-Purple hoodie, Ruby-Red shirt & tie).',
  situation:
    'Feeling lonely yet unbothered on Christmas Eve, she bumps into a handsome short-haired stranger spilling hot chocolate—sparking chaotic reactions inside Mind HQ before a sweet coffee invitation and cozy dream-to-doorway twist.',
  styleId: '3d-figure',
};

export const DEFAULT_STORYBOARD: StoryboardBeat[] = [
  {
    id: 'beat-1',
    beatNumber: 1,
    title: 'Hook',
    timeRange: '0–7s',
    startSec: 0.0,
    endSec: 7.0,
    dialogueWindowStart: 1.0,
    dialogueWindowEnd: 6.48,
    sceneDescription:
      '[0-1s] Quick shot of the pretty collectible-figure female protagonist standing alone among couples on a miniature glowing Christmas street, instant zoom into her forehead. [1-6.5s] Inside 3D Mind Headquarters, crisp cut per speaker. [6.5-7s] Quick zoom out; she shrugs calmly.',
    lines: [
      {
        id: 'b1-l1',
        speaker: 'Yellow figure',
        voiceRole: 'yellow',
        text: 'Ooh, look at those lights!',
      },
      {
        id: 'b1-l2',
        speaker: 'Green figure',
        voiceRole: 'green',
        text: 'Ugh, couples everywhere.',
      },
      {
        id: 'b1-l3',
        speaker: 'Purple figure',
        voiceRole: 'purple',
        text: 'Everything feels kind of meh today.',
      },
    ],
  },
  {
    id: 'beat-2',
    beatNumber: 2,
    title: 'Problem',
    timeRange: '7–15s',
    startSec: 7.0,
    endSec: 15.0,
    dialogueWindowStart: 8.55,
    dialogueWindowEnd: 14.95,
    sceneDescription:
      "[7-8.5s] Looking up at a sparkling Christmas tree, she bumps into the handsome short-haired male-lead figure holding hot chocolate; hot chocolate spills on her cream coat, instant zoom into her forehead. [8.5-15s] Inside 3D Mind Headquarters, crisp cut per speaker; a stylized flame bursts from Red figure's head.",
    lines: [
      {
        id: 'b2-l1',
        speaker: 'Yellow figure',
        voiceRole: 'yellow',
        text: 'Oh, so cute!',
      },
      {
        id: 'b2-l2',
        speaker: 'Green figure',
        voiceRole: 'green',
        text: 'My coat is ruined! That gives me the ick.',
      },
      {
        id: 'b2-l3',
        speaker: 'Red figure',
        voiceRole: 'red',
        text: 'That really crossed the line!',
      },
    ],
  },
  {
    id: 'beat-3',
    beatNumber: 3,
    title: 'Turn',
    timeRange: '15–23s',
    startSec: 15.0,
    endSec: 23.0,
    dialogueWindowStart: 15.1,
    dialogueWindowEnd: 22.85,
    sceneDescription:
      '[15-23s] 3D Figure Scene: the handsome short-haired male figure gently dabs her stained coat with tiny tissues, looking apologetic; camera cuts to her pretty figure face, captivated by his handsome face, giving a sweet, charming smile, followed by fluttering eye contact between the two.',
    lines: [
      {
        id: 'b3-l1',
        speaker: 'Male Lead',
        voiceRole: 'male_lead',
        text: 'I’m so sorry! Let me make this spick and span.',
      },
      {
        id: 'b3-l2',
        speaker: 'Female Protagonist',
        voiceRole: 'female_lead',
        text: 'If you’re really sorry… buy me a coffee while I get cleaned up?',
      },
    ],
  },
  {
    id: 'beat-4',
    beatNumber: 4,
    title: 'Close',
    timeRange: '23–30s',
    startSec: 23.0,
    endSec: 30.0,
    dialogueWindowStart: 25.5,
    dialogueWindowEnd: 29.65,
    sceneDescription:
      '[23-25.5s] Dream-ripple dissolve transition: she is actually asleep under a cozy blanket on her living room sofa in front of a small home Christmas tree; she flutters her eyes open, rubs her eyes sleepily, and stretches, realizing it was a dream. Her phone buzzes on the table, so she puts on her coat and steps out the front door—bumping straight into the exact same handsome short-haired male figure. [25.5-30s] Warm eye contact and a sweet smile under golden streetlights, slow fade to black.',
    lines: [
      {
        id: 'b4-l1',
        speaker: 'Male Lead',
        voiceRole: 'male_lead',
        text: 'Careful there.',
      },
      {
        id: 'b4-l2',
        speaker: 'Female Protagonist (V.O.)',
        voiceRole: 'female_lead',
        text: "I’m confident that this Christmas won’t be 'meh' after all.",
      },
    ],
  },
];

export const CAST_GALLERY: Array<{
  id: string;
  role: VoiceRole;
  name: string;
  tag: string;
  details: string;
  swatches: string[];
}> = [
  {
    id: 'cast-female',
    role: 'female_lead',
    name: 'Female Protagonist',
    tag: 'Designer Vinyl Figure',
    details:
      'Matte-porcelain skin, soft wavy dark brown hair, big glossy eyes, pastel blush, cozy cream-beige wool coat & knit scarf.',
    swatches: ['#E4D5BE', '#F6F1E7', '#4A372B'],
  },
  {
    id: 'cast-male',
    role: 'male_lead',
    name: 'Male Lead',
    tag: 'Designer Vinyl Figure',
    details:
      'Short, clean-cut men’s haircut with short sides, neat back neckline, and lightly styled short front bangs, sharp jawline, captivating dark eyes, gentle smile, tailored charcoal coat & turtleneck.',
    swatches: ['#282E3A', '#151922', '#B4845C'],
  },
  {
    id: 'cast-yellow',
    role: 'yellow',
    name: 'Golden-Yellow Fairy',
    tag: 'Mind HQ · Chibi Figure',
    details: 'Sparkling golden-yellow fairy-like figure with starry eyes and bright smile.',
    swatches: ['#FACC15', '#FEF08A', '#F59E0B'],
  },
  {
    id: 'cast-green',
    role: 'green',
    name: 'Mint-Green Chic',
    tag: 'Mind HQ · Chibi Figure',
    details: 'Stylish bob hair, expressive eyebrows, arms crossed in a sassy pose.',
    swatches: ['#34D399', '#A7F3D0', '#059669'],
  },
  {
    id: 'cast-purple',
    role: 'purple',
    name: 'Lavender-Purple Chill',
    tag: 'Mind HQ · Chibi Figure',
    details: 'Oversized cozy hoodie, sleepy eyes, holding a tiny glowing smartphone.',
    swatches: ['#A78BFA', '#DDD6FE', '#6D28D9'],
  },
  {
    id: 'cast-red',
    role: 'red',
    name: 'Ruby-Red Fiery',
    tag: 'Mind HQ · Chibi Figure',
    details: 'Tiny fiery figure in crisp white shirt & tie with stylized head flame.',
    swatches: ['#EF4444', '#F97316', '#F8FAFC'],
  },
];

export function getRoleAccent(role: VoiceRole): string {
  switch (role) {
    case 'yellow':
      return '#FACC15';
    case 'green':
      return '#34D399';
    case 'purple':
      return '#A78BFA';
    case 'red':
      return '#EF4444';
    case 'male_lead':
      return '#60A5FA';
    case 'female_lead':
    default:
      return '#F59E0B';
  }
}

/**
 * Estimates tight conversational timing (~140 WPM = ~2.33 words/sec) when audio clips
 * haven't been measured yet, or uses exact measured audio clip durations for zero dead air.
 */
export function computeTightTimeline(
  beats: StoryboardBeat[],
  measuredDurations?: Record<string, number>
): TimedLine[] {
  const timed: TimedLine[] = [];

  for (const beat of beats) {
    const winStart = beat.dialogueWindowStart;
    const winEnd = beat.dialogueWindowEnd;
    const winLen = Math.max(1.0, winEnd - winStart);
    const gap = 0.05; // Tight zero-dead-air transition

    const rawDurs = beat.lines.map((line) => {
      if (measuredDurations && measuredDurations[line.id] !== undefined) {
        return Math.max(0.45, measuredDurations[line.id]);
      }
      const words = line.text.trim().split(/\s+/).filter(Boolean).length;
      return Math.max(0.85, words / 2.38 + 0.12);
    });

    const totalRaw = rawDurs.reduce((acc, d) => acc + d, 0) + gap * Math.max(0, beat.lines.length - 1);
    const scale = totalRaw > winLen ? winLen / totalRaw : 1.0;

    let cursor = winStart;
    beat.lines.forEach((line, idx) => {
      const dur = rawDurs[idx] * scale;
      const startSec = cursor;
      const endSec = Math.min(winEnd, cursor + dur);
      cursor = endSec + gap * scale;

      timed.push({
        id: line.id,
        beatNumber: beat.beatNumber,
        speaker: line.speaker,
        voiceRole: line.voiceRole,
        text: line.text,
        startSec,
        endSec,
        accentHex: getRoleAccent(line.voiceRole),
      });
    });
  }

  return timed;
}
