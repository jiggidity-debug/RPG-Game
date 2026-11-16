'use strict';
// All game content lives here. To add a clan, jutsu, mission or enemy,
// add an entry below — the rest of the code picks it up automatically.
const DATA = {};

DATA.STATS = [
  { id: 'taijutsu', label: 'Taijutsu' },
  { id: 'ninjutsu', label: 'Ninjutsu' },
  { id: 'genjutsu', label: 'Genjutsu' },
  { id: 'chakraControl', label: 'Chakra Control' },
  { id: 'chakraPool', label: 'Chakra Reserves' },
  { id: 'speed', label: 'Speed' },
  { id: 'strength', label: 'Strength' },
  { id: 'stamina', label: 'Stamina' },
  { id: 'intellect', label: 'Intellect' },
];

// Stat scale (0-100). Most ninja never pass Chunin level in most stats.
DATA.TIERS = [[15, 'Academy'], [30, 'Genin'], [45, 'Chunin'], [65, 'Jonin'], [85, 'Elite'], [101, 'Kage']];

DATA.RANKS = { student: 'Academy Student', genin: 'Genin', chunin: 'Chunin' };

DATA.NATURES = { fire: 'Fire', wind: 'Wind', lightning: 'Lightning', earth: 'Earth', water: 'Water' };

DATA.VILLAGES = {
  leaf:  { name: 'Hidden Leaf',  land: 'Land of Fire',      natures: { fire: 4, wind: 2, lightning: 1, earth: 1, water: 1 } },
  sand:  { name: 'Hidden Sand',  land: 'Land of Wind',      natures: { wind: 4, earth: 2, fire: 1, lightning: 1, water: 1 } },
  mist:  { name: 'Hidden Mist',  land: 'Land of Water',     natures: { water: 4, lightning: 1, wind: 1, earth: 1, fire: 1 } },
  cloud: { name: 'Hidden Cloud', land: 'Land of Lightning', natures: { lightning: 4, water: 1, earth: 1, wind: 1, fire: 1 } },
  stone: { name: 'Hidden Stone', land: 'Land of Earth',     natures: { earth: 4, lightning: 1, fire: 1, water: 1, wind: 1 } },
};

// talent: multiplies training gains for that stat. start: bonus starting points.
// combat: passive combat bonuses (hit = extra hit chance, support = extra teammate help).
DATA.CLANS = {
  civilian: { name: 'No clan', villages: 'all', talent: {}, talentAll: 1.08, start: {},
    desc: 'No ninja legacy, no head start, no expectations.', trait: 'Something to prove: +8% to all training.' },
  uchiha: { name: 'Uchiha', villages: ['leaf'], nature: 'fire', talent: { ninjutsu: 1.25, genjutsu: 1.3, speed: 1.1 }, start: { ninjutsu: 2, genjutsu: 2 },
    desc: 'A proud clan famed for fire techniques and illusions.', trait: 'Always Fire nature. Strong ninjutsu and genjutsu growth.' },
  hyuga: { name: 'Hyuga', villages: ['leaf'], talent: { taijutsu: 1.25, chakraControl: 1.3 }, start: { taijutsu: 2, chakraControl: 3 }, combat: { hit: 0.08 },
    desc: 'A strict clan of close-range fighters with all-seeing eyes.', trait: 'Byakugan: +8% hit chance. Gentle Fist technique.' },
  nara: { name: 'Nara', villages: ['leaf'], talent: { intellect: 1.35, chakraControl: 1.1 }, start: { intellect: 4 },
    desc: 'Lazy-looking strategists who fight with shadows.', trait: 'Big intellect growth. Shadow Possession technique.' },
  akimichi: { name: 'Akimichi', villages: ['leaf'], talent: { strength: 1.3, stamina: 1.25, chakraPool: 1.15, speed: 0.85 }, start: { strength: 3, stamina: 2 },
    desc: 'Big-hearted, big-bodied powerhouses.', trait: 'Strength and stamina growth, slower speed. Expansion technique.' },
  yamanaka: { name: 'Yamanaka', villages: ['leaf'], talent: { genjutsu: 1.2, intellect: 1.15, chakraControl: 1.1 }, start: { intellect: 2, genjutsu: 1 },
    desc: 'Mind specialists who run the village flower shop.', trait: 'Mind Transfer technique.' },
  inuzuka: { name: 'Inuzuka', villages: ['leaf'], talent: { speed: 1.2, taijutsu: 1.2, strength: 1.1, intellect: 0.9 }, start: { speed: 2, taijutsu: 2 }, combat: { support: 0.2 },
    desc: 'Wild fighters who partner with ninja hounds.', trait: 'Your hound helps in fights. Fang Over Fang technique.' },
  aburame: { name: 'Aburame', villages: ['leaf'], talent: { chakraPool: 1.2, intellect: 1.15, ninjutsu: 1.1 }, start: { intellect: 2, chakraPool: 2 },
    desc: 'Quiet clan whose bodies host chakra-eating insects.', trait: 'Insect Swarm technique.' },
  uzumaki: { name: 'Uzumaki', villages: ['leaf'], talent: { chakraPool: 1.5, stamina: 1.25, chakraControl: 0.85 }, start: { chakraPool: 5, stamina: 2 },
    desc: 'Survivors of a lost clan known for vast chakra and sealing.', trait: 'Huge chakra growth, worse control. Chakra Chains technique.' },
  hozuki: { name: 'Hozuki', villages: ['mist'], nature: 'water', talent: { ninjutsu: 1.15, chakraControl: 1.1 }, start: { chakraControl: 2 },
    desc: 'A clan that can turn their bodies to water.', trait: 'Always Water nature. Hydrification technique.' },
  kaguya: { name: 'Kaguya', villages: ['mist'], talent: { taijutsu: 1.3, strength: 1.2, stamina: 1.1, intellect: 0.85 }, start: { taijutsu: 2, strength: 2 },
    desc: 'A feared warrior clan that shapes its own bones.', trait: 'Strong taijutsu growth. Bone Blade technique.' },
};

