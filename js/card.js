'use strict';

/* ═══════════════════════════════════════════════════════════════
   card.js — buildCard(player) → DOM element
   A4 card (794 × 1123 px)
═══════════════════════════════════════════════════════════════ */

const POSITION_COORDS = {
  GK:  { cx: 50, cy: 138 },
  CB:  { cx: 50, cy: 115 },
  LB:  { cx: 20, cy: 108 },
  RB:  { cx: 80, cy: 108 },
  CDM: { cx: 50, cy: 90  },
  CM:  { cx: 50, cy: 75  },
  CAM: { cx: 50, cy: 58  },
  LW:  { cx: 18, cy: 50  },
  RW:  { cx: 82, cy: 50  },
  ST:  { cx: 50, cy: 30  }
};

// ── FC Köln Football School badge — always rendered inline ─────
// Replace this SVG when the official logo is available.
const FCK_BADGE_SVG = `
<svg width="56" height="68" viewBox="0 0 56 68" xmlns="http://www.w3.org/2000/svg">
  <!-- Shield outline -->
  <path d="M28 1 L55 13 L55 41 Q55 60 28 67 Q1 60 1 41 L1 13 Z" fill="white"/>
  <!-- Red fill -->
  <path d="M28 5 L51 16 L51 40 Q51 58 28 64 Q5 58 5 40 L5 16 Z" fill="#E3000F"/>
  <!-- White horizontal band -->
  <rect x="5" y="28" width="46" height="14" fill="white"/>
  <!-- FC KÖLN text -->
  <text x="28" y="38.5" text-anchor="middle" fill="#E3000F"
    font-size="10" font-weight="900" font-family="Arial,Helvetica,sans-serif">FC KÖLN</text>
  <!-- FOOTBALL SCHOOL (upper red zone) -->
  <text x="28" y="18" text-anchor="middle" fill="white"
    font-size="6" font-weight="800" font-family="Arial,Helvetica,sans-serif" letter-spacing="0.3">FOOTBALL</text>
  <text x="28" y="25.5" text-anchor="middle" fill="white"
    font-size="6" font-weight="800" font-family="Arial,Helvetica,sans-serif" letter-spacing="0.5">SCHOOL</text>
  <!-- ITP (lower red zone) -->
  <text x="28" y="51" text-anchor="middle" fill="white"
    font-size="7.5" font-weight="700" font-family="Arial,Helvetica,sans-serif" letter-spacing="1.5">ITP</text>
  <text x="28" y="59" text-anchor="middle" fill="rgba(255,255,255,0.82)"
    font-size="4" font-weight="600" font-family="Arial,Helvetica,sans-serif" letter-spacing="0.3">TALENT PATHWAY</text>
</svg>`;

// ── Unit conversions ──────────────────────────────────────────

function cmToFtIn(cm) {
  if (!cm) return '—';
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${ft}'${inches}"`;
}

function kgToLbs(kg) {
  if (!kg) return '—';
  return Math.round(kg * 2.205) + ' lbs';
}

function formatHeight(cm) {
  if (!cm) return '—';
  return `${cm} cm / ${cmToFtIn(cm)}`;
}

