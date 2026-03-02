import fs from 'fs';

const fixes = [
  // === ThemeContext.jsx ===
  ['src/context/ThemeContext.jsx', [
    ['"#10b981"', '"#5B0B14"'],
    ['"#059669"', '"#4A0910"'],
  ]],
  // === globals.css ===
  ['src/styles/globals.css', [
    ['--color-brand: #10b981', '--color-brand: #5B0B14'],
    ['--color-brand-dark: #059669', '--color-brand-dark: #4A0910'],
    ['--color-brand-light: #34d399', '--color-brand-light: #C8A03A'],
    ['rgba(16, 185, 129, 0.5)', 'rgba(200, 160, 58, 0.5)'],
    ['rgba(16, 185, 129, 0.1)', 'rgba(200, 160, 58, 0.1)'],
  ]],
  // === constants/index.js ===
  ['src/constants/index.js', [
    ['color: "#10b981", colorLight: "#ECFDF5"', 'color: "#5B0B14", colorLight: "#FDF5F5"'],
    ['"Nutrición": "#059669"', '"Nutrición": "#1F2A44"'],
  ]],
  // === pdfGenerator.js ===
  ['src/utils/pdfGenerator.js', [
    ['border-bottom: 3px solid #059669', 'border-bottom: 3px solid #1F2A44'],
    ['color: #059669; margin-bottom: 2px', 'color: #1F2A44; margin-bottom: 2px'],
    ['color: #059669; border-bottom: 1px solid #e5e7eb', 'color: #1F2A44; border-bottom: 1px solid #e5e7eb'],
    ['background: #f0fdf4; color: #059669', 'background: #F0EDE6; color: #1F2A44'],
    ['border: 1px solid #d1fae5', 'border: 1px solid #E0D8C8'],
  ]],
  // === UserCard.jsx ===
  ['src/components/admin/UserCard.jsx', [
    ["role?.color || '#10b981'", "role?.color || '#5B0B14'"],
  ]],
  // === UserFormModal.jsx ===
  ['src/components/admin/UserFormModal.jsx', [
    ["from-emerald-500 to-[#C8A03A] text-white cursor-pointer shadow-md shadow-emerald-500/20",
     "from-[#5B0B14] to-[#1F2A44] text-white cursor-pointer shadow-md shadow-black/20"],
  ]],
  // === ApprovalConfigScreen.jsx ===
  ['src/components/admin/ApprovalConfigScreen.jsx', [
    ['color: "#10b981"', 'color: "#5B0B14"'],
  ]],
  // === UserManagementScreen.jsx ===
  ['src/components/admin/UserManagementScreen.jsx', [
    ["role.color || '#10b981'", "role.color || '#5B0B14'"],
  ]],
  // === RequestTimeline.jsx ===
  ['src/components/requests/RequestTimeline.jsx', [
    ['color: "#10b981", label: "Avanzada"', 'color: "#5B0B14", label: "Avanzada"'],
  ]],
  // === NewRequestForm.jsx (progress bar + buttons) ===
  ['src/components/requests/NewRequestForm.jsx', [
    ["s < step ? '#22c55e' : '#10b981'", "s < step ? '#5B0B14' : '#C8A03A'"],
    ["step === 3 ? '#6366f1' : '#10b981'", "step === 3 ? '#6366f1' : '#5B0B14'"],
  ]],
  // === AttachmentUpload.jsx ===
  ['src/components/requests/AttachmentUpload.jsx', [
    ['border-t-emerald-500', 'border-t-[#C8A03A]'],
  ]],
  // === RequestDetail.jsx ===
  ['src/components/requests/RequestDetail.jsx', [
    ["color || '#10b981'", "color || '#5B0B14'"],
    ["background: 'linear-gradient(135deg, #10b981, #059669)'", "background: 'linear-gradient(135deg, #5B0B14, #4A0910)'"],
    ["STATUS_FLOW[statusIdx + 1]?.color || '#10b981'", "STATUS_FLOW[statusIdx + 1]?.color || '#5B0B14'"],
    ['color="#10b981"', 'color="#C8A03A"'],
    ['color="#10b981" bg="linear-gradient(135deg, #10b981, #059669)"', 'color="#5B0B14" bg="linear-gradient(135deg, #5B0B14, #4A0910)"'],
    ['color={STATUS_FLOW[statusIdx + 1]?.color || "#10b981"}', 'color={STATUS_FLOW[statusIdx + 1]?.color || "#5B0B14"}'],
  ]],
  // === Inventory files ===
  ['src/components/inventory/InventoryScreen.jsx', [
    ['"#10b981"', '"#5B0B14"'],
  ]],
  ['src/components/inventory/InventoryProductList.jsx', [
    ['"#10b981"', '"#5B0B14"'],
  ]],
  ['src/components/inventory/ProductDetailPanel.jsx', [
    ['"#10b981"', '"#5B0B14"'],
  ]],
  // === AnalyticsScreen.jsx ===
  ['src/components/analytics/AnalyticsScreen.jsx', [
    ["color=\"#10b981\"", "color=\"#5B0B14\""],
    ['color="#10b981"', 'color="#5B0B14"'],
    ["'#10b981'", "'#5B0B14'"],
  ]],
];

let total = 0;
for (const [file, replacements] of fixes) {
  if (!fs.existsSync(file)) { console.log('  ✗ NOT FOUND:', file); continue; }
  let content = fs.readFileSync(file, 'utf-8');
  const orig = content;
  for (const [from, to] of replacements) {
    content = content.replaceAll(from, to);
  }
  if (content !== orig) {
    fs.writeFileSync(file, content);
    console.log('  ✓', file);
    total++;
  } else {
    console.log('  –', file, '(no changes)');
  }
}
console.log(`\n✅ ${total} files updated`);
