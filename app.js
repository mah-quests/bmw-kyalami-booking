/* ===================================================================
   Kyalami Grand Prix Circuit — Booking App
   =================================================================== */

// ── DATA ────────────────────────────────────────────────────────────

const RACE_EVENTS = [
  {
    id: 'e01',
    title: 'BMW M Festival',
    series: 'BMW Club SA',
    date: '2026-07-18',
    dateDisplay: '18 July 2026',
    day: 'Saturday',
    availability: 'available',
    spotsLeft: 640,
  },
  {
    id: 'e02',
    title: 'SA Formula Regional — Round 4',
    series: 'Motorsport SA',
    date: '2026-07-25',
    dateDisplay: '25 July 2026',
    day: 'Saturday',
    availability: 'low',
    spotsLeft: 94,
  },
  {
    id: 'e03',
    title: 'Kyalami 9 Hour Endurance Race',
    series: 'Intercontinental GT Challenge',
    date: '2026-08-08',
    dateDisplay: '8 August 2026',
    day: 'Saturday',
    availability: 'available',
    spotsLeft: 1200,
  },
  {
    id: 'e04',
    title: 'Porsche Carrera Cup — Round 6',
    series: 'Porsche Motorsport',
    date: '2026-08-22',
    dateDisplay: '22 August 2026',
    day: 'Saturday',
    availability: 'available',
    spotsLeft: 780,
  },
  {
    id: 'e05',
    title: 'SA GT Challenge',
    series: 'Motorsport SA',
    date: '2026-09-12',
    dateDisplay: '12 September 2026',
    day: 'Saturday',
    availability: 'low',
    spotsLeft: 45,
  },
  {
    id: 'e06',
    title: 'Global Touring Cars — Round 5',
    series: 'GTC Series',
    date: '2026-09-26',
    dateDisplay: '26 September 2026',
    day: 'Saturday',
    availability: 'soldout',
    spotsLeft: 0,
  },
  {
    id: 'e07',
    title: 'Kyalami Summer Classic',
    series: 'Historic Racing SA',
    date: '2026-10-17',
    dateDisplay: '17 October 2026',
    day: 'Saturday',
    availability: 'available',
    spotsLeft: 920,
  },
  {
    id: 'e08',
    title: 'Season Finale — Mixed Masters',
    series: 'Motorsport SA',
    date: '2026-11-07',
    dateDisplay: '7 November 2026',
    day: 'Saturday',
    availability: 'available',
    spotsLeft: 1100,
  },
];

const TICKET_CATEGORIES = [
  {
    id: 'ga',
    name: 'General Admission',
    desc: 'Access to public grandstands and grass banks around the circuit.',
    price: 250,
    badgeColor: '#2e2e38',
    badgeText: '#9da1ab',
    badgeLabel: 'ENTRY',
  },
  {
    id: 'gs',
    name: 'Grandstand',
    desc: 'Reserved numbered seat in the main grandstand with great circuit views.',
    price: 450,
    badgeColor: 'rgba(28,105,212,.2)',
    badgeText: '#1c69d4',
    badgeLabel: 'SEATING',
  },
  {
    id: 'pc',
    name: 'Paddock Club',
    desc: 'Paddock access, pit lane walk, complimentary refreshments, and premium seating.',
    price: 950,
    badgeColor: 'rgba(227,6,19,.18)',
    badgeText: '#e30613',
    badgeLabel: 'PREMIUM',
  },
  {
    id: 'vip',
    name: 'VIP Suite',
    desc: 'Exclusive suite with fine dining, open bar, private terrace, and driver meet & greet.',
    price: 1800,
    badgeColor: 'rgba(250,190,0,.15)',
    badgeText: '#fabe00',
    badgeLabel: 'VIP',
  },
];

// ── STATE ────────────────────────────────────────────────────────────

const state = {
  currentStep: 1,
  selectedEvent: null,
  selectedTicket: null,
  quantity: 1,
  customer: { firstName: '', lastName: '', email: '', phone: '' },
};

// ── HELPERS ──────────────────────────────────────────────────────────

function fmt(amount) {
  return 'R ' + amount.toLocaleString('en-ZA');
}

function generateRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'KYL-';
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

// ── RENDER: RACE CARDS ───────────────────────────────────────────────

