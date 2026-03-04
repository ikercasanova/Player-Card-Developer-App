'use strict';

/* ═══════════════════════════════════════════════════════════════
   card.js — buildCard(player) → DOM element
   A4 card (794 × 1123 px)
═══════════════════════════════════════════════════════════════ */

// ── Performance Test Benchmarks (US College Avg) ──────────────
// Sources documented in benchmarks-research.md
const BENCHMARKS = {
  cmjCm:        { label: 'CMJ',        unit: 'cm', benchmark: 36,   higherIsBetter: true,  min: 0,   max: 70  },
  broadJumpCm:  { label: 'BROAD JUMP', unit: 'cm', benchmark: 220,  higherIsBetter: true,  min: 0,   max: 300 },
  sprint30mSec: { label: '30M SPRINT', unit: 's',  benchmark: 4.25, higherIsBetter: false, min: 3.0, max: 6.0 },
  sprint40ydSec:{ label: '40YD DASH',  unit: 's',  benchmark: 4.85, higherIsBetter: false, min: 3.5, max: 6.5 },
};

function calcBarPercent(value, cfg) {
  if (value == null || value === '') return 0;
  const v = parseFloat(value);
  if (isNaN(v)) return 0;
  if (cfg.higherIsBetter) {
    // Higher = better → linear scale from min to max
    return Math.max(0, Math.min(100, ((v - cfg.min) / (cfg.max - cfg.min)) * 100));
  }
  // Lower = better (sprints) → invert so faster = longer bar
  return Math.max(0, Math.min(100, ((cfg.max - v) / (cfg.max - cfg.min)) * 100));
}

function calcBenchmarkPercent(cfg) {
  if (cfg.higherIsBetter) {
    return ((cfg.benchmark - cfg.min) / (cfg.max - cfg.min)) * 100;
  }
  return ((cfg.max - cfg.benchmark) / (cfg.max - cfg.min)) * 100;
}

function buildTestsHTML(tests) {
  const legend = `<div class="test-bars-legend">
    <span class="test-legend-item"><span class="test-legend-swatch" style="background:#ED1C24"></span>Player</span>
    <span class="test-legend-item"><span class="test-legend-swatch" style="background:#888"></span>US College Avg</span>
  </div>`;

  const rows = Object.entries(BENCHMARKS).map(([key, cfg]) => {
    const raw = tests[key];
    const hasValue = raw != null && raw !== '' && !isNaN(parseFloat(raw));
    const displayVal = hasValue ? parseFloat(raw) + ' ' + cfg.unit : '—';
    const barPct = hasValue ? calcBarPercent(raw, cfg) : 0;
    const benchPct = calcBenchmarkPercent(cfg);

    return `<div class="test-bar-row">
      <div class="test-bar-label">${cfg.label}</div>
      <div class="test-bar-value">${displayVal}</div>
      <div class="test-bar-track">
        <div class="test-bar-fill" style="width:${barPct.toFixed(1)}%"></div>
        <div class="test-bar-benchmark" style="left:${benchPct.toFixed(1)}%"></div>
      </div>
      <div class="test-bar-bench-val">${cfg.benchmark} ${cfg.unit}</div>
    </div>`;
  }).join('');

  return legend + rows;
}


// ── FC Köln Football School logo — official image ─────────────
// Located at assets/logos/koln-fs.webp
const FCK_LOGO_IMG = `<img src="assets/logos/koln-fs.webp" class="card-fck-logo" alt="1. FC Köln Football School">`;

// ── Unit conversions ──────────────────────────────────────────

