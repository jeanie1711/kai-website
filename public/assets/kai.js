/* KAI website: shared behaviour. Content never depends on this script; it only adds interaction. */
(function () {
  // Mobile menu
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('site-menu');
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('open', !open);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) { btn.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); }
    });
  }

  // Tabs (Why AI section)
  var tabs = [].slice.call(document.querySelectorAll('[role=tab]'));
  function select(i, focus) {
    tabs.forEach(function (t, j) {
      var on = j === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(i); });
    t.addEventListener('keydown', function (e) {
      var n;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i + tabs.length - 1) % tabs.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = tabs.length - 1;
      if (n !== undefined) { e.preventDefault(); select(n, true); }
    });
  });

  // Workflow diagram motion
  var toggles = [].slice.call(document.querySelectorAll('.motion-toggle'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var paused = reduce;
  function sync() {
    document.body.classList.toggle('motion-paused', paused);
    toggles.forEach(function (b) {
      b.hidden = reduce;
      b.textContent = paused ? 'Resume motion' : 'Pause motion';
      b.setAttribute('aria-pressed', String(paused));
    });
  }
  toggles.forEach(function (b) { b.addEventListener('click', function () { paused = !paused; sync(); }); });
  sync();

  // Scroll reveal: cards fade up as they enter the viewport, staggered within each row.
  // Elements already on screen are shown immediately; nothing is hidden for reduced-motion users.
  if (!reduce) {
    var pending = [];
    [].slice.call(document.querySelectorAll('.card,.phase,.guard3>article,.measure,.measure-row>div,.term,.quotes blockquote,.fstep,.faq details')).forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      var i = [].indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--rvd', Math.min(i, 5) * 90 + 'ms');
      el.classList.add('rv');
      pending.push(el);
    });
    var show = function (el) {
      el.classList.add('in');
      setTimeout(function () { el.classList.remove('rv', 'in'); el.style.removeProperty('--rvd'); }, 1200);
    };
    var ticking = false;
    var check = function () {
      ticking = false;
      var limit = window.innerHeight * 0.92;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top < limit) { show(el); return false; }
        return true;
      });
      if (!pending.length) { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); }
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    document.documentElement.classList.add('rv-ready');
    // Never leave content hidden when printing.
    window.addEventListener('beforeprint', function () { pending.forEach(show); pending = []; });
  }
})();
