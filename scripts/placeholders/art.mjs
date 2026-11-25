// Placeholder illustration kit. Every image produced here is clearly labelled
// "placeholder" and is meant to be replaced with VBamboo catalogue photography.

export const PAL = {
  moss: '#2D3826',
  mossDeep: '#222B1D',
  gold: '#DCB573',
  ivory: '#F6F1E7',
  sand: '#E9DFCC',
  stone: '#D8CDB8',
  bamboo: '#C9A267',
  bambooDark: '#8E6B3A',
  ink: '#3A3328',
};

const node = (x, y, w) => `<line x1="${x - w}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${PAL.bambooDark}" stroke-width="2" opacity=".55"/>`;

/** A bamboo tube from (x1,y1) to (x2,y2) with growth nodes. */
const tube = (x1, y1, x2, y2, w = 9, nodes = 2) => {
  let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${PAL.bamboo}" stroke-width="${w}" stroke-linecap="round"/>`;
  s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#E4C690" stroke-width="${w * 0.28}" stroke-linecap="round" opacity=".6" transform="translate(${-w * 0.22},0)"/>`;
  for (let i = 1; i <= nodes; i++) {
    const t = i / (nodes + 1);
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (Math.abs(x2 - x1) < Math.abs(y2 - y1)) s += node(x, y, w * 0.6);
  }
  return s;
};

const bentTube = (d, w = 9) =>
  `<path d="${d}" fill="none" stroke="${PAL.bamboo}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" fill="none" stroke="#E4C690" stroke-width="${w * 0.28}" stroke-linecap="round" opacity=".55" transform="translate(-2,-1)"/>`;

const weaveFill = (id, color = PAL.bamboo) =>
  `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="16" height="16" fill="${color}"/><rect width="16" height="6" y="5" fill="#B48C52" opacity=".55"/><rect width="6" height="16" x="5" fill="#E2C38B" opacity=".45"/></pattern>`;

