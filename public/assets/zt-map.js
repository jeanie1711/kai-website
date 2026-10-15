/* KAI Zero Trust Baseline map: component details, the five-step sign-in scenario, review notes and the
   free policy kit download. The map, policies and detail panel are rendered in the HTML; this only adds behaviour. */
(function () {
  var dataEl = document.getElementById('zt-data');
  var map = document.querySelector('.ztm');
  if (!dataEl || !map) return;
  var DATA = JSON.parse(dataEl.textContent);
  var comps = DATA.components, steps = DATA.steps;
  var keys = comps.map(function (c) { return c.key; });
  var boxes = [].slice.call(map.querySelectorAll('.ztm-box'));
  var lines = [].slice.call(map.querySelectorAll('.ztm-lines g'));
  var detail = document.getElementById('zt-detail');
  var playBtn = document.getElementById('zt-play');
  var stepTitle = document.getElementById('zt-step-title');
  var stepDesc = document.getElementById('zt-step-desc');
  var progressEl = document.getElementById('zt-progress');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STORE = 'kai-baseline-review-v1';
  var idleTitle = stepTitle.textContent, idleDesc = stepDesc.textContent;
  var selected = 'eng', step = 0, timer = null, review = {};
  try { review = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { review = {}; }

  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var byKey = function (k) { return comps[keys.indexOf(k)]; };
  var badge = function (id) { return '<b class="' + (id.indexOf('PR') === 0 ? 'pr' : 'po') + '">' + esc(id) + '</b>'; };
  var count = function (items) {
    var po = items.filter(function (i) { return i.id.indexOf('PO') === 0; }).length;
    return po + ' PO · ' + (items.length - po) + ' PR';
  };

  function renderDetail() {
    var c = byKey(selected);
    detail.innerHTML = '<div class="ztd-left"><span class="eyebrow">Take a closer look</span><h3>' + esc(c.name) + '</h3>' +
      '<p class="ztd-meta">' + esc(c.sub) + ' · ' + count(c.items) + '</p><p class="ztd-check">' + esc(c.check) + '</p>' +
      '<label class="ztd-label" for="ztd-status">What needs attention here?</label>' +
      '<select id="ztd-status" class="ztd-status"><option value="">Choose a status</option><option value="check">Needs checking</option>' +
      '<option value="progress">In progress</option><option value="reviewed">Checked with our IT team</option></select>' +
      '<small class="ztd-note">These are your own notes. They stay in this browser and are not sent to KAI.</small></div>' +
      '<ul class="ztd-list">' + c.items.map(function (i) { return '<li>' + badge(i.id) + '<span>' + esc(i.name) + '</span></li>'; }).join('') + '</ul>';
    var sel = document.getElementById('ztd-status');
    sel.value = review[selected] || '';
    sel.addEventListener('change', function () {
      review[selected] = sel.value;
      try { localStorage.setItem(STORE, JSON.stringify(review)); } catch (e) {}
      renderProgress();
    });
  }

  function renderProgress() {
    var n = keys.filter(function (k) { return review[k]; }).length;
    progressEl.innerHTML = 'Your review: ' + n + ' of 8 components marked · Your notes, not a system check.' +
      (n ? '<button type="button" id="zt-reset">Clear my notes</button>' : '');
    var reset = document.getElementById('zt-reset');
    if (reset) reset.addEventListener('click', function () {
      review = {};
      try { localStorage.removeItem(STORE); } catch (e) {}
      renderDetail(); renderProgress();
    });
  }

  function draw() {
    var s = steps[step];
    boxes.forEach(function (b) {
      var k = b.getAttribute('data-key');
      var inStep = s.c.indexOf(k) !== -1;
      b.classList.toggle('dim', !inStep);
      b.classList.toggle('on', step > 0 && inStep);
      b.setAttribute('aria-pressed', String(k === selected));
    });
    lines.forEach(function (g) { g.classList.toggle('dim', s.l.indexOf(g.getAttribute('data-line')) === -1); });
    map.classList.toggle('playing', step > 0);
    stepTitle.textContent = step ? 'Step ' + step + ' of 5 · ' + s.t : idleTitle;
    stepDesc.textContent = step ? s.d : idleDesc;
    renderDetail();
  }

  function stop() {
    clearInterval(timer); timer = null;
    playBtn.textContent = '▶ Play a real scenario: sign-in';
  }
  function play() {
    step = 1; selected = steps[1].c[0]; draw();
    playBtn.textContent = 'Ⅱ Pause demo';
    timer = setInterval(function () {
      step = step >= 5 ? 1 : step + 1;
      selected = steps[step].c[0];
      draw();
    }, 3600);
  }

  playBtn.addEventListener('click', function () { if (timer) stop(); else play(); });
  boxes.forEach(function (b) {
    b.addEventListener('click', function () {
      stop(); step = 0; selected = b.getAttribute('data-key'); draw();
      if (window.innerWidth < 960) detail.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });

  // Free policy kit: generated in the browser, no form and no email.
  var labels = { check: 'Needs checking', progress: 'In progress', reviewed: 'Checked with our IT team' };
  document.getElementById('zt-download').addEventListener('click', function () {
    var groups = [['ident', 'endp'], ['gov', 'eng', 'threat'], ['data', 'apps']];
    var html = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>KAI Zero Trust Baseline Policies: Free Policy Kit</title>' +
      '<style>body{font:15px/1.6 Arial,sans-serif;color:#0a2f49;max-width:950px;margin:40px auto;padding:0 24px}h1,h2{line-height:1.2}' +
      'article{border-top:1px solid #dce5ee;margin:28px 0;padding-top:18px}small{color:#56657b}li{margin:5px 0}' +
      '.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.box{padding:12px;border:1px solid #dce5ee;border-radius:8px;margin-bottom:10px}' +
      '@media print{article{break-inside:avoid}body{font-size:11px}}</style>' +
      '<h1>KAI Zero Trust Baseline Policies</h1><p><strong>Free policy kit for Microsoft 365</strong> · 28 security rules · 8 team practices</p>' +
      '<p>A starting point for discussing security with your IT team. This kit lists the policies and things to check. It does not test your systems or include detailed setup instructions. Some policies may need extra Microsoft features.</p>' +
      '<h2>How the policies fit together</h2><div class="grid">' + groups.map(function (g) {
        return '<div>' + g.map(function (k) { var c = byKey(k); return '<div class="box"><strong>' + esc(c.kit.name) + '</strong><p>' + esc(c.outcome) + '</p></div>'; }).join('') + '</div>';
      }).join('') + '</div><p><strong>' + esc(byKey('tele').kit.name) + '</strong> support all groups. The map shows how policies fit together, not the exact route a file takes.</p>' +
      '<h2>Questions before you start</h2><ul><li>Who looks after Microsoft 365 and agrees changes?</li><li>Which Microsoft subscriptions and features do you have?</li>' +
      '<li>Do you know which accounts, devices, apps and sensitive files you have?</li><li>How will you test changes, keep emergency access and tell the team?</li>' +
      '<li>Who checks that the rules work and follows up on alerts?</li></ul>' +
      comps.map(function (c) {
        return '<article><h2>' + esc(c.kit.name) + '</h2><p>' + esc(c.outcome) + '</p><p><small>' + esc(c.check) + '</small></p>' +
          '<p><strong>Your review:</strong> ' + esc(labels[review[c.key]] || 'Not marked') + '</p><ul>' +
          c.kit.items.map(function (i) { return '<li><strong>' + esc(i.id) + ':</strong> ' + esc(i.name) + '</li>'; }).join('') + '</ul></article>';
      }).join('') +
      '<h2>Do it with KAI</h2><p>The KAI Zero Trust Security Foundation helps you define the policies, set them up in Microsoft 365 and help your team use them. We agree the work and fees with you before starting.</p>' +
      '<p>kai.services · C4L@kai.services</p></html>';
    var url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    var a = document.createElement('a');
    a.href = url; a.download = 'KAI_Zero_Trust_Baseline_Policy_Kit.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    document.getElementById('zt-download-status').textContent = 'Your free policy kit has been downloaded.';
  });

  renderProgress();
  draw();
})();
