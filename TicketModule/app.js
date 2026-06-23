'use strict';

// ── USER STORE (in-memory) ─────────────────────────────────
const users = [
  { id: 1, name: 'Demo Buyer',    email: 'buyer@demo.com',    password: 'pass123', role: 'buyer' },
  { id: 2, name: 'Demo Reseller', email: 'reseller@demo.com', password: 'pass123', role: 'reseller' }
];

// ── STATE ──────────────────────────────────────────────────
const state = {
  currentUser: null,
  events: [
    {
      id: 1,
      name: 'BMW M Power Race Day',
      date: '18 Jul 2026',
      venue: 'Kyalami Circuit, Johannesburg',
      category: 'Race',
      capacity: 60,
      sold: { kaylami: 22, partnerA: 16, partnerB: 10 },
      listed: 12,
      paused: false
    },
    {
      id: 2,
      name: 'BMW Driving Experience',
      date: '22 Aug 2026',
      venue: 'Kyalami Circuit, Johannesburg',
      category: 'Training',
      capacity: 40,
      sold: { kaylami: 10, partnerA: 7, partnerB: 2 },
      listed: 18,
      paused: false
    },
    {
      id: 3,
      name: 'BMW M Festival 2026',
      date: '10 Oct 2026',
      venue: 'Kyalami Circuit, Johannesburg',
      category: 'Race',
      capacity: 50,
      sold: { kaylami: 14, partnerA: 10, partnerB: 8 },
      listed: 16,
      paused: false
    }
  ],
  alerts: [],
  lastSync: null
};

// ── HELPERS ────────────────────────────────────────────────
const totalSold   = e => e.sold.kaylami + e.sold.partnerA + e.sold.partnerB;
const available   = e => e.capacity - totalSold(e);
const pct         = e => Math.min(100, Math.round((totalSold(e) / e.capacity) * 100));
const statusOf    = e => available(e) === 0 ? 'sold-out' : pct(e) >= 80 ? 'limited' : 'available';
const labelOf     = e => available(e) === 0 ? 'Sold Out' : pct(e) >= 80 ? 'Limited' : 'Available';
const genTicketId = () => 'BMW-' + Math.random().toString(36).substr(2, 8).toUpperCase();
const initials    = name => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

// ══════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════

function login(email, password) {
  const user = users.find(u => u.email === email.trim().toLowerCase() && u.password === password);
  if (!user) return { ok: false, message: 'Incorrect email or password.' };
  state.currentUser = user;
  return { ok: true, user };
}

function register(name, email, password, role) {
  if (!name.trim())  return { ok: false, message: 'Please enter your full name.' };
  if (!email.trim()) return { ok: false, message: 'Please enter your email address.' };
  if (password.length < 6) return { ok: false, message: 'Password must be at least 6 characters.' };
  if (users.find(u => u.email === email.trim().toLowerCase())) {
    return { ok: false, message: 'An account with this email already exists.' };
  }
  const user = {
    id: users.length + 1,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role
  };
  users.push(user);
  state.currentUser = user;
  return { ok: true, user };
}

function logout() {
  state.currentUser = null;
  showAuthScreen();
}

// ── Auth screen transitions ────────────────────────────────
function showAuthScreen() {
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('appWrapper').classList.add('hidden');
  document.getElementById('loginEmail').value    = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').classList.add('hidden');
}

function showApp(user) {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appWrapper').classList.remove('hidden');

  // Render user pill in header
  document.getElementById('userPill').innerHTML = `
    <div class="user-avatar ${user.role}">${initials(user.name)}</div>
    <span class="user-name">${user.name}</span>
    <span class="user-role-tag ${user.role}">${user.role}</span>
  `;

  // Show the correct view for this role
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(user.role === 'buyer' ? 'buyerView' : 'resellerView')
          .classList.add('active');

  if (user.role === 'buyer') {
    renderBuyerView();
  } else {
    renderResellerView();
    checkAlerts();
  }
}

// ── Login form submit ──────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');

  const result = login(email, password);
  if (!result.ok) {
    errEl.textContent = result.message;
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');
  showApp(result.user);
});

// ── Register form submit ───────────────────────────────────
let selectedRole = 'buyer';

document.querySelectorAll('.role-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.role-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedRole = card.dataset.role;
  });
});

document.getElementById('registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const name     = document.getElementById('regName').value;
  const email    = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const errEl    = document.getElementById('registerError');

  const result = register(name, email, password, selectedRole);
  if (!result.ok) {
    errEl.textContent = result.message;
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');
  showApp(result.user);
});