function renderRaceCards() {
  const grid = document.getElementById('race-grid');
  grid.innerHTML = '';

  RACE_EVENTS.forEach(ev => {
    const isSoldOut = ev.availability === 'soldout';
    const isLow     = ev.availability === 'low';

    const card = document.createElement('div');
    card.className = 'race-card' + (isSoldOut ? ' sold-out' : '');
    card.dataset.id = ev.id;

    const availHtml = isSoldOut
      ? `<span class="race-sold-out-badge">Sold Out</span>`
      : `<span class="race-avail${isLow ? ' low' : ''}">${isLow ? '⚠ ' : ''}${ev.spotsLeft.toLocaleString()} spots left</span>`;

    card.innerHTML = `
      <div class="race-date-badge">📅 ${ev.dateDisplay}</div>
      <div class="race-card-title">${ev.title}</div>
      <div class="race-card-series">${ev.series}</div>
      <div class="race-card-meta">
        ${availHtml}
        <div class="race-select-indicator"></div>
      </div>
    `;

    if (!isSoldOut) {
      card.addEventListener('click', () => selectRaceCard(ev.id));
    }

    grid.appendChild(card);
  });
}

function selectRaceCard(id) {
  state.selectedEvent = RACE_EVENTS.find(e => e.id === id);

  document.querySelectorAll('.race-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === id);
  });

  document.getElementById('step1-next').disabled = false;
}

// ── RENDER: TICKET CARDS ─────────────────────────────────────────────

function renderTicketCards() {
  const grid = document.getElementById('ticket-grid');
  grid.innerHTML = '';

  TICKET_CATEGORIES.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'ticket-card';
    card.dataset.id = cat.id;

    card.innerHTML = `
      <span class="ticket-badge"
        style="background:${cat.badgeColor};color:${cat.badgeText}">${cat.badgeLabel}</span>
      <div class="ticket-name">${cat.name}</div>
      <div class="ticket-desc">${cat.desc}</div>
      <div class="ticket-price">${fmt(cat.price)} <span>per person</span></div>
    `;

    card.addEventListener('click', () => selectTicketCard(cat.id));
    grid.appendChild(card);
  });
}

function selectTicketCard(id) {
  state.selectedTicket = TICKET_CATEGORIES.find(t => t.id === id);
  state.quantity = 1;

  document.querySelectorAll('.ticket-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === id);
  });

  document.getElementById('qty-display').textContent = 1;
  document.getElementById('step2-next').disabled = false;
  updateSubtotal();
}

function updateSubtotal() {
  if (!state.selectedTicket) return;
  const total = state.selectedTicket.price * state.quantity;
  document.getElementById('subtotal-display').textContent = fmt(total);
}

// ── RENDER: SELECTED EVENT BANNER ────────────────────────────────────

function renderEventBanner() {
  const ev = state.selectedEvent;
  const el = document.getElementById('selected-event-banner');
  el.innerHTML = `
    <div class="seb-icon">🏁</div>
    <div>
      <div class="seb-title">${ev.title}</div>
      <div class="seb-date">${ev.series} &middot; ${ev.dateDisplay}</div>
    </div>
  `;
}

// ── RENDER: SUMMARY ──────────────────────────────────────────────────

function renderSummary() {
  const ev  = state.selectedEvent;
  const cat = state.selectedTicket;
  const c   = state.customer;
  const total = cat.price * state.quantity;

  const card = document.getElementById('summary-card');
  card.innerHTML = `
    <div class="summary-section">
      <div class="summary-section-title">Event</div>
      <div class="summary-row">
        <span class="summary-key">Race</span>
        <span class="summary-value">${ev.title}</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Series</span>
        <span class="summary-value">${ev.series}</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Date</span>
        <span class="summary-value">${ev.dateDisplay}</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Venue</span>
        <span class="summary-value">Kyalami Grand Prix Circuit</span>
      </div>
    </div>

    <div class="summary-section">
      <div class="summary-section-title">Tickets</div>
      <div class="summary-row">
        <span class="summary-key">Category</span>
        <span class="summary-value">${cat.name}</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Quantity</span>
        <span class="summary-value">${state.quantity} ticket${state.quantity > 1 ? 's' : ''}</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Price per ticket</span>
        <span class="summary-value">${fmt(cat.price)}</span>
      </div>
    </div>

    <div class="summary-section">
      <div class="summary-section-title">Contact</div>
      <div class="summary-row">
        <span class="summary-key">Name</span>
        <span class="summary-value">${c.firstName} ${c.lastName}</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Email</span>
        <span class="summary-value">${c.email}</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Phone</span>
        <span class="summary-value">${c.phone}</span>
      </div>
    </div>

    <div class="summary-total-row">
      <span class="summary-total-label">Total Amount</span>
      <span class="summary-total-value">${fmt(total)}</span>
    </div>
  `;
}

// ── STEP NAVIGATION ──────────────────────────────────────────────────