DATA.BACKGROUNDS = {
  scrappy:  { name: 'Scrappy',  start: { taijutsu: 2, strength: 2 }, desc: 'Grew up getting into fights.' },
  bookworm: { name: 'Bookworm', start: { intellect: 3, chakraControl: 1 }, desc: 'Read every scroll you could find.' },
  runner:   { name: 'Runner',   start: { speed: 3, stamina: 1 }, desc: 'Always racing across rooftops.' },
  dreamer:  { name: 'Dreamer',  start: { genjutsu: 2, chakraPool: 2 }, desc: 'Lost in your own head — and full of energy.' },
};

// Weekly activities. gains = relative training weight per stat. fatigue = cost (negative recovers).
DATA.ACTIVITIES = {
  classes:      { name: 'Academy classes', ranks: ['student'], gains: { ninjutsu: 0.5, taijutsu: 0.5, intellect: 0.7, chakraControl: 0.4, genjutsu: 0.3 }, fatigue: 10 },
  taijutsu:     { name: 'Taijutsu drills', gains: { taijutsu: 1, speed: 0.4, strength: 0.3 }, fatigue: 18 },
  ninjutsu:     { name: 'Ninjutsu practice', gains: { ninjutsu: 1, chakraControl: 0.4, chakraPool: 0.2 }, fatigue: 14 },
  control:      { name: 'Chakra control exercises', gains: { chakraControl: 1, chakraPool: 0.4, genjutsu: 0.2 }, fatigue: 12 },
  genjutsu:     { name: 'Illusion training', gains: { genjutsu: 1, intellect: 0.4, chakraControl: 0.2 }, fatigue: 10 },
  conditioning: { name: 'Physical conditioning', gains: { strength: 0.8, stamina: 0.8, speed: 0.5 }, fatigue: 22 },
  study:        { name: 'Study in the library', gains: { intellect: 1, genjutsu: 0.2 }, fatigue: 5, injurySafe: true },
  rest:         { name: 'Rest', gains: {}, fatigue: -35, injurySafe: true },
};