function formatWeight(kg) {
  if (!kg) return '—';
  return `${kg} kg / ${kgToLbs(kg)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function val(v) {
  return (v !== undefined && v !== null && v !== '') ? v : '—';
}

// ── Pitch SVG ─────────────────────────────────────────────────

function buildPitchSVG(positions) {
  const stripes = [0,1,2,3,4,5,6,7,8,9].map(i =>
    `<rect x="0" y="${i*15}" width="100" height="15" fill="${i%2===0 ? '#2d5a27' : '#336129'}"/>`
  ).join('');

  const markings = `
    ${stripes}
    <rect x="3" y="3" width="94" height="144" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
    <line x1="3" y1="75" x2="97" y2="75" stroke="rgba(255,255,255,0.7)" stroke-width="0.6"/>
    <circle cx="50" cy="75" r="12" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="0.6"/>
    <circle cx="50" cy="75" r="1" fill="rgba(255,255,255,0.7)"/>
    <rect x="22" y="3" width="56" height="27" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="0.6"/>
    <rect x="35" y="3" width="30" height="9" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="0.6"/>
    <circle cx="50" cy="21" r="1" fill="rgba(255,255,255,0.7)"/>
    <rect x="38" y="1" width="24" height="3" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="0.8"/>
    <rect x="22" y="120" width="56" height="27" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="0.6"/>
    <rect x="35" y="138" width="30" height="9" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="0.6"/>
    <circle cx="50" cy="129" r="1" fill="rgba(255,255,255,0.7)"/>
    <rect x="38" y="146" width="24" height="3" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="0.8"/>
  `;

  // Ghost markers
  const ghosts = Object.values(POSITION_COORDS).map(c =>
    `<circle cx="${c.cx}" cy="${c.cy}" r="4" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.22)" stroke-width="0.6"/>`
  ).join('');

  // Selected positions
  let selected = '';
  if (positions && positions.length > 0) {
    positions.forEach((pos, i) => {
      const c = POSITION_COORDS[pos.code];
      if (!c) return;
      if (i === 0) {
        selected += `
          <circle cx="${c.cx}" cy="${c.cy}" r="6" fill="#E3000F" stroke="white" stroke-width="1"/>
          <text x="${c.cx}" y="${c.cy + 0.5}" text-anchor="middle" dominant-baseline="middle"
            fill="white" font-size="3.5" font-weight="bold" font-family="Arial,sans-serif">${pos.code}</text>`;
      } else {
        selected += `
          <circle cx="${c.cx}" cy="${c.cy}" r="6" fill="rgba(227,0,15,0.18)" stroke="#E3000F" stroke-width="1"/>
          <text x="${c.cx}" y="${c.cy + 0.5}" text-anchor="middle" dominant-baseline="middle"
            fill="#ffcccc" font-size="3.5" font-weight="bold" font-family="Arial,sans-serif">${pos.code}</text>`;
      }
    });
  }

  return `<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">
    ${markings}${ghosts}${selected}
  </svg>`;
}

// ── YouTube Thumbnail ─────────────────────────────────────────

function getYouTubeInfo(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (match) return { thumb: `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`, url };
  return null;
}

function buildVideosHTML(urls) {
  if (!urls || !urls.filter(u => u && u.trim()).length) {
    return '<div class="card-no-content">No videos added</div>';
  }
  return urls.filter(u => u && u.trim()).map(url => {
    const yt = getYouTubeInfo(url);
    if (yt) {
      return `<div class="card-video-item">
          <img src="${yt.thumb}" class="card-video-thumb" alt="Video"
            onerror="this.style.display='none';this.nextElementSibling.textContent='▶ Watch Video'">
          <div class="card-video-label">▶ Watch Video</div>
        </div>`;
    }
    return `<div class="card-video-item"><div class="card-video-label" title="${url}">▶ ${url}</div></div>`;
  }).join('');
}

function buildPositionPills(positions) {
  if (!positions || !positions.length) return '';
  return positions.map((p, i) =>
    `<span class="card-pos-pill ${i === 0 ? 'card-pos-pill-primary' : 'card-pos-pill-secondary'}">${p.code}</span>`
  ).join('');
}

// ── Main buildCard ────────────────────────────────────────────

