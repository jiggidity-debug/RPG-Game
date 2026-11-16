'use strict';
// Wires clicks to game actions, then redraws.
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const d = el.dataset;
  switch (d.act) {
    case 'pick': UI.setDraft(d.field, d.val, false); break;
    case 'create': UI.create(); break;
    case 'activity': Sim.doActivity(d.id); break;
    case 'practice': Sim.practice(d.id); break;
    case 'mission': Sim.doMission(d.rank); break;
    case 'combat': Sim.combatAction(d.move, d.jutsu); break;
    case 'combat-close': Sim.closeCombat(); break;
    case 'prompt': Sim.resolvePrompt(d.id); break;
    case 'new-game':
      if ((Game.state && Game.state.ended) || confirm('Start over? Your current save will be erased.')) Game.reset();
      break;
    default: return;
  }
  if (Game.state) Game.save();
  UI.render();
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'name-input') UI.setDraft('name', e.target.value, false);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'name-input') { UI.create(); UI.render(); }
});

Game.load();
UI.render();
