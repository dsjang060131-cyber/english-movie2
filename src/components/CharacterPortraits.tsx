import React from 'react';
import { VoiceRole } from '../data/cinephraseDefaults';

export function CastPortrait({ role }: { role: VoiceRole }) {
  if (role === 'female_lead') {
    return (
      <svg
        viewBox="0 0 240 240"
        className="w-full h-full object-cover bg-[#F4EFEA]"
        role="img"
        aria-label="Female Protagonist collectible figure portrait"
      >
        <defs>
          <radialGradient id="fSkin" cx="42%" cy="38%" r="55%">
            <stop offset="0%" stopColor="#FFF4EC" />
            <stop offset="70%" stopColor="#FCE0D0" />
            <stop offset="100%" stopColor="#ECC1AD" />
          </radialGradient>
        </defs>
        <rect width="240" height="240" fill="#EFEAE3" />
        <ellipse cx="120" cy="112" rx="64" ry="72" fill="#3B2820" />
        {/* Beige wool coat & cream scarf */}
        <path d="M56 240 L68 166 Q120 150 172 166 L184 240 Z" fill="#DFCBB0" />
        <rect x="74" y="150" width="92" height="34" rx="17" fill="#F9F5EE" />
        <rect x="102" y="168" width="28" height="58" rx="9" fill="#F9F5EE" />
        {/* Porcelain figure face */}
        <ellipse cx="120" cy="108" rx="46" ry="50" fill="url(#fSkin)" />
        {/* Pastel blush */}
        <ellipse cx="94" cy="120" rx="12" ry="7" fill="#F47291" fillOpacity="0.3" />
        <ellipse cx="146" cy="120" rx="12" ry="7" fill="#F47291" fillOpacity="0.3" />
        {/* Glossy vinyl eyes */}
        <ellipse cx="101" cy="106" rx="11" ry="11.5" fill="#FFFFFF" />
        <circle cx="101" cy="107" r="7.5" fill="#2A1A14" />
        <circle cx="98.5" cy="103.5" r="3" fill="#FFFFFF" />
        <ellipse cx="139" cy="106" rx="11" ry="11.5" fill="#FFFFFF" />
        <circle cx="139" cy="107" r="7.5" fill="#2A1A14" />
        <circle cx="136.5" cy="103.5" r="3" fill="#FFFFFF" />
        {/* Soft smile */}
        <path d="M111 132 Q120 138 129 132" fill="none" stroke="#B4635E" strokeWidth="2.5" strokeLinecap="round" />
        {/* Bangs */}
        <path d="M72 98 Q74 48 120 48 Q166 48 168 98 Q154 78 134 86 Q120 72 106 86 Q86 78 72 98 Z" fill="#4A3228" />
      </svg>
    );
  }

  if (role === 'male_lead') {
    return (
      <svg
        viewBox="0 0 240 240"
        className="w-full h-full object-cover bg-[#E8ECF2]"
        role="img"
        aria-label="Male Lead collectible figure portrait"
      >
        <defs>
          <radialGradient id="mSkin" cx="42%" cy="35%" r="58%">
            <stop offset="0%" stopColor="#FFF2E8" />
            <stop offset="68%" stopColor="#F9D8C4" />
            <stop offset="100%" stopColor="#E3B59C" />
          </radialGradient>
        </defs>
        <rect width="240" height="240" fill="#E6EAF1" />
        {/* Tailored charcoal coat & knit turtleneck (clean neck, zero long hair) */}
        <path d="M52 240 L66 164 Q120 148 174 164 L188 240 Z" fill="#2B313F" />
        <path d="M90 162 L106 240 M150 162 L134 240" stroke="#1E2430" strokeWidth="3" fill="none" />
        <rect x="96" y="148" width="48" height="30" rx="10" fill="#151922" />
        {/* Ears visible cleanly below short-tapered sides */}
        <ellipse cx="75" cy="108" rx="7" ry="12" fill="#F3C9B2" />
        <ellipse cx="165" cy="108" rx="7" ry="12" fill="#F3C9B2" />
        {/* Sculpted sharp-jawline porcelain face */}
        <path
          d="M78 96 C78 64 96 52 120 52 C144 52 162 64 162 96 C162 124 148 144 120 156 C92 144 78 124 78 96 Z"
          fill="url(#mSkin)"
        />
        {/* Soft blush */}
        <ellipse cx="94" cy="118" rx="9" ry="5" fill="#F47291" fillOpacity="0.16" />
        <ellipse cx="146" cy="118" rx="9" ry="5" fill="#F47291" fillOpacity="0.16" />
        {/* Big captivating dark glossy eyes */}
        <ellipse cx="101" cy="105" rx="10.5" ry="10" fill="#FFFFFF" />
        <circle cx="101" cy="106" r="7" fill="#171C28" />
        <circle cx="98.5" cy="102.5" r="2.8" fill="#FFFFFF" />
        <circle cx="104" cy="109" r="1.3" fill="#FFFFFF" />
        <ellipse cx="139" cy="105" rx="10.5" ry="10" fill="#FFFFFF" />
        <circle cx="139" cy="106" r="7" fill="#171C28" />
        <circle cx="136.5" cy="102.5" r="2.8" fill="#FFFFFF" />
        <circle cx="142" cy="109" r="1.3" fill="#FFFFFF" />
        {/* Clean masculine brows */}
        <path d="M90 91 Q101 87 112 91" fill="none" stroke="#1E222E" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M128 91 Q139 87 150 91" fill="none" stroke="#1E222E" strokeWidth="2.8" strokeLinecap="round" />
        {/* Gentle charming smile */}
        <path d="M111 131 Q120 137 129 131" fill="none" stroke="#A65E57" strokeWidth="2.5" strokeLinecap="round" />
        {/* Strictly short, clean-cut men's haircut: short tapered sides above ears + lightly styled short front bangs */}
        <path
          d="M76 92 C75 56 96 42 120 42 C144 42 165 56 164 92 C161 78 154 72 146 77 C136 83 128 76 122 68 C115 78 106 84 95 79 C86 75 79 80 76 92 Z"
          fill="#1E222E"
        />
        <path
          d="M106 49 Q116 64 102 78 M124 47 Q132 62 144 74"
          stroke="#2E3446"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }

  if (role === 'yellow') {
    return (
      <svg viewBox="0 0 240 240" className="w-full h-full object-cover bg-[#FEF9E7]" role="img" aria-label="Golden-Yellow fairy figure">
        <rect width="240" height="240" fill="#FEF9E7" />
        <ellipse cx="76" cy="148" rx="34" ry="20" transform="rotate(-24 76 148)" fill="#FDE68A" fillOpacity="0.8" />
        <ellipse cx="164" cy="148" rx="34" ry="20" transform="rotate(24 164 148)" fill="#FDE68A" fillOpacity="0.8" />
        <rect x="74" y="152" width="92" height="96" rx="28" fill="#FACC15" />
        <ellipse cx="120" cy="112" rx="45" ry="47" fill="#FEF9C3" />
        <path d="M74 102 A48 48 0 0 1 166 102 Z" fill="#F59E0B" />
        <ellipse cx="102" cy="112" rx="10.5" ry="11.5" fill="#FFFFFF" />
        <circle cx="102" cy="112" r="7" fill="#78350F" />
        <circle cx="99.5" cy="108.5" r="2.8" fill="#FFFFFF" />
        <ellipse cx="138" cy="112" rx="10.5" ry="11.5" fill="#FFFFFF" />
        <circle cx="138" cy="112" r="7" fill="#78350F" />
        <circle cx="135.5" cy="108.5" r="2.8" fill="#FFFFFF" />
        <path d="M110 136 Q120 144 130 136" fill="none" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (role === 'green') {
    return (
      <svg viewBox="0 0 240 240" className="w-full h-full object-cover bg-[#ECFDF5]" role="img" aria-label="Mint-Green chic figure">
        <rect width="240" height="240" fill="#ECFDF5" />
        <rect x="74" y="152" width="92" height="96" rx="24" fill="#10B981" />
        <rect x="64" y="186" width="112" height="26" rx="13" fill="#059669" />
        <ellipse cx="120" cy="112" rx="43" ry="46" fill="#D1FAE5" />
        <path d="M74 102 A48 48 0 0 1 166 102 L166 134 Q142 102 118 90 Q94 102 74 128 Z" fill="#065F46" />
        <ellipse cx="102" cy="112" rx="9.5" ry="8.5" fill="#FFFFFF" />
        <circle cx="103" cy="110" r="5.5" fill="#064E3B" />
        <ellipse cx="138" cy="112" rx="9.5" ry="8.5" fill="#FFFFFF" />
        <circle cx="139" cy="110" r="5.5" fill="#064E3B" />
        <path d="M92 96 Q102 91 112 96" fill="none" stroke="#064E3B" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M128 98 Q138 96 148 98" fill="none" stroke="#064E3B" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M110 136 Q120 133 130 136" fill="none" stroke="#064E3B" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (role === 'purple') {
    return (
      <svg viewBox="0 0 240 240" className="w-full h-full object-cover bg-[#F3EFFE]" role="img" aria-label="Lavender-Purple chill figure">
        <rect width="240" height="240" fill="#F3EFFE" />
        <rect x="64" y="152" width="112" height="96" rx="32" fill="#8B5CF6" />
        <circle cx="120" cy="114" r="50" fill="#6D28D9" />
        <ellipse cx="120" cy="118" rx="42" ry="44" fill="#EDE9FE" />
        <path d="M78 108 A44 44 0 0 1 162 108 Z" fill="#4C1D95" />
        <ellipse cx="103" cy="120" rx="9" ry="6" fill="#FFFFFF" />
        <circle cx="102" cy="122" r="4.5" fill="#4C1D95" />
        <ellipse cx="137" cy="120" rx="9" ry="6" fill="#FFFFFF" />
        <circle cx="136" cy="122" r="4.5" fill="#4C1D95" />
        <line x1="112" y1="141" x2="128" y2="141" stroke="#5B21B6" strokeWidth="2.6" strokeLinecap="round" />
        <rect x="68" y="174" width="24" height="38" rx="5" fill="#1E1B4B" />
        <rect x="71" y="178" width="18" height="30" rx="3" fill="#DDD6FE" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 240 240" className="w-full h-full object-cover bg-[#FEF2F2]" role="img" aria-label="Ruby-Red fiery figure">
      <rect width="240" height="240" fill="#FEF2F2" />
      <path d="M84 82 C76 54 98 36 106 54 C112 24 134 20 136 52 C148 34 166 50 156 82 Z" fill="#F97316" />
      <path d="M98 82 C96 62 110 52 116 64 C122 44 134 46 132 66 C140 54 148 66 144 82 Z" fill="#FDE047" />
      <rect x="66" y="160" width="108" height="88" rx="22" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
      <polygon points="114,166 126,166 130,218 120,232 110,218" fill="#B91C1C" />
      <rect x="76" y="78" width="88" height="82" rx="24" fill="#FCA5A5" />
      <ellipse cx="102" cy="116" rx="9" ry="8" fill="#FFFFFF" />
      <circle cx="103" cy="116" r="4.8" fill="#7F1D1D" />
      <ellipse cx="138" cy="116" rx="9" ry="8" fill="#FFFFFF" />
      <circle cx="137" cy="116" r="4.8" fill="#7F1D1D" />
      <line x1="88" y1="100" x2="112" y2="108" stroke="#7F1D1D" strokeWidth="4" strokeLinecap="round" />
      <line x1="152" y1="100" x2="128" y2="108" stroke="#7F1D1D" strokeWidth="4" strokeLinecap="round" />
      <rect x="104" y="135" width="32" height="14" rx="5" fill="#7F1D1D" />
    </svg>
  );
}