// Jutsu. req = minimum stats to practice it. Learning takes several weeks of practice.
// combat.effect: attack | stun | evade | feint | buff | wall
DATA.JUTSU = {
  clone:          { name: 'Clone Jutsu', type: 'ninjutsu', academy: true, req: { ninjutsu: 6, chakraControl: 6 }, cost: 5, combat: { effect: 'feint' } },
  transformation: { name: 'Transformation Jutsu', type: 'ninjutsu', academy: true, req: { ninjutsu: 7, chakraControl: 5 }, cost: 0, combat: null },
  substitution:   { name: 'Substitution Jutsu', type: 'ninjutsu', academy: true, req: { ninjutsu: 8, speed: 8 }, cost: 6, combat: { effect: 'evade', value: 0.65 } },
  falseSurroundings: { name: 'Genjutsu: False Surroundings', type: 'genjutsu', req: { genjutsu: 14, chakraControl: 12 }, cost: 10, combat: { effect: 'stun', base: 0.45, stat: 'genjutsu' } },

  // Nature techniques (unlock once your nature is revealed at graduation)
  fireball:     { name: 'Fire Style: Fireball Jutsu', type: 'ninjutsu', nature: 'fire', req: { ninjutsu: 16, chakraControl: 14, chakraPool: 12 }, cost: 14, combat: { effect: 'attack', power: 10, stat: 'ninjutsu' } },
  phoenix:      { name: 'Fire Style: Phoenix Flower', type: 'ninjutsu', nature: 'fire', req: { ninjutsu: 30, chakraControl: 28, chakraPool: 24 }, cost: 22, combat: { effect: 'attack', power: 18, stat: 'ninjutsu' } },
  galePalm:     { name: 'Wind Style: Gale Palm', type: 'ninjutsu', nature: 'wind', req: { ninjutsu: 16, chakraControl: 15, chakraPool: 10 }, cost: 12, combat: { effect: 'attack', power: 9, stat: 'ninjutsu' } },
  breakthrough: { name: 'Wind Style: Great Breakthrough', type: 'ninjutsu', nature: 'wind', req: { ninjutsu: 30, chakraControl: 28, chakraPool: 22 }, cost: 20, combat: { effect: 'attack', power: 17, stat: 'ninjutsu' } },
  thunderNeedle:{ name: 'Lightning Style: Thunder Needle', type: 'ninjutsu', nature: 'lightning', req: { ninjutsu: 16, chakraControl: 15, speed: 12 }, cost: 13, combat: { effect: 'attack', power: 8, stat: 'ninjutsu', stun: 0.15 } },
  chainLightning:{ name: 'Lightning Style: Chain Lightning', type: 'ninjutsu', nature: 'lightning', req: { ninjutsu: 30, chakraControl: 28, speed: 24 }, cost: 21, combat: { effect: 'attack', power: 15, stat: 'ninjutsu', stun: 0.25 } },
  rockShot:     { name: 'Earth Style: Rock Shot', type: 'ninjutsu', nature: 'earth', req: { ninjutsu: 15, chakraControl: 13, strength: 12 }, cost: 12, combat: { effect: 'attack', power: 9, stat: 'ninjutsu' } },
  earthWall:    { name: 'Earth Style: Earth Wall', type: 'ninjutsu', nature: 'earth', req: { ninjutsu: 26, chakraControl: 24, chakraPool: 22 }, cost: 14, combat: { effect: 'wall' } },
  waterBullet:  { name: 'Water Style: Water Bullet', type: 'ninjutsu', nature: 'water', req: { ninjutsu: 16, chakraControl: 16, chakraPool: 10 }, cost: 13, combat: { effect: 'attack', power: 9, stat: 'ninjutsu' } },
  tidalLash:    { name: 'Water Style: Tidal Lash', type: 'ninjutsu', nature: 'water', req: { ninjutsu: 30, chakraControl: 30, chakraPool: 22 }, cost: 20, combat: { effect: 'attack', power: 16, stat: 'ninjutsu' } },

  // Clan techniques (taught at home, so you can learn them any time)
  gentleFist:       { name: 'Gentle Fist', type: 'taijutsu', clan: 'hyuga', req: { taijutsu: 14, chakraControl: 16 }, cost: 8, combat: { effect: 'attack', power: 8, stat: 'taijutsu', pierce: true } },
  shadowPossession: { name: 'Shadow Possession Jutsu', type: 'ninjutsu', clan: 'nara', req: { ninjutsu: 12, intellect: 16, chakraControl: 12 }, cost: 12, combat: { effect: 'stun', base: 0.6, stat: 'intellect' } },
  expansion:        { name: 'Expansion Jutsu', type: 'ninjutsu', clan: 'akimichi', req: { strength: 14, chakraPool: 12 }, cost: 15, combat: { effect: 'buff' } },
  mindTransfer:     { name: 'Mind Transfer Jutsu', type: 'genjutsu', clan: 'yamanaka', req: { genjutsu: 14, intellect: 14 }, cost: 14, combat: { effect: 'stun', base: 0.5, stat: 'genjutsu' } },
  fangOverFang:     { name: 'Fang Over Fang', type: 'taijutsu', clan: 'inuzuka', req: { taijutsu: 15, speed: 14 }, cost: 10, combat: { effect: 'attack', power: 10, stat: 'taijutsu' } },
  insectSwarm:      { name: 'Insect Swarm', type: 'ninjutsu', clan: 'aburame', req: { ninjutsu: 12, chakraPool: 14 }, cost: 8, combat: { effect: 'attack', power: 8, stat: 'ninjutsu' } },
  chakraChains:     { name: 'Sealing: Chakra Chains', type: 'ninjutsu', clan: 'uzumaki', req: { chakraPool: 18, ninjutsu: 14 }, cost: 14, combat: { effect: 'stun', base: 0.55, stat: 'ninjutsu' } },
  hydrification:    { name: 'Hydrification', type: 'ninjutsu', clan: 'hozuki', req: { ninjutsu: 12, chakraControl: 14 }, cost: 8, combat: { effect: 'evade', value: 0.8 } },
  boneBlade:        { name: 'Bone Blade', type: 'taijutsu', clan: 'kaguya', req: { taijutsu: 16, strength: 14 }, cost: 6, combat: { effect: 'attack', power: 11, stat: 'taijutsu' } },
};