// ── Auth tab switcher ──────────────────────────────────────
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.auth;
    document.getElementById('loginForm').classList.toggle('hidden',    target !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', target !== 'register');
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('registerError').classList.add('hidden');
  });
});

// ── Logout ─────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', logout);

// ══════════════════════════════════════════════════════════
// BUYER VIEW
// ══════════════════════════════════════════════════════════

function renderBuyerView() {
  document.getElementById('eventsGrid').innerHTML = state.events.map(e => {
    const status = statusOf(e);
    const avail  = available(e);
    return `
      <div class="event-card ${status === 'sold-out' ? 'dimmed' : ''}">
        <div class="event-card-header">
          <span class="category-badge ${e.category === 'Training' ? 'training' : ''}">${e.category === 'Training' ? '🎓' : '🏁'} ${e.category}</span>
          <span class="event-status-badge ${status}">${labelOf(e)}</span>
        </div>
        <h3>${e.name}</h3>
        <div class="event-meta">
          <span>📅 ${e.date}</span>
          <span>📍 ${e.venue}</span>
        </div>
        <button
          class="btn-buy ${status === 'sold-out' ? 'disabled' : ''}"
          onclick="initiatePurchase(${e.id})"
          ${status === 'sold-out' ? 'disabled' : ''}
        >${status === 'sold-out' ? 'Sold Out' : 'Book Ticket'}</button>
      </div>
    `;
  }).join('');
}

// ── Purchase flow ──────────────────────────────────────────
function initiatePurchase(eventId) {
  const event = state.events.find(e => e.id === eventId);
  if (!event) return;

  openModal(`
    <div class="purchase-flow">
      <h3>Booking: ${event.name}</h3>
      <div class="checks-list">
        <div class="check-item" id="chk1"><span class="check-icon">⏳</span><span>Capacity Guard: Validating event capacity...</span></div>
        <div class="check-item" id="chk2"><span class="check-icon">⏳</span><span>Inventory Sync: Checking partner availability...</span></div>
        <div class="check-item" id="chk3"><span class="check-icon">⏳</span><span>Pre-Registration: Registering with event...</span></div>
      </div>
      <div id="purchaseResult"></div>
    </div>
  `);

  setTimeout(() => {
    if (available(event) <= 0) {
      setCheck('chk1', 'fail', 'Capacity Guard: Event is at full capacity.');
      showPurchaseFail('No available tickets found across all platforms.');
      return;
    }
    setCheck('chk1', 'pass', 'Capacity Guard: Capacity confirmed.');

    setTimeout(() => {
      setCheck('chk2', 'pass', 'Inventory Sync: No duplicate sales detected across partners.');

      setTimeout(() => {
        setCheck('chk3', 'pass', 'Pre-Registration: You are now pre-registered for this event.');
        event.sold.kaylami += 1;

        setTimeout(() => {
          const ticketId = genTicketId();
          document.getElementById('purchaseResult').innerHTML = `
            <div class="confirmation-box">
              <div class="tick">✓</div>
              <h4>Booking Confirmed!</h4>
              <div class="ticket-details">
                <div><strong>Ticket ID:</strong> ${ticketId}</div>
                <div><strong>Event:</strong> ${event.name}</div>
                <div><strong>Type:</strong> ${event.category}</div>
                <div><strong>Date:</strong> ${event.date}</div>
                <div><strong>Venue:</strong> ${event.venue}</div>
                <div><strong>Booked by:</strong> ${state.currentUser.name}</div>
                <div><strong>Pre-Registration:</strong> <span class="badge-green">Complete</span></div>
              </div>
            </div>
          `;
          renderBuyerView();
          checkAlerts();
        }, 400);
      }, 900);
    }, 900);
  }, 900);
}

function setCheck(id, result, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `check-item ${result}`;
  el.querySelector('.check-icon').textContent = result === 'pass' ? '✓' : '✗';
  el.querySelector('span:last-child').textContent = text;
}

function showPurchaseFail(reason) {
  const el = document.getElementById('purchaseResult');
  if (!el) return;
  el.innerHTML = `
    <div class="fail-box">
      <div class="cross">✗</div>
      <h4>Booking Failed</h4>
      <p>${reason}</p>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════
// RESELLER VIEW
// ══════════════════════════════════════════════════════════

function renderResellerView() {
  renderStats();
  renderAlertFeed();
  renderTable();
}

function renderStats() {
  const activeAlerts = state.alerts.length;
  const totalListed  = state.events.reduce((s, e) => s + e.listed, 0);
  const activeCount  = state.events.filter(e => !e.paused).length;

  document.getElementById('dashboardStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${state.events.length}</div>
      <div class="stat-label">Total Events</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${totalListed}</div>
      <div class="stat-label">Tickets Listed</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${activeCount}</div>
      <div class="stat-label">Active Listings</div>
    </div>
    <div class="stat-card ${activeAlerts > 0 ? 'alert-card' : ''}">
      <div class="stat-number">${activeAlerts}</div>
      <div class="stat-label">Active Alerts</div>
    </div>
  `;
}

