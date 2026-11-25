import {
  AnimationStyleId,
  TOTAL_DURATION_SEC,
  TimedLine,
  VoiceRole,
} from '../data/cinephraseDefaults';

export interface CinePhraseRenderOptions {
  styleId: AnimationStyleId;
  showSubtitles: boolean;
  targetExpressions: string[];
  timedLines: TimedLine[];
}

const W = 1280;
const H = 720;

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t);
}

function easeInExpo(t: number): number {
  const x = clamp(t);
  return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}

function easeOutCubic(t: number): number {
  const x = clamp(t);
  return 1 - Math.pow(1 - x, 3);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function renderCinePhraseFrame(
  ctx: CanvasRenderingContext2D,
  rawTimeSec: number,
  options: CinePhraseRenderOptions
) {
  // Subtle stop-motion stepped time for clay preset
  const t =
    options.styleId === 'clay'
      ? Math.floor(clamp(rawTimeSec, 0, TOTAL_DURATION_SEC) * 15) / 15
      : clamp(rawTimeSec, 0, TOTAL_DURATION_SEC);

  const activeLine = options.timedLines.find((l) => t >= l.startSec && t <= l.endSec);

  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // =========================================================================
  // BEAT 1 (0 - 7s): Street Hook -> Mind HQ crisp speaker cuts -> Shrug out
  // =========================================================================
  if (t < 1.0) {
    const zoomP = t > 0.65 ? easeInExpo((t - 0.65) / 0.35) : 0;
    const zoomScale = 1 + zoomP * 11.0;
    ctx.save();
    ctx.translate(640, 240);
    ctx.scale(zoomScale, zoomScale);
    ctx.translate(-640, -240);
    drawMiniatureStreet(ctx, t, 'hook', options.styleId);
    ctx.restore();
    if (t > 0.65) drawWhipZoomOverlay(ctx, (t - 0.65) / 0.35);
  } else if (t < 6.5) {
    drawMindHqCutScene(ctx, t, 1, activeLine, options.styleId);
  } else if (t < 7.0) {
    const zoomOutP = clamp((t - 6.5) / 0.2);
    const zoomScale = 1 + (1 - easeOutCubic(zoomOutP)) * 8.0;
    ctx.save();
    ctx.translate(640, 240);
    ctx.scale(zoomScale, zoomScale);
    ctx.translate(-640, -240);
    drawMiniatureStreet(ctx, t, 'walkoff', options.styleId);
    ctx.restore();
    if (t < 6.7) drawWhipZoomOverlay(ctx, 1 - zoomOutP);
  }
  // =========================================================================
  // BEAT 2 (7 - 15s): Tree bump & spill -> Mind HQ crisp cuts + Red flame
  // =========================================================================
  else if (t < 8.1) {
    drawTreeBumpFigureScene(ctx, t, options.styleId);
  } else if (t < 8.5) {
    // Spill glance + instant forehead whip-zoom
    const zoomP = t > 8.22 ? easeInExpo((t - 8.22) / 0.28) : 0;
    ctx.save();
    ctx.translate(640, 240);
    ctx.scale(1 + zoomP * 10.5, 1 + zoomP * 10.5);
    ctx.translate(-640, -240);
    drawMiniatureStreet(ctx, t, 'stained', options.styleId);
    ctx.restore();
    if (t > 8.22) drawWhipZoomOverlay(ctx, (t - 8.22) / 0.28);
  } else if (t < 15.0) {
    drawMindHqCutScene(ctx, t, 2, activeLine, options.styleId);
  }
  // =========================================================================
  // BEAT 3 (15 - 23s): Dabbing tissues -> Captivated smile -> Eye contact
  // =========================================================================
  else if (t < 18.4) {
    drawBeat3TissuesFigureScene(ctx, t, activeLine, options.styleId);
  } else if (t < 21.4) {
    drawBeat3CaptivatedFigureCloseUp(ctx, t, activeLine, options.styleId);
  } else if (t < 23.0) {
    drawBeat3FlutteringEyeContact(ctx, t, activeLine, options.styleId);
  }
  // =========================================================================
  // BEAT 4 (23 - 30s): Dream-ripple dissolve -> Sofa wake-up/rub/stretch -> Phone on table -> Doorway bump -> Golden streetlights fade out
  // =========================================================================
  else if (t < 24.55) {
    drawSofaWakeUpFigureScene(ctx, t, options.styleId);
    if (t < 23.45) {
      drawDreamRippleDissolve(ctx, t, (t - 23.0) / 0.45, options.styleId);
    }
  } else if (t < 25.0) {
    drawBuzzingPhoneScene(ctx, t);
  } else if (t < 25.5) {
    drawDoorwayBumpFigureScene(ctx, t, options.styleId);
  } else {
    drawBeat4EndingFigureScene(ctx, t, activeLine, options.styleId);
  }

  // Apply chosen style texture overlay (2D cel, clay matte, watercolor paper)
  applyStylePostOverlay(ctx, options.styleId);

  // Soft warm miniature vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,12,20,0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Burned-in Subtitles synced word-for-word with spoken audio
  if (options.showSubtitles && activeLine) {
    drawBurnedInSubtitles(ctx, activeLine, options.targetExpressions);
  }

  ctx.restore();
}

function applyStylePostOverlay(ctx: CanvasRenderingContext2D, styleId: AnimationStyleId) {
  if (styleId === 'watercolor') {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 250, 240, 0.08)';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
  } else if (styleId === 'clay') {
    ctx.save();
    ctx.fillStyle = 'rgba(245, 232, 214, 0.05)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

function drawWhipZoomOverlay(ctx: CanvasRenderingContext2D, intensity: number) {
  const a = clamp(intensity);
  if (a <= 0.02) return;
  ctx.save();
  ctx.translate(W / 2, 250);
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2 + a * 0.2;
    const inner = lerp(130, 40, a);
    ctx.strokeStyle =
      i % 2 === 0 ? `rgba(253, 224, 71, ${a * 0.32})` : `rgba(255, 255, 255, ${a * 0.25})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * 900, Math.sin(angle) * 900);
    ctx.stroke();
  }
  ctx.restore();
}

/* ============================================================================
 * MINIATURE CHRISTMAS WORLD BACKDROP
 * ========================================================================== */
function drawMiniatureChristmasBackdrop(
  ctx: CanvasRenderingContext2D,
  t: number,
  styleId: AnimationStyleId
) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 490);
  if (styleId === 'watercolor') {
    skyGrad.addColorStop(0, '#1E2942');
    skyGrad.addColorStop(1, '#413B5C');
  } else {
    skyGrad.addColorStop(0, '#0D1326');
    skyGrad.addColorStop(0.55, '#19223B');
    skyGrad.addColorStop(1, '#2D273D');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(-30, -30, W + 60, 520);

  // Miniature snowy cobblestone floor
  const floorGrad = ctx.createLinearGradient(0, 420, 0, H);
  floorGrad.addColorStop(0, '#272C3D');
  floorGrad.addColorStop(1, '#1A1E2B');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(-30, 420, W + 60, H - 400);

  // Soft warm miniature bokeh fairy lights
  const orbs = [
    [130, 170, 34, 'rgba(253, 224, 71, 0.24)'],
    [260, 240, 22, 'rgba(244, 114, 182, 0.22)'],
    [400, 195, 28, 'rgba(251, 191, 36, 0.25)'],
    [540, 230, 20, 'rgba(52, 211, 153, 0.2)'],
    [750, 205, 24, 'rgba(251, 191, 36, 0.24)'],
    [900, 165, 36, 'rgba(248, 113, 113, 0.22)'],
    [1100, 240, 30, 'rgba(253, 224, 71, 0.24)'],
  ] as const;
  for (let i = 0; i < orbs.length; i++) {
    const [ox, oy, r, c] = orbs[i];
    const pulse = 0.88 + Math.sin(t * 2.2 + i) * 0.12;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(ox, oy, r * pulse, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMiniatureTree(ctx: CanvasRenderingContext2D, cx: number, baseY: number, t: number, scale = 1) {
  ctx.save();
  ctx.translate(cx, baseY);
  ctx.scale(scale, scale);

  const glow = ctx.createRadialGradient(0, -170, 20, 0, -170, 210);
  glow.addColorStop(0, 'rgba(250, 204, 21, 0.26)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -170, 210, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4A3121';
  ctx.fillRect(-16, -34, 32, 38);

  const tiers = [
    { topY: -175, w: 120, h: 145, color: '#145339' },
    { topY: -245, w: 96, h: 118, color: '#196646' },
    { topY: -305, w: 72, h: 92, color: '#1E7A54' },
    { topY: -355, w: 46, h: 70, color: '#248E62' },
  ];
  for (const tier of tiers) {
    ctx.fillStyle = tier.color;
    ctx.beginPath();
    ctx.moveTo(0, tier.topY);
    ctx.lineTo(tier.w, tier.topY + tier.h);
    ctx.lineTo(-tier.w, tier.topY + tier.h);
    ctx.closePath();
    ctx.fill();
  }

  const ornaments = [
    [-40, -70, 0], [38, -65, 1], [-70, -45, 2], [65, -40, 0],
    [-25, -135, 1], [30, -125, 0], [-50, -110, 2], [48, -102, 1],
    [-18, -200, 0], [22, -190, 2], [0, -270, 1],
  ];
  const palette = ['#F87171', '#FDE047', '#6EE7B7'];
  for (let i = 0; i < ornaments.length; i++) {
    const [dx, dy, cIdx] = ornaments[i];
    ctx.fillStyle = palette[cIdx];
    ctx.globalAlpha = 0.72 + 0.28 * Math.sin(t * 4 + i);
    ctx.beginPath();
    ctx.arc(dx, dy, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 17 : 7;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, -366 + Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, -366 + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCoupleFigures(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.68, 0.68);
  ctx.globalAlpha = 0.78;
  const bob = Math.abs(Math.sin(t * 4)) * 3;
  ctx.fillStyle = '#A78BFA';
  drawRoundedRect(ctx, -40, -108 - bob, 38, 72, 16);
  ctx.fill();
  ctx.fillStyle = '#FCE3D4';
  ctx.beginPath();
  ctx.arc(-21, -126 - bob, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#60A5FA';
  drawRoundedRect(ctx, 4, -114 - bob, 40, 76, 16);
  ctx.fill();
  ctx.fillStyle = '#FCE3D4';
  ctx.beginPath();
  ctx.arc(24, -132 - bob, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMiniatureStreet(
  ctx: CanvasRenderingContext2D,
  t: number,
  mood: 'hook' | 'walkoff' | 'stained',
  styleId: AnimationStyleId
) {
  drawMiniatureChristmasBackdrop(ctx, t, styleId);
  drawMiniatureTree(ctx, 945, 425, t);
  drawCoupleFigures(ctx, 290 + t * 18, 438, t);
  drawCoupleFigures(ctx, 1020 - t * 18, 442, t + 1);

  const shrugY = mood === 'walkoff' ? -Math.sin(clamp((t - 6.55) / 0.32) * Math.PI) * 10 : 0;
  const walkX = mood === 'walkoff' ? clamp((t - 6.5) / 0.5) * -45 : 0;

  drawFemaleCollectibleFigure(ctx, 640 + walkX, 695, 1.0, {
    styleId,
    shrugY,
    smile: mood === 'walkoff' ? 0.5 : 0,
    stain: mood === 'stained',
    shocked: mood === 'stained',
  });

  drawSnowflakes(ctx, t);
}

function drawTreeBumpFigureScene(ctx: CanvasRenderingContext2D, t: number, styleId: AnimationStyleId) {
  drawMiniatureChristmasBackdrop(ctx, t, styleId);
  drawMiniatureTree(ctx, 640, 455, t, 1.12);

  const p = clamp((t - 7.0) / 1.1);
  const bump = clamp((t - 7.52) / 0.38);
  const impact = Math.sin(bump * Math.PI);

  drawFemaleCollectibleFigure(ctx, lerp(515, 570, p) - impact * 12, 705, 1.04, {
    styleId,
    lookUp: p < 0.5 ? 1 : 0,
    shocked: p >= 0.5,
    stain: p >= 0.65,
  });

  drawMaleCollectibleFigure(ctx, lerp(830, 710, p) + impact * 12, 705, 1.04, {
    styleId,
    holdingCocoa: true,
    splash: p >= 0.5 && p <= 0.95,
    shocked: p >= 0.5,
  });

  drawSnowflakes(ctx, t);
}

/* ============================================================================
 * 3D MIND HEADQUARTERS WITH CRISP CUT PER SPEAKER
 * ========================================================================== */
function drawMindHqCutScene(
  ctx: CanvasRenderingContext2D,
  t: number,
  beat: 1 | 2,
  activeLine: TimedLine | undefined,
  styleId: AnimationStyleId
) {
  const speakerRole = activeLine?.voiceRole;

  // Crisp cut per speaker! Camera zooms slightly & centers onto active chibi figure
  let camX = 0;
  let camScale = 1.0;
  if (speakerRole === 'yellow') {
    camX = 280;
    camScale = 1.24;
  } else if (speakerRole === 'green') {
    camX = 60;
    camScale = 1.24;
  } else if (speakerRole === 'purple') {
    camX = -260;
    camScale = 1.24;
  } else if (speakerRole === 'red') {
    camX = -130;
    camScale = 1.28;
  }

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(camScale, camScale);
  ctx.translate(-W / 2 + camX, -H / 2 + (camScale > 1.0 ? 22 : 0));

  // Glowing miniature futuristic control room
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1B1936');
  bg.addColorStop(0.6, '#26234B');
  bg.addColorStop(1, '#141229');
  ctx.fillStyle = bg;
  ctx.fillRect(-350, -100, W + 700, H + 200);

  // Soft pastel curved control room window
  drawRoundedRect(ctx, 270, 44, 740, 215, 28);
  ctx.fillStyle = '#0F1629';
  ctx.fill();
  ctx.strokeStyle = speakerRole === 'red' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(165, 180, 252, 0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Miniature window glow
  ctx.fillStyle = beat === 1 ? 'rgba(250, 204, 21, 0.16)' : 'rgba(248, 113, 113, 0.16)';
  ctx.beginPath();
  ctx.arc(640, 150, 90, 0, Math.PI * 2);
  ctx.fill();

  // Cozy purple sofa on right
  ctx.fillStyle = '#4B3B6E';
  drawRoundedRect(ctx, 830, 385, 220, 82, 24);
  ctx.fill();
  ctx.fillStyle = '#5D4A87';
  drawRoundedRect(ctx, 820, 440, 240, 44, 16);
  ctx.fill();

  // 4 Chibi-style Collectible Figure Emotions
  drawYellowChibiFigure(ctx, 290, 492, t, speakerRole === 'yellow', styleId);
  drawGreenChibiFigure(ctx, 580, 495, t, speakerRole === 'green', beat === 2, styleId);
  drawPurpleChibiFigure(ctx, 940, 472, t, speakerRole === 'purple', styleId);
  if (beat === 2) {
    drawRedChibiFigure(ctx, 775, 502, t, speakerRole === 'red', styleId);
  }

  // Miniature glowing console desk
  const deskGrad = ctx.createLinearGradient(0, 470, 0, H);
  deskGrad.addColorStop(0, '#312E5E');
  deskGrad.addColorStop(1, '#171530');
  ctx.fillStyle = deskGrad;
  ctx.beginPath();
  ctx.moveTo(40, H + 60);
  ctx.lineTo(130, 494);
  ctx.quadraticCurveTo(W / 2, 456, 1150, 494);
  ctx.lineTo(1240, H + 60);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/* ============================================================================
 * BEAT 3 & BEAT 4 SCENES (3D COLLECTIBLE FIGURES)
 * ========================================================================== */
function drawBeat3TissuesFigureScene(
  ctx: CanvasRenderingContext2D,
  t: number,
  activeLine: TimedLine | undefined,
  styleId: AnimationStyleId
) {
  drawMiniatureChristmasBackdrop(ctx, t, styleId);
  drawMiniatureTree(ctx, 980, 440, t, 0.9);

  const dab = Math.sin(t * 7.5) * 11;
  const maleSpeaking = activeLine?.voiceRole === 'male_lead';

  drawFemaleCollectibleFigure(ctx, 735, 705, 1.08, {
    styleId,
    stain: true,
    smile: 0.4,
  });
  drawMaleCollectibleFigure(ctx, 540, 705, 1.08, {
    styleId,
    dabbing: true,
    dabOffset: dab,
    apologetic: true,
    speaking: maleSpeaking,
    t,
  });

  // Tiny white tissues
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(655 + dab * 0.6, 425 + dab * 0.3, 18, 0, Math.PI * 2);
  ctx.arc(670 + dab * 0.6, 434 + dab * 0.3, 14, 0, Math.PI * 2);
  ctx.fill();

  drawSnowflakes(ctx, t);
}

function drawBeat3CaptivatedFigureCloseUp(
  ctx: CanvasRenderingContext2D,
  t: number,
  activeLine: TimedLine | undefined,
  styleId: AnimationStyleId
) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1D1B30');
  bg.addColorStop(1, '#332436');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(253, 224, 71, 0.28)' : 'rgba(244, 114, 182, 0.18)';
    ctx.beginPath();
    ctx.arc((i * 117 + 70) % W, (i * 83 + 50) % 470, 26 + (i % 3) * 14, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFemaleCollectibleFigure(ctx, 640, 1085, 2.02, {
    styleId,
    smile: 0.95,
    warmGlow: true,
    blush: 0.45,
    speaking: activeLine?.voiceRole === 'female_lead',
    t,
  });
}

function drawBeat3FlutteringEyeContact(
  ctx: CanvasRenderingContext2D,
  t: number,
  activeLine: TimedLine | undefined,
  styleId: AnimationStyleId
) {
  // Split screen / alternating fluttering eye contact between the two collectible figures
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#19182C');
  bg.addColorStop(1, '#2D2234');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Warm dreamy sparkle orbs
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
    ctx.beginPath();
    ctx.arc((i * 123 + 40) % W, (i * 91 + 60) % H, 22 + (i % 3) * 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Two figures facing each other closely in warm eye contact
  drawMaleCollectibleFigure(ctx, 430, 880, 1.48, {
    styleId,
    smile: 0.85,
    warmGlow: true,
    blush: 0.65,
  });
  drawFemaleCollectibleFigure(ctx, 850, 880, 1.48, {
    styleId,
    smile: 0.9,
    warmGlow: true,
    blush: 0.65,
    speaking: activeLine?.voiceRole === 'female_lead',
    t,
  });

  // Subtle fluttering sparkle heart/star motes between their eyes
  const floatP = (t - 21.4) / 1.6;
  ctx.fillStyle = `rgba(244, 114, 182, ${0.4 + 0.4 * Math.sin(t * 8)})`;
  ctx.beginPath();
  ctx.arc(640, 240 - floatP * 24, 7, 0, Math.PI * 2);
  ctx.arc(618, 265 - floatP * 18, 5, 0, Math.PI * 2);
  ctx.arc(662, 255 - floatP * 20, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawDreamRippleDissolve(
  ctx: CanvasRenderingContext2D,
  t: number,
  progress: number,
  styleId: AnimationStyleId
) {
  const p = clamp(progress);
  const alpha = 1 - easeOutCubic(p);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  // Soft dream-ripple concentric shimmer rings over the dissolving Beat 3 memory
  drawBeat3FlutteringEyeContact(ctx, t, undefined, styleId);
  for (let i = 0; i < 6; i++) {
    const r = ((p * 650 + i * 110) % 720) + 40;
    ctx.strokeStyle = `rgba(255, 245, 220, ${alpha * 0.45})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(W / 2, H / 2, r * 1.45, r * 0.85, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSofaWakeUpFigureScene(ctx: CanvasRenderingContext2D, t: number, styleId: AnimationStyleId) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1F1A28');
  bg.addColorStop(1, '#30242F');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Small home Christmas tree in cozy living room
  drawMiniatureTree(ctx, 250, 505, t, 0.84);

  // Cozy miniature sofa
  ctx.fillStyle = '#7C6A5F';
  drawRoundedRect(ctx, 380, 395, 560, 195, 34);
  ctx.fill();
  ctx.fillStyle = '#948074';
  drawRoundedRect(ctx, 405, 455, 510, 125, 24);
  ctx.fill();

  // Phases across 23.0 - 24.55s:
  // [23.0 - 23.55] Asleep under cozy blanket -> flutters eyes open
  // [23.55 - 24.05] Rubs eyes sleepily
  // [24.05 - 24.55] Stretches & notices buzzing phone on coffee table
  const localT = clamp((t - 23.0) / 1.55);
  const sitY = lerp(22, 0, easeOutCubic(clamp(localT * 2.2)));
  const isSleeping = t < 23.42;
  const isRubbingEyes = t >= 23.42 && t < 24.05;
  const isStretching = t >= 24.05;

  drawFemaleCollectibleFigure(ctx, 665, 650 + sitY, 0.86, {
    styleId,
    sleeping: isSleeping,
    rubbingEyes: isRubbingEyes,
    stretching: isStretching,
    smile: isStretching ? 0.35 : 0,
    t,
  });

  // Cozy knitted blanket draped over her lap on the sofa
  ctx.fillStyle = '#E8D5C4';
  drawRoundedRect(ctx, 520, 468, 290, 118, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 132, 92, 0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(540, 502);
  ctx.lineTo(790, 502);
  ctx.moveTo(540, 535);
  ctx.lineTo(790, 535);
  ctx.stroke();

  // Living room coffee table on right with buzzing smartphone
  ctx.fillStyle = '#5C4332';
  drawRoundedRect(ctx, 890, 540, 260, 32, 10);
  ctx.fill();
  ctx.fillStyle = '#4A3426';
  ctx.fillRect(920, 572, 22, 95);
  ctx.fillRect(1098, 572, 22, 95);

  const buzzOffset = t > 24.1 ? Math.sin(t * 58) * 3 : 0;
  ctx.save();
  ctx.translate(1015 + buzzOffset, 524);
  ctx.fillStyle = '#1E293B';
  drawRoundedRect(ctx, -38, -14, 76, 28, 6);
  ctx.fill();
  if (t > 24.1) {
    ctx.fillStyle = '#FACC15';
    drawRoundedRect(ctx, -32, -10, 64, 20, 4);
    ctx.fill();
  }
  ctx.restore();
}

function drawBuzzingPhoneScene(ctx: CanvasRenderingContext2D, t: number) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#231C28');
  bg.addColorStop(1, '#362832');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Wooden living room coffee table surface behind phone
  ctx.fillStyle = '#4A3426';
  ctx.fillRect(0, 110, W, H - 110);
  ctx.fillStyle = '#5C4332';
  ctx.fillRect(0, 110, W, 18);

  const buzz = Math.sin(t * 58) * 4;
  ctx.save();
  ctx.translate(W / 2 + buzz, H / 2 + 20);

  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, -165, -245, 330, 490, 38);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  drawRoundedRect(ctx, -148, -225, 296, 450, 28);
  ctx.fill();

  ctx.fillStyle = '#FACC15';
  drawRoundedRect(ctx, -124, -64, 248, 88, 18);
  ctx.fill();

  ctx.fillStyle = '#0F172A';
  ctx.font = '700 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Get out here now!', 0, -20);
  ctx.restore();
}

function drawDoorwayBumpFigureScene(ctx: CanvasRenderingContext2D, t: number, styleId: AnimationStyleId) {
  drawMiniatureChristmasBackdrop(ctx, t, styleId);
  // Warm golden streetlight glow on the doorway
  const streetGlow = ctx.createRadialGradient(840, 180, 20, 840, 240, 340);
  streetGlow.addColorStop(0, 'rgba(253, 224, 71, 0.32)');
  streetGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = streetGlow;
  ctx.beginPath();
  ctx.arc(840, 240, 340, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4A3426';
  ctx.fillRect(0, 0, 240, H);

  const p = clamp((t - 25.0) / 0.5);
  drawFemaleCollectibleFigure(ctx, lerp(340, 575, p), 705, 1.05, {
    styleId,
    shocked: p > 0.6,
  });
  drawMaleCollectibleFigure(ctx, lerp(790, 695, p), 705, 1.05, {
    styleId,
    smile: 0.85,
  });
  drawSnowflakes(ctx, t);
}

function drawBeat4EndingFigureScene(
  ctx: CanvasRenderingContext2D,
  t: number,
  activeLine: TimedLine | undefined,
  styleId: AnimationStyleId
) {
  drawMiniatureChristmasBackdrop(ctx, t, styleId);

  // Golden streetlights aura
  const goldLight = ctx.createRadialGradient(640, 140, 40, 640, 260, 480);
  goldLight.addColorStop(0, 'rgba(253, 224, 71, 0.28)');
  goldLight.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = goldLight;
  ctx.fillRect(0, 0, W, H);

  const maleSpeaking = activeLine?.voiceRole === 'male_lead';
  const showMaleFirst = t < 26.85;

  if (showMaleFirst) {
    drawMaleCollectibleFigure(ctx, 640, 1085, 2.02, {
      styleId,
      smile: 1.0,
      warmGlow: true,
      speaking: maleSpeaking,
      t,
    });
  } else {
    drawFemaleCollectibleFigure(ctx, 640, 1085, 2.04, {
      styleId,
      smile: 1.0,
      warmGlow: true,
      blush: 0.9,
      speaking: activeLine?.voiceRole === 'female_lead',
      t,
    });
  }

  drawSnowflakes(ctx, t);

  // Slow fade to black [28.4 - 29.85]
  const fadeAlpha = t > 28.4 ? clamp((t - 28.4) / 1.45) : 0;
  if (fadeAlpha > 0) {
    ctx.fillStyle = `rgba(8, 10, 16, ${fadeAlpha})`;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ============================================================================
 * COLLECTIBLE FIGURE RIGS (MATTE-PORCELAIN SKIN + GLOSSY VINYL EYES)
 * ========================================================================== */
function drawFemaleCollectibleFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  opts: {
    styleId: AnimationStyleId;
    shrugY?: number;
    smile?: number;
    shocked?: boolean;
    sleeping?: boolean;
    rubbingEyes?: boolean;
    stretching?: boolean;
    stain?: boolean;
    lookUp?: number;
    warmGlow?: boolean;
    blush?: number;
    speaking?: boolean;
    t?: number;
  }
) {
  const is2D = opts.styleId === '2d-cel';
  ctx.save();
  ctx.translate(x, y + (opts.shrugY ?? 0));
  ctx.scale(scale, scale);

  // Soft wavy dark brown hair silhouette
  ctx.fillStyle = '#3B2820';
  ctx.beginPath();
  ctx.ellipse(0, -432, 76, 86, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cream-beige wool coat with soft sculpted figure volume
  const coatGrad = ctx.createLinearGradient(-105, -370, 105, -100);
  coatGrad.addColorStop(0, '#F0E4D2');
  coatGrad.addColorStop(0.55, '#DFCBB0');
  coatGrad.addColorStop(1, '#C4AC8E');
  ctx.fillStyle = coatGrad;
  ctx.strokeStyle = is2D ? '#3D2F24' : 'rgba(92, 74, 56, 0.35)';
  ctx.lineWidth = is2D ? 3 : 1.8;
  ctx.beginPath();
  ctx.moveTo(-84, -365);
  ctx.quadraticCurveTo(0, -388, 84, -365);
  ctx.lineTo(104, -104);
  ctx.quadraticCurveTo(0, -92, -104, -104);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (opts.stain) {
    ctx.fillStyle = 'rgba(104, 58, 28, 0.8)';
    ctx.beginPath();
    ctx.ellipse(26, -245, 22, 16, -0.2, 0, Math.PI * 2);
    ctx.ellipse(15, -230, 11, 13, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Knit scarf
  ctx.fillStyle = '#F9F5EE';
  drawRoundedRect(ctx, -62, -392, 124, 46, 22);
  ctx.fill();
  drawRoundedRect(ctx, -26, -356, 36, 86, 12);
  ctx.fill();

  // Cozy stretching arms when waking up
  if (opts.stretching) {
    ctx.strokeStyle = '#DFCBB0';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-72, -345);
    ctx.lineTo(-108, -460);
    ctx.moveTo(72, -345);
    ctx.lineTo(108, -460);
    ctx.stroke();
    ctx.fillStyle = '#FCE0D0';
    ctx.beginPath();
    ctx.arc(-110, -468, 12, 0, Math.PI * 2);
    ctx.arc(110, -468, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Collectible figure head (smooth matte-porcelain vinyl proportions)
  ctx.save();
  ctx.translate(0, -458);
  if (opts.lookUp) ctx.rotate(-0.08 * opts.lookUp);

  if (opts.warmGlow) {
    const rim = ctx.createRadialGradient(0, -4, 38, 0, -4, 88);
    rim.addColorStop(0, 'rgba(253, 224, 71, 0.3)');
    rim.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(0, -4, 88, 0, Math.PI * 2);
    ctx.fill();
  }

  const skinGrad = ctx.createRadialGradient(-14, -18, 12, 0, 0, 68);
  skinGrad.addColorStop(0, '#FFF1E8');
  skinGrad.addColorStop(0.65, '#FCE0D0');
  skinGrad.addColorStop(1, '#EEC0AB');
  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 56, 62, 0, 0, Math.PI * 2);
  ctx.fill();

  // Porcelain specular cheek highlight
  if (!is2D) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-20, -24, 14, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Delicate pastel blush
  const blushAlpha = 0.28 + (opts.blush ?? 0) * 0.35;
  ctx.fillStyle = `rgba(244, 114, 145, ${blushAlpha})`;
  ctx.beginPath();
  ctx.ellipse(-30, 16, 15, 9, 0, 0, Math.PI * 2);
  ctx.ellipse(30, 16, 15, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (sleeping, rubbing, or big glossy vinyl-figure eyes)
  if (opts.sleeping) {
    ctx.strokeStyle = '#3D271E';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      const ex = side * 22;
      ctx.beginPath();
      ctx.moveTo(ex - 11, -1);
      ctx.quadraticCurveTo(ex, 6, ex + 11, -1);
      ctx.stroke();
    }
  } else {
    for (const side of [-1, 1]) {
      const ex = side * 22;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(ex, -2, 13, opts.shocked ? 14 : opts.rubbingEyes ? 6 : 12.5, 0, 0, Math.PI * 2);
      ctx.fill();

      const irisGrad = ctx.createRadialGradient(ex, 0, 2, ex, 0, 10);
      irisGrad.addColorStop(0, '#3D271E');
      irisGrad.addColorStop(1, '#1A110E');
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(ex, opts.lookUp ? -4 : -1, opts.rubbingEyes ? 5.5 : 8.8, 0, Math.PI * 2);
      ctx.fill();

      // Glossy dual catchlights
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - 3, -5, 3.6, 0, Math.PI * 2);
      ctx.arc(ex + 3.2, 2.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Sleepy eye-rubbing hands
  if (opts.rubbingEyes) {
    const rub = opts.t ? Math.sin(opts.t * 14) * 3.5 : 0;
    ctx.fillStyle = '#FCE0D0';
    ctx.strokeStyle = '#E5B79F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-24 + rub, 5, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(24 - rub, 5, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Mouth
  if (opts.speaking && opts.t !== undefined) {
    const open = Math.abs(Math.sin(opts.t * 16)) * 5.5 + 1.5;
    ctx.fillStyle = '#D97B78';
    ctx.beginPath();
    ctx.ellipse(0, 31, 8, open, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (opts.shocked) {
    ctx.fillStyle = '#D97B78';
    ctx.beginPath();
    ctx.ellipse(0, 31, 5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#B4635E';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const curve = (opts.smile ?? 0) * 6;
    ctx.moveTo(-10, 30);
    ctx.quadraticCurveTo(0, 30 + curve, 10, 30);
    ctx.stroke();
  }

  // Soft sculpted dark brown bangs
  ctx.fillStyle = '#4A3228';
  ctx.beginPath();
  ctx.moveTo(-58, -10);
  ctx.quadraticCurveTo(-58, -72, 0, -72);
  ctx.quadraticCurveTo(58, -72, 58, -10);
  ctx.quadraticCurveTo(42, -32, 16, -24);
  ctx.quadraticCurveTo(0, -38, -16, -24);
  ctx.quadraticCurveTo(-42, -32, -58, -10);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

function drawMaleCollectibleFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  opts: {
    styleId: AnimationStyleId;
    holdingCocoa?: boolean;
    splash?: boolean;
    shocked?: boolean;
    dabbing?: boolean;
    dabOffset?: number;
    apologetic?: boolean;
    smile?: number;
    warmGlow?: boolean;
    blush?: number;
    speaking?: boolean;
    t?: number;
  }
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Clean neck & collar (strictly short masculine haircut, no hair hanging down neck)

  // Tailored charcoal wool coat
  const coatGrad = ctx.createLinearGradient(-105, -390, 105, -100);
  coatGrad.addColorStop(0, '#363D4D');
  coatGrad.addColorStop(1, '#1A1F2B');
  ctx.fillStyle = coatGrad;
  ctx.beginPath();
  ctx.moveTo(-88, -382);
  ctx.quadraticCurveTo(0, -404, 88, -382);
  ctx.lineTo(100, -98);
  ctx.quadraticCurveTo(0, -90, -100, -98);
  ctx.closePath();
  ctx.fill();

  // Coat lapels
  ctx.strokeStyle = '#1D2230';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-42, -386);
  ctx.lineTo(-16, -270);
  ctx.moveTo(42, -386);
  ctx.lineTo(16, -270);
  ctx.stroke();

  // Knit turtleneck
  ctx.fillStyle = '#151922';
  drawRoundedRect(ctx, -28, -408, 56, 40, 12);
  ctx.fill();

  if (opts.holdingCocoa) {
    ctx.save();
    ctx.translate(-74, -245);
    ctx.rotate(opts.splash ? -0.32 : 0.05);
    ctx.fillStyle = '#B4845C';
    drawRoundedRect(ctx, -18, -28, 36, 54, 6);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, -20, -32, 40, 10, 4);
    ctx.fill();
    if (opts.splash) {
      ctx.fillStyle = 'rgba(104, 58, 28, 0.85)';
      ctx.beginPath();
      ctx.arc(-28, -14, 7, 0, Math.PI * 2);
      ctx.arc(-42, 4, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (opts.dabbing) {
    ctx.strokeStyle = '#2A303E';
    ctx.lineWidth = 24;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(64, -330);
    ctx.lineTo(106 + (opts.dabOffset ?? 0) * 0.5, -265);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(0, -472);

  if (opts.warmGlow) {
    const rim = ctx.createRadialGradient(0, -6, 38, 0, -6, 88);
    rim.addColorStop(0, 'rgba(253, 224, 71, 0.28)');
    rim.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(0, -6, 88, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ears visible cleanly below short-tapered sides
  ctx.fillStyle = '#F3C9B2';
  ctx.beginPath();
  ctx.ellipse(-52, 0, 7.5, 13, 0, 0, Math.PI * 2);
  ctx.ellipse(52, 0, 7.5, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sculpted sharp-jawline porcelain face
  const skinGrad = ctx.createRadialGradient(-12, -16, 12, 0, 0, 65);
  skinGrad.addColorStop(0, '#FFF1E7');
  skinGrad.addColorStop(0.65, '#F9D8C4');
  skinGrad.addColorStop(1, '#E3B59C');
  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.moveTo(-51, -12);
  ctx.bezierCurveTo(-51, -50, -30, -64, 0, -64);
  ctx.bezierCurveTo(30, -64, 51, -50, 51, -12);
  ctx.bezierCurveTo(51, 24, 34, 48, 0, 61);
  ctx.bezierCurveTo(-34, 48, -51, 24, -51, -12);
  ctx.closePath();
  ctx.fill();

  if (opts.blush) {
    ctx.fillStyle = `rgba(244, 114, 145, ${0.24 * opts.blush})`;
    ctx.beginPath();
    ctx.ellipse(-28, 16, 13, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(28, 16, 13, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Big captivating dark glossy eyes
  for (const side of [-1, 1]) {
    const ex = side * 20;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(ex, -2, 12, opts.shocked ? 13 : 11.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#171C28';
    ctx.beginPath();
    ctx.arc(ex, -1.5, 7.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex - 2.8, -5, 3.2, 0, Math.PI * 2);
    ctx.arc(ex + 3, 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Expressive eyebrows (gentle apologetic tilt when dabbing)
    ctx.strokeStyle = '#1E222E';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (opts.apologetic) {
      ctx.moveTo(ex - 11, side === -1 ? -15 : -19);
      ctx.lineTo(ex + 11, side === -1 ? -19 : -15);
    } else {
      ctx.moveTo(ex - 11, -16);
      ctx.quadraticCurveTo(ex, -20, ex + 11, -16);
    }
    ctx.stroke();
  }

  if (opts.speaking && opts.t !== undefined) {
    const open = Math.abs(Math.sin(opts.t * 16)) * 5 + 1.5;
    ctx.fillStyle = '#B87268';
    ctx.beginPath();
    ctx.ellipse(0, 30, 8, open, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#A65E57';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const curve = (opts.smile ?? 0) * 6;
    ctx.moveTo(-10, 29);
    ctx.quadraticCurveTo(0, 29 + curve, 10, 29);
    ctx.stroke();
  }

  // Strictly short, clean-cut men's haircut: short tapered sides above ears + lightly styled short front bangs
  ctx.fillStyle = '#1E222E';
  ctx.beginPath();
  ctx.moveTo(-53, -15);
  ctx.bezierCurveTo(-54, -56, -28, -74, 0, -74);
  ctx.bezierCurveTo(28, -74, 54, -56, 53, -15);
  ctx.quadraticCurveTo(49, -31, 40, -25);
  ctx.quadraticCurveTo(28, -19, 18, -28);
  ctx.quadraticCurveTo(8, -18, -4, -30);
  ctx.quadraticCurveTo(-18, -18, -32, -25);
  ctx.quadraticCurveTo(-45, -31, -53, -15);
  ctx.closePath();
  ctx.fill();

  // Lightly styled short front texture highlights
  ctx.strokeStyle = '#2E3446';
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-16, -64);
  ctx.quadraticCurveTo(-8, -46, -20, -28);
  ctx.moveTo(8, -66);
  ctx.quadraticCurveTo(18, -48, 30, -30);
  ctx.stroke();

  ctx.restore();
  ctx.restore();
}

/* ============================================================================
 * 4 CHIBI COLLECTIBLE FIGURE EMOTIONS (MIND HQ)
 * ========================================================================== */
function drawYellowChibiFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  active: boolean,
  _styleId: AnimationStyleId
) {
  const bounce = active ? Math.abs(Math.sin(t * 11)) * 16 : Math.sin(t * 2.4) * 3;
  const mouthOpen = active ? Math.abs(Math.sin(t * 17)) * 8 + 2 : 2;
  ctx.save();
  ctx.translate(x, y - bounce);

  // Sparkling fairy wings behind golden-yellow chibi figure
  ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
  ctx.beginPath();
  ctx.ellipse(-44, -108, 30, 18, -0.45, 0, Math.PI * 2);
  ctx.ellipse(44, -108, 30, 18, 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FACC15';
  drawRoundedRect(ctx, -46, -118, 92, 120, 28);
  ctx.fill();

  const skinGrad = ctx.createRadialGradient(-10, -172, 10, 0, -166, 52);
  skinGrad.addColorStop(0, '#FEFCE8');
  skinGrad.addColorStop(1, '#FDE047');
  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.ellipse(0, -166, 48, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(0, -180, 50, Math.PI * 0.92, Math.PI * 2.08);
  ctx.closePath();
  ctx.fill();

  for (const side of [-1, 1]) {
    const ex = side * 19;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(ex, -168, 12, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.arc(ex, -168, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex - 2.5, -172, 3.2, 0, Math.PI * 2);
    ctx.arc(ex + 3, -165, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#EA580C';
  ctx.beginPath();
  ctx.ellipse(0, -140, 10, mouthOpen, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGreenChibiFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  active: boolean,
  scowling: boolean,
  _styleId: AnimationStyleId
) {
  const mouthOpen = active ? Math.abs(Math.sin(t * 16)) * 5.5 + 1.5 : 0;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#10B981';
  drawRoundedRect(ctx, -46, -122, 92, 124, 24);
  ctx.fill();

  ctx.fillStyle = '#059669';
  drawRoundedRect(ctx, -56, -86, 112, 26, 12);
  ctx.fill();

  ctx.fillStyle = '#D1FAE5';
  ctx.beginPath();
  ctx.ellipse(0, -170, 45, 48, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#065F46';
  ctx.beginPath();
  ctx.arc(0, -182, 48, Math.PI * 0.94, Math.PI * 2.06);
  ctx.lineTo(48, -148);
  ctx.quadraticCurveTo(26, -182, 0, -188);
  ctx.quadraticCurveTo(-26, -182, -48, -148);
  ctx.closePath();
  ctx.fill();

  for (const side of [-1, 1]) {
    const ex = side * 18;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(ex, -170, 10.5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#064E3B';
    ctx.beginPath();
    ctx.arc(ex, -171, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex - 2, -174, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#064E3B';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    if (scowling) {
      ctx.moveTo(ex - 10, side === -1 ? -188 : -182);
      ctx.lineTo(ex + 10, side === -1 ? -182 : -188);
    } else {
      ctx.moveTo(ex - 10, side === -1 ? -187 : -183);
      ctx.quadraticCurveTo(ex, -191, ex + 10, -184);
    }
    ctx.stroke();
  }

  if (mouthOpen > 0.5) {
    ctx.fillStyle = '#064E3B';
    ctx.beginPath();
    ctx.ellipse(0, -146, 9, mouthOpen, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#064E3B';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-10, -146);
    ctx.quadraticCurveTo(0, -150, 10, -146);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPurpleChibiFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  active: boolean,
  _styleId: AnimationStyleId
) {
  const mouthOpen = active ? Math.abs(Math.sin(t * 12)) * 4 + 1.2 : 0;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#8B5CF6';
  drawRoundedRect(ctx, -52, -114, 104, 116, 30);
  ctx.fill();

  ctx.fillStyle = '#EDE9FE';
  ctx.beginPath();
  ctx.ellipse(-4, -152, 43, 45, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4C1D95';
  ctx.beginPath();
  ctx.arc(-4, -164, 44, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  for (const side of [-1, 1]) {
    const ex = -4 + side * 16;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(ex, -150, 9.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4C1D95';
    ctx.beginPath();
    ctx.arc(ex - 1, -148, 4.8, 0, Math.PI * 2);
    ctx.fill();
  }

  if (mouthOpen > 0.5) {
    ctx.fillStyle = '#5B21B6';
    ctx.beginPath();
    ctx.ellipse(-4, -128, 7, mouthOpen, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tiny glowing smartphone
  ctx.fillStyle = '#1E1B4B';
  drawRoundedRect(ctx, -48, -94, 26, 42, 5);
  ctx.fill();
  ctx.fillStyle = '#DDD6FE';
  drawRoundedRect(ctx, -45, -90, 20, 34, 3);
  ctx.fill();
  ctx.restore();
}

function drawRedChibiFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  active: boolean,
  _styleId: AnimationStyleId
) {
  const stompY = active ? Math.abs(Math.sin(t * 16)) * -14 : 0;
  const mouthOpen = active ? Math.abs(Math.sin(t * 19)) * 8 + 3 : 0;

  ctx.save();
  ctx.translate(x, y + 12 + stompY);

  // Crisp white shirt & tie
  ctx.fillStyle = '#F8FAFC';
  drawRoundedRect(ctx, -48, -108, 96, 108, 22);
  ctx.fill();
  ctx.fillStyle = '#B91C1C';
  ctx.beginPath();
  ctx.moveTo(-7, -104);
  ctx.lineTo(7, -104);
  ctx.lineTo(10, -48);
  ctx.lineTo(0, -34);
  ctx.lineTo(-10, -48);
  ctx.closePath();
  ctx.fill();

  // Stylized flame bursting from Red figure's head!
  if (active) {
    const flick = Math.sin(t * 28) * 9;
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(-38, -186);
    ctx.quadraticCurveTo(-40, -245, -16, -258 + flick * 0.5);
    ctx.quadraticCurveTo(0, -285, 16, -254 - flick * 0.5);
    ctx.quadraticCurveTo(40, -242, 38, -186);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(-22, -186);
    ctx.quadraticCurveTo(0, -250 - flick * 0.4, 22, -186);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = active ? '#EF4444' : '#FCA5A5';
  drawRoundedRect(ctx, -42, -192, 84, 82, 24);
  ctx.fill();

  for (const side of [-1, 1]) {
    const ex = side * 16;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(ex, -154, 9.5, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7F1D1D';
    ctx.beginPath();
    ctx.arc(ex, -154, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#450A0A';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(ex - 10, side === -1 ? -170 : -162);
    ctx.lineTo(ex + 10, side === -1 ? -162 : -170);
    ctx.stroke();
  }

  if (mouthOpen > 0.5) {
    ctx.fillStyle = '#450A0A';
    drawRoundedRect(ctx, -16, -134, 32, mouthOpen + 4, 6);
    ctx.fill();
  }
  ctx.restore();
}

function drawSnowflakes(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  for (let i = 0; i < 36; i++) {
    const x = ((i * 197 + Math.sin(t * 1.5 + i) * 18 + t * 14) % W + W) % W;
    const y = (i * 113 + t * (34 + (i % 5) * 10)) % H;
    ctx.globalAlpha = 0.32 + (i % 4) * 0.14;
    ctx.beginPath();
    ctx.arc(x, y, 1.8 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ============================================================================
 * BURNED-IN SUBTITLES (WORD-FOR-WORD, MAX 2 LINES, EXPRESSION HIGHLIGHT)
 * ========================================================================== */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (ctx.measureText(text).width <= maxWidth) return [text];
  const words = text.split(' ');
  let bestSplit = Math.ceil(words.length / 2);
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(' ');
    const l2 = words.slice(i).join(' ');
    const diff = Math.abs(ctx.measureText(l1).width - ctx.measureText(l2).width);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplit = i;
    }
  }
  return [words.slice(0, bestSplit).join(' '), words.slice(bestSplit).join(' ')];
}

function normalizeQuotes(str: string): string {
  return str.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

function findHighlightSpan(text: string, expressions: string[]): { start: number; end: number } | null {
  const lower = normalizeQuotes(text).toLowerCase();
  for (const raw of expressions) {
    const expr = normalizeQuotes(raw).trim().replace(/[.,!?]+$/, '');
    if (!expr) continue;
    const idx = lower.indexOf(expr.toLowerCase());
    if (idx >= 0) {
      return { start: idx, end: idx + expr.length };
    }
  }
  return null;
}

function drawBurnedInSubtitles(
  ctx: CanvasRenderingContext2D,
  line: TimedLine,
  targetExpressions: string[]
) {
  const cleanText = line.text.replace(/\*\*/g, '').trim();
  ctx.save();
  const fontSize = 28;
  ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textBaseline = 'middle';

  const lines = wrapLines(ctx, cleanText, 940).slice(0, 2);
  const lineH = 38;
  const maxLineW = Math.max(...lines.map((l) => ctx.measureText(l).width));

  const padX = 24;
  const padY = 12;
  const boxW = maxLineW + padX * 2;
  const boxH = lines.length * lineH + padY * 2 - 4;
  const boxX = (W - boxW) / 2;
  const boxY = H - 32 - boxH;

  drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 10);
  ctx.fillStyle = 'rgba(10, 14, 24, 0.72)';
  ctx.fill();

  const span = findHighlightSpan(cleanText, targetExpressions);
  let runningOffset = 0;

  lines.forEach((subLine, idx) => {
    const lineW = ctx.measureText(subLine).width;
    let cursorX = (W - lineW) / 2;
    const lineY = boxY + padY + lineH * idx + lineH / 2 - 2;

    const gStart = runningOffset;
    const gEnd = runningOffset + subLine.length;
    runningOffset = gEnd + 1;

    const segments: Array<{ text: string; isHl: boolean }> = [];
    if (span && span.end > gStart && span.start < gEnd) {
      const ls = Math.max(0, span.start - gStart);
      const le = Math.min(subLine.length, span.end - gStart);
      if (ls > 0) segments.push({ text: subLine.slice(0, ls), isHl: false });
      segments.push({ text: subLine.slice(ls, le), isHl: true });
      if (le < subLine.length) segments.push({ text: subLine.slice(le), isHl: false });
    } else {
      segments.push({ text: subLine, isHl: false });
    }

    ctx.textAlign = 'left';
    for (const seg of segments) {
      const segW = ctx.measureText(seg.text).width;
      if (seg.isHl) {
        ctx.fillStyle = '#F59E0B';
        drawRoundedRect(ctx, cursorX, lineY + 15, segW, 3.5, 2);
        ctx.fill();
      }

      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;

      ctx.lineWidth = 4.5;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.strokeText(seg.text, cursorX, lineY);

      ctx.fillStyle = seg.isHl ? '#FEF08A' : '#FFFFFF';
      ctx.fillText(seg.text, cursorX, lineY);
      cursorX += segW;
    }
  });

  ctx.restore();
}