DATA.MISSIONS = {
  D: [
    { text: "Track down a lord's runaway cat", gains: { speed: 0.6, stamina: 0.3 } },
    { text: "Weed and harvest a farmer's field", gains: { strength: 0.5, stamina: 0.5 } },
    { text: 'Repair the fences around the training grounds', gains: { strength: 0.6 } },
    { text: 'Deliver medicine to an outlying farmstead', gains: { speed: 0.4, stamina: 0.4 } },
    { text: 'Clear trash out of the river', gains: { stamina: 0.6 } },
    { text: 'Help a shopkeeper take inventory', gains: { intellect: 0.6 } },
  ],
  C: [
    { text: 'Escort a merchant caravan to a border town', encounter: 0.6, enemies: ['bandit', 'bandit', 'rogue'] },
    { text: 'Drive off bandits harassing a farming village', encounter: 0.95, enemies: ['banditLeader'] },
    { text: 'Deliver a sealed message to a frontier outpost', encounter: 0.45, enemies: ['bandit', 'rogue'] },
    { text: 'Guard a bridge builder for a week', encounter: 0.55, enemies: ['bandit', 'rogue'] },
  ],
};

// level = rough stat level. A fresh Genin is around 15-25.
DATA.ENEMIES = {
  bandit:       { level: [11, 19], names: ['Bandit thug', 'Bandit brute', 'Bandit knife-fighter'] },
  banditLeader: { level: [17, 25], names: ['Bandit leader', 'Ex-samurai mercenary'] },
  rogue:        { level: [20, 30], names: ['Rogue ninja', 'Missing-nin drifter'] },
  exam:         { level: [15, 34], names: null }, // name generated: a genin from another village
};

DATA.NAMES = {
  given: ['Haru', 'Ren', 'Sora', 'Kaito', 'Aiko', 'Yui', 'Daichi', 'Hana', 'Riku', 'Mei', 'Takeshi', 'Nori', 'Kenji', 'Suzu', 'Toma', 'Akane', 'Isamu', 'Chiyo', 'Ryota', 'Emi', 'Jiro', 'Natsu'],
  family: ['Sato', 'Kobayashi', 'Mori', 'Fujita', 'Ishida', 'Kuroda', 'Tani', 'Hoshino', 'Ueda', 'Nakano', 'Arai', 'Kondo'],
};