/** Furniture drawings in a 400 x 300 box, floor at y = 300. `cushion` colours upholstery. */
export const FURNITURE = {
  sofas: (c) => `
    <ellipse cx="200" cy="298" rx="210" ry="10" fill="#000" opacity=".12"/>
    ${tube(40, 300, 46, 232, 10, 1)}${tube(360, 300, 354, 232, 10, 1)}
    <rect x="34" y="120" width="332" height="72" rx="28" fill="${c}"/>
    <rect x="30" y="176" width="340" height="56" rx="20" fill="${c}" />
    <rect x="30" y="176" width="340" height="56" rx="20" fill="#000" opacity=".06"/>
    <line x1="200" y1="182" x2="200" y2="226" stroke="#000" opacity=".12" stroke-width="2"/>
    ${bentTube('M14 246 L14 160 Q14 118 54 118 L60 118', 12)}
    ${bentTube('M386 246 L386 160 Q386 118 346 118 L340 118', 12)}
    ${bentTube('M14 246 L386 246', 12)}`,
  chairs: (c) => `
    <ellipse cx="200" cy="298" rx="110" ry="8" fill="#000" opacity=".12"/>
    ${tube(130, 300, 136, 190, 9, 1)}${tube(270, 300, 264, 190, 9, 1)}
    ${tube(152, 296, 156, 196, 7, 1)}${tube(248, 296, 244, 196, 7, 1)}
    ${bentTube('M136 196 L132 40 Q200 22 268 40 L264 196', 10)}
    ${[160, 184, 208, 232].map((x) => tube(x + 4, 52, x + 4, 150, 6, 0)).join('')}
    ${bentTube('M138 70 Q200 56 262 70', 8)}
    <rect x="120" y="178" width="160" height="26" rx="10" fill="${c}"/>
    ${bentTube('M134 262 L266 262', 6)}`,
  'lounge-chairs': (c) => `
    <ellipse cx="200" cy="298" rx="190" ry="10" fill="#000" opacity=".12"/>
    ${bentTube('M40 296 Q60 190 120 150 Q170 120 120 40', 11)}
    ${bentTube('M360 296 Q330 230 250 214 L120 196', 11)}
    ${bentTube('M70 296 L330 296', 9)}
    <path d="M128 52 Q164 120 150 176 Q220 196 330 210 L320 234 Q210 224 130 206 Q104 140 106 60 Z" fill="${c}"/>
    <path d="M128 52 Q164 120 150 176" fill="none" stroke="#000" opacity=".1" stroke-width="3"/>
    ${bentTube('M100 214 Q200 236 300 232', 8)}`,
  ottomans: (c) => `
    <ellipse cx="200" cy="298" rx="140" ry="10" fill="#000" opacity=".12"/>
    <defs>${weaveFill('wv-ot')}</defs>
    <path d="M78 196 L92 292 L308 292 L322 196 Z" fill="url(#wv-ot)"/>
    <rect x="66" y="156" width="268" height="48" rx="22" fill="${c}"/>
    ${bentTube('M80 292 L320 292', 7)}`,
  tables: () => `
    <ellipse cx="200" cy="298" rx="200" ry="10" fill="#000" opacity=".12"/>
    <rect x="4" y="120" width="392" height="22" rx="6" fill="${PAL.bamboo}"/>
    <rect x="4" y="120" width="392" height="5" rx="2" fill="#E4C690" opacity=".7"/>
    ${tube(54, 142, 44, 300, 11, 2)}${tube(346, 142, 356, 300, 11, 2)}
    ${tube(78, 142, 84, 300, 8, 2)}${tube(322, 142, 316, 300, 8, 2)}
    ${bentTube('M60 236 L340 236', 7)}`,
  'coffee-tables': () => `
    <ellipse cx="200" cy="298" rx="180" ry="10" fill="#000" opacity=".12"/>
    <defs>${weaveFill('wv-ct')}</defs>
    <path d="M110 222 Q200 300 290 222 L276 292 L124 292 Z" fill="url(#wv-ct)"/>
    <ellipse cx="200" cy="214" rx="180" ry="24" fill="${PAL.bamboo}"/>
    <ellipse cx="200" cy="210" rx="180" ry="22" fill="#D8B57A"/>
    <ellipse cx="200" cy="210" rx="150" ry="16" fill="none" stroke="${PAL.bambooDark}" opacity=".25"/>`,
  lamps: () => `
    <ellipse cx="200" cy="298" rx="80" ry="8" fill="#000" opacity=".12"/>
    <defs>${weaveFill('wv-lp', '#D9B678')}<radialGradient id="glow"><stop offset="0" stop-color="#FFE9B8" stop-opacity=".9"/><stop offset="1" stop-color="#FFE9B8" stop-opacity="0"/></radialGradient></defs>
    <circle cx="200" cy="80" r="150" fill="url(#glow)"/>
    ${tube(200, 120, 200, 292, 9, 3)}
    ${bentTube('M150 296 L250 296', 9)}
    <path d="M140 120 Q130 40 200 18 Q270 40 260 120 Z" fill="url(#wv-lp)"/>
    <path d="M140 120 Q200 136 260 120" fill="none" stroke="${PAL.bambooDark}" stroke-width="4" opacity=".5"/>`,
  shelving: () => `
    <ellipse cx="200" cy="298" rx="140" ry="8" fill="#000" opacity=".12"/>
    ${tube(80, 300, 96, 6, 11, 4)}${tube(320, 300, 304, 6, 11, 4)}
    ${[60, 130, 200, 268].map((y) => `<rect x="${86 - y * 0.03}" y="${y}" width="${228 + y * 0.06}" height="12" rx="4" fill="${PAL.bamboo}"/><rect x="${90}" y="${y}" width="${220}" height="3" fill="#E4C690" opacity=".7"/>`).join('')}
    <rect x="120" y="96" width="34" height="34" rx="4" fill="${PAL.stone}"/><circle cx="250" cy="108" r="22" fill="${PAL.sand}"/>
    <rect x="200" y="226" width="70" height="42" rx="3" fill="${PAL.moss}" opacity=".75"/>`,
  umbrellas: (c) => `
    <ellipse cx="200" cy="298" rx="200" ry="10" fill="#000" opacity=".1"/>
    <path d="M10 92 Q200 -20 390 92 Q300 78 200 84 Q100 78 10 92 Z" fill="${c}"/>
    ${[40, 100, 160, 240, 300, 360].map((x) => `<line x1="200" y1="22" x2="${x}" y2="${90 - Math.abs(200 - x) * 0.02}" stroke="${PAL.bambooDark}" stroke-width="2" opacity=".35"/>`).join('')}
    ${tube(200, 16, 200, 290, 10, 4)}
    ${bentTube('M200 150 L140 96 M200 150 L260 96', 5)}
    <rect x="150" y="284" width="100" height="14" rx="6" fill="${PAL.ink}" opacity=".7"/>`,
};