function cmToFtIn(cm) {
  if (!cm) return '—';
  const totalInches = Math.round(cm / 2.54); // round total first to avoid 5'12"
  const ft = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
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

function calcAge(dateStr) {
  if (!dateStr) return null;
  const dob = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function val(v) {
  return (v !== undefined && v !== null && v !== '') ? v : '—';
}


// ── YouTube Thumbnail ─────────────────────────────────────────

function getYouTubeInfo(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (match) return { thumb: `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`, url };
  return null;
}

function buildVideosHTML(urls, playerName) {
  const url1 = urls?.[0]?.trim() || '';
  const url2 = urls?.[1]?.trim() || '';
  const name = (playerName || '').toUpperCase();

  if (!url1 && !url2) {
    return `<div class="card-no-videos">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="5" width="22" height="16" rx="2" stroke="#ddd" stroke-width="1.5" fill="none"/>
        <path d="M23 11l7-4v14l-7-4V11z" stroke="#ddd" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
      </svg>
      <span>No video links added</span>
    </div>`;
  }

  let html = '';

  // Slot 1: Highlight Video
  if (url1) {
    const yt = getYouTubeInfo(url1);
    if (yt) {
      html += `<div class="card-video-item" data-url="${url1}">
          <img src="${yt.thumb}" class="card-video-thumb" alt="Highlight Video"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="card-video-thumb-gen" style="display:none">
            <div class="card-video-thumb-icon">&#9654;</div>
            <div class="card-video-thumb-gen-title">HIGHLIGHT</div>
            <div class="card-video-thumb-gen-name">${name}</div>
          </div>
          <div class="card-video-label">&#9654; Highlight Video</div>
        </div>`;
    } else {
      html += `<div class="card-video-item" data-url="${url1}">
          <div class="card-video-thumb-gen">
            <div class="card-video-thumb-icon">&#9654;</div>
            <div class="card-video-thumb-gen-title">HIGHLIGHT</div>
            <div class="card-video-thumb-gen-name">${name}</div>
          </div>
          <div class="card-video-label" title="${url1}">&#9654; Highlight Video</div>
        </div>`;
    }
  }

  // Slot 2: Full Game
  if (url2) {
    const isVeo = /app\.veo\.co/i.test(url2);
    html += `<div class="card-video-item" data-url="${url2}">
        <div class="card-video-thumb-gen card-video-thumb-gen--game">
          <div class="card-video-thumb-icon">&#9654;</div>
          <div class="card-video-thumb-gen-title">FULL GAME</div>
          <div class="card-video-thumb-gen-name">${name}</div>
          ${isVeo ? '<div class="card-video-thumb-gen-source">veo</div>' : ''}
        </div>
        <div class="card-video-label" title="${url2}">&#9654; Full Game${isVeo ? ' · Veo' : ''}</div>
      </div>`;
  }

  return html;
}

function buildPositionPills(positions) {
  if (!positions || !positions.length) return '';
  return positions.map((p, i) => {
    const code = typeof p === 'string' ? p : p.code;
    return `<span class="card-pos-pill ${i === 0 ? 'card-pos-pill-primary' : 'card-pos-pill-secondary'}">${code}</span>`;
  }).join('');
}

// ── Player Archetype Banner ──────────────────────────────────

function buildArchetypeBanner(player) {
  const arch = getPlayerArchetype(player.strengths);
  if (!arch) return '';

  return `<div class="card-archetype-banner">
    <div class="card-archetype-inner">
      <div class="card-archetype-name">${arch.name}</div>
      <div class="card-archetype-cats">${arch.categories.join(' · ')}</div>
    </div>
  </div>`;
}

// ── Main buildCard ────────────────────────────────────────────

function buildCard(player) {
  const card = document.createElement('div');
  card.className = 'player-card';


  // Partner logo: shown at bottom of contact cell
  const partnerLogoContactHTML = player.partnerLogoBase64
    ? `<div class="card-partner-in-contact">
        <span class="partner-contact-label">PARTNER</span>
        <img src="${player.partnerLogoBase64}" class="partner-contact-logo" alt="Partner Logo">
       </div>`
    : '';

  const posY = player.photoPositionY != null ? player.photoPositionY : 0;
  const photoContent = player.photoBase64
    ? `<img src="${player.photoBase64}" class="card-photo" alt="Player Photo" style="object-position: center ${posY}%">`
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
      <div class="card-header-badge">${FCK_LOGO_IMG}</div>
      <div class="card-header-center">
        <div class="card-program-name">1. FC KÖLN — INTERNATIONAL TALENT PATHWAY</div>
        <div class="card-player-name-wrap">
          <div class="card-player-name">${player.firstName ? player.firstName.toUpperCase() : ''} ${player.lastName ? player.lastName.toUpperCase() : ''}</div>
        </div>
      </div>
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
          <tr><td class="info-label">Height</td><td class="info-value">${formatHeight(player.heightCm)}</td></tr>
          <tr><td class="info-label">Weight</td><td class="info-value">${formatWeight(player.weightKg)}</td></tr>
          <tr><td class="info-label">Pref. Foot</td><td class="info-value">${val(player.foot)}</td></tr>
        </table>
        ${pills ? `<div class="card-position-display">
          <span class="info-label">Position</span>
          <div class="card-position-badges">${pills}</div>
        </div>` : ''}
      </div>
      <div class="card-contact-cell">
        <div class="card-section-title">CONTACT</div>
        <div class="card-contact-name">Max Bisinger</div>
        <div class="card-contact-role">ITP Coordinator</div>
        <div class="card-contact-org">1. FC Köln Football School</div>
        <div class="card-contact-org">International Talent Pathway</div>
        ${partnerLogoContactHTML}
      </div>
    </div>

    <!-- ── 3. PERFORMANCE TESTS ────────────────────────────── -->
    <div class="card-section-block card-tests-block">
      <div class="card-section-title">PERFORMANCE TESTS</div>
      ${buildTestsHTML(tests)}
    </div>

    <!-- ── 5. PLAYER PROFILE ──────────────────────────────── -->
    <div class="card-section-block card-about-block">
      <div class="card-section-title">PLAYER PROFILE</div>
      <div class="card-about-inner">
        <div class="card-strengths-col">
          <div class="card-col-heading">KEY STRENGTHS</div>
          ${player.strengths && player.strengths.length
            ? `<ul class="card-strengths-list">${buildStrengthBullets(player.strengths).map(s =>
                `<li class="card-strength-item">${s}</li>`).join('')}</ul>`
            : '<span class="card-empty-dash">—</span>'}
        </div>
        <div class="card-style-col">
          <div class="card-col-heading">PLAYING STYLE</div>
          <div class="card-about-text">${player.playingStyle
            ? player.playingStyle.replace(/\n/g, '<br>')
            : '<span class="card-empty-dash">—</span>'}</div>
        </div>
      </div>
    </div>

    <!-- ── 5b. ARCHETYPE BANNER ─────────────────────────────── -->
    ${buildArchetypeBanner(player)}

    <!-- ── 6. BOTTOM ROW ───────────────────────────────────── -->
    <div class="card-bottom-row">
      <div class="card-videos-cell">
        <div class="card-section-title">VIDEOS</div>
        <div class="card-videos-content">${buildVideosHTML(player.videoUrls, `${player.firstName || ''} ${player.lastName || ''}`.trim())}</div>
        ${(player.videoUrls?.[0]?.trim() || player.videoUrls?.[1]?.trim())
          ? '<div class="card-videos-hint">Download PDF and click on video to watch</div>'
          : ''}
      </div>
    </div>

    <!-- ── 7. FOOTER ───────────────────────────────────────── -->
    <div class="card-footer">
      <span>1. FC KÖLN INTERNATIONAL TALENT PATHWAY — PLAYER PROFILE</span>
    </div>
  `;

  return card;
}
