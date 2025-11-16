// (Tetap sama seperti sebelumnya)
export const CANONICAL_TAGS = [
  'Co‑op',
  'Low Spec',
  'Open World',
  'Story Rich',
  'Pixel Art',
  'AAA',
  'Keyboard Only',
  'Gamepad Support',
  'Multiplayer'
];

const rules = [
  { match: (s) => /co-?op|coop/i.test(s), label: 'Co‑op' },
  { match: (s) => /low.*spec/i.test(s), label: 'Low Spec' },
  { match: (s) => /open.*world/i.test(s), label: 'Open World' },
  { match: (s) => /story|narrative/i.test(s), label: 'Story Rich' },
  { match: (s) => /pixel/i.test(s), label: 'Pixel Art' },
  { match: (s) => /\baaa\b|triple ?a/i.test(s), label: 'AAA' },
  { match: (s) => /keyboard/i.test(s), label: 'Keyboard Only' },
  { match: (s) => /gamepad|controller/i.test(s), label: 'Gamepad Support' },
  { match: (s) => /multi.?player/i.test(s), label: 'Multiplayer' }
];

export function normalizeTags(inputTags = [], genre = [], name = '') {
  const rawInput = (Array.isArray(inputTags) ? inputTags : [])
    .map((t) => String(t).trim())
    .filter(Boolean);

  const seeds = new Set(rawInput);
  const g = (Array.isArray(genre) ? genre : []).map((x) => String(x).toLowerCase());
  if (g.some((x) => /rpg|adventure|visual novel/.test(x))) seeds.add('Story Rich');
  if (g.some((x) => /sandbox|open world/.test(x))) seeds.add('Open World');
  if (g.some((x) => /pixel/.test(x))) seeds.add('Pixel Art');

  const n = String(name).toLowerCase();
  if (/definitive|remastered|director'?s cut/.test(n)) seeds.add('AAA');

  const canonical = [];
  for (const raw of seeds) {
    const k = raw.toLowerCase();
    const hit = rules.find((r) => r.match(k));
    canonical.push(hit ? hit.label : raw);
  }

  const dedup = Array.from(new Set(canonical));
  dedup.sort((a, b) => {
    const ia = CANONICAL_TAGS.indexOf(a);
    const ib = CANONICAL_TAGS.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return dedup;
}