function renderAlertFeed() {
  document.getElementById('alertFeed').innerHTML = state.alerts.map(a => `
    <div class="alert-feed-item">
      <span class="alert-text">⚠️ ${a.message}</span>
      <button class="btn-alert-pause" onclick="pauseFromAlert(${a.eventId})">Pause Listing</button>
    </div>
  `).join('');
}

function renderTable() {
  const rows = state.events.map(e => {
    const sold   = totalSold(e);
    const avail  = available(e);
    const p      = pct(e);
    const status = statusOf(e);
    return `
      <tr>
        <td>
          <strong>${e.name}</strong>
          <br><small>${e.date} · ${e.category}</small>
        </td>
        <td>
          <div class="capacity-bar mini">
            <div class="capacity-fill ${status}" style="width:${p}%"></div>
          </div>
          <small>${sold}/${e.capacity} (${p}%)</small>
        </td>
        <td>${e.sold.kaylami}</td>
        <td>${e.sold.partnerA}</td>
        <td>${e.sold.partnerB}</td>
        <td>${e.listed}</td>
        <td>${avail}</td>
        <td><span class="status-pill ${e.paused ? 'paused' : 'active'}">${e.paused ? 'Paused' : 'Active'}</span></td>
        <td>
          <button class="btn-toggle ${e.paused ? 'btn-resume' : 'btn-pause'}" onclick="toggleListing(${e.id})">
            ${e.paused ? 'Resume' : 'Pause'}
          </button>
        </td>
      </tr>
    `;
  }).join('');

  document.getElementById('eventsTable').innerHTML = `
    <thead>
      <tr>
        <th>Event</th>
        <th>Capacity</th>
        <th>Kaylami</th>
        <th>Partner A</th>
        <th>Partner B</th>
        <th>Your Listings</th>
        <th>Available</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  `;
}

function toggleListing(eventId) {
  const event = state.events.find(e => e.id === eventId);
  if (!event) return;
  event.paused = !event.paused;
  checkAlerts();
  renderResellerView();
}

function pauseFromAlert(eventId) {
  const event = state.events.find(e => e.id === eventId);
  if (!event) return;
  event.paused = true;
  checkAlerts();
  renderResellerView();
}

// ══════════════════════════════════════════════════════════
// SHARED: ALERTS / SYNC
// ══════════════════════════════════════════════════════════

function checkAlerts() {
  state.alerts = state.events
    .filter(e => pct(e) >= 80 && !e.paused)
    .map(e => ({
      eventId: e.id,
      message: `${e.name} is at ${pct(e)}% capacity. Consider pausing your listings.`
    }));

  const bar = document.getElementById('alertBar');
  if (state.alerts.length === 0 || state.currentUser?.role !== 'reseller') {
    bar.classList.add('hidden');
  } else {
    bar.classList.remove('hidden');
    bar.innerHTML = state.alerts.map(a => `<div class="alert-item">⚠️ ${a.message}</div>`).join('');
  }
}

function runSync() {
  const dot  = document.getElementById('syncDot');
  const text = document.getElementById('syncText');
  dot.className = 'sync-dot syncing';
  text.textContent = 'Syncing partners...';

  setTimeout(() => {
    const candidates = state.events.filter(e => available(e) > 1);
    if (candidates.length) {
      const event   = candidates[Math.floor(Math.random() * candidates.length)];
      const partner = Math.random() < 0.5 ? 'partnerA' : 'partnerB';
      event.sold[partner] += 1;
    }

    state.lastSync = new Date();
    dot.className  = 'sync-dot synced';
    const t = state.lastSync;
    const pad = n => String(n).padStart(2, '0');
    text.textContent = `Last sync ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
    setTimeout(() => { dot.className = 'sync-dot'; }, 3000);

    if (state.currentUser?.role === 'buyer')    renderBuyerView();
    if (state.currentUser?.role === 'reseller') renderResellerView();
    checkAlerts();
  }, 1300);
}

// ── Modal ──────────────────────────────────────────────────
function openModal(html) {
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', closeModal);
document.getElementById('manualSync').addEventListener('click', runSync);

// ── Auto sync every 10s ────────────────────────────────────
setInterval(runSync, 10000);