function goToStep(n) {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`step-${n}`).classList.add('active');

  document.querySelectorAll('.progress-step').forEach(s => {
    const num = parseInt(s.dataset.step);
    s.classList.remove('active', 'completed');
    if (num === n) s.classList.add('active');
    else if (num < n) s.classList.add('completed');
  });

  document.querySelectorAll('.progress-line').forEach((line, i) => {
    line.classList.toggle('completed', i + 1 < n);
  });

  state.currentStep = n;
  window.scrollTo({ top: document.getElementById('booking').offsetTop - 80, behavior: 'smooth' });
}

// ── FORM VALIDATION ──────────────────────────────────────────────────

function validateDetails() {
  let valid = true;

  const fields = [
    { id: 'first-name', errId: 'err-first-name', label: 'First name', type: 'text' },
    { id: 'last-name',  errId: 'err-last-name',  label: 'Last name',  type: 'text' },
    { id: 'email',      errId: 'err-email',      label: 'Email',      type: 'email' },
    { id: 'phone',      errId: 'err-phone',      label: 'Phone',      type: 'phone' },
  ];

  fields.forEach(f => {
    const input = document.getElementById(f.id);
    const err   = document.getElementById(f.errId);
    const val   = input.value.trim();

    input.classList.remove('error');
    err.textContent = '';

    if (!val) {
      err.textContent = `${f.label} is required.`;
      input.classList.add('error');
      valid = false;
      return;
    }

    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      err.textContent = 'Please enter a valid email address.';
      input.classList.add('error');
      valid = false;
    }

    if (f.type === 'phone' && !/^[+\d\s\-()]{7,20}$/.test(val)) {
      err.textContent = 'Please enter a valid phone number.';
      input.classList.add('error');
      valid = false;
    }
  });

  if (valid) {
    state.customer.firstName = document.getElementById('first-name').value.trim();
    state.customer.lastName  = document.getElementById('last-name').value.trim();
    state.customer.email     = document.getElementById('email').value.trim();
    state.customer.phone     = document.getElementById('phone').value.trim();
  }

  return valid;
}

// ── QUANTITY CONTROLS ────────────────────────────────────────────────

document.getElementById('qty-minus').addEventListener('click', () => {
  if (state.quantity > 1) {
    state.quantity--;
    document.getElementById('qty-display').textContent = state.quantity;
    updateSubtotal();
  }
});

document.getElementById('qty-plus').addEventListener('click', () => {
  if (state.quantity < 10) {
    state.quantity++;
    document.getElementById('qty-display').textContent = state.quantity;
    updateSubtotal();
  }
});

// ── STEP BUTTONS ─────────────────────────────────────────────────────

document.getElementById('step1-next').addEventListener('click', () => {
  renderEventBanner();
  renderTicketCards();
  goToStep(2);
});

document.getElementById('step2-back').addEventListener('click', () => goToStep(1));
document.getElementById('step2-next').addEventListener('click', () => goToStep(3));

document.getElementById('step3-back').addEventListener('click', () => goToStep(2));
document.getElementById('step3-next').addEventListener('click', () => {
  if (validateDetails()) {
    renderSummary();
    goToStep(4);
  }
});

document.getElementById('step4-back').addEventListener('click', () => goToStep(3));
document.getElementById('step4-confirm').addEventListener('click', () => {
  const ref = generateRef();
  document.getElementById('modal-ref').textContent = `Booking Reference: ${ref}`;
  document.getElementById('modal-message').textContent =
    `${state.quantity} × ${state.selectedTicket.name} ticket${state.quantity > 1 ? 's' : ''} for ${state.selectedEvent.title} on ${state.selectedEvent.dateDisplay}.`;
  document.getElementById('modal-email').textContent = state.customer.email;
  document.getElementById('success-modal').classList.add('open');
});

// ── MODAL CLOSE / RESET ───────────────────────────────────────────────

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('success-modal').classList.remove('open');

  // Reset state
  state.selectedEvent  = null;
  state.selectedTicket = null;
  state.quantity       = 1;
  state.customer       = { firstName: '', lastName: '', email: '', phone: '' };

  // Reset form fields
  ['first-name','last-name','email','phone'].forEach(id => {
    const el = document.getElementById(id);
    el.value = '';
    el.classList.remove('error');
  });
  ['err-first-name','err-last-name','err-email','err-phone'].forEach(id => {
    document.getElementById(id).textContent = '';
  });

  document.getElementById('step1-next').disabled = true;
  document.getElementById('step2-next').disabled = true;
  document.getElementById('qty-display').textContent = '1';
  document.getElementById('subtotal-display').textContent = 'R 0';

  renderRaceCards();
  goToStep(1);
});

// ── INIT ──────────────────────────────────────────────────────────────

renderRaceCards();
