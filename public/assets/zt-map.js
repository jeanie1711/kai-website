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
        sending: 'Checking your email…', verifying: 'Confirming your link…', again: 'Download again',
        sent: function (e) { return 'Check your inbox at ' + e + '. Click the link in our email to download the kit. If it hasn’t arrived in a few minutes, check your spam folder.'; },
        downloaded: 'Email confirmed. Your free policy kit is downloading.',
        typo: function (s) { return 'Did you mean ' + s + '?'; }, useIt: 'Use this address',
        invalid_format: 'Please enter a valid email address.',
        disposable: 'Please use a permanent email address, not a temporary inbox.',
        junk: 'Please enter your real email address so we can send you the kit.',
        no_mail_server: 'This email domain can’t receive mail. Please check the address.',
        rate_limited: 'Too many requests. Please try again a little later.',
        invalid_link: 'This download link isn’t valid. Enter your email again to get a new one.',
        expired: 'This download link has expired. Enter your email again to get a new one.',
        failed: 'Sorry, we couldn’t send the email right now. Please try again, or write to C4L@kai.services.',
      },
      file: 'KAI_Zero_Trust_Baseline_Policy_Kit.html',
      kit: {
        title: 'KAI Zero Trust Baseline Policies: Free Policy Kit', sub: 'Free policy kit for Microsoft 365', counts: '28 security rules · 8 team practices',
        intro: 'A starting point for discussing security with your IT team. This kit lists the policies and things to check. It does not test your systems or include detailed setup instructions. Some policies may need extra Microsoft features.',
        fit: 'How the policies fit together', supports: ' support all groups. The map shows how policies fit together, not the exact route a file takes.',
        before: 'Questions before you start',
        questions: ['Who looks after Microsoft 365 and agrees changes?', 'Which Microsoft subscriptions and features do you have?', 'Do you know which accounts, devices, apps and sensitive files you have?', 'How will you test changes, keep emergency access and tell the team?', 'Who checks that the rules work and follows up on alerts?'],
        review: 'Your review:', notMarked: 'Not marked', withKai: 'Do it with KAI',
        withKaiText: 'The KAI Zero Trust Security Foundation helps you define the policies, set them up in Microsoft 365 and help your team use them. We agree the work and fees with you before starting.',
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
        sending: 'Đang kiểm tra email…', verifying: 'Đang xác nhận đường link…', again: 'Tải lại',
        sent: function (e) { return 'Hãy kiểm tra hộp thư ' + e + '. Bấm vào đường link trong email để tải bộ chính sách. Nếu sau vài phút chưa thấy, hãy xem thư mục spam.'; },
        downloaded: 'Email đã được xác nhận. Bộ chính sách miễn phí đang được tải về.',
        typo: function (s) { return 'Có phải bạn muốn nhập ' + s + '?'; }, useIt: 'Dùng địa chỉ này',
        invalid_format: 'Vui lòng nhập địa chỉ email hợp lệ.',
        disposable: 'Vui lòng dùng địa chỉ email lâu dài, không dùng hộp thư tạm thời.',
        junk: 'Vui lòng nhập địa chỉ email thật để chúng tôi gửi bộ tài liệu cho bạn.',
        no_mail_server: 'Tên miền email này không nhận được thư. Vui lòng kiểm tra lại địa chỉ.',
        rate_limited: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
        invalid_link: 'Đường link tải về không hợp lệ. Hãy nhập lại email để nhận link mới.',
        expired: 'Đường link tải về đã hết hạn. Hãy nhập lại email để nhận link mới.',
        failed: 'Xin lỗi, hiện chưa gửi được email. Vui lòng thử lại, hoặc liên hệ C4L@kai.services.',
      },
      file: 'KAI_Zero_Trust_Baseline_Bo_Chinh_Sach.html',
      kit: {
        title: 'KAI Zero Trust Baseline Policies: Bộ chính sách miễn phí', sub: 'Bộ chính sách miễn phí cho Microsoft 365', counts: '28 quy tắc bảo mật · 8 thực hành cho đội ngũ',
        intro: 'Điểm khởi đầu để bạn trao đổi về bảo mật với đội IT. Bộ tài liệu liệt kê các chính sách và những điều cần kiểm tra. Tài liệu không kiểm tra hệ thống của bạn và không gồm hướng dẫn cấu hình chi tiết. Một số chính sách có thể cần thêm tính năng của Microsoft.',
        fit: 'Các chính sách liên kết với nhau thế nào', supports: ' hỗ trợ cho tất cả các nhóm. Bản đồ cho thấy các chính sách liên kết với nhau thế nào, không phải đường đi chính xác của một tệp.',
        before: 'Câu hỏi trước khi bắt đầu',
        questions: ['Ai phụ trách Microsoft 365 và duyệt các thay đổi?', 'Bạn đang có những gói và tính năng Microsoft nào?', 'Bạn có nắm được mình đang có những tài khoản, thiết bị, ứng dụng và tệp nhạy cảm nào không?', 'Bạn sẽ thử nghiệm thay đổi, giữ quyền truy cập khẩn cấp và thông báo cho đội ngũ như thế nào?', 'Ai kiểm tra các quy tắc có hoạt động và theo dõi cảnh báo?'],
        review: 'Đánh giá của bạn:', notMarked: 'Chưa đánh dấu', withKai: 'Làm cùng KAI',
        withKaiText: 'KAI Zero Trust Security Foundation giúp bạn xác định chính sách, thiết lập chúng trong Microsoft 365 và giúp đội ngũ áp dụng. Chúng tôi thống nhất phạm vi công việc và chi phí với bạn trước khi bắt đầu.',
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

  // Free policy kit. The visitor leaves an email; the server checks it and emails a one-time link
  // (see lib/kit-gate.js). Opening that link brings them back here with ?kit=..., we confirm it with
  // the server, then build the kit in the browser, in the page's language, with their review notes.
  function downloadKit() {
    var K = L.kit;
    var groups = [['ident', 'endp'], ['gov', 'eng', 'threat'], ['data', 'apps']];
    var html = '<!doctype html><html lang="' + lang + '"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + esc(K.title) + '</title>' +
      '<style>body{font:15px/1.6 Arial,sans-serif;color:#0a2f49;max-width:950px;margin:40px auto;padding:0 24px}h1,h2{line-height:1.2}' +
      'article{border-top:1px solid #dce5ee;margin:28px 0;padding-top:18px}small{color:#56657b}li{margin:5px 0}' +
      '.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.box{padding:12px;border:1px solid #dce5ee;border-radius:8px;margin-bottom:10px}' +
      '@media print{article{break-inside:avoid}body{font-size:11px}}</style>' +
      '<h1>KAI Zero Trust Baseline Policies</h1><p><strong>' + esc(K.sub) + '</strong> · ' + esc(K.counts) + '</p>' +
      '<p>' + esc(K.intro) + '</p>' +
      '<h2>' + esc(K.fit) + '</h2><div class="grid">' + groups.map(function (g) {
        return '<div>' + g.map(function (k) { var c = byKey(k); return '<div class="box"><strong>' + esc(c.kit.name) + '</strong><p>' + esc(c.outcome) + '</p></div>'; }).join('') + '</div>';
      }).join('') + '</div><p><strong>' + esc(byKey('tele').kit.name) + '</strong>' + esc(K.supports) + '</p>' +
      '<h2>' + esc(K.before) + '</h2><ul>' + K.questions.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ul>' +
      comps.map(function (c) {
        return '<article><h2>' + esc(c.kit.name) + '</h2><p>' + esc(c.outcome) + '</p><p><small>' + esc(c.check) + '</small></p>' +
          '<p><strong>' + esc(K.review) + '</strong> ' + esc(L.status[review[c.key]] || K.notMarked) + '</p><ul>' +
          c.kit.items.map(function (i) { return '<li><strong>' + esc(i.id) + ':</strong> ' + esc(i.name) + '</li>'; }).join('') + '</ul></article>';
      }).join('') +
      '<h2>' + esc(K.withKai) + '</h2><p>' + esc(K.withKaiText) + '</p>' +
      '<p>kai.services · C4L@kai.services</p></html>';
    var url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    var a = document.createElement('a');
    a.href = url; a.download = L.file;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

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
    emailIn.setAttribute('aria-invalid', 'true');
    if (reason === 'typo' && suggestion) return suggest(suggestion);
    say(G[reason] || G.failed, 'error');
  }

  gateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = emailIn.value.trim().toLowerCase();
    emailIn.removeAttribute('aria-invalid');
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email)) { fail('invalid_format'); emailIn.focus(); return; }
    var dom = email.split('@')[1];
    if (TYPO[dom]) { fail('typo', email.split('@')[0] + '@' + TYPO[dom]); return; }
    submitBtn.disabled = true; say(G.sending);
    fetch('/api/kit-request', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: email, lang: lang, updates: gateForm.updates.checked, website: gateForm.website.value }),
    }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (res) {
        if (res.ok) { say(G.sent(email), 'ok'); gateForm.classList.add('sent'); }
        else fail(res.reason, res.suggestion);
      })
      .catch(function () { fail('failed'); })
      .then(function () { submitBtn.disabled = false; });
  });

  // Arrived from the emailed link?
  var kitToken = new URLSearchParams(location.search).get('kit');
  if (kitToken) {
    var clean = location.pathname + location.hash;
    say(G.verifying);
    fetch('/api/kit-verify?token=' + encodeURIComponent(kitToken))
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (res) {
        history.replaceState(null, '', clean);
        if (!res.ok) { say(G[res.reason] || G.failed, 'error'); return; }
        downloadKit();
        say(G.downloaded, 'ok');
        var again = document.createElement('button');
        again.type = 'button'; again.className = 'zt-linkbtn'; again.textContent = G.again;
        again.addEventListener('click', downloadKit);
        statusEl.appendChild(document.createTextNode(' ')); statusEl.appendChild(again);
      })
      .catch(function () { say(G.failed, 'error'); });
    var target = document.getElementById('next-step');
    if (target) setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 50);
  }

  renderProgress();
  draw();
})();
