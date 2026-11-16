'use strict';
// Holds the current save, creates new characters, and saves/loads from the browser.
const Game = {
  SAVE_KEY: 'shinobi-path-save-v1',
  state: null,

  newCharacter({ name, village, clan, background }) {
    const clanData = DATA.CLANS[clan];
    const bg = DATA.BACKGROUNDS[background];
    const stats = {};
    const talent = {}; // hidden: how fast each stat grows for this character
    for (const { id } of DATA.STATS) {
      stats[id] = U.rand(3, 8) + (clanData.start[id] || 0) + (bg.start[id] || 0);
      talent[id] = U.clamp(U.gauss(1, 0.18), 0.6, 1.4) * (clanData.talent[id] || 1) * (clanData.talentAll || 1);
    }
    this.state = {
      version: 1,
      name, village, clan, background,
      nature: clanData.nature || U.weighted(DATA.VILLAGES[village].natures),
      natureKnown: false,
      year: 1, week: 1, ageWeeks: 8 * 52,
      rank: 'student',
      stats, talent,
      fatigue: 0, injuredWeeks: 0,
      learned: [], progress: {},
      ryo: 0, missions: { D: 0, C: 0 },
      gradFails: 0, chuninAttempts: 0,
      team: null, exam: null, combat: null,
      prompts: [], log: [], ended: null,
    };
    Sim.log(`${name} enters the ${DATA.VILLAGES[village].name} Academy at age 8.`, 'good');
    this.save();
  },

  save() {
    try { localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.state)); } catch (e) { /* storage unavailable */ }
  },

  load() {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY);
      this.state = raw ? JSON.parse(raw) : null;
    } catch (e) { this.state = null; }
    return !!this.state;
  },

  reset() {
    this.state = null;
    try { localStorage.removeItem(this.SAVE_KEY); } catch (e) { /* ignore */ }
  },
};