function buildCard(player) {
  const card = document.createElement('div');
  card.className = 'player-card';

  const jerseyWatermark = player.jerseyNumber
    ? `<span class="header-jersey-watermark">${player.jerseyNumber}</span>` : '';

  // Partner logo: wrapped in white box so it blends regardless of source image background
  const partnerLogoHTML = player.partnerLogoBase64
    ? `<div class="card-header-right">
        <div class="partner-logo-box">
          <img src="${player.partnerLogoBase64}" class="header-partner-logo" alt="Partner Logo">
        </div>
       </div>`
    : '';

  const photoContent = player.photoBase64
    ? `<img src="${player.photoBase64}" class="card-photo" alt="Player Photo">`
    : `<div class="card-photo-placeholder">
        <svg width="44" height="44" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="14" r="9" fill="#ccc"/>
          <path d="M4 38c0-8.8 7.2-16 16-16s16 7.2 16 16" fill="#ccc"/>
        </svg>
       </div>`;

  const tests = player.tests || {};
  const pills = buildPositionPills(player.positions);

  card.innerHTML = `
    <!-- ── 1. HEADER ───────────────────────────────────────── -->
    <div class="card-header">
      <div class="card-header-badge">${FCK_BADGE_SVG}</div>
      <div class="card-header-center">
        <div class="card-program-name">1. FC KÖLN — INTERNATIONAL TALENT PATHWAY</div>
        <div class="card-player-name-wrap">
          ${jerseyWatermark}
          <div class="card-player-name">${val(player.firstName)} <strong>${player.lastName ? player.lastName.toUpperCase() : ''}</strong></div>
        </div>
      </div>
      ${partnerLogoHTML}
    </div>

    <!-- ── 2. BIO ROW ──────────────────────────────────────── -->
    <div class="card-bio-row">
      <div class="card-photo-cell">
        <div class="card-photo-wrap">
          ${photoContent}
          <div class="card-photo-gradient"></div>
        </div>
      </div>
      <div class="card-overview-cell">
        <div class="card-section-title">OVERVIEW</div>
        <table class="card-info-table">
          <tr><td class="info-label">Nationality</td><td class="info-value">${val(player.nationality)}</td></tr>
          <tr><td class="info-label">Passport</td><td class="info-value">${val(player.passportCountry)}</td></tr>
          <tr><td class="info-label">Date of Birth</td><td class="info-value">${formatDate(player.dateOfBirth)}</td></tr>
        </table>
      </div>
      <div class="card-contact-cell">
        <div class="card-section-title">CONTACT</div>
        <div class="card-contact-name">Max Bisinger</div>
        <div class="card-contact-role">ITP Coordinator</div>
        <div class="card-contact-org">1. FC Köln Football School</div>
        <div class="card-contact-org">International Talent Pathway</div>
      </div>
    </div>

    <!-- ── 3. PLAYER INFORMATION ───────────────────────────── -->
    <div class="card-section-block">
      <div class="card-section-title">PLAYER INFORMATION</div>
      <table class="card-data-table">
        <thead><tr><th>HEIGHT</th><th>WEIGHT</th><th>PREFERRED FOOT</th></tr></thead>
        <tbody><tr>
          <td>${formatHeight(player.heightCm)}</td>
          <td>${formatWeight(player.weightKg)}</td>
          <td>${val(player.foot)}</td>
        </tr></tbody>
      </table>
    </div>

    <!-- ── 4. PERFORMANCE TESTS ────────────────────────────── -->
    <div class="card-section-block">
      <div class="card-section-title">PERFORMANCE TESTS</div>
      <table class="card-data-table">
        <thead><tr><th>CMJ</th><th>BROAD JUMP</th><th>5m</th><th>10m</th><th>30m</th><th>40YD</th></tr></thead>
        <tbody><tr>
          <td>${tests.cmjCm        ? tests.cmjCm + ' cm'       : '—'}</td>
          <td>${tests.broadJumpCm  ? tests.broadJumpCm + ' cm'  : '—'}</td>
          <td>${tests.sprint5mSec  ? tests.sprint5mSec + 's'    : '—'}</td>
          <td>${tests.sprint10mSec ? tests.sprint10mSec + 's'   : '—'}</td>
          <td>${tests.sprint30mSec ? tests.sprint30mSec + 's'   : '—'}</td>
          <td>${tests.sprint40ydSec? tests.sprint40ydSec + 's'  : '—'}</td>
        </tr></tbody>
      </table>
    </div>

    <!-- ── 5. ABOUT THE PLAYER ─────────────────────────────── -->
    <div class="card-section-block card-about-block">
      <div class="card-section-title">ABOUT THE PLAYER</div>
      <div class="card-about-text">${player.aboutText
        ? player.aboutText.replace(/\n/g, '<br>')
        : '<span style="color:#aaa;font-style:italic;">—</span>'}</div>
    </div>

    <!-- ── 6. BOTTOM ROW ───────────────────────────────────── -->
    <div class="card-bottom-row">
      <div class="card-videos-cell">
        <div class="card-section-title">VIDEOS</div>
        <div class="card-videos-content">${buildVideosHTML(player.videoUrls)}</div>
      </div>
      <div class="card-position-cell">
        <div class="card-section-title">POSITION</div>
        <div class="card-pitch-wrap">${buildPitchSVG(player.positions)}</div>
        ${pills ? `<div class="card-position-pills">${pills}</div>` : ''}
      </div>
    </div>

    <!-- ── 7. FOOTER ───────────────────────────────────────── -->
    <div class="card-footer">
      <span>1. FC KÖLN INTERNATIONAL TALENT PROGRAM — PLAYER PROFILE</span>
    </div>
  `;

  return card;
}
