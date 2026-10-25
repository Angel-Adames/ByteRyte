export async function seed(page, { profile: over = {}, settings = {}, raw = null } = {}) {
  const stamp = 's' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  await page.addInitScript(({ over, settings, raw, stamp }) => {
    if (sessionStorage.getItem('br-seed') === stamp) return;
    sessionStorage.setItem('br-seed', stamp);
    const z = new Date();
    const today = z.getFullYear() + '-' + String(z.getMonth() + 1).padStart(2, '0') + '-' + String(z.getDate()).padStart(2, '0');
    const base = {
      id: 'ptest', name: 'Ada', avatar: '🦊', xp: 0, streak: 0, best: 0, last: null,
      hearts: 5, heartAt: null, heartDay: today, done: {}, review: {}, misses: {}, xpLog: {},
      gems: 200, freezes: 0, inv: { fifty: 1, skip: 1 }, doubleUntil: 0, goal: 30, goalDay: null,
      badges: {}, saved: {}, dlog: {},
      stats: { answered: 0, correct: 0, perfect: 0, lessons: 0, interviews: 0, bestIv: 0, reviews: 0, challenges: 0 },
      onboarded: true, track: 'java', unlockAll: false, created: Date.now(), curriculum: 2, gates: {},
    };
    if (raw != null) localStorage.setItem('byteroots-profiles', raw);
    else {
      const p = Object.assign(base, over);
      if (over.heartDay === undefined) p.heartDay = today;
      if (over.inv) p.inv = Object.assign({ fifty: 1, skip: 1 }, over.inv);
      localStorage.setItem('byteroots-profiles', JSON.stringify({ active: p.id, list: { [p.id]: p } }));
    }
    localStorage.setItem('byteroots-settings', JSON.stringify(Object.assign({ theme: 'light', sound: false, big: false }, settings)));
  }, { over, settings, raw, stamp });
}

export function themeOf(testInfo) {
  return testInfo.project.use.brTheme || 'light';
}

export async function boot(page, testInfo, opts = {}) {
  if (opts.time) await page.clock.install({ time: opts.time });
  await seed(page, {
    profile: opts.profile || {},
    settings: Object.assign({ theme: themeOf(testInfo), sound: false }, opts.settings || {}),
    raw: opts.raw === undefined ? null : opts.raw,
  });
  await page.goto('./');
}

export async function answerSession(page) {
  await page.evaluate(() => {
    const $ = (s) => document.querySelector(s);
    let guard = 0;
    while (guard++ < 8000) {
      if ($('#h')) { $('#h').click(); return; }
      if ($('#cont')) { $('#cont').click(); continue; }
      if ($('#go')) { $('#go').click(); continue; }
      if ($('#buyh')) throw new Error('out of hearts');
      const e = window.__BR.cur();
      if (!e || !$('#chk')) throw new Error('no question on screen');
      if (e.t === 'ar') {
        for (const line of e.lines) {
          const chip = [...document.querySelectorAll('#bank .chip')].find((c) => c.dataset.raw === line);
          if (!chip) throw new Error('missing arrange line: ' + line);
          chip.click();
        }
      } else {
        const opt = document.querySelector('.opt[data-i="' + e.a + '"]');
        if (!opt) throw new Error('missing choice for ' + e.t + ' ' + (e.q || '').slice(0, 80));
        opt.click();
      }
      if ($('#chk').disabled) throw new Error('Check stayed disabled');
      $('#chk').click();
      if (!$('#cont')) throw new Error('no explanation after Check');
      $('#cont').click();
    }
    throw new Error('session did not finish');
  });
}

export async function state(page) {
  return page.evaluate(() => {
    const s = window.__BR.S;
    return {
      xp: s.xp, hearts: s.hearts, gems: s.gems, streak: s.streak, best: s.best, last: s.last,
      freezes: s.freezes, goal: s.goal, name: s.name, avatar: s.avatar, heartDay: s.heartDay,
      lessons: s.stats.lessons, perfect: s.stats.perfect, reviews: s.stats.reviews,
      interviews: s.stats.interviews, bestIv: s.stats.bestIv, bought: s.stats.bought || 0,
      fifty: s.inv.fifty, skip: s.inv.skip, doubleUntil: s.doubleUntil,
      done: Object.keys(s.done), gates: s.gates, curriculum: s.curriculum,
      review: s.review, misses: s.misses, saved: s.saved, badges: Object.keys(s.badges),
    };
  });
}

export async function overflow(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    for (const el of document.querySelectorAll('#app *')) {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      if (r.right <= vw + 2 && r.left >= -2) continue;
      const cls = typeof el.className === 'string' ? el.className : '';
      if (el.tagName === 'PRE' || /code|chip|tabs|toast|conf|path/.test(cls)) continue;
      bad.push((cls || el.tagName) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
    }
    return bad.slice(0, 8);
  });
}

export function isDeep() {
  return true;
}
