'use strict';
// Everything that draws the screen. Reads Game.state, never changes game rules.
const UI = (() => {
  const app = () => document.getElementById('app');
  const draft = { name: '', village: 'leaf', clan: 'civilian', background: 'scrappy' };
  const esc = U.esc;
  const tier = (v) => DATA.TIERS.find(([max]) => v < max)[1];
  const statLabel = (id) => DATA.STATS.find((x) => x.id === id).label;

  function setDraft(field, val, rerender = true) {
    draft[field] = val;
    if (field === 'village') {
      const c = DATA.CLANS[draft.clan];
      if (c.villages !== 'all' && !c.villages.includes(val)) draft.clan = 'civilian';
    }
    if (rerender) render();
  }

  function create() {
    const name = draft.name.trim();
    if (!name) { draft.error = 'Give your ninja a name.'; return; }
    draft.error = '';
    Game.newCharacter({ ...draft, name: name.slice(0, 24) });
  }

  // ---------- character creation ----------
  function card(field, id, title, body, selected) {
    return `<button class="card ${selected ? 'selected' : ''}" data-act="pick" data-field="${field}" data-val="${id}">
      <strong>${esc(title)}</strong><span>${body}</span></button>`;
  }

  function renderCreate() {
    const clans = Object.entries(DATA.CLANS).filter(([, c]) => c.villages === 'all' || c.villages.includes(draft.village));
    app().innerHTML = `
      <div class="create">
        <header class="title">
          <h1>Shinobi Path</h1>
          <p>Create a ninja and live out their career — from Academy student to whatever you can make of yourself. Not everyone makes it.</p>
        </header>
        <section class="panel">
          <h2>Name</h2>
          <input id="name-input" maxlength="24" placeholder="Your ninja's name" value="${esc(draft.name)}" autocomplete="off">
          <div class="error">${esc(draft.error || '')}</div>
        </section>
        <section class="panel">
          <h2>Village</h2>
          <div class="cards">${Object.entries(DATA.VILLAGES).map(([id, v]) => card('village', id, v.name, esc(v.land), draft.village === id)).join('')}</div>
        </section>
        <section class="panel">
          <h2>Clan</h2>
          <div class="cards">${clans.map(([id, c]) => card('clan', id, c.name, `${esc(c.desc)}<em>${esc(c.trait)}</em>`, draft.clan === id)).join('')}</div>
        </section>
        <section class="panel">
          <h2>Childhood</h2>
          <div class="cards">${Object.entries(DATA.BACKGROUNDS).map(([id, b]) => card('background', id, b.name,
            `${esc(b.desc)}<em>${Object.entries(b.start).map(([k, v]) => `+${v} ${statLabel(k)}`).join(', ')}</em>`, draft.background === id)).join('')}</div>
        </section>
        <button class="primary big" data-act="create">Enter the Academy</button>
        <p class="fine">Fan-made game. Not affiliated with or endorsed by the creators or publishers of Naruto.</p>
      </div>`;
  }

  // ---------- main screen ----------
  function bar(value, max, cls = '') {
    return `<div class="bar ${cls}"><div style="width:${U.clamp((value / max) * 100, 0, 100)}%"></div></div>`;
  }

  function statsPanel(s) {
    const rows = DATA.STATS.map(({ id, label }) => {
      const v = s.stats[id];
      return `<div class="stat"><span class="name">${label}</span>${bar(v, 100)}<span class="val">${Math.floor(v)}</span><span class="tier">${tier(v)}</span></div>`;
    }).join('');
    const fatigueCls = s.fatigue > 80 ? 'danger' : s.fatigue > 50 ? 'warn' : 'ok';
    return `<section class="panel">
      <h2>Stats</h2>${rows}
      <h2>Condition</h2>
      <div class="kv"><span>Health</span><span>${Sim.maxHp()}</span></div>
      <div class="kv"><span>Chakra</span><span>${Sim.maxChakra()}</span></div>
      <div class="stat"><span class="name">Fatigue</span>${bar(s.fatigue, 100, fatigueCls)}<span class="val">${Math.round(s.fatigue)}</span><span class="tier"></span></div>
      ${s.injuredWeeks > 0 ? `<div class="alert">Injured — ${s.injuredWeeks} week(s) to recover</div>` : ''}
      ${s.fatigue > 80 ? '<div class="alert">Exhausted. Training now risks injury.</div>' : ''}
    </section>`;
  }

  function actionsPanel(s) {
    const injured = s.injuredWeeks > 0;
    const acts = Sim.activitiesFor().map(([id, a]) => {
      const trains = Object.keys(a.gains).map(statLabel).join(', ');
      const disabled = injured && !a.injurySafe;
      const sub = id === 'rest' ? 'Recover from fatigue' : `${trains} · Fatigue +${a.fatigue}`;
      return `<button class="action" data-act="activity" data-id="${id}" ${disabled ? 'disabled' : ''}><strong>${a.name}</strong><span>${sub}</span></button>`;
    }).join('');
    let missions = '';
    if (s.rank !== 'student') {
      const cLocked = s.missions.D < 5;
      missions = `<h2>Missions</h2><div class="actions">
        <button class="action mission" data-act="mission" data-rank="D" ${injured ? 'disabled' : ''}><strong>D-rank mission</strong><span>Safe chores · 1,500–4,000 ryo</span></button>
        <button class="action mission" data-act="mission" data-rank="C" ${injured ? 'disabled' : ''}><strong>C-rank mission</strong><span>${cLocked ? `Needs 5 D-ranks (${s.missions.D}/5)` : 'Real danger · 6,000–14,000 ryo'}</span></button>
      </div>`;
    }
    const logHtml = s.log.slice(0, 40).map((l) => `<li class="${l.type}"><span class="when">${l.t}</span>${esc(l.text)}</li>`).join('');
    return `<section class="panel">
      <h2>This week</h2><p class="hint">Each choice takes one week.</p>
      <div class="actions">${acts}</div>
      ${missions}
      <h2>Journal</h2><ul class="log">${logHtml}</ul>
    </section>`;
  }

  function jutsuEffectText(j) {
    if (!j.combat) return 'Not used in combat';
    const fx = j.combat;
    switch (fx.effect) {
      case 'attack': return `Attack (power ${fx.power}${fx.stun ? ', may paralyze' : ''}${fx.pierce ? ', ignores armor' : ''})`;
      case 'stun': return 'Stops the enemy for a turn';
      case 'evade': return 'Dodge the next attack';
      case 'feint': return 'Confuse the enemy: next hit lands harder';
      case 'buff': return 'Physical attacks hit much harder';
      case 'wall': return 'Block most of the next attack';
      default: return '';
    }
  }

  function jutsuPanel(s) {
    const all = Object.entries(DATA.JUTSU).filter(([, j]) => Sim.jutsuAvailable(j));
    const learned = all.filter(([id]) => s.learned.includes(id));
    const toLearn = all.filter(([id]) => !s.learned.includes(id));
    const learnedHtml = learned.length
      ? learned.map(([, j]) => `<li><strong>${esc(j.name)}</strong><span>${jutsuEffectText(j)}${j.cost ? ` · ${j.cost} chakra` : ''}</span></li>`).join('')
      : '<li class="muted">None yet.</li>';
    const toLearnHtml = toLearn.map(([id, j]) => {
      const met = Sim.reqsMet(j);
      const reqs = Object.entries(j.req).map(([k, v]) => `<span class="${s.stats[k] >= v ? 'met' : 'unmet'}">${statLabel(k)} ${v}</span>`).join(' ');
      const prog = s.progress[id] || 0;
      return `<div class="jutsu">
        <div class="jhead"><strong>${esc(j.name)}</strong>${j.academy ? '<span class="tag">Exam</span>' : ''}</div>
        <div class="reqs">${reqs}</div>
        <div class="jfoot">${bar(prog, 100, 'learn')}<button class="small" data-act="practice" data-id="${id}" ${!met || s.injuredWeeks > 0 ? 'disabled' : ''}>Practice</button></div>
      </div>`;
    }).join('');
    const natureNote = s.natureKnown ? '' : '<p class="hint">Your chakra nature will be revealed when you graduate.</p>';
    return `<section class="panel"><h2>Known jutsu</h2><ul class="known">${learnedHtml}</ul>
      <h2>Learnable jutsu</h2>${natureNote}${toLearnHtml || '<p class="muted">Nothing new to learn right now.</p>'}</section>`;
  }

  function recordPanel(s) {
    const team = s.team ? `<div class="kv"><span>Sensei</span><span>${esc(s.team.sensei)}</span></div>
      <div class="kv"><span>Teammates</span><span>${esc(s.team.mates.join(', '))}</span></div>` : '';
    return `<section class="panel"><h2>Record</h2>
      <div class="kv"><span>Chakra nature</span><span>${s.natureKnown ? DATA.NATURES[s.nature] : 'Unknown'}</span></div>
      ${team}
      <div class="kv"><span>D-rank missions</span><span>${s.missions.D}</span></div>
      <div class="kv"><span>C-rank missions</span><span>${s.missions.C}</span></div>
      <div class="kv"><span>Failed graduation exams</span><span>${s.gradFails}</span></div>
      <div class="kv"><span>Chunin Exam attempts</span><span>${s.chuninAttempts}</span></div>
    </section>`;
  }

  function renderMain() {
    const s = Game.state;
    const clan = s.clan === 'civilian' ? '' : ` · ${DATA.CLANS[s.clan].name} clan`;
    app().innerHTML = `
      <header class="topbar">
        <div><h1>${esc(s.name)}</h1><div class="sub">${DATA.RANKS[s.rank]}${clan} · ${DATA.VILLAGES[s.village].name}</div></div>
        <div class="meta"><span>Age ${Sim.age()}</span><span>Year ${s.year}, Week ${s.week}</span><span>${s.ryo.toLocaleString()} ryo</span>
          <button class="ghost" data-act="new-game">New game</button></div>
      </header>
      <main class="grid">
        <div class="col">${statsPanel(s)}</div>
        <div class="col">${actionsPanel(s)}</div>
        <div class="col">${jutsuPanel(s)}${recordPanel(s)}</div>
      </main>
      ${overlay(s)}`;
  }

  // ---------- modals ----------
  function overlay(s) {
    if (s.combat) return combatModal(s);
    if (s.prompts.length) {
      const p = s.prompts[0];
      return `<div class="overlay"><div class="modal">
        <h2>${esc(p.title)}</h2><p>${esc(p.text).replace(/\n/g, '<br>')}</p>
        <div class="opts">${p.options.map((o, i) => `<button class="${i === 0 ? 'primary' : 'ghost'}" data-act="prompt" data-id="${o.id}">${esc(o.label)}</button>`).join('')}</div>
      </div></div>`;
    }
    return '';
  }

  function threat(L) {
    const me = Sim.coreAvg();
    if (L < me - 6) return 'Weaker than you';
    if (L > me + 6) return 'Stronger than you';
    return 'An even match';
  }

  function combatModal(s) {
    const c = s.combat;
    const e = c.enemy;
    const titles = { mission: 'Ambush', forest: 'Chunin Exams — Survival stage', finals: 'Chunin Exams — Finals' };
    let buttons;
    if (c.over) {
      buttons = `<button class="primary" data-act="combat-close">Continue</button>`;
    } else {
      const jutsu = s.learned.map((id) => [id, DATA.JUTSU[id]]).filter(([, j]) => j.combat)
        .map(([id, j]) => `<button data-act="combat" data-move="jutsu" data-jutsu="${id}" ${c.chakra < j.cost ? 'disabled' : ''} title="${esc(jutsuEffectText(j))}">${esc(j.name)}<small>${j.cost} chakra</small></button>`).join('');
      buttons = `<button data-act="combat" data-move="strike">Strike<small>Taijutsu</small></button>
        <button data-act="combat" data-move="defend">Defend<small>Halve damage, +6 chakra</small></button>
        ${jutsu}
        ${c.canRetreat ? '<button class="ghost" data-act="combat" data-move="retreat">Retreat<small>Abandon the mission</small></button>' : ''}`;
    }
    return `<div class="overlay"><div class="modal combat">
      <h2>${titles[c.kind]}</h2>
      <div class="fighters">
        <div class="fighter"><strong>${esc(s.name)}</strong>
          <div class="kv"><span>Health</span><span>${Math.max(0, c.hp)} / ${c.maxHp}</span></div>${bar(c.hp, c.maxHp, 'hp')}
          <div class="kv"><span>Chakra</span><span>${c.chakra} / ${c.maxChakra}</span></div>${bar(c.chakra, c.maxChakra, 'chakra')}
        </div>
        <div class="fighter"><strong>${esc(e.name)}</strong>
          <div class="kv"><span>Health</span><span>${e.hp} / ${e.maxHp}</span></div>${bar(e.hp, e.maxHp, 'hp')}
          <div class="hint">${threat(e.L)}</div>
        </div>
      </div>
      <ul class="clog">${c.log.slice(-8).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
      <div class="cactions">${buttons}</div>
    </div></div>`;
  }

  function renderEnding() {
    const s = Game.state;
    const e = s.ended;
    app().innerHTML = `<div class="create ending">
      <header class="title"><h1>${esc(e.title)}</h1><p>${esc(e.text)}</p></header>
      <section class="panel">
        <div class="kv"><span>Name</span><span>${esc(s.name)}</span></div>
        <div class="kv"><span>Final rank</span><span>${e.rank}</span></div>
        <div class="kv"><span>Age</span><span>${e.age}</span></div>
        <div class="kv"><span>Missions</span><span>${s.missions.D} D-rank, ${s.missions.C} C-rank</span></div>
        <div class="kv"><span>Jutsu mastered</span><span>${s.learned.length}</span></div>
      </section>
      <button class="primary big" data-act="new-game">Start a new life</button>
    </div>`;
  }

  function render() {
    const s = Game.state;
    if (!s) renderCreate();
    else if (s.ended) renderEnding();
    else renderMain();
  }

  return { render, setDraft, create };
})();