const label = (w, h, text, dark = false) =>
  `<g font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(w / 90)}" letter-spacing="2" fill="${dark ? '#F6F1E7' : '#3A3328'}" opacity=".55"><text x="${w / 2}" y="${h - h * 0.035}" text-anchor="middle">PLACEHOLDER · ${text}</text></g>`;

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;

/** Background "places" that set the mood of each collection. */
export const SETTINGS = {
  coast: (w, h) => `
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E7E3D6"/><stop offset=".55" stop-color="#F3E6CD"/><stop offset="1" stop-color="#EAD5AE"/></linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9DB3AA"/><stop offset="1" stop-color="#C6CFC0"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#sky)"/>
    <circle cx="${w * 0.72}" cy="${h * 0.3}" r="${h * 0.07}" fill="#F8EBCF"/>
    <rect y="${h * 0.5}" width="${w}" height="${h * 0.09}" fill="url(#sea)"/>
    <path d="M0 ${h * 0.58} Q${w * 0.3} ${h * 0.54} ${w * 0.55} ${h * 0.6} T${w} ${h * 0.57} V${h} H0 Z" fill="#E2CDA5"/>
    <path d="M0 ${h * 0.7} Q${w * 0.4} ${h * 0.64} ${w} ${h * 0.72} V${h} H0 Z" fill="#D9C197"/>`,
  grove: (w, h) => {
    let s = `<rect width="${w}" height="${h}" fill="#C9CDB2"/><rect width="${w}" height="${h}" fill="#2D3826" opacity=".35"/>`;
    const n = Math.round(w / 55);
    for (let i = 0; i < n; i++) {
      const x = (i / n) * w + ((i * 37) % 23);
      const cw = 8 + ((i * 13) % 14);
      const tone = ['#5E6B45', '#6F7B50', '#4C5A38', '#82895A'][i % 4];
      s += `<rect x="${x}" y="0" width="${cw}" height="${h}" fill="${tone}" opacity="${0.5 + (i % 3) * 0.15}"/>`;
      for (let y = (i * 41) % 120; y < h; y += 140 + (i % 4) * 20) s += `<rect x="${x - 1}" y="${y}" width="${cw + 2}" height="3" fill="#2A3320" opacity=".5"/>`;
    }
    s += `<rect y="${h * 0.66}" width="${w}" height="${h * 0.34}" fill="#C8B994"/><rect y="${h * 0.66}" width="${w}" height="${h * 0.34}" fill="url(#fade)"/>`;
    s += `<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2D3826" stop-opacity=".25"/><stop offset="1" stop-color="#2D3826" stop-opacity="0"/></linearGradient></defs>`;
    return s;
  },
  dusk: (w, h) => {
    let s = `<defs><linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B3A2C"/><stop offset=".6" stop-color="#6A5638"/><stop offset="1" stop-color="#8B6F45"/></linearGradient><radialGradient id="lg"><stop offset="0" stop-color="#FFD98F" stop-opacity=".8"/><stop offset="1" stop-color="#FFD98F" stop-opacity="0"/></radialGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#dusk)"/>`;
    for (let i = 0; i < 7; i++) {
      const x = w * (0.08 + i * 0.14);
      const y = h * (0.18 + ((i * 7) % 5) * 0.05);
      s += `<line x1="${x}" y1="0" x2="${x}" y2="${y - h * 0.04}" stroke="#2A2418" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${h * 0.12}" fill="url(#lg)"/><ellipse cx="${x}" cy="${y}" rx="${h * 0.035}" ry="${h * 0.05}" fill="#E7B865"/>`;
    }
    s += `<rect y="${h * 0.68}" width="${w}" height="${h * 0.32}" fill="#5A4A33"/>`;
    return s;
  },
};

