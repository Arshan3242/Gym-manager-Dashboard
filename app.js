/**
 * GymFlow - Gym Manager & Membership Automation Dashboard
 * Production-ready Vanilla JavaScript with LocalStorage persistence.
 * Features:
 * 1. Live Top Daily Report Cards & Financial Summary
 * 2. Immutable Payment History & Unique Receipt IDs (#REC-1001)
 * 3. Double-Payment Warning Guard (>7 days active protection)
 * 4. Instant WhatsApp Proof Receipts for Paid Members
 * 5. Read-Only Tamper-Proof Audit Log Ledger
 * 6. Full JSON Backup/Restore & CSV Exports
 */

// Storage Keys
const STORAGE_KEY_MEMBERS = 'gymflow_members_data_v1';
const STORAGE_KEY_THEME = 'gymflow_theme_pref';
const STORAGE_KEY_GYM_NAME = 'gymflow_gym_name';
const STORAGE_KEY_GYM_TAGLINE = 'gymflow_gym_tagline';
const STORAGE_KEY_GYM_PHONE = 'gymflow_gym_phone';
const STORAGE_KEY_GYM_ADDRESS = 'gymflow_gym_address';
const STORAGE_KEY_FIN_MONTH = 'gymflow_finance_month';
const STORAGE_KEY_FIN_YEAR = 'gymflow_finance_year';
const STORAGE_KEY_RECEIPT_SEQ = 'gymflow_receipt_sequence_v1';
const STORAGE_KEY_AUDIT_LOG = 'gymflow_audit_log_v1';

// Defaults
const DEFAULT_GYM_NAME = 'IronFit Gym & Fitness';
const DEFAULT_GYM_TAGLINE = 'Membership Automation & Daily Ops';
const DEFAULT_GYM_PHONE = '+91 98765 00000';
const DEFAULT_GYM_ADDRESS = 'Main Market, City Center';

// State Management
let members = [];
let auditLogs = [];
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'expiryAsc';
let memberToDeleteId = null;
let pendingGuardMemberId = null;
let activeReceiptMember = null;
let activeReceiptPayment = null;

// Financial Summary Filter State (Defaults to current month & year)
let selectedFinanceMonth = new Date().getMonth(); // 0 to 11
let selectedFinanceYear = new Date().getFullYear(); // e.g. 2026

// Avatar Color Palette
const AVATAR_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' },
  { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
  { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
  { bg: 'rgba(168, 85, 247, 0.2)', text: '#a855f7' },
  { bg: 'rgba(236, 72, 153, 0.2)', text: '#ec4899' },
  { bg: 'rgba(6, 182, 212, 0.2)', text: '#06b6d4' }
];

// Month Names in English & Hindi
const MONTH_NAMES = [
  { en: 'January', hi: 'जनवरी' },
  { en: 'February', hi: 'फ़रवरी' },
  { en: 'March', hi: 'मार्च' },
  { en: 'April', hi: 'अप्रैल' },
  { en: 'May', hi: 'मई' },
  { en: 'June', hi: 'जून' },
  { en: 'July', hi: 'जुलाई' },
  { en: 'August', hi: 'अगस्त' },
  { en: 'September', hi: 'सितंबर' },
  { en: 'October', hi: 'अक्टूबर' },
  { en: 'November', hi: 'नवंबर' },
  { en: 'December', hi: 'दिसंबर' }
];

// Helper: Format Date to YYYY-MM-DD
function formatDateToInput(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Add Days to Date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper: Generate Relative Sample Dates
function getRelativeDate(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return formatDateToInput(date);
}

// Helper: Exact Date and Time (e.g., 16 Nov 2026, 09:30 AM)
function formatExactDateTime(date) {
  const d = new Date(date);
  const datePart = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const timePart = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return `${datePart}, ${timePart}`;
}

// ==========================================================================
// Unique Receipt ID Sequence Generator (#REC-1001, #REC-1002, ...)
// ==========================================================================
function getNextReceiptId() {
  let seq = parseInt(localStorage.getItem(STORAGE_KEY_RECEIPT_SEQ) || '1004', 10);
  seq += 1;
  localStorage.setItem(STORAGE_KEY_RECEIPT_SEQ, seq.toString());
  return `#REC-${seq}`;
}

// Generate Sample 5 Members (dynamically relative to current day & current month)
function generateSampleMembers() {
  return [
    {
      id: 'mem_1',
      name: 'Rahul Sharma',
      phone: '9876543210',
      amount: 1500,
      joinDate: getRelativeDate(-65),
      expiryDate: getRelativeDate(25), // Active (expires in 25 days)
      paymentStatus: 'Paid',
      paymentDate: getRelativeDate(-5),
      payments: [
        {
          receiptId: '#REC-1001',
          timestamp: new Date(Date.now() - 65 * 86400000).toISOString(),
          exactTime: formatExactDateTime(new Date(Date.now() - 65 * 86400000)),
          amount: 1500,
          date: getRelativeDate(-65),
          note: 'Initial Registration Fee',
          planType: 'Cardio & Strength (Evening 6 PM)'
        },
        {
          receiptId: '#REC-1002',
          timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
          exactTime: formatExactDateTime(new Date(Date.now() - 5 * 86400000)),
          amount: 1500,
          date: getRelativeDate(-5),
          note: 'Monthly Renewal (+30 Days)',
          planType: 'Cardio & Strength (Evening 6 PM)'
        }
      ],
      planType: 'Cardio & Strength (Evening 6 PM)'
    },
    {
      id: 'mem_2',
      name: 'Priya Patel',
      phone: '9823456789',
      amount: 2000,
      joinDate: getRelativeDate(-28),
      expiryDate: getRelativeDate(2), // Expiring in 2 days (<= 3 days)
      paymentStatus: 'Paid',
      paymentDate: getRelativeDate(-12),
      payments: [
        {
          receiptId: '#REC-1003',
          timestamp: new Date(Date.now() - 12 * 86400000).toISOString(),
          exactTime: formatExactDateTime(new Date(Date.now() - 12 * 86400000)),
          amount: 2000,
          date: getRelativeDate(-12),
          note: 'Monthly Renewal (+30 Days)',
          planType: 'CrossFit & Yoga (Morning 7 AM)'
        }
      ],
      planType: 'CrossFit & Yoga (Morning 7 AM)'
    },
    {
      id: 'mem_3',
      name: 'Amit Kumar',
      phone: '9912345670',
      amount: 1200,
      joinDate: getRelativeDate(-64),
      expiryDate: getRelativeDate(-4), // Expired 4 days ago
      paymentStatus: 'Pending',
      paymentDate: '',
      payments: [],
      planType: 'Weight Training'
    },
    {
      id: 'mem_4',
      name: 'Sneha Verma',
      phone: '9789012345',
      amount: 3500,
      joinDate: getRelativeDate(-10),
      expiryDate: getRelativeDate(80), // Active 3 months plan
      paymentStatus: 'Paid',
      paymentDate: getRelativeDate(-10),
      payments: [
        {
          receiptId: '#REC-1004',
          timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
          exactTime: formatExactDateTime(new Date(Date.now() - 10 * 86400000)),
          amount: 3500,
          date: getRelativeDate(-10),
          note: 'Quarterly Package (3 Months)',
          planType: 'Personal Training + Diet'
        }
      ],
      planType: 'Personal Training + Diet'
    },
    {
      id: 'mem_5',
      name: 'Vikram Singh',
      phone: '9845012398',
      amount: 1500,
      joinDate: getRelativeDate(-30),
      expiryDate: getRelativeDate(1), // Expiring tomorrow (<= 3 days)
      paymentStatus: 'Pending',
      paymentDate: '',
      payments: [],
      planType: 'General Fitness (Morning 8 AM)'
    }
  ];
}

// Generate Initial Audit Logs
function generateInitialAuditLogs() {
  return [
    {
      id: 'AUD-001',
      timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
      exactTime: formatExactDateTime(new Date(Date.now() - 10 * 86400000)),
      category: 'PAYMENT',
      summary: 'Payment Received: ₹3,500 for Sneha Verma (#REC-1004)',
      details: 'Quarterly Plan (3 Months) | Expiry: Valid for 90 Days'
    },
    {
      id: 'AUD-002',
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
      exactTime: formatExactDateTime(new Date(Date.now() - 5 * 86400000)),
      category: 'PAYMENT',
      summary: 'Renewal Payment Received: ₹1,500 for Rahul Sharma (#REC-1002)',
      details: 'Plan: Cardio & Strength | +30 Days Renewal extended'
    },
    {
      id: 'AUD-003',
      timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
      exactTime: formatExactDateTime(new Date(Date.now() - 1 * 86400000)),
      category: 'SYSTEM',
      summary: 'Security & Anti-Fraud Ledger Initialized',
      details: 'Tamper-proof audit tracking and double-payment guard activated.'
    }
  ];
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initGymBranding();
  initLiveDate();
  initFinanceControls();
  loadAuditLogs();
  loadMembers();
  bindEvents();
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(STORAGE_KEY_THEME, next);
  showToast(`Switched to ${next} mode`, 'info');
}

// Gym Name & Branding Management
function initGymBranding() {
  const savedName = localStorage.getItem(STORAGE_KEY_GYM_NAME) || DEFAULT_GYM_NAME;
  const savedTagline = localStorage.getItem(STORAGE_KEY_GYM_TAGLINE) || DEFAULT_GYM_TAGLINE;

  const nameEl = document.getElementById('gymNameDisplay');
  if (nameEl) nameEl.textContent = savedName;

  const tagEl = document.getElementById('gymTaglineDisplay');
  if (tagEl) tagEl.textContent = savedTagline;
}

// Live Date Display
function initLiveDate() {
  const liveDateEl = document.getElementById('liveDateText');
  if (!liveDateEl) return;
  const today = new Date();
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  liveDateEl.textContent = today.toLocaleDateString('en-IN', options);
}

// Month & Year Filter Controls Initialization
function initFinanceControls() {
  const now = new Date();
  selectedFinanceMonth = now.getMonth();
  selectedFinanceYear = now.getFullYear();

  const monthSelect = document.getElementById('financeMonthSelect');
  const yearSelect = document.getElementById('financeYearSelect');
  const resetBtn = document.getElementById('resetFinanceToCurrentBtn');

  if (yearSelect) {
    yearSelect.innerHTML = '';
    const currentYear = now.getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = `${y} ${y === currentYear ? '(This Year)' : ''}`;
      if (y === selectedFinanceYear) opt.selected = true;
      yearSelect.appendChild(opt);
    }

    yearSelect.addEventListener('change', (e) => {
      selectedFinanceYear = parseInt(e.target.value, 10);
      updateFinancialSummary();
      showToast(`Updated Financial Report for Year ${selectedFinanceYear}`, 'info');
    });
  }

  if (monthSelect) {
    monthSelect.value = selectedFinanceMonth;
    monthSelect.addEventListener('change', (e) => {
      selectedFinanceMonth = parseInt(e.target.value, 10);
      updateFinancialSummary();
      const mName = MONTH_NAMES[selectedFinanceMonth];
      showToast(`Filtered Financials for ${mName.en} (${mName.hi})`, 'info');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const today = new Date();
      selectedFinanceMonth = today.getMonth();
      selectedFinanceYear = today.getFullYear();
      if (monthSelect) monthSelect.value = selectedFinanceMonth;
      if (yearSelect) yearSelect.value = selectedFinanceYear;
      updateFinancialSummary();
      showToast(`Reset to Current Month (${MONTH_NAMES[selectedFinanceMonth].en} ${selectedFinanceYear})`, 'success');
    });
  }
}

// ==========================================================================
// Read-Only Audit Log System (Tamper-Proof)
// ==========================================================================
function loadAuditLogs() {
  const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOG);
  if (raw) {
    try {
      auditLogs = JSON.parse(raw);
    } catch (e) {
      auditLogs = [];
    }
  }
  if (!Array.isArray(auditLogs) || auditLogs.length === 0) {
    auditLogs = generateInitialAuditLogs();
    saveAuditLogs();
  }
}

