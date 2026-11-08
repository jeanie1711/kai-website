/* KAI Zero Trust Baseline map: component details, the five-step sign-in scenario, review notes and the
   free policy kit download. The scenario only plays when the visitor presses play. The map, policies and
   detail panel are rendered in the HTML (in the page's language); this only adds behaviour. */
(function () {
  var dataEl = document.getElementById('zt-data');
  var map = document.querySelector('.ztm');
  if (!dataEl || !map) return;

  var S = {
    en: {
      closer: 'Take a closer look', attention: 'What needs attention here?', choose: 'Choose a status',
      status: { check: 'Needs checking', progress: 'In progress', reviewed: 'Checked with our IT team' },
      note: 'These are your own notes. They stay in this browser and are not sent to KAI.',
      progress: function (n) { return 'Your review: ' + n + ' of 8 components marked · Your notes, not a system check.'; },
      clear: 'Clear my notes', step: function (n, t) { return 'Step ' + n + ' of 5 · ' + t; },
      play: '▶ Play a real scenario: sign-in', pause: 'Ⅱ Pause demo',
      gate: {
        sending: 'Sending your request…',
        sent: function (n, e) { return 'Thanks, ' + n + '. We’ve received your request and will email the policy kit to ' + e + ' within 1–2 business days.'; },
        typo: function (s) { return 'Did you mean ' + s + '?'; }, useIt: 'Use this address',
        missing: 'Please fill in your name, company and team size.',
        invalid_format: 'Please enter a valid email address.',
        disposable: 'Please use a permanent email address, not a temporary inbox.',
        junk: 'Please enter your real email address so we can send you the kit.',
        no_mail_server: 'This email domain can’t receive mail. Please check the address.',
        rate_limited: 'Too many requests. Please try again a little later.',
        failed: 'Sorry, we couldn’t send your request right now. Please try again, or write to C4L@kai.services.',
      },
    },
    vi: {
      closer: 'Xem kỹ hơn', attention: 'Phần này cần lưu ý gì?', choose: 'Chọn trạng thái',
      status: { check: 'Cần kiểm tra', progress: 'Đang thực hiện', reviewed: 'Đã kiểm tra cùng đội IT' },
      note: 'Đây là ghi chú của riêng bạn. Ghi chú được lưu trên trình duyệt này và không gửi cho KAI.',
      progress: function (n) { return 'Bạn đã đánh dấu ' + n + '/8 nhóm · Đây là ghi chú của bạn, không phải kết quả kiểm tra hệ thống.'; },
      clear: 'Xóa ghi chú', step: function (n, t) { return 'Bước ' + n + '/5 · ' + t; },
      play: '▶ Xem kịch bản thực tế: một lần đăng nhập', pause: 'Ⅱ Tạm dừng demo',
      gate: {
        sending: 'Đang gửi yêu cầu…',
        sent: function (n, e) { return 'Cảm ơn ' + n + '. KAI đã nhận yêu cầu và sẽ gửi bộ chính sách tới ' + e + ' trong 1–2 ngày làm việc.'; },
        typo: function (s) { return 'Có phải bạn muốn nhập ' + s + '?'; }, useIt: 'Dùng địa chỉ này',
        missing: 'Vui lòng điền họ tên, công ty và quy mô đội ngũ.',
        invalid_format: 'Vui lòng nhập địa chỉ email hợp lệ.',
        disposable: 'Vui lòng dùng địa chỉ email lâu dài, không dùng hộp thư tạm thời.',
        junk: 'Vui lòng nhập địa chỉ email thật để chúng tôi gửi bộ tài liệu cho bạn.',
        no_mail_server: 'Tên miền email này không nhận được thư. Vui lòng kiểm tra lại địa chỉ.',
        rate_limited: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
        failed: 'Xin lỗi, hiện chưa gửi được yêu cầu. Vui lòng thử lại, hoặc liên hệ C4L@kai.services.',
      },
    },
  };
  var lang = document.documentElement.lang === 'vi' ? 'vi' : 'en';
  var L = S[lang];

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
    detail.innerHTML = '<div class="ztd-left"><span class="eyebrow">' + L.closer + '</span><h3>' + esc(c.name) + '</h3>' +
      '<p class="ztd-meta">' + esc(c.sub) + ' · ' + count(c.items) + '</p><p class="ztd-check">' + esc(c.check) + '</p>' +
      '<label class="ztd-label" for="ztd-status">' + L.attention + '</label>' +
      '<select id="ztd-status" class="ztd-status"><option value="">' + L.choose + '</option><option value="check">' + L.status.check + '</option>' +
      '<option value="progress">' + L.status.progress + '</option><option value="reviewed">' + L.status.reviewed + '</option></select>' +
      '<small class="ztd-note">' + L.note + '</small></div>' +
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
    progressEl.innerHTML = esc(L.progress(n)) + (n ? '<button type="button" id="zt-reset">' + L.clear + '</button>' : '');
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
    stepTitle.textContent = step ? L.step(step, s.t) : idleTitle;
    stepDesc.textContent = step ? s.d : idleDesc;
    renderDetail();
  }

  function stop() { clearInterval(timer); timer = null; playBtn.textContent = L.play; }
  function play() {
    step = 1; selected = steps[1].c[0]; draw();
    playBtn.textContent = L.pause;
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

  // Free policy kit request. The visitor leaves their details; the server checks the email and records
  // the request in HubSpot (see lib/kit-gate.js). KAI then emails the kit by hand.
  var G = L.gate;
  var gateForm = document.getElementById('zt-gate');
  var emailIn = document.getElementById('zt-email');
  var statusEl = document.getElementById('zt-download-status');
  var submitBtn = document.getElementById('zt-download');
  var TYPO = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.co': 'outlook.com', 'yaho.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'icloud.co': 'icloud.com' };

  function say(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = 'zt-status' + (kind ? ' ' + kind : '');
  }
  function suggest(addr) {
    say(G.typo(addr), 'warn');
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'zt-linkbtn'; b.textContent = G.useIt;
    b.addEventListener('click', function () { emailIn.value = addr; say(''); emailIn.focus(); });
    statusEl.appendChild(document.createTextNode(' ')); statusEl.appendChild(b);
  }
  function fail(reason, suggestion) {
    if (reason !== 'missing' && reason !== 'failed' && reason !== 'rate_limited') emailIn.setAttribute('aria-invalid', 'true');
    if (reason === 'typo' && suggestion) return suggest(suggestion);
    say(G[reason] || G.failed, 'error');
  }

  gateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = gateForm;
    var val = function (n) { return f[n].value.trim(); };
    var email = val('email').toLowerCase();
    [].forEach.call(f.querySelectorAll('[aria-invalid]'), function (el) { el.removeAttribute('aria-invalid'); });
    var empty = ['firstname', 'lastname', 'company', 'size'].filter(function (n) { return !val(n); });
    if (empty.length) { empty.forEach(function (n) { f[n].setAttribute('aria-invalid', 'true'); }); fail('missing'); f[empty[0]].focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email)) { fail('invalid_format'); emailIn.focus(); return; }
    var dom = email.split('@')[1];
    if (TYPO[dom]) { fail('typo', email.split('@')[0] + '@' + TYPO[dom]); return; }
    submitBtn.disabled = true; say(G.sending);
    fetch('/api/kit-request', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ firstname: val('firstname'), lastname: val('lastname'), email: email, company: val('company'), size: val('size'),
        lang: lang, updates: f.updates.checked, website: f.website.value }),
    }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (res) {
        if (res.ok) { f.classList.add('sent'); say(G.sent(val('firstname'), email), 'ok'); }
        else fail(res.reason, res.suggestion);
      })
      .catch(function () { fail('failed'); })
      .then(function () { submitBtn.disabled = false; });
  });

  renderProgress();
  draw();
})();