/** An architectural room with an opening onto the collection's setting. */
export const room = (setting, w, h, wall = '#EDE4D3') => `
  <defs><clipPath id="opening"><path d="M${w * 0.18} ${h * 0.74} V${h * 0.34} Q${w * 0.18} ${h * 0.1} ${w * 0.5} ${h * 0.1} Q${w * 0.82} ${h * 0.1} ${w * 0.82} ${h * 0.34} V${h * 0.74} Z"/></clipPath>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9CBB0"/><stop offset="1" stop-color="#C4B391"/></linearGradient>
  <linearGradient id="light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="${wall}"/>
  <g clip-path="url(#opening)"><svg x="0" y="0" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${SETTINGS[setting](w, h)}</svg></g>
  <path d="M${w * 0.18} ${h * 0.74} V${h * 0.34} Q${w * 0.18} ${h * 0.1} ${w * 0.5} ${h * 0.1} Q${w * 0.82} ${h * 0.1} ${w * 0.82} ${h * 0.34} V${h * 0.74}" fill="none" stroke="#D7CAB3" stroke-width="${w * 0.012}"/>
  <rect y="${h * 0.74}" width="${w}" height="${h * 0.26}" fill="url(#floor)"/>
  <path d="M${w * 0.18} ${h * 0.74} L${w * 0.05} ${h} H${w * 0.95} L${w * 0.82} ${h * 0.74} Z" fill="url(#light)"/>`;

export function sceneSVG({ setting, category, cushion, w = 1800, h = 1200, text }) {
  const fw = w * (h > w ? 0.86 : 0.5);
  const s = fw / 400;
  const fx = (w - fw) / 2;
  const fy = h * 0.9 - 300 * s;
  return svg(w, h, room(setting, w, h) + `<g transform="translate(${fx} ${fy}) scale(${s})">${FURNITURE[category](cushion)}</g>` + label(w, h, text));
}

export function studioSVG({ category, cushion, w = 1600, h = 1200, text }) {
  const fw = w * 0.56;
  const s = fw / 400;
  const fx = (w - fw) / 2;
  const fy = h * 0.82 - 300 * s;
  return svg(
    w,
    h,
    `<defs><radialGradient id="st" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#FBF8F1"/><stop offset="1" stop-color="#ECE4D4"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#st)"/>` +
      `<g transform="translate(${fx} ${fy}) scale(${s})">${FURNITURE[category](cushion)}</g>` +
      label(w, h, text),
  );
}

export function detailSVG({ kind = 'weave', w = 1600, h = 1200, text, tone = PAL.bamboo }) {
  let body = `<rect width="${w}" height="${h}" fill="${tone}"/>`;
  if (kind === 'weave') {
    const sz = 120;
    for (let y = -sz; y < h + sz; y += sz / 2)
      for (let x = -sz; x < w + sz; x += sz) {
        const off = (y / (sz / 2)) % 2 ? sz / 2 : 0;
        body += `<rect x="${x + off}" y="${y}" width="${sz * 0.9}" height="${sz * 0.42}" rx="10" fill="#D7B47A" transform="rotate(-30 ${x} ${y})"/>`;
        body += `<rect x="${x + off}" y="${y}" width="${sz * 0.9}" height="${sz * 0.08}" fill="#F0D7A6" opacity=".6" transform="rotate(-30 ${x} ${y})"/>`;
      }
    body += `<rect width="${w}" height="${h}" fill="#5A3E1B" opacity=".08"/>`;
  } else if (kind === 'grain') {
    for (let i = 0; i < 90; i++) {
      const y = (i / 90) * h;
      body += `<path d="M0 ${y} Q${w * 0.3} ${y + (i % 5) * 3} ${w * 0.6} ${y - 2} T${w} ${y + 3}" stroke="${i % 3 ? '#B48C52' : '#E5C891'}" stroke-width="${1 + (i % 4)}" fill="none" opacity=".7"/>`;
    }
    body += `<rect x="0" y="${h * 0.46}" width="${w}" height="${h * 0.05}" fill="#9A7440" opacity=".75"/><rect x="0" y="${h * 0.48}" width="${w}" height="${h * 0.01}" fill="#F0D7A6" opacity=".6"/>`;
  } else if (kind === 'curve') {
    body = `<rect width="${w}" height="${h}" fill="#EFE7D8"/>`;
    for (let i = 0; i < 5; i++)
      body += `<path d="M${-w * 0.1} ${h * (1.1 - i * 0.05)} Q${w * 0.35} ${h * (0.2 + i * 0.05)} ${w * 1.1} ${h * (0.35 + i * 0.05)}" fill="none" stroke="${PAL.bamboo}" stroke-width="${h * 0.045}" stroke-linecap="round"/><path d="M${-w * 0.1} ${h * (1.1 - i * 0.05)} Q${w * 0.35} ${h * (0.2 + i * 0.05)} ${w * 1.1} ${h * (0.35 + i * 0.05)}" fill="none" stroke="#F0D7A6" stroke-width="${h * 0.01}" opacity=".6" transform="translate(-4 -8)"/>`;
  } else if (kind === 'fabric') {
    body = `<rect width="${w}" height="${h}" fill="${tone}"/>`;
    for (let y = 0; y < h; y += 6) body += `<rect y="${y}" width="${w}" height="2" fill="#000" opacity=".05"/>`;
    for (let x = 0; x < w; x += 7) body += `<rect x="${x}" width="2" height="${h}" fill="#fff" opacity=".05"/>`;
    body += `<path d="M0 ${h * 0.6} Q${w * 0.5} ${h * 0.4} ${w} ${h * 0.65}" stroke="#000" opacity=".08" stroke-width="${h * 0.06}" fill="none"/>`;
  }
  return svg(w, h, body + label(w, h, text, kind === 'grain'));
}

