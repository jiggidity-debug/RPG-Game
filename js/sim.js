'use strict';
// Game rules: training, time, exams, missions and combat. No HTML in here.
const Sim = (() => {
  const S = () => Game.state;

  // ---------- helpers ----------
  const label = (id) => DATA.STATS.find((x) => x.id === id).label;
  const age = () => Math.floor(S().ageWeeks / 52);
  const coreAvg = () => { const v = Object.values(S().stats); return v.reduce((a, b) => a + b, 0) / v.length; };
  const maxHp = () => { const st = S().stats; return Math.round(40 + st.stamina * 2 + st.strength * 0.5); };
  const maxChakra = () => { const st = S().stats; return Math.round(20 + st.chakraPool * 2 + st.chakraControl * 0.3); };
  const clanBonus = (key) => { const c = DATA.CLANS[S().clan]; return (c.combat && c.combat[key]) || 0; };
  const canAct = () => { const s = S(); return s && !s.ended && !s.combat && s.prompts.length === 0; };
  const randomName = () => `${U.pick(DATA.NAMES.given)} ${U.pick(DATA.NAMES.family)}`;
  const teammate = () => (S().team ? U.pick(S().team.mates) : 'A teammate');

  function log(text, type = 'info') {
    const s = S();
    s.log.unshift({ t: `Y${s.year} W${s.week}`, text, type });
    if (s.log.length > 150) s.log.length = 150;
  }

  function notify(title, text, options) {
    S().prompts.push({ title, text, options: options || [{ label: 'Continue', id: 'close' }] });
  }

  function ageFactor() {
    const a = age();
    if (a < 10) return 0.75;
    if (a < 13) return 0.9;
    if (a < 19) return 1;
    if (a < 26) return 0.95;
    return 0.85;
  }

  // Core growth formula: gains shrink as a stat gets higher, and when tired.
  function train(gains, mult = 1) {
    const s = S();
    const out = {};
    const fatigueMult = 1 - s.fatigue / 160;
    for (const [stat, w] of Object.entries(gains)) {
      const cur = s.stats[stat];
      const g = 0.45 * w * s.talent[stat] * Math.pow(1 - cur / 100, 1.5) * ageFactor() * fatigueMult * U.rand(0.7, 1.3) * mult;
      s.stats[stat] = Math.min(99, cur + g);
      out[stat] = g;
    }
    return out;
  }

  const describeGains = (out) => Object.entries(out)
    .filter(([, g]) => g >= 0.05)
    .map(([k, g]) => `${label(k)} +${g.toFixed(1)}`)
    .join(', ');

  function overtrainCheck(cost) {
    const s = S();
    if (cost >= 10 && s.fatigue > 80 && Math.random() < 0.2) {
      const w = U.randInt(1, 3);
      s.injuredWeeks = Math.max(s.injuredWeeks, w);
      log(`You pushed yourself too hard and got hurt. Out for ${w} week(s).`, 'bad');
    }
  }

  function injuredBlock() {
    const s = S();
    if (s.injuredWeeks > 0) {
      notify('Still injured', `You need ${s.injuredWeeks} more week(s) to recover. For now you can only rest or study.`);
      return true;
    }
    return false;
  }

  function endCareer(title, text) {
    const s = S();
    s.ended = { title, text, age: age(), rank: DATA.RANKS[s.rank] };
    log(title, 'bad');
  }

  // ---------- weekly actions ----------
  function activitiesFor() {
    return Object.entries(DATA.ACTIVITIES).filter(([, a]) => !a.ranks || a.ranks.includes(S().rank));
  }

  function doActivity(id) {
    if (!canAct()) return;
    const s = S();
    const a = DATA.ACTIVITIES[id];
    if (!a || (a.ranks && !a.ranks.includes(s.rank))) return;
    if (!a.injurySafe && injuredBlock()) return;
    if (id === 'rest') {
      s.fatigue = U.clamp(s.fatigue + a.fatigue, 0, 100);
      log('You took the week to rest.');
    } else {
      const out = train(a.gains);
      s.fatigue = U.clamp(s.fatigue + a.fatigue, 0, 100);
      log(`${a.name}: ${describeGains(out) || 'barely any progress'}.`);
      overtrainCheck(a.fatigue);
    }
    endWeek();
  }

  // ---------- jutsu ----------
  function jutsuAvailable(j) {
    const s = S();
    if (j.clan && j.clan !== s.clan) return false;
    if (j.nature && (!s.natureKnown || s.nature !== j.nature)) return false;
    return true;
  }
  const reqsMet = (j) => Object.entries(j.req).every(([k, v]) => S().stats[k] >= v);

  function practice(jid) {
    if (!canAct()) return;
    const s = S();
    const j = DATA.JUTSU[jid];
    if (!j || !jutsuAvailable(j) || s.learned.includes(jid)) return;
    if (injuredBlock()) return;
    if (!reqsMet(j)) { notify('Not ready yet', `Your stats don't meet the requirements for ${j.name} yet.`); return; }
    const reqStats = Object.keys(j.req);
    const surplus = reqStats.reduce((a, k) => a + Math.max(0, s.stats[k] - j.req[k]), 0);
    const talent = reqStats.reduce((a, k) => a + s.talent[k], 0) / reqStats.length;
    const gain = (7 + surplus * 0.8) * talent * U.rand(0.8, 1.2) * (1 - s.fatigue / 200);
    s.progress[jid] = Math.min(100, (s.progress[jid] || 0) + gain);
    train({ [j.type]: 0.4, chakraControl: 0.3 });
    s.fatigue = U.clamp(s.fatigue + 14, 0, 100);
    if (s.progress[jid] >= 100) {
      s.learned.push(jid);
      delete s.progress[jid];
      log(`You mastered ${j.name}!`, 'good');
    } else {
      log(`Practiced ${j.name} (${Math.floor(s.progress[jid])}% learned).`);
    }
    overtrainCheck(14);
    endWeek();
  }

  // ---------- missions ----------
  function doMission(rank) {
    if (!canAct()) return;
    const s = S();
    if (s.rank === 'student' || injuredBlock()) return;
    if (rank === 'D') {
      const m = U.pick(DATA.MISSIONS.D);
      const ryo = U.randInt(15, 40) * 100;
      s.ryo += ryo;
      s.missions.D++;
      const out = train(m.gains, 0.6);
      s.fatigue = U.clamp(s.fatigue + 12, 0, 100);
      log(`D-rank: ${m.text}. Done. +${ryo} ryo${describeGains(out) ? ` (${describeGains(out)})` : ''}.`);
      endWeek();
    } else if (rank === 'C') {
      if (s.missions.D < 5) {
        notify('Not yet', `${s.team.sensei} wants your team to finish at least 5 D-rank missions before taking a C-rank. (${s.missions.D}/5)`);
        return;
      }
      const m = U.pick(DATA.MISSIONS.C);
      const ryo = U.randInt(60, 140) * 100;
      s.fatigue = U.clamp(s.fatigue + 20, 0, 100);
      if (Math.random() < m.encounter) {
        startCombat({
          kind: 'mission', enemy: makeEnemy(U.pick(m.enemies)), support: true, canRetreat: true,
          intro: `C-rank: ${m.text}. You're ambushed on the road!`, mission: { text: m.text, ryo },
        });
      } else {
        s.missions.C++;
        s.ryo += ryo;
        train({ speed: 0.3, stamina: 0.3 }, 0.6);
        log(`C-rank: ${m.text}. It went smoothly. +${ryo} ryo.`, 'good');
        endWeek();
      }
    }
  }

  // ---------- combat ----------
  function makeEnemy(type) {
    const T = DATA.ENEMIES[type];
    const L = U.randInt(T.level[0], T.level[1]);
    let name;
    if (type === 'exam') {
      const other = U.pick(Object.keys(DATA.VILLAGES).filter((v) => v !== S().village));
      name = `${U.pick(DATA.NAMES.given)} of the ${DATA.VILLAGES[other].name}`;
    } else name = U.pick(T.names);
    const hp = Math.round(30 + L * 2.2);
    return { name, L, hp, maxHp: hp, atk: L, def: L * 0.5, speed: L * U.rand(0.85, 1.15), stunned: false };
  }

  function startCombat(o) {
    const s = S();
    s.combat = {
      kind: o.kind, enemy: o.enemy, support: !!o.support, canRetreat: !!o.canRetreat, mission: o.mission || null,
      hp: maxHp(), maxHp: maxHp(), chakra: maxChakra(), maxChakra: maxChakra(),
      flags: { evade: 0, feint: false, feintDef: false, defend: false, wall: false, buff: false },
      log: [o.intro, `${o.enemy.name} squares up against you.`], over: false, result: null, turn: 1,
    };
  }

  const clog = (t) => S().combat.log.push(t);

  function playerHit({ hit, dmg, pierce, name, strike }) {
    const c = S().combat;
    const e = c.enemy;
    let h = hit + clanBonus('hit');
    if (c.flags.feint) { h += 0.25; dmg *= 1.3; c.flags.feint = false; }
    if (strike && c.flags.buff) dmg *= 1.4;
    if (Math.random() < U.clamp(h, 0.3, 0.97)) {
      const d = Math.max(1, Math.round(dmg * U.rand(0.85, 1.15) - (pierce ? 0 : e.def * 0.3)));
      e.hp = Math.max(0, e.hp - d);
      clog(`${name} hits for ${d}.`);
      return true;
    }
    clog(`${name} misses.`);
    return false;
  }

  function combatAction(move, jid) {
    const s = S();
    const c = s.combat;
    if (!c || c.over) return;
    const e = c.enemy;
    const st = s.stats;

    if (move === 'strike') {
      playerHit({ hit: 0.78 + (st.speed - e.speed) / 120, dmg: 3 + st.taijutsu * 0.35 + st.strength * 0.25, name: 'Your strike', strike: true });
    } else if (move === 'defend') {
      c.flags.defend = true;
      c.chakra = Math.min(c.maxChakra, c.chakra + 6);
      clog('You guard and steady your chakra.');
    } else if (move === 'retreat') {
      if (!c.canRetreat) return;
      if (Math.random() < U.clamp(0.4 + (st.speed - e.speed) / 100, 0.15, 0.9)) {
        clog('You break away and retreat. The mission is abandoned.');
        return finish('fled');
      }
      clog('You try to retreat, but the enemy cuts you off!');
    } else if (move === 'jutsu') {
      const j = DATA.JUTSU[jid];
      if (!j || !j.combat || !s.learned.includes(jid)) return;
      if (c.chakra < j.cost) { clog(`Not enough chakra for ${j.name}.`); return; }
      c.chakra -= j.cost;
      const fx = j.combat;
      if (fx.effect === 'attack') {
        const taiBonus = j.type === 'taijutsu' ? (st.speed - e.speed) / 150 : 0;
        const landed = playerHit({ hit: 0.82 + (st.chakraControl - e.L) / 150 + taiBonus, dmg: fx.power + st[fx.stat] * 0.45, pierce: fx.pierce, name: j.name, strike: j.type === 'taijutsu' });
        if (landed && fx.stun && e.hp > 0 && Math.random() < fx.stun) { e.stunned = true; clog(`${e.name} is paralyzed for a moment!`); }
      } else if (fx.effect === 'stun') {
        if (Math.random() < U.clamp(fx.base + (st[fx.stat] - e.L) / 100, 0.1, 0.9)) { e.stunned = true; clog(`${j.name}: ${e.name} is caught and can't act!`); }
        else clog(`${j.name}: ${e.name} breaks free.`);
      } else if (fx.effect === 'evade') {
        c.flags.evade = fx.value;
        clog(`${j.name}: you get ready to slip away from the next attack.`);
      } else if (fx.effect === 'feint') {
        c.flags.feint = true; c.flags.feintDef = true;
        clog(`${j.name}: copies of you scatter, confusing ${e.name}.`);
      } else if (fx.effect === 'buff') {
        if (c.flags.buff) { c.chakra += j.cost; clog(`${j.name} is already active.`); return; }
        c.flags.buff = true;
        clog(`${j.name}: your physical attacks now hit much harder.`);
      } else if (fx.effect === 'wall') {
        c.flags.defend = true; c.flags.wall = true;
        clog(`${j.name}: a wall of stone rises in front of you.`);
      }
    } else return;

    if (e.hp <= 0) return finish('win');
    if (c.support && Math.random() < 0.45 + clanBonus('support')) {
      const d = U.randInt(2, 5) + Math.floor(coreAvg() / 10);
      e.hp = Math.max(0, e.hp - d);
      clog(`${teammate()} jumps in for ${d} damage.`);
      if (e.hp <= 0) return finish('win');
    }
    enemyTurn();
    if (c.hp <= 0) { c.hp = 0; return finish('lose'); }
    c.turn++;
  }

  function enemyTurn() {
    const s = S();
    const c = s.combat;
    const e = c.enemy;
    const st = s.stats;
    const f = c.flags;
    if (e.stunned) {
      e.stunned = false;
      clog(`${e.name} can't move this turn.`);
    } else {
      let h = U.clamp(0.72 + (e.speed - st.speed) / 120 - (f.feintDef ? 0.2 : 0), 0.25, 0.92);
      if (f.evade) h *= 1 - f.evade;
      const heavy = Math.random() < 0.2;
      if (Math.random() < h) {
        let d = (3 + e.atk * 0.45) * U.rand(0.8, 1.2) * (heavy ? 1.5 : 1) - (st.stamina * 0.1 + st.strength * 0.1);
        if (f.defend) d *= f.wall ? 0.3 : 0.5;
        d = Math.max(1, Math.round(d));
        c.hp -= d;
        clog(heavy ? `${e.name} lands a heavy blow for ${d}!` : `${e.name} hits you for ${d}.`);
      } else {
        clog(f.evade ? `You slip away from ${e.name}'s attack.` : `${e.name} misses.`);
      }
    }
    f.evade = 0; f.feintDef = false; f.defend = false; f.wall = false;
  }

  function finish(result) {
    const c = S().combat;
    c.over = true;
    c.result = result;
    if (result === 'win') clog(`${c.enemy.name} is defeated!`);
    if (result === 'lose') clog('Your vision goes dark as you collapse...');
  }

  function closeCombat() {
    const s = S();
    const c = s.combat;
    if (!c || !c.over) return;
    s.combat = null;
    train({ taijutsu: 0.3, speed: 0.2, ninjutsu: 0.2 }, 0.8); // real fights teach you something either way

    if (c.kind === 'mission') {
      if (c.result === 'win') {
        s.missions.C++;
        s.ryo += c.mission.ryo;
        log(`C-rank complete: ${c.mission.text}. You defeated ${c.enemy.name}. +${c.mission.ryo} ryo.`, 'good');
      } else if (c.result === 'fled') {
        log(`C-rank abandoned: ${c.mission.text}.`, 'bad');
      } else {
        log(`C-rank failed: ${c.mission.text}. ${c.enemy.name} beat you.`, 'bad');
        injure('mission');
      }
      endWeek();
    } else if (c.kind === 'forest') {
      if (c.result === 'win') {
        notify('Survival stage cleared', `Your team took the scroll from ${c.enemy.name}'s team and reached the tower. Next: the one-on-one finals.`,
          [{ label: 'Enter the finals', id: 'exam_finals' }]);
      } else {
        s.exam = null;
        log(`Eliminated from the Chunin Exams in the survival stage by ${c.enemy.name}.`, 'bad');
        notify('Eliminated', `${c.enemy.name}'s team took your scroll. Your exam is over for this year.`);
        injure('exam');
        endWeek();
      }
    } else if (c.kind === 'finals') {
      judgement(c.result === 'win', c.enemy.name);
      endWeek();
    }
  }

  function injure(context) {
    const s = S();
    const r = Math.random();
    if (context === 'mission' && r < 0.008) {
      endCareer('Career-ending injury', 'The wound from that fight never healed right. The medical ninja did what they could, but your days as a shinobi are over.');
      return;
    }
    let w;
    if (context === 'exam') w = U.randInt(1, 3);
    else w = r < 0.06 ? U.randInt(10, 20) : U.randInt(2, 6);
    s.injuredWeeks = Math.max(s.injuredWeeks, w);
    log(`You were hurt. Out for ${w} week(s).`, 'bad');
  }

  // ---------- Academy graduation ----------
  function runGraduation() {
    const s = S();
    const st = s.stats;
    const missing = ['clone', 'transformation', 'substitution'].filter((j) => !s.learned.includes(j));
    const score = st.ninjutsu * 0.35 + st.taijutsu * 0.25 + st.intellect * 0.2 + st.chakraControl * 0.2 + U.rand(-2, 2);
    const needed = age() < 12 ? 19 : 16; // going early means beating a higher bar
    const pass = missing.length === 0 && score >= needed;
    if (pass) {
      s.rank = 'genin';
      s.team = { sensei: randomName(), mates: [randomName(), randomName()] };
      s.natureKnown = true;
      const nature = DATA.NATURES[s.nature];
      log(`Graduated from the Academy at age ${age()}! Assigned to ${s.team.sensei}'s squad.`, 'good');
      notify('You graduated!',
        `Exam score: ${score.toFixed(1)} (needed ${needed}).\n\nYou're now a Genin of the ${DATA.VILLAGES[s.village].name}. ` +
        `You've been placed on a squad with ${s.team.mates[0]} and ${s.team.mates[1]}, led by Jonin ${s.team.sensei}.\n\n` +
        `On day one, your sensei hands you a slip of chakra paper. When you channel chakra into it, it reveals your nature: ${nature}. ` +
        `${nature} techniques are now available to learn.`);
      return;
    }
    s.gradFails++;
    const why = missing.length
      ? `You haven't mastered: ${missing.map((j) => DATA.JUTSU[j].name).join(', ')}.`
      : `Your exam score was ${score.toFixed(1)} — you needed ${needed}.`;
    if (age() >= 15) {
      endCareer('Washed out of the Academy', `You failed the graduation exam one last time. ${why} The Academy won't take you back next year. Your life will go another way.`);
      return;
    }
    log(`Failed the graduation exam. ${why}`, 'bad');
    notify('Failed the graduation exam', `${why}\n\nYou can try again next year.${age() >= 14 ? ' Next year is your last chance.' : ''}`);
  }

  // ---------- Chunin Exams ----------
  function chuninInvite() {
    const s = S();
    const sen = s.team.sensei;
    if (s.injuredWeeks > 0) { log('The Chunin Exams are being held, but you are injured and miss them.'); return; }
    if (s.missions.D + s.missions.C < 8 || s.missions.C < 1) {
      log(`The Chunin Exams are being held. ${sen} says your team needs more experience first (8 missions, including a C-rank).`);
      return;
    }
    if (coreAvg() < 22) { log(`The Chunin Exams are being held. ${sen} doesn't think you're ready yet.`); return; }
    notify('Chunin Exams', `${sen} has recommended your squad for the Chunin Exams. Ninja from every village will be there, and not everyone comes back unhurt.\n\nThe exams take this week. Will you enter?`,
      [{ label: 'Enter the exams', id: 'exam_enter' }, { label: 'Not this time', id: 'close' }]);
  }

  function examWritten() {
    const s = S();
    const st = s.stats;
    s.chuninAttempts++;
    const score = st.intellect * 0.6 + st.genjutsu * 0.3 + st.chakraControl * 0.1 + U.rand(-4, 4);
    s.exam = { written: score };
    if (score < 14) {
      s.exam = null;
      log('Eliminated from the Chunin Exams in the written test.', 'bad');
      notify('Failed the written test', `The questions were far beyond Genin level, and you couldn't find a way around them. (Score ${score.toFixed(1)}, needed 14.)`);
      endWeek();
      return;
    }
    notify('Written test passed', `Score: ${score.toFixed(1)}. Next is the survival stage: your squad must take a scroll from another team in the forest.`,
      [{ label: 'Begin the survival stage', id: 'exam_forest' }]);
  }

  function judgement(won, foe) {
    const s = S();
    const j = coreAvg() + (won ? 6 : 0) + s.exam.written * 0.15 + U.rand(-3, 3);
    s.exam = null;
    if (j >= 34) {
      s.rank = 'chunin';
      log(`Promoted to Chunin at age ${age()}!`, 'good');
      notify('Promoted to Chunin!', `${won ? `You beat ${foe}` : `You lost to ${foe}`}, but the judges care about judgement and skill more than wins. They promote you to Chunin.\n\nB-rank missions and squad leadership are coming in a future update.`);
    } else {
      log(`Finals ${won ? 'won' : 'lost'} against ${foe}, but not promoted.`, 'bad');
      notify('Not promoted', `${won ? `You beat ${foe}, but` : `You lost to ${foe}, and`} the judges didn't think you're ready to lead a squad yet. There's always the next exam.`);
    }
  }

  // ---------- prompts ----------
  function resolvePrompt(id) {
    const s = S();
    if (!s.prompts.length) return;
    s.prompts.shift();
    if (id === 'grad_take') runGraduation();
    else if (id === 'grad_wait') log('You decided to wait another year before taking the graduation exam.');
    else if (id === 'exam_enter') examWritten();
    else if (id === 'exam_forest') startCombat({ kind: 'forest', enemy: makeEnemy('exam'), support: true, canRetreat: false, intro: 'The survival stage begins. Your squad tracks a rival team through the forest.' });
    else if (id === 'exam_finals') startCombat({ kind: 'finals', enemy: makeEnemy('exam'), support: false, canRetreat: false, intro: 'The finals: one-on-one, in front of the whole village.' });
  }

  // ---------- time ----------
  function randomEvent() {
    const s = S();
    const r = Math.random();
    if (r < 0.35) { const out = train({ taijutsu: 0.8 }); log(`${s.rank === 'student' ? 'A classmate' : teammate()} challenged you to a spar. (${describeGains(out)})`); }
    else if (r < 0.65) { const out = train({ intellect: 0.8 }); log(`You found an old scroll and read it cover to cover. (${describeGains(out)})`); }
    else { s.fatigue = U.clamp(s.fatigue - 15, 0, 100); log('A village festival lifts your spirits. (Fatigue -15)', 'good'); }
  }

  function endWeek() {
    const s = S();
    if (s.ended) return;
    s.week++;
    s.ageWeeks++;
    if (s.week > 52) { s.week = 1; s.year++; }
    if (s.ageWeeks % 52 === 0) log(`You turned ${age()}.`);
    s.fatigue = U.clamp(s.fatigue - 8, 0, 100);
    if (s.injuredWeeks > 0) { s.injuredWeeks--; if (s.injuredWeeks === 0) log('You have fully recovered.', 'good'); }

    if (s.rank === 'student' && s.week === 48 && age() >= 11) {
      if (age() < 12) {
        notify('Early graduation?', 'Your instructors say you can take the graduation exam a year early. Most students wait until 12, and early takers are held to a higher standard. If you fail, it counts as an attempt.',
          [{ label: 'Take the exam', id: 'grad_take' }, { label: 'Wait a year', id: 'grad_wait' }]);
      } else {
        notify('Graduation exam', 'Exam day is here. You will be tested on the Clone, Transformation and Substitution jutsu, plus ninjutsu, taijutsu, chakra control and written knowledge.',
          [{ label: 'Take the exam', id: 'grad_take' }]);
      }
    }
    if (s.rank === 'genin' && (s.week === 24 || s.week === 50)) chuninInvite();
    if (Math.random() < 0.07 && s.injuredWeeks === 0) randomEvent();
    Game.save();
  }

  return {
    log, age, coreAvg, maxHp, maxChakra, activitiesFor, jutsuAvailable, reqsMet,
    doActivity, practice, doMission, combatAction, closeCombat, resolvePrompt,
  };
})();