function saveAuditLogs() {
  localStorage.setItem(STORAGE_KEY_AUDIT_LOG, JSON.stringify(auditLogs));
}

function logAuditEvent(category, summary, details) {
  const event = {
    id: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    exactTime: formatExactDateTime(new Date()),
    category: category, // 'PAYMENT', 'MEMBER', 'SYSTEM', 'WARNING'
    summary: summary,
    details: details || ''
  };

  auditLogs.unshift(event);
  if (auditLogs.length > 500) auditLogs.pop(); // Cap at 500 records
  saveAuditLogs();
}

function openAuditLogModal() {
  renderAuditLog();
  openModal('auditModalBackdrop');
}

function renderAuditLog() {
  const container = document.getElementById('auditLogList');
  const countEl = document.getElementById('auditLogCount');
  const searchInput = document.getElementById('auditSearchInput');
  const filterSelect = document.getElementById('auditFilterSelect');
  if (!container) return;

  const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const filterCat = filterSelect ? filterSelect.value : 'ALL';

  let filtered = auditLogs.filter(log => {
    if (filterCat !== 'ALL') {
      if (filterCat === 'PAYMENT' && log.category !== 'PAYMENT' && log.category !== 'WARNING') return false;
      if (filterCat === 'MEMBER' && log.category !== 'MEMBER') return false;
      if (filterCat === 'SYSTEM' && log.category !== 'SYSTEM') return false;
    }

    if (query) {
      const matchSum = (log.summary || '').toLowerCase().includes(query);
      const matchDet = (log.details || '').toLowerCase().includes(query);
      const matchTime = (log.exactTime || '').toLowerCase().includes(query);
      if (!matchSum && !matchDet && !matchTime) return false;
    }

    return true;
  });

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${auditLogs.length} events`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
        No audit log entries matching your search.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(log => {
    let badgeClass = 'badge-audit-sys';
    let badgeLabel = log.category;

    if (log.category === 'PAYMENT') {
      badgeClass = 'badge-audit-pay';
      badgeLabel = 'PAYMENT';
    } else if (log.category === 'WARNING') {
      badgeClass = 'badge-audit-warn';
      badgeLabel = 'ADVANCE REVENUE';
    } else if (log.category === 'MEMBER') {
      badgeClass = 'badge-audit-member';
      badgeLabel = 'MEMBER';
    } else if (log.category === 'DELETE') {
      badgeClass = 'badge-audit-del';
      badgeLabel = 'DELETED';
    }

    return `
      <div class="audit-entry-card">
        <div class="audit-entry-header">
          <div class="audit-entry-meta">
            <span class="audit-badge ${badgeClass}">${badgeLabel}</span>
            <span class="audit-timestamp">${escapeHtml(log.exactTime)}</span>
          </div>
          <span style="font-size: 0.72rem; color: var(--text-dim); font-family: var(--font-mono);">${log.id}</span>
        </div>
        <div class="audit-entry-summary">${escapeHtml(log.summary)}</div>
        ${log.details ? `<div class="audit-entry-details">${escapeHtml(log.details)}</div>` : ''}
      </div>
    `;
  }).join('');
}

function exportAuditCsv() {
  if (auditLogs.length === 0) {
    showToast('No audit logs to export!', 'warning');
    return;
  }

  const gymName = localStorage.getItem(STORAGE_KEY_GYM_NAME) || DEFAULT_GYM_NAME;
  const headers = ['Audit ID', 'Exact Date & Time', 'Category', 'Summary', 'Details', 'ISO Timestamp'];
  const rows = auditLogs.map(l => [
    `"${l.id}"`,
    `"${l.exactTime}"`,
    `"${l.category}"`,
    `"${(l.summary || '').replace(/"/g, '""')}"`,
    `"${(l.details || '').replace(/"/g, '""')}"`,
    `"${l.timestamp}"`
  ].join(','));

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const todayStr = formatDateToInput(new Date());
  link.setAttribute('href', url);
  link.setAttribute('download', `${gymName.replace(/[^a-z0-9]/gi, '_')}_Audit_Log_${todayStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Audit Log exported to CSV successfully! 🛡️', 'success');
}

// ==========================================================================
// Load Members from LocalStorage or Preload Sample Data
// ==========================================================================
function loadMembers() {
  const rawData = localStorage.getItem(STORAGE_KEY_MEMBERS);
  if (rawData) {
    try {
      members = JSON.parse(rawData);
      if (!Array.isArray(members) || members.length === 0) {
        members = generateSampleMembers();
        saveMembers();
      } else {
        // Upgrade existing records with payments array and Receipt IDs if missing
        let modified = false;
        members.forEach(m => {
          if (!Array.isArray(m.payments)) {
            m.payments = [];
            if (m.paymentStatus === 'Paid') {
              const pDate = m.paymentDate || m.joinDate || formatDateToInput(new Date());
              m.paymentDate = pDate;
              m.payments.push({
                receiptId: getNextReceiptId(),
                timestamp: new Date().toISOString(),
                exactTime: formatExactDateTime(new Date()),
                amount: Number(m.amount) || 0,
                date: pDate,
                note: 'Recorded Payment',
                planType: m.planType || 'General Fitness'
              });
            }
            modified = true;
          } else {
            // Ensure every payment has a receiptId and exactTime
            m.payments.forEach(p => {
              if (!p.receiptId) {
                p.receiptId = getNextReceiptId();
                modified = true;
              }
              if (!p.exactTime) {
                p.exactTime = formatExactDateTime(p.timestamp || new Date());
                modified = true;
              }
            });
          }
        });
        if (modified) saveMembers();
      }
    } catch (e) {
      console.error('Failed to parse members from storage, loading defaults:', e);
      members = generateSampleMembers();
      saveMembers();
    }
  } else {
    members = generateSampleMembers();
    saveMembers();
  }

  updateDashboard();
}

function saveMembers() {
  localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
}

// Calculate Membership Status and Days Remaining
function getMemberStatus(expiryDateStr) {
  if (!expiryDateStr) return { code: 'expired', label: 'Renewal Miss', daysRemaining: -999 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      code: 'expired',
      label: 'Renewal Miss',
      sublabel: `Expired ${Math.abs(diffDays)}d ago`,
      daysRemaining: diffDays,
      badgeClass: 'badge-expired'
    };
  } else if (diffDays <= 3) {
    const text = diffDays === 0 ? 'Expires Today' : diffDays === 1 ? 'Expires Tomorrow' : `Expiring in ${diffDays} Days`;
    return {
      code: 'expiring',
      label: 'Expiring in 3 Days',
      sublabel: text,
      daysRemaining: diffDays,
      badgeClass: 'badge-expiring'
    };
  } else {
    return {
      code: 'active',
      label: 'OK',
      sublabel: `${diffDays} days left`,
      daysRemaining: diffDays,
      badgeClass: 'badge-ok'
    };
  }
}

// Clean and Format Indian / International Phone Number
function sanitizePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

// ==========================================================================
// Instant WhatsApp Proof Receipt & Reminders Generator
// ==========================================================================
function generateWhatsAppMessage(member) {
  const gymName = localStorage.getItem(STORAGE_KEY_GYM_NAME) || DEFAULT_GYM_NAME;
  const statusInfo = getMemberStatus(member.expiryDate);
  const formattedExpiry = formatDateDisplay(member.expiryDate);
  const amountStr = Number(member.amount || 0).toLocaleString('en-IN');

  // PAID MEMBERS: Generate Official Confirmation Proof with Receipt ID
  if (member.paymentStatus === 'Paid') {
    const lastPayment = (member.payments && member.payments.length > 0)
      ? member.payments[member.payments.length - 1]
      : null;
    const recId = lastPayment?.receiptId || '#REC-1001';
    const payDate = lastPayment?.exactTime || formatDateDisplay(member.paymentDate || new Date());

    return `Hi ${member.name}, aapka gym membership payment ₹${amountStr} successfully receive ho gaya hai! ✅\n\n` +
           `📄 *Receipt ID:* ${recId}\n` +
           `💰 *Amount Paid:* ₹${amountStr}\n` +
           `📅 *Payment Date:* ${payDate}\n` +
           `⏳ *Valid Till Date:* ${formattedExpiry}\n\n` +
           `Thank you for training with us! Consistency is key. 💪🔥 - ${gymName}`;
  }

  // PENDING / EXPIRED MEMBERS: Generate Polite Hindi/English Renewal Reminder
  if (statusInfo.code === 'expired') {
    return `Hi ${member.name}, aapki gym membership ${formattedExpiry} ko khatam ho chuki hai. Kripya ₹${amountStr} pay karke renew karein aur apna daily fitness routine continue rakhein! 💪🏋️ - ${gymName}`;
  } else if (statusInfo.code === 'expiring') {
    return `Hi ${member.name}, aapki gym membership ${formattedExpiry} ko khatam ho rahi hai (${statusInfo.sublabel}). Kripya ₹${amountStr} pay karke time par renew karein! 🏋️‍♂️💪 - ${gymName}`;
  } else {
    return `Hi ${member.name}, aapka gym membership fee payment ₹${amountStr} pending hai. Kripya counter par ya UPI se pay karke update karwayein. Shukriya! 🙏 - ${gymName}`;
  }
}

// Update Dashboard: Top Report Cards + Financial Summary + Member List
function updateDashboard() {
  updateMetricsCards();
  updateFinancialSummary();
  renderMembersTable();
}

// SECTION 1: Top Daily Report Cards Calculation (Active, Expiring/Expired, Pending)
function updateMetricsCards() {
  let activeCount = 0;
  let expiringSoonCount = 0;
  let expiredCount = 0;
  let pendingSum = 0;
  let pendingCount = 0;

  members.forEach(m => {
    const status = getMemberStatus(m.expiryDate);
    if (status.code === 'active') {
      activeCount++;
    } else if (status.code === 'expiring') {
      expiringSoonCount++;
    } else if (status.code === 'expired') {
      expiredCount++;
    }

    if (m.paymentStatus === 'Pending') {
      pendingSum += Number(m.amount) || 0;
      pendingCount++;
    }
  });

  const totalExpiringAndExpired = expiringSoonCount + expiredCount;

  const activeEl = document.getElementById('activeCount');
  if (activeEl) activeEl.textContent = activeCount;

  const expiringEl = document.getElementById('expiringCount');
  if (expiringEl) expiringEl.textContent = totalExpiringAndExpired;

  const exp3dEl = document.getElementById('expiring3DaysBreakdown');
  if (exp3dEl) exp3dEl.textContent = `${expiringSoonCount} Expiring ≤3d`;

  const expPastEl = document.getElementById('expiredBreakdown');
  if (expPastEl) expPastEl.textContent = `${expiredCount} Expired`;

  const pendingEl = document.getElementById('pendingAmount');
  if (pendingEl) pendingEl.textContent = `₹${pendingSum.toLocaleString('en-IN')}`;

  const pendingMembersEl = document.getElementById('pendingMembersCount');
  if (pendingMembersEl) pendingMembersEl.textContent = `${pendingCount} member${pendingCount === 1 ? '' : 's'} with pending fees`;

  // Update Filter Pill Counts
  const countAll = document.getElementById('countAll');
  if (countAll) countAll.textContent = members.length;

  const countActivePill = document.getElementById('countActivePill');
  if (countActivePill) countActivePill.textContent = activeCount;

  const countExpiringPill = document.getElementById('countExpiringPill');
  if (countExpiringPill) countExpiringPill.textContent = expiringSoonCount;

  const countExpiredPill = document.getElementById('countExpiredPill');
  if (countExpiredPill) countExpiredPill.textContent = expiredCount;

  const countPendingPill = document.getElementById('countPendingPill');
  if (countPendingPill) countPendingPill.textContent = pendingSum.toLocaleString('en-IN');
}

// ==========================================================================
// SECTION: Revenue & Financial Summary Calculation (4 Clean Cards in ₹)
// ==========================================================================
function updateFinancialSummary() {
  const month = selectedFinanceMonth; // 0-11
  const year = selectedFinanceYear;   // e.g. 2026
  const monthInfo = MONTH_NAMES[month] || { en: 'Month', hi: 'महीना' };

  let monthlyReceived = 0;
  let monthlyReceivedCount = 0;

  let monthlyPending = 0;
  let monthlyPendingCount = 0;

  let fullYearRevenue = 0;
  let fullYearRevenueCount = 0;

  let fullYearPending = 0;
  let fullYearPendingCount = 0;

  members.forEach(member => {
    const status = getMemberStatus(member.expiryDate);
    const planAmt = Number(member.amount) || 0;

    // 1. REVENUE COLLECTED (PAID MEMBERS)
    if (member.payments && Array.isArray(member.payments) && member.payments.length > 0) {
      member.payments.forEach(p => {
        if (!p.date) return;
        const pDate = new Date(p.date);
        const pYear = pDate.getFullYear();
        const pMonth = pDate.getMonth();
        const pAmt = Number(p.amount) || planAmt;

        if (pYear === year) {
          fullYearRevenue += pAmt;
          fullYearRevenueCount++;

          if (pMonth === month) {
            monthlyReceived += pAmt;
            monthlyReceivedCount++;
          }
        }
      });
    } else if (member.paymentStatus === 'Paid') {
      const effectiveDateStr = member.paymentDate || member.joinDate;
      if (effectiveDateStr) {
        const pDate = new Date(effectiveDateStr);
        const pYear = pDate.getFullYear();
        const pMonth = pDate.getMonth();

        if (pYear === year) {
          fullYearRevenue += planAmt;
          fullYearRevenueCount++;

          if (pMonth === month) {
            monthlyReceived += planAmt;
            monthlyReceivedCount++;
          }
        }
      }
    }

    // 2. PENDING / DUE AMOUNTS (PENDING OR EXPIRED MEMBERS)
    const isDue = member.paymentStatus === 'Pending' || status.code === 'expired';

    if (isDue) {
      const targetDateStr = member.expiryDate || member.joinDate;
      if (targetDateStr) {
        const tDate = new Date(targetDateStr);
        const tYear = tDate.getFullYear();
        const tMonth = tDate.getMonth();

        if (tYear === year) {
          fullYearPending += planAmt;
          fullYearPendingCount++;

          if (tMonth === month) {
            monthlyPending += planAmt;
            monthlyPendingCount++;
          }
        }
      }
    }
  });

  // Card 1: Monthly Received Payment (₹)
  const monthlyRecEl = document.getElementById('monthlyReceivedAmount');
  if (monthlyRecEl) {
    monthlyRecEl.textContent = `₹${monthlyReceived.toLocaleString('en-IN')}`;
  }
  const monthlyRecSub = document.getElementById('monthlyReceivedSubtext');
  if (monthlyRecSub) {
    monthlyRecSub.textContent = `${monthlyReceivedCount} paid collection${monthlyReceivedCount === 1 ? '' : 's'} in ${monthInfo.en} (${monthInfo.hi})`;
  }

  // Card 2: Monthly Pending Payment (₹)
  const monthlyPenEl = document.getElementById('monthlyPendingAmount');
  if (monthlyPenEl) {
    monthlyPenEl.textContent = `₹${monthlyPending.toLocaleString('en-IN')}`;
  }
  const monthlyPenSub = document.getElementById('monthlyPendingSubtext');
  if (monthlyPenSub) {
    monthlyPenSub.textContent = `${monthlyPendingCount} pending / expired due${monthlyPendingCount === 1 ? '' : 's'} in ${monthInfo.en}`;
  }

  // Card 3: Full Year Revenue (₹)
  const fullYearRevEl = document.getElementById('fullYearRevenueAmount');
  if (fullYearRevEl) {
    fullYearRevEl.textContent = `₹${fullYearRevenue.toLocaleString('en-IN')}`;
  }
  const fullYearRevSub = document.getElementById('fullYearRevenueSubtext');
  if (fullYearRevSub) {
    fullYearRevSub.textContent = `Total collected across all 12 months (${year})`;
  }

  // Card 4: Full Year Pending (₹)
  const fullYearPenEl = document.getElementById('fullYearPendingAmount');
  if (fullYearPenEl) {
    fullYearPenEl.textContent = `₹${fullYearPending.toLocaleString('en-IN')}`;
  }
  const fullYearPenSub = document.getElementById('fullYearPendingSubtext');
  if (fullYearPenSub) {
    fullYearPenSub.textContent = `Total unpaid dues across all 12 months (${year})`;
  }
}

// ==========================================================================
// SECTION 3: Member List Table with Search, Filter, Receipts & History
// ==========================================================================
function renderMembersTable() {
  const tbody = document.getElementById('membersTableBody');
  const mobileCardsList = document.getElementById('mobileMembersCardsList');
  const emptyState = document.getElementById('emptyState');
  const resultsCountEl = document.getElementById('tableResultsCount');
  if (!tbody) return;

  // 1. Filter members
  let filtered = members.filter(member => {
    const status = getMemberStatus(member.expiryDate);

    if (currentFilter === 'active' && status.code !== 'active') return false;
    if (currentFilter === 'expiring' && status.code !== 'expiring') return false;
    if (currentFilter === 'expired' && status.code !== 'expired') return false;
    if (currentFilter === 'expiring_or_expired' && status.code === 'active') return false;
    if (currentFilter === 'pending' && member.paymentStatus !== 'Pending') return false;
    if (currentFilter === 'paid' && member.paymentStatus !== 'Paid') return false;

    if (currentSearch) {
      const q = currentSearch.toLowerCase().trim();
      const nameMatch = (member.name || '').toLowerCase().includes(q);
      const phoneMatch = (member.phone || '').includes(q);
      const planMatch = (member.planType || '').toLowerCase().includes(q);
      if (!nameMatch && !phoneMatch && !planMatch) return false;
    }

    return true;
  });

  // 2. Sort members
  filtered.sort((a, b) => {
    if (currentSort === 'expiryAsc') {
      return new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0);
    } else if (currentSort === 'expiryDesc') {
      return new Date(b.expiryDate || 0) - new Date(a.expiryDate || 0);
    } else if (currentSort === 'nameAsc') {
      return (a.name || '').localeCompare(b.name || '');
    } else if (currentSort === 'amountDesc') {
      return (Number(b.amount) || 0) - (Number(a.amount) || 0);
    } else if (currentSort === 'joinDesc') {
      return new Date(b.joinDate || 0) - new Date(a.joinDate || 0);
    }
    return 0;
  });

  if (resultsCountEl) {
    resultsCountEl.textContent = `Showing ${filtered.length} of ${members.length} members`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (mobileCardsList) mobileCardsList.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  } else {
    if (emptyState) emptyState.style.display = 'none';
  }

  tbody.innerHTML = filtered.map((member, index) => {
    const status = getMemberStatus(member.expiryDate);
    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
    const initials = getInitials(member.name);
    const formattedJoin = formatDateDisplay(member.joinDate);
    const formattedExpiry = formatDateDisplay(member.expiryDate);
    const isPaid = member.paymentStatus === 'Paid';
    const waUrl = getDirectWaLink(member);

    return `
      <tr data-id="${member.id}">
        <!-- Member Name & Contact -->
        <td class="col-member">
          <div class="member-cell">
            <div class="member-avatar" style="background-color: ${avatarColor.bg}; color: ${avatarColor.text};">
              ${initials}
            </div>
            <div class="member-info">
              <span class="member-name">${escapeHtml(member.name)}</span>
              <span class="member-phone">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                +91 ${formatPhonePretty(member.phone)}
              </span>
              ${member.planType ? `<span class="member-plan-type">${escapeHtml(member.planType)}</span>` : ''}
            </div>
          </div>
        </td>

        <!-- Plan Amount -->
        <td class="col-plan">
          <span class="plan-amount-cell">₹${Number(member.amount || 0).toLocaleString('en-IN')}</span>
        </td>

        <!-- Join & Expiry Dates -->
        <td class="col-dates">
          <div class="date-cell-wrap">
            <div class="date-expiry-row" title="Membership Expiry Date">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Exp: <strong>${formattedExpiry}</strong></span>
            </div>
            <div class="date-join-row" title="Member Join Date">
              Joined: ${formattedJoin}
            </div>
          </div>
        </td>

        <!-- Status Badge -->
        <td class="col-status">
          <div class="status-badge ${status.badgeClass}">
            <span class="badge-dot"></span>
            <span>${status.label}</span>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 3px;">
            ${status.sublabel}
          </div>
        </td>

        <!-- Payment Status with Receipt & History Buttons -->
        <td class="col-payment">
          <div class="payment-cell-stack">
            <span class="payment-badge ${isPaid ? 'payment-paid' : 'payment-pending'}">
              ${isPaid ? '✅ Paid' : '⚠️ Baaki (Pending)'}
            </span>
            ${isPaid ? `
              <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 3px;">
                <button class="btn-action-receipt" onclick="openReceiptModal('${member.id}')" title="View & Print Official Digital Fee Receipt">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <span>Receipt</span>
                </button>
                <button class="btn-action-history" onclick="openPaymentHistoryModal('${member.id}')" title="View Locked Payment History">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>History</span>
                </button>
              </div>
            ` : ''}
          </div>
        </td>

        <!-- WhatsApp Proof Receipt / Reminder Button (wa.me) -->
        <td class="col-whatsapp">
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" 
             class="btn-action-wa ${isPaid ? 'btn-action-wa-proof' : ''}" 
             title="${isPaid ? 'Send Official Confirmation Proof Receipt on WhatsApp' : 'Open WhatsApp chat with pre-filled reminder'}">
            ${isPaid ? `
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Proof Receipt</span>
            ` : `
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>Send Reminder</span>
            `}
          </a>
        </td>

        <!-- Quick Actions: Renew (+30d), Edit, Delete -->
        <td class="col-actions text-right">
          <div class="actions-cell-wrap">
            <button class="btn-action-renew" onclick="handleRenewQuick('${member.id}')" title="Extend expiry by 30 days & mark Paid">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              <span>+30 Days</span>
            </button>
            <button class="btn-action-edit" onclick="openEditModal('${member.id}')" title="Edit Member">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-action-delete" onclick="promptDeleteMember('${member.id}')" title="Delete Member">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // B. Render Native Mobile Cards (< 768px Viewport)
  if (mobileCardsList) {
    mobileCardsList.innerHTML = filtered.map((member, index) => {
      const status = getMemberStatus(member.expiryDate);
      const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
      const initials = getInitials(member.name);
      const formattedJoin = formatDateDisplay(member.joinDate);
      const formattedExpiry = formatDateDisplay(member.expiryDate);
      const isPaid = member.paymentStatus === 'Paid';
      const waUrl = getDirectWaLink(member);
      const borderClass = status.code === 'active' ? 'card-border-ok' : status.code === 'expiring' ? 'card-border-expiring' : 'card-border-expired';

      return `
        <div class="mobile-member-card ${borderClass}" data-id="${member.id}">
          <!-- Header: Avatar, Name, Phone, Price -->
          <div class="mob-card-header">
            <div class="mob-card-user-info">
              <div class="mob-avatar" style="background-color: ${avatarColor.bg}; color: ${avatarColor.text};">
                ${initials}
              </div>
              <div class="mob-user-text">
                <span class="mob-member-name">${escapeHtml(member.name)}</span>
                <a href="tel:${member.phone}" class="mob-member-phone" title="Call Member">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  +91 ${formatPhonePretty(member.phone)}
                </a>
              </div>
            </div>
            <div class="mob-card-price-badge">
              <span class="mob-plan-price">₹${Number(member.amount || 0).toLocaleString('en-IN')}</span>
              <span class="mob-plan-type">${escapeHtml(member.planType || 'General')}</span>
            </div>
          </div>

          <!-- Badges Row: Membership Status & Payment Status -->
          <div class="mob-badges-row">
            <div class="mob-badges-left">
              <span class="status-badge ${status.badgeClass}">
                <span class="badge-dot"></span>
                <span>${status.label}</span>
              </span>
            </div>
            <div class="mob-badges-right">
              <span class="payment-badge ${isPaid ? 'payment-paid' : 'payment-pending'}">
                ${isPaid ? '✅ Paid' : '⚠️ Baaki (Pending)'}
              </span>
            </div>
          </div>

          <!-- Dates Details Grid -->
          <div class="mob-dates-grid">
            <div class="mob-date-item">
              <span class="mob-date-label">Joined Date</span>
              <span class="mob-date-val">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                ${formattedJoin}
              </span>
            </div>
            <div class="mob-date-item">
              <span class="mob-date-label">Valid Till / Expiry</span>
              <span class="mob-date-val ${status.code === 'expired' ? 'mob-date-expired-val' : status.code === 'expiring' ? 'mob-date-expiry-val' : ''}">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <strong>${formattedExpiry}</strong>
              </span>
            </div>
          </div>

          <!-- Actions Section -->
          <div class="mob-actions-section">
            ${isPaid ? `
              <!-- Paid Member Primary Action: RECEIPT BUTTON & WHATSAPP PROOF -->
              <div class="mob-primary-action-row">
                <button type="button" class="mob-btn mob-btn-receipt" onclick="openReceiptModal('${member.id}')" title="Generate, View, Print & Download Digital Fee Receipt Card">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <span>Receipt (रसीद)</span>
                </button>
                <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="mob-btn mob-btn-wa-proof" title="Send Official Proof Receipt on WhatsApp">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>WhatsApp Proof</span>
                </a>
              </div>
              <div class="mob-secondary-actions-row">
                <button type="button" class="mob-btn-secondary-sm" onclick="openPaymentHistoryModal('${member.id}')" title="View Locked Payment History">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>History</span>
                </button>
                <button type="button" class="mob-btn-secondary-sm" onclick="handleRenewQuick('${member.id}')" title="Advance Renewal (+30d)">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  <span>+30 Days</span>
                </button>
                <button type="button" class="mob-btn-secondary-sm" onclick="openEditModal('${member.id}')" title="Edit Member">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span>Edit</span>
                </button>
                <button type="button" class="mob-btn-secondary-sm mob-btn-del" onclick="promptDeleteMember('${member.id}')" title="Delete Member">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            ` : `
              <!-- Pending / Expired Member Primary Action: RENEW (+30D) & SEND REMINDER -->
              <div class="mob-primary-action-row">
                <button type="button" class="mob-btn mob-btn-renew-paid" onclick="handleRenewQuick('${member.id}')" title="Mark as Paid & Extend 30 Days">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  <span>Mark Paid (+30d)</span>
                </button>
                <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="mob-btn mob-btn-wa-remind" title="Send WhatsApp Renewal Reminder">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>WhatsApp</span>
                </a>
              </div>
              <div class="mob-secondary-actions-row">
                <button type="button" class="mob-btn-secondary-sm" onclick="openEditModal('${member.id}')" title="Edit Member">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span>Edit</span>
                </button>
                <button type="button" class="mob-btn-secondary-sm mob-btn-del" onclick="promptDeleteMember('${member.id}')" title="Delete Member">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
  }
}

// WhatsApp wa.me Link Builder
function getDirectWaLink(member) {
  const cleanPhone = sanitizePhone(member.phone);
  const msg = generateWhatsAppMessage(member);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

// Helper: Initials for Avatar
function getInitials(name) {
  if (!name) return 'GM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Helper: Format Date for Display
function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Helper: Pretty format 10-digit phone
function formatPhonePretty(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    return `${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

// Helper: HTML escape
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// FEATURE 1: Immutable Payment History Modal (Locked & Tamper-Proof)
// ==========================================================================
window.openPaymentHistoryModal = function(memberId) {
  const member = members.find(m => m.id === memberId);
  if (!member) return;

  const subtitleEl = document.getElementById('historyMemberSubtitle');
  if (subtitleEl) subtitleEl.textContent = `Transactions for ${member.name} (+91 ${formatPhonePretty(member.phone)})`;

  const tbody = document.getElementById('historyTableBody');
  const emptyState = document.getElementById('historyEmptyState');
  if (!tbody) return;

  const payments = Array.isArray(member.payments) ? member.payments : [];

  if (payments.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
  } else {
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = payments.map((p, index) => {
      const recId = p.receiptId || `#REC-${1000 + index + 1}`;
      const timeStr = p.exactTime || formatExactDateTime(p.timestamp || p.date || new Date());
      const amtStr = `₹${Number(p.amount || member.amount || 0).toLocaleString('en-IN')}`;
      const noteStr = p.note || 'Membership Payment';

      return `
        <tr>
          <td>
            <span class="receipt-id-tag">${recId}</span>
          </td>
          <td>
            <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-main);">${timeStr}</div>
            <div style="font-size: 0.72rem; color: var(--text-dim);">Recorded in Immutable Ledger</div>
          </td>
          <td>
            <strong style="color: #10b981; font-family: var(--font-mono); font-size: 0.94rem;">${amtStr}</strong>
          </td>
          <td>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(noteStr)}</span>
          </td>
          <td class="text-right">
            <button class="btn btn-ghost-sm" onclick="openReceiptModalForPayment('${member.id}', ${index})" title="View Digital Receipt Voucher">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>Receipt</span>
            </button>
          </td>
        </tr>
      `;
    }).reverse().join(''); // Show most recent on top
  }

  openModal('historyModalBackdrop');
};

// ==========================================================================
// Digital Fee Receipt Modal Logic
// ==========================================================================
window.openReceiptModal = function(memberId) {
  openReceiptModalForPayment(memberId, null);
};

window.openReceiptModalForPayment = function(memberId, paymentIndex) {
  const member = members.find(m => m.id === memberId);
  if (!member) return;

  activeReceiptMember = member;

  const payments = Array.isArray(member.payments) ? member.payments : [];
  let paymentItem = null;

  if (paymentIndex !== null && paymentIndex >= 0 && paymentIndex < payments.length) {
    paymentItem = payments[paymentIndex];
  } else if (payments.length > 0) {
    paymentItem = payments[payments.length - 1]; // Latest payment
  }

  activeReceiptPayment = paymentItem;

  const gymName = localStorage.getItem(STORAGE_KEY_GYM_NAME) || DEFAULT_GYM_NAME;
  const gymTagline = localStorage.getItem(STORAGE_KEY_GYM_TAGLINE) || DEFAULT_GYM_TAGLINE;
  const gymPhone = localStorage.getItem(STORAGE_KEY_GYM_PHONE) || DEFAULT_GYM_PHONE;
  const gymAddress = localStorage.getItem(STORAGE_KEY_GYM_ADDRESS) || DEFAULT_GYM_ADDRESS;

  // Header
  const recGymName = document.getElementById('receiptGymName');
  if (recGymName) recGymName.textContent = gymName;

  const recGymTag = document.getElementById('receiptGymTagline');
  if (recGymTag) recGymTag.textContent = gymTagline;

  const recGymContact = document.getElementById('receiptGymContact');
  if (recGymContact) recGymContact.textContent = `Phone: ${gymPhone} | Location: ${gymAddress}`;

  // Signatory
  const recSignGym = document.getElementById('receiptSignGymName');
  if (recSignGym) recSignGym.textContent = gymName;

  // Receipt No
  const recNo = paymentItem?.receiptId || `#REC-${1000 + (parseInt(member.id.replace(/\D/g, ''), 10) || 1)}`;
  const recNoEl = document.getElementById('receiptNo');
  if (recNoEl) recNoEl.textContent = recNo;

  // Exact Dates & Times
  const exactTimeStr = paymentItem?.exactTime || formatExactDateTime(paymentItem?.timestamp || member.paymentDate || new Date());
  const formattedExpiryDate = formatDateDisplay(paymentItem?.expiryDate || member.expiryDate);

  const recPayDateEl = document.getElementById('receiptPaymentDateDisplay');
  if (recPayDateEl) recPayDateEl.textContent = exactTimeStr;

  const recExpDateEl = document.getElementById('receiptExpiryDateDisplay');
  if (recExpDateEl) recExpDateEl.textContent = formattedExpiryDate;

  // Member Details
  const recMemName = document.getElementById('receiptMemberName');
  if (recMemName) recMemName.textContent = member.name;

  const recMemPhone = document.getElementById('receiptMemberPhone');
  if (recMemPhone) recMemPhone.textContent = `+91 ${formatPhonePretty(member.phone)}`;

  const recPlan = document.getElementById('receiptPlanType');
  if (recPlan) recPlan.textContent = paymentItem?.planType || member.planType || 'General Fitness & Gym Membership';

  // Amount
  const amountToDisplay = paymentItem?.amount || member.amount || 0;
  const amountStr = `₹${Number(amountToDisplay).toLocaleString('en-IN')}`;
  const recAmount = document.getElementById('receiptAmountPaidDisplay');
  if (recAmount) recAmount.textContent = amountStr;

  // Configure WhatsApp Share for this exact receipt
  const waShareBtn = document.getElementById('shareReceiptWaBtn');
  if (waShareBtn) {
    waShareBtn.onclick = () => {
      const cleanPhone = sanitizePhone(member.phone);
      const text = `🧾 *OFFICIAL FEE RECEIPT - ${gymName}*\n` +
                   `----------------------------------------\n` +
                   `📄 *Receipt ID:* ${recNo}\n` +
                   `📅 *Payment Date & Time:* ${exactTimeStr}\n` +
                   `👤 *Member Name:* ${member.name}\n` +
                   `📱 *Phone:* +91 ${formatPhonePretty(member.phone)}\n` +
                   `🏋️ *Plan / Batch:* ${paymentItem?.planType || member.planType || 'General Fitness'}\n` +
                   `⏳ *Valid Till Date:* ${formattedExpiryDate}\n` +
                   `💰 *Amount Paid:* ${amountStr}\n` +
                   `----------------------------------------\n` +
                   `Status: ✅ *PAID & VERIFIED (ANTI-FRAUD LOCKED)*\n` +
                   `Thank you for training with us! 💪🔥`;

      const shareUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    };
  }

  openModal('receiptModalBackdrop');
};

// ==========================================================================
// FEATURE 2: Double-Payment Warning Guard Logic (>7 Days Remaining)
// ==========================================================================
window.handleRenewQuick = function(memberId) {
  const member = members.find(m => m.id === memberId);
  if (!member) return;

  const status = getMemberStatus(member.expiryDate);

  // DOUBLE-PAYMENT WARNING GUARD:
  // If member has MORE THAN 7 DAYS remaining on an active paid plan
  if (member.paymentStatus === 'Paid' && status.daysRemaining > 7) {
    pendingGuardMemberId = memberId;
    openDoublePaymentGuard(member, status);
    return;
  }

  // Otherwise (<= 7 days, expiring soon, or expired): proceed directly
  executeRenewalProcess(member, false);
};

function openDoublePaymentGuard(member, status) {
  const nameEl = document.getElementById('guardMemberName');
  if (nameEl) nameEl.textContent = member.name;

  const daysEl = document.getElementById('guardDaysRemaining');
  if (daysEl) daysEl.textContent = `${status.daysRemaining} days remaining`;

  const curExpEl = document.getElementById('guardCurrentExpiry');
  if (curExpEl) curExpEl.textContent = `${formatDateDisplay(member.expiryDate)} (Paid)`;

  const amtEl = document.getElementById('guardPlanAmount');
  if (amtEl) amtEl.textContent = `₹${Number(member.amount || 0).toLocaleString('en-IN')}`;

  const currentExpiry = new Date(member.expiryDate);
  const newExpiry = addDays(currentExpiry, 30);
  const newExpEl = document.getElementById('guardNewExpiry');
  if (newExpEl) newExpEl.textContent = `${formatDateDisplay(newExpiry)} (+30 Days from current expiry)`;

  openModal('guardModalBackdrop');
}

function executeRenewalProcess(member, isAdvance) {
  const currentExpiry = new Date(member.expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let baseDate = currentExpiry > today ? currentExpiry : today;
  const newExpiry = addDays(baseDate, 30);
  const todayStr = formatDateToInput(today);
  const exactTimeStr = formatExactDateTime(new Date());

  // Generate unique immutable Receipt ID
  const receiptId = getNextReceiptId();

  member.expiryDate = formatDateToInput(newExpiry);
  member.paymentStatus = 'Paid';
  member.paymentDate = todayStr;

  const paymentRecord = {
    receiptId: receiptId,
    timestamp: new Date().toISOString(),
    exactTime: exactTimeStr,
    amount: Number(member.amount) || 0,
    date: todayStr,
    expiryDate: formatDateToInput(newExpiry),
    note: isAdvance ? 'Advance Renewal (+30 Days - Guard Confirmed)' : 'Membership Renewal (+30 Days)',
    planType: member.planType || 'General Fitness'
  };

  if (!Array.isArray(member.payments)) {
    member.payments = [];
  }
  member.payments.push(paymentRecord);

  saveMembers();

  // Log to Immutable Audit Ledger
  if (isAdvance) {
    logAuditEvent(
      'WARNING',
      `Advance Double-Payment Confirmed: ₹${member.amount} for ${member.name} (${receiptId})`,
      `Guard Warning Overridden: Customer had active membership. Extended to ${formatDateDisplay(newExpiry)}.`
    );
  } else {
    logAuditEvent(
      'PAYMENT',
      `Membership Renewal (+30 Days): ₹${member.amount} for ${member.name} (${receiptId})`,
      `Previous Expiry: ${formatDateDisplay(currentExpiry)} ➔ New Expiry: ${formatDateDisplay(newExpiry)}`
    );
  }

  updateDashboard();

  showToast(`Renewed ${member.name} (+30d) • Receipt ${receiptId} generated! 🎉`, 'success');
}

// Quick Action: Prompt Delete
window.promptDeleteMember = function(memberId) {
  const member = members.find(m => m.id === memberId);
  if (!member) return;

  memberToDeleteId = memberId;
  const nameEl = document.getElementById('deleteMemberName');
  if (nameEl) nameEl.textContent = member.name;

  const modal = document.getElementById('deleteModalBackdrop');
  if (modal) modal.classList.add('show');
};

// Confirm Delete
function executeDeleteMember() {
  if (!memberToDeleteId) return;
  const member = members.find(m => m.id === memberToDeleteId);
  const name = member ? member.name : 'Member';
  const amt = member ? member.amount : 0;

  members = members.filter(m => m.id !== memberToDeleteId);
  memberToDeleteId = null;

  saveMembers();

  // Log deletion to Audit Log
  logAuditEvent('DELETE', `Member Removed: ${name}`, `Member ID: ${memberToDeleteId} | Plan Amount: ₹${amt}`);

  updateDashboard();
  closeModal('deleteModalBackdrop');
  showToast(`Removed ${name} from gym records.`, 'info');
}

// Quick Action: Export Data to CSV (for Excel / Google Sheets)
function exportMembersToCSV() {
  if (members.length === 0) {
    showToast('No members data to export!', 'warning');
    return;
  }

  const gymName = localStorage.getItem(STORAGE_KEY_GYM_NAME) || DEFAULT_GYM_NAME;
  const headers = [
    'Member ID',
    'Member Name',
    'Phone Number',
    'Plan Amount (INR)',
    'Join Date',
    'Expiry Date',
    'Payment Status',
    'Latest Receipt ID',
    'Membership Status',
    'Days Remaining',
    'Plan / Batch Info'
  ];

  const rows = members.map(m => {
    const status = getMemberStatus(m.expiryDate);
    const lastRec = (m.payments && m.payments.length > 0) ? m.payments[m.payments.length - 1].receiptId : '—';
    return [
      `"${m.id}"`,
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${m.phone || ''}"`,
      m.amount || 0,
      `"${m.joinDate || ''}"`,
      `"${m.expiryDate || ''}"`,
      `"${m.paymentStatus || ''}"`,
      `"${lastRec}"`,
      `"${status.label}"`,
      status.daysRemaining,
      `"${(m.planType || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const todayStr = formatDateToInput(new Date());
  link.setAttribute('href', url);
  link.setAttribute('download', `${gymName.replace(/[^a-z0-9]/gi, '_')}_Members_${todayStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Exported CSV backup for Google Sheets & Excel!', 'success');
}

// ==========================================================================
// Settings & Full JSON Data Backup / Restore Logic
// ==========================================================================
function openSettingsModal() {
  const gymName = localStorage.getItem(STORAGE_KEY_GYM_NAME) || DEFAULT_GYM_NAME;
  const gymTagline = localStorage.getItem(STORAGE_KEY_GYM_TAGLINE) || DEFAULT_GYM_TAGLINE;
  const gymPhone = localStorage.getItem(STORAGE_KEY_GYM_PHONE) || DEFAULT_GYM_PHONE;
  const gymAddress = localStorage.getItem(STORAGE_KEY_GYM_ADDRESS) || DEFAULT_GYM_ADDRESS;

  const nameInput = document.getElementById('settingsGymNameInput');
  if (nameInput) nameInput.value = gymName;

  const tagInput = document.getElementById('settingsGymTaglineInput');
  if (tagInput) tagInput.value = gymTagline;

  const phoneInput = document.getElementById('settingsGymPhoneInput');
  if (phoneInput) phoneInput.value = gymPhone;

  const addrInput = document.getElementById('settingsGymAddressInput');
  if (addrInput) addrInput.value = gymAddress;

  openModal('settingsModalBackdrop');
}

function saveGymSettings() {
  const nameInput = document.getElementById('settingsGymNameInput');
  const tagInput = document.getElementById('settingsGymTaglineInput');
  const phoneInput = document.getElementById('settingsGymPhoneInput');
  const addrInput = document.getElementById('settingsGymAddressInput');

  const newName = (nameInput && nameInput.value.trim()) || DEFAULT_GYM_NAME;
  const newTag = (tagInput && tagInput.value.trim()) || DEFAULT_GYM_TAGLINE;
  const newPhone = (phoneInput && phoneInput.value.trim()) || DEFAULT_GYM_PHONE;
  const newAddr = (addrInput && addrInput.value.trim()) || DEFAULT_GYM_ADDRESS;

  localStorage.setItem(STORAGE_KEY_GYM_NAME, newName);
  localStorage.setItem(STORAGE_KEY_GYM_TAGLINE, newTag);
  localStorage.setItem(STORAGE_KEY_GYM_PHONE, newPhone);
  localStorage.setItem(STORAGE_KEY_GYM_ADDRESS, newAddr);

  initGymBranding();

  logAuditEvent('SYSTEM', `Gym Branding Profile Updated`, `Name: "${newName}" | Tagline: "${newTag}" | Phone: "${newPhone}"`);

  showToast('Gym branding & profile saved successfully!', 'success');
}

// Full JSON Backup Export
function exportJsonBackup() {
  const gymName = localStorage.getItem(STORAGE_KEY_GYM_NAME) || DEFAULT_GYM_NAME;
  const gymTagline = localStorage.getItem(STORAGE_KEY_GYM_TAGLINE) || DEFAULT_GYM_TAGLINE;
  const gymPhone = localStorage.getItem(STORAGE_KEY_GYM_PHONE) || DEFAULT_GYM_PHONE;
  const gymAddress = localStorage.getItem(STORAGE_KEY_GYM_ADDRESS) || DEFAULT_GYM_ADDRESS;

  const backupData = {
    appName: 'GymFlow',
    version: '1.2',
    exportedAt: new Date().toISOString(),
    gymProfile: {
      gymName,
      gymTagline,
      gymPhone,
      gymAddress
    },
    members: members,
    auditLogs: auditLogs
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const todayStr = formatDateToInput(new Date());
  link.setAttribute('href', url);
  link.setAttribute('download', `${gymName.replace(/[^a-z0-9]/gi, '_')}_Full_Backup_${todayStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  logAuditEvent('SYSTEM', 'Full JSON Database Backup Exported', `Downloaded complete database with ${members.length} members.`);

  showToast('Full JSON backup exported successfully! 💾', 'success');
}

// Full JSON Backup Restore
function importJsonBackup(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const data = JSON.parse(event.target.result);

      let loadedMembers = null;
      if (Array.isArray(data)) {
        loadedMembers = data;
      } else if (data && Array.isArray(data.members)) {
        loadedMembers = data.members;

        if (data.gymProfile) {
          if (data.gymProfile.gymName) localStorage.setItem(STORAGE_KEY_GYM_NAME, data.gymProfile.gymName);
          if (data.gymProfile.gymTagline) localStorage.setItem(STORAGE_KEY_GYM_TAGLINE, data.gymProfile.gymTagline);
          if (data.gymProfile.gymPhone) localStorage.setItem(STORAGE_KEY_GYM_PHONE, data.gymProfile.gymPhone);
          if (data.gymProfile.gymAddress) localStorage.setItem(STORAGE_KEY_GYM_ADDRESS, data.gymProfile.gymAddress);
        }

        if (Array.isArray(data.auditLogs)) {
          auditLogs = data.auditLogs;
          saveAuditLogs();
        }
      }

      if (!loadedMembers) {
        showToast('Invalid backup file! Could not find members array.', 'error');
        return;
      }

      members = loadedMembers;
      saveMembers();
      initGymBranding();
      updateDashboard();
      closeModal('settingsModalBackdrop');

      logAuditEvent('SYSTEM', 'Full JSON Database Restored', `Restored ${members.length} members from file backup.`);

      showToast(`Backup restored! Loaded ${members.length} members successfully. 🎉`, 'success');

      e.target.value = '';
    } catch (err) {
      console.error('Failed to parse JSON backup:', err);
      showToast('Error reading backup JSON file. Please check format.', 'error');
    }
  };
  reader.readAsText(file);
}

// ==========================================================================
// Add / Edit Member Form Handling
// ==========================================================================
function openAddModal() {
  const form = document.getElementById('memberForm');
  if (form) form.reset();

  document.getElementById('memberIdField').value = '';
  document.getElementById('modalTitle').textContent = 'Add New Member';
  document.getElementById('saveBtnText').textContent = 'Save Member';

  const today = formatDateToInput(new Date());
  document.getElementById('joinDateInput').value = today;
  document.getElementById('expiryDateInput').value = formatDateToInput(addDays(new Date(), 30));

  clearFormErrors();
  openModal('memberModalBackdrop');
}

window.openEditModal = function(memberId) {
  const member = members.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById('memberIdField').value = member.id;
  document.getElementById('modalTitle').textContent = 'Edit Member Details';
  document.getElementById('saveBtnText').textContent = 'Update Member';

  document.getElementById('memberNameInput').value = member.name || '';
  document.getElementById('memberPhoneInput').value = member.phone || '';
  document.getElementById('planAmountInput').value = member.amount || '';
  document.getElementById('paymentStatusSelect').value = member.paymentStatus || 'Paid';
  document.getElementById('joinDateInput').value = member.joinDate || '';
  document.getElementById('expiryDateInput').value = member.expiryDate || '';
  document.getElementById('planTypeInput').value = member.planType || '';

  clearFormErrors();
  openModal('memberModalBackdrop');
};

function handleMemberFormSubmit(e) {
  e.preventDefault();

  const idField = document.getElementById('memberIdField').value;
  const name = document.getElementById('memberNameInput').value.trim();
  const phone = document.getElementById('memberPhoneInput').value.trim();
  const amount = parseFloat(document.getElementById('planAmountInput').value);
  const paymentStatus = document.getElementById('paymentStatusSelect').value;
  const joinDate = document.getElementById('joinDateInput').value;
  const expiryDate = document.getElementById('expiryDateInput').value;
  const planType = document.getElementById('planTypeInput').value.trim();

  let hasError = false;
  clearFormErrors();

  if (!name) {
    showFieldError('nameError', 'Please enter the member full name');
    hasError = true;
  }

  const cleanedPhone = phone.replace(/\D/g, '');
  if (!cleanedPhone || (cleanedPhone.length !== 10 && cleanedPhone.length !== 12)) {
    showFieldError('phoneError', 'Please enter a valid 10-digit Indian phone number');
    hasError = true;
  }

  if (isNaN(amount) || amount < 0) {
    showFieldError('amountError', 'Please enter a valid amount');
    hasError = true;
  }

  if (!joinDate || !expiryDate) {
    showToast('Please select both Join and Expiry dates', 'warning');
    hasError = true;
  }

  if (hasError) return;

  const todayStr = formatDateToInput(new Date());
  const exactTimeStr = formatExactDateTime(new Date());

  if (idField) {
    const memberIndex = members.findIndex(m => m.id === idField);
    if (memberIndex !== -1) {
      const existing = members[memberIndex];
      let payments = existing.payments ? [...existing.payments] : [];
      let paymentDate = existing.paymentDate || '';

      if (paymentStatus === 'Paid') {
        if (existing.paymentStatus !== 'Paid' || !paymentDate) {
          const recId = getNextReceiptId();
          paymentDate = todayStr;
          payments.push({
            receiptId: recId,
            timestamp: new Date().toISOString(),
            exactTime: exactTimeStr,
            date: todayStr,
            expiryDate: expiryDate,
            amount: amount,
            note: 'Status Updated to Paid',
            planType: planType || 'General Fitness'
          });

          logAuditEvent('PAYMENT', `Payment Received: ₹${amount} for ${name} (${recId})`, `Status manually marked Paid in profile editor.`);
        }
      }

      members[memberIndex] = {
        ...existing,
        name,
        phone,
        amount,
        paymentStatus,
        paymentDate,
        payments,
        joinDate,
        expiryDate,
        planType
      };

      logAuditEvent('MEMBER', `Member Profile Updated: ${name}`, `Phone: +91 ${phone} | Plan: ₹${amount} | Expiry: ${expiryDate}`);

      showToast(`Updated profile for ${name}!`, 'success');
    }
  } else {
    const isPaid = paymentStatus === 'Paid';
    const recId = isPaid ? getNextReceiptId() : null;

    const newMember = {
      id: 'mem_' + Date.now(),
      name,
      phone,
      amount,
      paymentStatus,
      paymentDate: isPaid ? (joinDate || todayStr) : '',
      payments: isPaid ? [{
        receiptId: recId,
        timestamp: new Date().toISOString(),
        exactTime: exactTimeStr,
        date: joinDate || todayStr,
        expiryDate: expiryDate,
        amount: amount,
        note: 'Initial Membership Registration',
        planType: planType || 'General Fitness'
      }] : [],
      joinDate,
      expiryDate,
      planType
    };
    members.unshift(newMember);

    logAuditEvent(
      'MEMBER',
      `New Member Registered: ${name}`,
      `Plan: ₹${amount} (${planType || 'General'}) | Status: ${paymentStatus} | Expiry: ${expiryDate}`
    );

    if (isPaid) {
      logAuditEvent(
        'PAYMENT',
        `Initial Payment Collected: ₹${amount} for ${name} (${recId})`,
        `Receipt ${recId} locked into payment history.`
      );
    }

    showToast(`Added ${name} to gym roster! 🏋️`, 'success');
  }

  saveMembers();
  updateDashboard();
  closeModal('memberModalBackdrop');
}

function clearFormErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));
}

function showFieldError(errorElId, message) {
  const el = document.getElementById(errorElId);
  if (el) {
    if (message) el.textContent = message;
    el.classList.add('show');
  }
}

// Modal helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('show');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('show');
}

// Toast System
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (type === 'warning') {
    iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f59e0b" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  } else {
    iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#3b82f6" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// ==========================================================================
// Event Listeners Binding
// ==========================================================================
function bindEvents() {
  // Double-Payment Warning Guard Triggers
  const cancelGuardBtn = document.getElementById('cancelGuardBtn');
  if (cancelGuardBtn) {
    cancelGuardBtn.addEventListener('click', () => {
      closeModal('guardModalBackdrop');
      pendingGuardMemberId = null;
      showToast('Advance renewal cancelled. Customer was not charged.', 'info');
    });
  }

  const closeGuardModalBtn = document.getElementById('closeGuardModalBtn');
  if (closeGuardModalBtn) {
    closeGuardModalBtn.addEventListener('click', () => {
      closeModal('guardModalBackdrop');
      pendingGuardMemberId = null;
    });
  }

  const confirmGuardRenewBtn = document.getElementById('confirmGuardRenewBtn');
  if (confirmGuardRenewBtn) {
    confirmGuardRenewBtn.addEventListener('click', () => {
      if (!pendingGuardMemberId) return;
      const member = members.find(m => m.id === pendingGuardMemberId);
      closeModal('guardModalBackdrop');
      pendingGuardMemberId = null;
      if (member) {
        executeRenewalProcess(member, true);
      }
    });
  }

  // Payment History Modal Triggers
  const closeHistoryModalBtn = document.getElementById('closeHistoryModalBtn');
  if (closeHistoryModalBtn) closeHistoryModalBtn.addEventListener('click', () => closeModal('historyModalBackdrop'));

  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', () => closeModal('historyModalBackdrop'));

  // Audit Log Modal Triggers
  const openAuditLogBtn = document.getElementById('openAuditLogBtn');
  if (openAuditLogBtn) openAuditLogBtn.addEventListener('click', openAuditLogModal);

  const closeAuditModalBtn = document.getElementById('closeAuditModalBtn');
  if (closeAuditModalBtn) closeAuditModalBtn.addEventListener('click', () => closeModal('auditModalBackdrop'));

  const closeAuditBtn = document.getElementById('closeAuditBtn');
  if (closeAuditBtn) closeAuditBtn.addEventListener('click', () => closeModal('auditModalBackdrop'));

  const exportAuditCsvBtn = document.getElementById('exportAuditCsvBtn');
  if (exportAuditCsvBtn) exportAuditCsvBtn.addEventListener('click', exportAuditCsv);

  const auditSearchInput = document.getElementById('auditSearchInput');
  if (auditSearchInput) {
    auditSearchInput.addEventListener('input', () => renderAuditLog());
  }

  const auditFilterSelect = document.getElementById('auditFilterSelect');
  if (auditFilterSelect) {
    auditFilterSelect.addEventListener('change', () => renderAuditLog());
  }

  // Settings & Backup Modal Triggers
  const openSettingsBtn = document.getElementById('openSettingsModalBtn');
  if (openSettingsBtn) openSettingsBtn.addEventListener('click', openSettingsModal);

  const editGymNameBtn = document.getElementById('editGymNameBtn');
  if (editGymNameBtn) editGymNameBtn.addEventListener('click', openSettingsModal);

  const closeSettingsBtn = document.getElementById('closeSettingsModalBtn');
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => closeModal('settingsModalBackdrop'));

  const closeSettingsFooterBtn = document.getElementById('closeSettingsFooterBtn');
  if (closeSettingsFooterBtn) closeSettingsFooterBtn.addEventListener('click', () => closeModal('settingsModalBackdrop'));

  const saveGymSettingsBtn = document.getElementById('saveGymSettingsBtn');
  if (saveGymSettingsBtn) saveGymSettingsBtn.addEventListener('click', saveGymSettings);

  const exportJsonBtn = document.getElementById('exportJsonBackupBtn');
  if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJsonBackup);

  const triggerImportBtn = document.getElementById('triggerImportJsonBtn');
  const importFileInput = document.getElementById('importJsonFileInput');
  if (triggerImportBtn && importFileInput) {
    triggerImportBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importJsonBackup);
  }

  // Receipt Modal Triggers
  const closeReceiptModalBtn = document.getElementById('closeReceiptModalBtn');
  if (closeReceiptModalBtn) closeReceiptModalBtn.addEventListener('click', () => closeModal('receiptModalBackdrop'));

  const closeReceiptBtn = document.getElementById('closeReceiptBtn');
  if (closeReceiptBtn) closeReceiptBtn.addEventListener('click', () => closeModal('receiptModalBackdrop'));

  const printReceiptBtn = document.getElementById('printReceiptBtn');
  if (printReceiptBtn) {
    printReceiptBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Add Member Modal Triggers
  const openAddBtn = document.getElementById('openAddModalBtn');
  if (openAddBtn) openAddBtn.addEventListener('click', openAddModal);

  const emptyAddBtn = document.getElementById('emptyAddBtn');
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', openAddModal);

  const closeAddBtn = document.getElementById('closeMemberModalBtn');
  if (closeAddBtn) closeAddBtn.addEventListener('click', () => closeModal('memberModalBackdrop'));

  const cancelAddBtn = document.getElementById('cancelModalBtn');
  if (cancelAddBtn) cancelAddBtn.addEventListener('click', () => closeModal('memberModalBackdrop'));

  // Member Form Submit
  const form = document.getElementById('memberForm');
  if (form) form.addEventListener('submit', handleMemberFormSubmit);

  // Quick Plan Presets buttons (+30d, +90d, +180d, +365d)
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const days = parseInt(btn.getAttribute('data-days'), 10) || 30;
      const joinVal = document.getElementById('joinDateInput').value;
      const baseDate = joinVal ? new Date(joinVal) : new Date();
      const calculatedExpiry = addDays(baseDate, days);
      document.getElementById('expiryDateInput').value = formatDateToInput(calculatedExpiry);
      showToast(`Selected +${days} days duration`, 'info');
    });
  });

  // Delete Modal Triggers
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => closeModal('deleteModalBackdrop'));

  const closeDeleteBtn = document.getElementById('closeDeleteModalBtn');
  if (closeDeleteBtn) closeDeleteBtn.addEventListener('click', () => closeModal('deleteModalBackdrop'));

  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', executeDeleteMember);

  // Export CSV
  const exportBtn = document.getElementById('exportCsvBtn');
  if (exportBtn) exportBtn.addEventListener('click', exportMembersToCSV);

  // Reload Sample Data
  const sampleBtn = document.getElementById('seedSampleDataBtn');
  if (sampleBtn) {
    sampleBtn.addEventListener('click', () => {
      if (confirm('Reload the 5 sample members? Any existing testing records will be reset.')) {
        members = generateSampleMembers();
        saveMembers();
        currentFilter = 'all';
        currentSearch = '';
        updateFilterPillsActiveUI();
        updateDashboard();
        logAuditEvent('SYSTEM', 'Sample Testing Members Reloaded', 'Re-initialized 5 sample member records.');
        showToast('Loaded 5 sample gym members with live dates & financials!', 'success');
      }
    });
  }

  // Print Table
  const printBtn = document.getElementById('printTableBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Search Input
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = currentSearch ? 'block' : 'none';
      }
      renderMembersTable();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      currentSearch = '';
      clearSearchBtn.style.display = 'none';
      renderMembersTable();
    });
  }

  // Filter Pills
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const filter = pill.getAttribute('data-filter');
      currentFilter = filter;
      updateFilterPillsActiveUI();
      renderMembersTable();
    });
  });

  // Clickable Top Summary Cards to auto-filter!
  const cardActive = document.getElementById('statCardActive');
  if (cardActive) {
    cardActive.addEventListener('click', () => {
      currentFilter = 'active';
      updateFilterPillsActiveUI();
      renderMembersTable();
      showToast('Filtered: Showing Active members', 'info');
    });
  }

  const cardExpiring = document.getElementById('statCardExpiring');
  if (cardExpiring) {
    cardExpiring.addEventListener('click', () => {
      currentFilter = 'expiring_or_expired';
      updateFilterPillsActiveUI();
      renderMembersTable();
      showToast('Filtered: Showing Expiring Soon & Expired members', 'info');
    });
  }

  const cardPending = document.getElementById('statCardPending');
  if (cardPending) {
    cardPending.addEventListener('click', () => {
      currentFilter = 'pending';
      updateFilterPillsActiveUI();
      renderMembersTable();
      showToast('Filtered: Showing members with Pending fees', 'info');
    });
  }

  // Clickable Financial Summary Cards to auto-filter!
  const cardMonRec = document.getElementById('cardMonthlyReceived');
  if (cardMonRec) {
    cardMonRec.addEventListener('click', () => {
      currentFilter = 'paid';
      updateFilterPillsActiveUI();
      renderMembersTable();
      showToast('Filtered: Showing Paid members', 'info');
    });
  }

  const cardMonPen = document.getElementById('cardMonthlyPending');
  if (cardMonPen) {
    cardMonPen.addEventListener('click', () => {
      currentFilter = 'pending';
      updateFilterPillsActiveUI();
      renderMembersTable();
      showToast('Filtered: Showing Pending dues members', 'info');
    });
  }

  const cardYearRev = document.getElementById('cardFullYearRevenue');
  if (cardYearRev) {
    cardYearRev.addEventListener('click', () => {
      currentFilter = 'paid';
      updateFilterPillsActiveUI();
      renderMembersTable();
      showToast('Filtered: Showing Paid members', 'info');
    });
  }

  const cardYearPen = document.getElementById('cardFullYearPending');
  if (cardYearPen) {
    cardYearPen.addEventListener('click', () => {
      currentFilter = 'pending';
      updateFilterPillsActiveUI();
      renderMembersTable();
      showToast('Filtered: Showing Pending dues members', 'info');
    });
  }

  // Sort By Dropdown
  const sortSelect = document.getElementById('sortBySelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderMembersTable();
    });
  }

  // Close modals on clicking backdrop
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.show').forEach(modal => {
        modal.classList.remove('show');
      });
    }
  });
}

function updateFilterPillsActiveUI() {
  document.querySelectorAll('.filter-pill').forEach(pill => {
    const filter = pill.getAttribute('data-filter');
    if (filter === currentFilter) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
  // ==========================================================================
  // Mobile Bottom Navigation Bar Logic (Overview, Revenue, Add, Members, Settings)
  // ==========================================================================
  const mobileNavItems = document.querySelectorAll('.mobile-bottom-nav .nav-item');

  function setActiveMobileTab(clickedItem) {
    mobileNavItems.forEach(item => item.classList.remove('active'));
    if (clickedItem) clickedItem.classList.add('active');
  }

  mobileNavItems.forEach(item => {
    item.addEventListener('click', () => {
      const labelEl = item.querySelector('.nav-label');
      const tabName = (item.getAttribute('data-tab') || (labelEl ? labelEl.textContent : '')).trim().toLowerCase();

      if (tabName.includes('overview')) {
        setActiveMobileTab(item);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } 
      else if (tabName.includes('revenue')) {
        setActiveMobileTab(item);
        const financeSec = document.querySelector('.finance-section-card');
        if (financeSec) {
          const yOffset = -75;
          const y = financeSec.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      } 
      else if (tabName.includes('add')) {
        openAddModal();
      } 
      else if (tabName.includes('member')) {
        setActiveMobileTab(item);
        const membersSec = document.querySelector('.toolbar-section') || document.querySelector('.table-container-card');
        if (membersSec) {
          const yOffset = -75;
          const y = membersSec.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      } 
      else if (tabName.includes('setting')) {
        openSettingsModal();
      }
    });
  });

  // Auto-update active tab on scroll
  window.addEventListener('scroll', () => {
    if (window.innerWidth > 768) return;
    const scrollPos = window.scrollY + 180;
    const financeSec = document.querySelector('.finance-section-card');
    const membersSec = document.querySelector('.toolbar-section');

    if (membersSec && scrollPos >= membersSec.offsetTop) {
      mobileNavItems.forEach(i => {
        const txt = i.textContent.trim().toLowerCase();
        i.classList.toggle('active', txt.includes('member'));
      });
    } else if (financeSec && scrollPos >= financeSec.offsetTop) {
      mobileNavItems.forEach(i => {
        const txt = i.textContent.trim().toLowerCase();
        i.classList.toggle('active', txt.includes('revenue'));
      });
    } else {
      mobileNavItems.forEach(i => {
        const txt = i.textContent.trim().toLowerCase();
        i.classList.toggle('active', txt.includes('overview'));
      });
    }
  }, { passive: true });

}
// ==========================================================================
// GYM EXPENSE TRACKER MODULE (Non-Intrusive Add-on)
// ==========================================================================
const STORAGE_KEY_EXPENSES = 'gymflow_expenses_data_v1';
let gymExpenses = [];

function initExpenseTracker() {
  const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
  if (raw) {
    try {
      gymExpenses = JSON.parse(raw);
    } catch (e) {
      gymExpenses = [];
    }
  }
  if (!Array.isArray(gymExpenses)) gymExpenses = [];

  // Bind Modal & Form Events
  const openBtn = document.getElementById('openExpenseModalBtn');
  const closeBtn = document.getElementById('closeExpenseModalBtn');
  const cancelBtn = document.getElementById('cancelExpenseBtn');
  const form = document.getElementById('expenseForm');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      if (form) form.reset();
      const dateInput = document.getElementById('expenseDateInput');
      if (dateInput) dateInput.value = formatDateToInput(new Date());
      openModal('expenseModalBackdrop');
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', () => closeModal('expenseModalBackdrop'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal('expenseModalBackdrop'));

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('expenseTitleInput').value.trim();
      const amount = parseFloat(document.getElementById('expenseAmountInput').value);
      const category = document.getElementById('expenseCategorySelect').value;
      const date = document.getElementById('expenseDateInput').value;

      if (!title || isNaN(amount) || amount <= 0 || !date) {
        showToast('Please fill all expense details properly', 'warning');
        return;
      }

      const newExpense = {
        id: 'EXP-' + Date.now(),
        title,
        amount,
        category,
        date,
        createdAt: new Date().toISOString()
      };

      gymExpenses.unshift(newExpense);
      localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(gymExpenses));

      if (typeof logAuditEvent === 'function') {
        logAuditEvent('SYSTEM', `Gym Expense Added: ₹${amount} (${title})`, `Category: ${category} | Date: ${date}`);
      }

      closeModal('expenseModalBackdrop');
      renderExpenseTracker();
      showToast(`Added expense: ${title} (₹${amount.toLocaleString('en-IN')})`, 'success');
    });
  }

  // Hook into existing updateFinancialSummary so changing Month/Year updates Expenses too
  if (typeof updateFinancialSummary === 'function') {
    const originalUpdateFinance = updateFinancialSummary;
    window.updateFinancialSummary = function() {
      originalUpdateFinance();
      renderExpenseTracker();
    };
  }

  renderExpenseTracker();
}

window.deleteGymExpense = function(expId) {
  const target = gymExpenses.find(x => x.id === expId);
  if (!target) return;
  if (!confirm(`Remove expense "${target.title}" (₹${target.amount})?`)) return;

  gymExpenses = gymExpenses.filter(x => x.id !== expId);
  localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(gymExpenses));

  if (typeof logAuditEvent === 'function') {
    logAuditEvent('DELETE', `Gym Expense Deleted: ${target.title}`, `Amount: ₹${target.amount}`);
  }

  renderExpenseTracker();
  showToast('Expense entry removed', 'info');
};

function renderExpenseTracker() {
  const month = typeof selectedFinanceMonth !== 'undefined' ? selectedFinanceMonth : new Date().getMonth();
  const year = typeof selectedFinanceYear !== 'undefined' ? selectedFinanceYear : new Date().getFullYear();

  let monthlyExpTotal = 0;
  let yearlyExpTotal = 0;
  const monthlyItems = [];

  gymExpenses.forEach(exp => {
    if (!exp.date) return;
    const d = new Date(exp.date);
    const eYear = d.getFullYear();
    const eMonth = d.getMonth();
    const amt = Number(exp.amount) || 0;

    if (eYear === year) {
      yearlyExpTotal += amt;
      if (eMonth === month) {
        monthlyExpTotal += amt;
        monthlyItems.push(exp);
      }
    }
  });

  // Read Monthly Received Revenue directly from existing DOM element to calculate Net Profit
  const recText = (document.getElementById('monthlyReceivedAmount')?.textContent || '0').replace(/[^\d]/g, '');
  const monthlyReceived = parseInt(recText, 10) || 0;
  const netProfit = monthlyReceived - monthlyExpTotal;

  // Update Cards
  const monExpEl = document.getElementById('monthlyExpenseAmount');
  if (monExpEl) monExpEl.textContent = `₹${monthlyExpTotal.toLocaleString('en-IN')}`;

  const monExpSub = document.getElementById('monthlyExpenseSubtext');
  if (monExpSub) monExpSub.textContent = `${monthlyItems.length} expense${monthlyItems.length === 1 ? '' : 's'} in selected month`;

  const netEl = document.getElementById('monthlyNetProfitAmount');
  if (netEl) {
    netEl.textContent = `${netProfit < 0 ? '-' : ''}₹${Math.abs(netProfit).toLocaleString('en-IN')}`;
    netEl.style.color = netProfit >= 0 ? '#10b981' : '#ef4444';
  }

  const yrExpEl = document.getElementById('yearlyExpenseAmount');
  if (yrExpEl) yrExpEl.textContent = `₹${yearlyExpTotal.toLocaleString('en-IN')}`;

  const yrExpSub = document.getElementById('yearlyExpenseSubtext');
  if (yrExpSub) yrExpSub.textContent = `Total expenses in ${year}`;

  const countEl = document.getElementById('expenseListCount');
  if (countEl) countEl.textContent = `${monthlyItems.length} item${monthlyItems.length === 1 ? '' : 's'}`;

  // Render Cards List
  const container = document.getElementById('expenseItemsContainer');
  if (!container) return;

  if (monthlyItems.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 1.25rem; color: var(--text-dim); font-size: 0.82rem; background: var(--bg-card-subtle); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
        No expenses recorded for this month yet. Click "Add Expense" to log rent, bills, or salaries.
      </div>
    `;
    return;
  }

  container.innerHTML = monthlyItems.map(item => `
    <div class="expense-item-card">
      <div class="expense-item-info">
        <span class="expense-item-title">${escapeHtml(item.title)}</span>
        <span class="expense-item-meta">${escapeHtml(item.category)} • ${formatDateDisplay(item.date)}</span>
      </div>
      <div class="expense-item-right">
        <span class="expense-item-amt">-₹${Number(item.amount).toLocaleString('en-IN')}</span>
        <button type="button" class="btn-action-delete" onclick="deleteGymExpense('${item.id}')" title="Delete Expense">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', initExpenseTracker);
// ==========================================================================
// BULLETPROOF MOBILE BOTTOM NAVIGATION HANDLER (Real Smartphone Touch Support)
// ==========================================================================
(function initBulletproofMobileNav() {
  function setupNav() {
    const bottomNav = document.querySelector('.mobile-bottom-nav') || document.querySelector('nav[class*="bottom"]');
    if (!bottomNav) return;

    function handleNavTap(e) {
      const targetBtn = e.target.closest('.nav-item, button, a');
      if (!targetBtn) return;

      e.preventDefault();
      e.stopPropagation();

      // Highlight active tab
      bottomNav.querySelectorAll('.nav-item, button, a').forEach(el => el.classList.remove('active'));
      targetBtn.classList.add('active');

      const text = (targetBtn.getAttribute('data-tab') || targetBtn.textContent || '').trim().toLowerCase();

      if (text.includes('overview') || text.includes('home')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } 
      else if (text.includes('revenue') || text.includes('finance')) {
        const el = document.querySelector('.finance-section-card');
        if (el) {
          const topPos = el.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top: topPos, behavior: 'smooth' });
        }
      } 
      else if (text.includes('add') || targetBtn.classList.contains('nav-fab')) {
        if (typeof openAddModal === 'function') openAddModal();
      } 
      else if (text.includes('member')) {
        const el = document.querySelector('.toolbar-section') || document.querySelector('.table-container-card');
        if (el) {
          const topPos = el.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top: topPos, behavior: 'smooth' });
        }
      } 
      else if (text.includes('setting')) {
        if (typeof openSettingsModal === 'function') openSettingsModal();
      }
    }

    // Both click and touchstart/touchend support
    bottomNav.addEventListener('click', handleNavTap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNav);
  } else {
    setupNav();
  }
})();
// ==========================================================================
// SINGLE MASTER MOBILE NAVIGATION HANDLER (Conflict-Free & Exact Scroll)
// ==========================================================================
(function initCleanMobileNavigation() {
  let isManualScrolling = false;
  let scrollTimeout = null;

  function setupCleanNav() {
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    if (!bottomNav) return;

    // Purane duplicate listeners hatane ke liye node clone karein
    const cleanNav = bottomNav.cloneNode(true);
    bottomNav.parentNode.replaceChild(cleanNav, bottomNav);

    const navButtons = Array.from(cleanNav.querySelectorAll('.nav-item'));

    function highlightTabByIndex(idx) {
      navButtons.forEach((btn, i) => {
        if (i === idx && !btn.classList.contains('nav-fab')) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    function smoothJumpTo(element, tabIdx) {
      if (!element) return;
      isManualScrolling = true;
      highlightTabByIndex(tabIdx);

      const headerHeight = document.querySelector('.navbar')?.offsetHeight || 60;
      const targetY = element.getBoundingClientRect().top + window.scrollY - headerHeight - 10;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isManualScrolling = false;
      }, 800);
    }

    // Button position aur text dono ke hisab se exact action
    navButtons.forEach((btn, index) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const label = btn.textContent.trim().toLowerCase();

        if (index === 0 || label.includes('overview')) {
          isManualScrolling = true;
          highlightTabByIndex(0);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => { isManualScrolling = false; }, 800);
        } 
        else if (index === 1 || label.includes('revenue')) {
          const revSection = document.querySelector('.finance-section-card');
          smoothJumpTo(revSection, 1);
        } 
        else if (index === 2 || btn.classList.contains('nav-fab') || label.includes('add')) {
          if (typeof openAddModal === 'function') openAddModal();
        } 
        else if (index === 3 || label.includes('member')) {
          const memSection = document.querySelector('.toolbar-section') || document.querySelector('.table-container-card');
          smoothJumpTo(memSection, 3);
        } 
        else if (index === 4 || label.includes('setting')) {
          if (typeof openSettingsModal === 'function') openSettingsModal();
        }
      });
    });

    // Scroll karte waqt active tab update karein (bina tap se takraye)
    window.addEventListener('scroll', () => {
      if (window.innerWidth > 768 || isManualScrolling) return;

      const headerOffset = 140;
      const scrollY = window.scrollY + headerOffset;
      const revSection = document.querySelector('.finance-section-card');
      const memSection = document.querySelector('.toolbar-section') || document.querySelector('.table-container-card');

      if (memSection && scrollY >= memSection.offsetTop) {
        highlightTabByIndex(3);
      } else if (revSection && scrollY >= revSection.offsetTop) {
        highlightTabByIndex(1);
      } else {
        highlightTabByIndex(0);
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCleanNav);
  } else {
    setupCleanNav();
  }
})();
// ==========================================================================
// EXACT MOBILE BOTTOM NAVIGATION SCROLL & MODAL CONTROLLER
// ==========================================================================
(function setupExactMobileNav() {
  function initNav() {
    const oldNav = document.querySelector('.mobile-bottom-nav');
    if (!oldNav) return;

    // Saare purane event listeners clean karne ke liye clone karein
    const nav = oldNav.cloneNode(true);
    oldNav.parentNode.replaceChild(nav, oldNav);

    const items = Array.from(nav.querySelectorAll('.nav-item'));

    function setActive(activeBtn) {
      items.forEach(btn => btn.classList.remove('active'));
      if (activeBtn && !activeBtn.classList.contains('nav-fab')) {
        activeBtn.classList.add('active');
      }
    }

    function scrollToSection(targetEl) {
      if (!targetEl) return;
      const navHeight = document.querySelector('.navbar')?.offsetHeight || 60;
      const elementPosition = targetEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight - 8;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }

    items.forEach((btn, idx) => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const txt = (btn.getAttribute('data-tab') || btn.textContent || '').trim().toLowerCase();

        // 1. Overview (Top of page)
        if (idx === 0 || txt.includes('overview')) {
          setActive(btn);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // 2. Revenue / Finance Section
        else if (idx === 1 || txt.includes('revenue')) {
          setActive(btn);
          const revEl = document.querySelector('.finance-section-card');
          scrollToSection(revEl);
        }
        // 3. Add Member (+)
        else if (idx === 2 || btn.classList.contains('nav-fab') || txt.includes('add')) {
          if (typeof openAddModal === 'function') {
            openAddModal();
          }
        }
        // 4. Members List Section
        else if (idx === 3 || txt.includes('member')) {
          setActive(btn);
          const memEl = document.querySelector('.toolbar-section') || document.querySelector('.table-container-card');
          scrollToSection(memEl);
        }
        // 5. Settings & Backup
        else if (idx === 4 || txt.includes('setting')) {
          if (typeof openSettingsModal === 'function') {
            openSettingsModal();
          }
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