export function wideSVG({ setting, w = 2400, h = 1200, text, category, cushion }) {
  let body = SETTINGS[setting](w, h);
  if (category) {
    const fw = w * 0.34;
    const s = fw / 400;
    body += `<g transform="translate(${(w - fw) / 2} ${h * 0.92 - 300 * s}) scale(${s})">${FURNITURE[category](cushion)}</g>`;
  }
  return svg(w, h, body + label(w, h, text, setting !== 'coast'));
}

export function ensembleSVG({ setting, items, w = 2000, h = 1200, text }) {
  let body = room(setting, w, h);
  const n = items.length;
  items.forEach(([category, cushion], i) => {
    const fw = (w * 0.8) / n;
    const s = (fw / 400) * 0.92;
    const x = w * 0.1 + i * fw;
    body += `<g transform="translate(${x} ${h * 0.93 - 300 * s}) scale(${s})">${FURNITURE[category](cushion)}</g>`;
  });
  return svg(w, h, body + label(w, h, text));
}

export function workshopSVG({ variant = 0, w = 1600, h = 1200, text }) {
  let body = `<rect width="${w}" height="${h}" fill="#3A3A2A"/><rect width="${w}" height="${h}" fill="url(#ws)"/><defs><radialGradient id="ws" cx=".3" cy=".2" r=".9"><stop offset="0" stop-color="#C9A267" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>`;
  if (variant === 0) {
    for (let i = 0; i < 26; i++) {
      const x = w * 0.1 + i * (w * 0.032);
      body += `<line x1="${x}" y1="${h * 0.05}" x2="${x + w * 0.08}" y2="${h * 0.95}" stroke="${i % 2 ? '#C9A267' : '#B08A50'}" stroke-width="${w * 0.016}" stroke-linecap="round"/>`;
    }
  } else if (variant === 1) {
    body += `<g transform="translate(${w * 0.2} ${h * 0.25}) scale(${w / 800})">`;
    for (let i = 0; i < 10; i++) body += `<path d="M0 ${i * 24} Q200 ${i * 24 - 80} 400 ${i * 24}" stroke="#D2AE72" stroke-width="12" fill="none" stroke-linecap="round"/>`;
    body += `</g><rect x="0" y="${h * 0.8}" width="${w}" height="${h * 0.2}" fill="#5A4630"/>`;
  } else {
    for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) body += `<circle cx="${w * 0.12 + c * w * 0.11}" cy="${h * 0.2 + r * h * 0.12}" r="${h * 0.045}" fill="#C9A267" stroke="#8E6B3A" stroke-width="6"/><circle cx="${w * 0.12 + c * w * 0.11}" cy="${h * 0.2 + r * h * 0.12}" r="${h * 0.018}" fill="#6B5230"/>`;
  }
  return svg(w, h, body + label(w, h, text, true));
}
