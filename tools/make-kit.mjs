// Builds the free policy kit (lead magnet) as standalone HTML files in lead-magnet/, one per language,
// for KAI to attach when replying to kit requests from HubSpot. Reads the map data embedded in the
// built Zero Trust pages, so the kit always matches the site.
// Usage: node build.mjs && node tools/make-kit.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'lead-magnet');

const K = {
  en: {
    page: 'public/zero-trust-security-foundation.html', file: 'KAI_Zero_Trust_Baseline_Policy_Kit.html',
    title: 'KAI Zero Trust Baseline Policies: Free Policy Kit', sub: 'Free policy kit for Microsoft 365', counts: '28 security rules · 8 team practices',
    intro: 'A starting point for discussing security with your IT team. This kit lists the policies and things to check. It does not test your systems or include detailed setup instructions. Some policies may need extra Microsoft features.',
    fit: 'How the policies fit together', supports: ' support all groups. The map shows how policies fit together, not the exact route a file takes.',
    before: 'Questions before you start',
    questions: ['Who looks after Microsoft 365 and agrees changes?', 'Which Microsoft subscriptions and features do you have?', 'Do you know which accounts, devices, apps and sensitive files you have?', 'How will you test changes, keep emergency access and tell the team?', 'Who checks that the rules work and follows up on alerts?'],
    withKai: 'Do it with KAI',
    withKaiText: 'The KAI Zero Trust Security Foundation helps you define the policies, set them up in Microsoft 365 and help your team use them. We agree the work and fees with you before starting.',
  },
  vi: {
    page: 'public/vi/zero-trust-security-foundation.html', file: 'KAI_Zero_Trust_Baseline_Bo_Chinh_Sach.html',
    title: 'KAI Zero Trust Baseline Policies: Bộ chính sách miễn phí', sub: 'Bộ chính sách miễn phí cho Microsoft 365', counts: '28 quy tắc bảo mật · 8 thực hành cho đội ngũ',
    intro: 'Điểm khởi đầu để bạn trao đổi về bảo mật với đội IT. Bộ tài liệu liệt kê các chính sách và những điều cần kiểm tra. Tài liệu không kiểm tra hệ thống của bạn và không gồm hướng dẫn cấu hình chi tiết. Một số chính sách có thể cần thêm tính năng của Microsoft.',
    fit: 'Các chính sách liên kết với nhau thế nào', supports: ' hỗ trợ cho tất cả các nhóm. Bản đồ cho thấy các chính sách liên kết với nhau thế nào, không phải đường đi chính xác của một tệp.',
    before: 'Câu hỏi trước khi bắt đầu',
    questions: ['Ai phụ trách Microsoft 365 và duyệt các thay đổi?', 'Bạn đang có những gói và tính năng Microsoft nào?', 'Bạn có nắm được mình đang có những tài khoản, thiết bị, ứng dụng và tệp nhạy cảm nào không?', 'Bạn sẽ thử nghiệm thay đổi, giữ quyền truy cập khẩn cấp và thông báo cho đội ngũ như thế nào?', 'Ai kiểm tra các quy tắc có hoạt động và theo dõi cảnh báo?'],
    withKai: 'Làm cùng KAI',
    withKaiText: 'KAI Zero Trust Security Foundation giúp bạn xác định chính sách, thiết lập chúng trong Microsoft 365 và giúp đội ngũ áp dụng. Chúng tôi thống nhất phạm vi công việc và chi phí với bạn trước khi bắt đầu.',
  },
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

mkdirSync(out, { recursive: true });
for (const [lang, t] of Object.entries(K)) {
  const page = readFileSync(join(root, t.page), 'utf8');
  const m = page.match(/<script type="application\/json" id="zt-data">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('map data not found in ' + t.page + ' (run node build.mjs first)');
  const comps = JSON.parse(m[1]).components;
  const byKey = (k) => comps.find((c) => c.key === k);
  const groups = [['ident', 'endp'], ['gov', 'eng', 'threat'], ['data', 'apps']];
  const html = '<!doctype html><html lang="' + lang + '"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(t.title) + '</title>' +
    '<style>body{font:15px/1.6 Arial,sans-serif;color:#0a2f49;max-width:950px;margin:40px auto;padding:0 24px}h1,h2{line-height:1.2}' +
    'article{border-top:1px solid #dce5ee;margin:28px 0;padding-top:18px}small{color:#56657b}li{margin:5px 0}' +
    '.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.box{padding:12px;border:1px solid #dce5ee;border-radius:8px;margin-bottom:10px}' +
    '@media print{article{break-inside:avoid}body{font-size:11px}}</style>' +
    '<h1>KAI Zero Trust Baseline Policies</h1><p><strong>' + esc(t.sub) + '</strong> · ' + esc(t.counts) + '</p>' +
    '<p>' + esc(t.intro) + '</p>' +
    '<h2>' + esc(t.fit) + '</h2><div class="grid">' + groups.map((g) =>
      '<div>' + g.map((k) => { const c = byKey(k); return '<div class="box"><strong>' + esc(c.kit.name) + '</strong><p>' + esc(c.outcome) + '</p></div>'; }).join('') + '</div>'
    ).join('') + '</div><p><strong>' + esc(byKey('tele').kit.name) + '</strong>' + esc(t.supports) + '</p>' +
    '<h2>' + esc(t.before) + '</h2><ul>' + t.questions.map((q) => '<li>' + esc(q) + '</li>').join('') + '</ul>' +
    comps.map((c) =>
      '<article><h2>' + esc(c.kit.name) + '</h2><p>' + esc(c.outcome) + '</p><p><small>' + esc(c.check) + '</small></p><ul>' +
      c.kit.items.map((i) => '<li><strong>' + esc(i.id) + ':</strong> ' + esc(i.name) + '</li>').join('') + '</ul></article>'
    ).join('') +
    '<h2>' + esc(t.withKai) + '</h2><p>' + esc(t.withKaiText) + '</p>' +
    '<p>kai.services · C4L@kai.services</p></html>';
  writeFileSync(join(out, t.file), html);
  console.log('wrote lead-magnet/' + t.file, html.length, 'bytes');
}
