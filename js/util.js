'use strict';
// Small helpers shared by every other file.
const U = {
  rand: (a, b) => a + Math.random() * (b - a),
  randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  // Roughly bell-shaped random number around `mean`.
  gauss: (mean, sd) => mean + (Math.random() + Math.random() + Math.random() - 1.5) * 2 * sd,
  // Pick a key from { key: weight } at random, proportional to weight.
  weighted(obj) {
    const total = Object.values(obj).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const k in obj) { r -= obj[k]; if (r <= 0) return k; }
    return Object.keys(obj)[0];
  },
  esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
};
