'use strict';

/* ═══════════════════════════════════════════════════════════════
   form.js — Form load/read, image resize, pitch selector,
             live preview updates
═══════════════════════════════════════════════════════════════ */

const PITCH_POS_COORDS = {
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

const Form = {
  selectedPositions: [],   // [{rank, code}]
  photoBase64:       null,
  partnerLogoBase64: null,
  previewTimer:      null,

  // ── Initialization ────────────────────────────────────────

  init() {
    // Photo upload
    document.getElementById('f-photo').addEventListener('change', e => {
      if (e.target.files[0]) {
        Form.resizeImage(e.target.files[0], 800, b64 => {
          Form.photoBase64 = b64;
          const img = document.getElementById('photo-preview');
          img.src = b64;
          img.style.display = 'block';
          document.querySelector('#photo-upload-area .upload-placeholder').style.display = 'none';
          Form.schedulePreview();
        });
      }
    });

    // Partner logo upload
    document.getElementById('f-partnerLogo').addEventListener('change', e => {
      if (e.target.files[0]) {
        Form.resizeImage(e.target.files[0], 400, b64 => {
          Form.partnerLogoBase64 = b64;
          const img = document.getElementById('logo-preview');
          img.src = b64;
          img.style.display = 'block';
          document.querySelector('#logo-upload-area .upload-placeholder').style.display = 'none';
          document.getElementById('btn-clear-logo').style.display = 'inline-flex';
          Form.schedulePreview();
        });
      }
    });

    // Clear logo button
    document.getElementById('btn-clear-logo').addEventListener('click', () => {
      Form.partnerLogoBase64 = null;
      document.getElementById('logo-preview').style.display = 'none';
      document.getElementById('logo-preview').src = '';
      document.querySelector('#logo-upload-area .upload-placeholder').style.display = '';
      document.getElementById('btn-clear-logo').style.display = 'none';
      Form.schedulePreview();
    });

    // Live preview on any input/select/textarea change
    document.getElementById('player-form').addEventListener('input',  () => Form.schedulePreview());
    document.getElementById('player-form').addEventListener('change', () => Form.schedulePreview());

    // Build the interactive pitch
    Form.buildPitchSelector();
  },

  // ── Load player data into form ────────────────────────────

  load(player) {
    Form.selectedPositions    = [];
    Form.photoBase64          = null;
    Form.partnerLogoBase64    = null;

    if (!player) {
      document.getElementById('player-form').reset();
      Form._resetPhotoUI();
      Form._resetLogoUI();
      Form.buildPitchSelector();
      Form.renderSelectedPositions();
      return;
    }

    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v || '';
    };

    set('f-firstName',     player.firstName);
    set('f-lastName',      player.lastName);
    set('f-jerseyNumber',  player.jerseyNumber);
    set('f-nationality',   player.nationality);
    set('f-passportCountry', player.passportCountry);
    set('f-dateOfBirth',   player.dateOfBirth);
    set('f-heightCm',      player.heightCm);
    set('f-weightKg',      player.weightKg);
    set('f-foot',          player.foot);
    set('f-aboutText',     player.aboutText);
    set('f-video1',        player.videoUrls?.[0]);
    set('f-video2',        player.videoUrls?.[1]);

    const t = player.tests || {};
    set('f-cmjCm',       t.cmjCm);
    set('f-broadJumpCm', t.broadJumpCm);
    set('f-sprint30m',   t.sprint30mSec);
    set('f-sprint40yd',  t.sprint40ydSec);

    // Photo
    if (player.photoBase64) {
      Form.photoBase64 = player.photoBase64;
      const img = document.getElementById('photo-preview');
      img.src = player.photoBase64;
      img.style.display = 'block';
      document.querySelector('#photo-upload-area .upload-placeholder').style.display = 'none';
    } else {
      Form._resetPhotoUI();
    }

    // Partner logo
    if (player.partnerLogoBase64) {
      Form.partnerLogoBase64 = player.partnerLogoBase64;
      const img = document.getElementById('logo-preview');
      img.src = player.partnerLogoBase64;
      img.style.display = 'block';
      document.querySelector('#logo-upload-area .upload-placeholder').style.display = 'none';
      document.getElementById('btn-clear-logo').style.display = 'inline-flex';
    } else {
      Form._resetLogoUI();
    }

    // Positions
    Form.selectedPositions = player.positions ? [...player.positions] : [];
    Form.buildPitchSelector();
    Form.renderSelectedPositions();
  },

  _resetPhotoUI() {
    Form.photoBase64 = null;
    const img = document.getElementById('photo-preview');
    img.style.display = 'none';
    img.src = '';
    const ph = document.querySelector('#photo-upload-area .upload-placeholder');
    if (ph) ph.style.display = '';
  },

  _resetLogoUI() {
    Form.partnerLogoBase64 = null;
    const img = document.getElementById('logo-preview');
    img.style.display = 'none';
    img.src = '';
    const ph = document.querySelector('#logo-upload-area .upload-placeholder');
    if (ph) ph.style.display = '';
    document.getElementById('btn-clear-logo').style.display = 'none';
  },

  // ── Read current form values → player object ──────────────

  getData() {
    const g = id => document.getElementById(id)?.value.trim() || '';
    const n = id => parseFloat(document.getElementById(id)?.value) || null;

    return {
      firstName:      g('f-firstName'),
      lastName:       g('f-lastName'),
      jerseyNumber:   document.getElementById('f-jerseyNumber')?.value || null,
      nationality:    g('f-nationality'),
      passportCountry: g('f-passportCountry'),
      dateOfBirth:    g('f-dateOfBirth'),
      heightCm:       n('f-heightCm'),
      weightKg:       n('f-weightKg'),
      foot:           g('f-foot'),
      tests: {
        cmjCm:        n('f-cmjCm'),
        broadJumpCm:  n('f-broadJumpCm'),
        sprint30mSec: n('f-sprint30m'),
        sprint40ydSec: n('f-sprint40yd'),
      },
      aboutText:      g('f-aboutText'),
      positions:      [...Form.selectedPositions],
      videoUrls:      [g('f-video1'), g('f-video2')],
      photoBase64:    Form.photoBase64,
      partnerLogoBase64: Form.partnerLogoBase64,
    };
  },

  // ── Live preview ──────────────────────────────────────────

  schedulePreview() {
    clearTimeout(Form.previewTimer);
    Form.previewTimer = setTimeout(() => Form.updatePreview(), 280);
  },

  updatePreview() {
    const container = document.getElementById('form-card-preview');
    if (!container) return;
    container.innerHTML = '';
    const card = buildCard(Form.getData());
    container.appendChild(card);
    Form.scalePreview();
  },

  scalePreview() {
    const wrapper = document.querySelector('.preview-scale-wrapper');
    if (!wrapper) return;
    const available = (wrapper.parentElement?.clientWidth || 600) - 48;
    const scale = Math.min(available / 794, 0.9);
    wrapper.style.width  = Math.round(794 * scale) + 'px';
    wrapper.style.height = Math.round(1123 * scale) + 'px';
    const card = wrapper.querySelector('.player-card');
    if (card) {
      card.style.transform       = `scale(${scale})`;
      card.style.transformOrigin = 'top left';
    }
  },

  // ── Image resizing ────────────────────────────────────────

  resizeImage(file, maxSize, callback) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width >= height) {
            height = Math.round((height / width) * maxSize);
            width  = maxSize;
          } else {
            width  = Math.round((width / height) * maxSize);
            height = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  // ── Interactive pitch selector ─────────────────────────────

  buildPitchSelector() {
    const container = document.getElementById('pitch-selector');
    if (!container) return;
    container.innerHTML = Form._buildInteractivePitchSVG();

    // Attach click listeners to each position group
    container.querySelectorAll('[data-pos]').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', e => {
        const code = e.currentTarget.dataset.pos;
        Form.togglePosition(code);
      });
    });
  },

  _buildInteractivePitchSVG() {
    let dotsHTML = '';

    for (const [code, coord] of Object.entries(PITCH_POS_COORDS)) {
      const selIdx    = Form.selectedPositions.findIndex(p => p.code === code);
      const isSelected = selIdx >= 0;
      const isPrimary  = selIdx === 0;

      let fillColor, strokeColor, textColor;
      if (isPrimary) {
        fillColor   = '#E3000F';
        strokeColor = 'rgba(255,255,255,0.9)';
        textColor   = 'white';
      } else if (isSelected) {
        fillColor   = 'rgba(255,255,255,0.10)';
        strokeColor = 'rgba(255,255,255,0.65)';
        textColor   = 'rgba(255,255,255,0.85)';
      } else {
        fillColor   = 'rgba(255,255,255,0.05)';
        strokeColor = 'rgba(255,255,255,0.18)';
        textColor   = 'rgba(255,255,255,0.5)';
      }

      dotsHTML += `
        <g data-pos="${code}" class="pitch-pos-marker">
          <circle cx="${coord.cx}" cy="${coord.cy}" r="8"
            fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>
          <text x="${coord.cx}" y="${coord.cy + 0.5}"
            text-anchor="middle" dominant-baseline="middle"
            fill="${textColor}" font-size="4.5" font-weight="bold"
            font-family="Arial,sans-serif" pointer-events="none">${code}</text>
        </g>`;
    }

    const stripes = [0,1,2,3,4,5,6,7,8,9].map(i =>
      `<rect x="0" y="${i*15}" width="100" height="15" fill="${i%2===0 ? '#0f0f0f' : '#131313'}"/>`
    ).join('');

    return `<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg"
        style="width:100%;display:block;border-radius:6px;overflow:hidden;">
      ${stripes}
      <rect x="3" y="3" width="94" height="144" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="0.8"/>
      <line x1="3" y1="75" x2="97" y2="75" stroke="rgba(255,255,255,0.14)" stroke-width="0.6"/>
      <circle cx="50" cy="75" r="12" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="0.6"/>
      <circle cx="50" cy="75" r="1.2" fill="rgba(255,255,255,0.3)"/>
      <rect x="22" y="3" width="56" height="27" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="0.6"/>
      <rect x="35" y="3" width="30" height="9" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="0.6"/>
      <circle cx="50" cy="21" r="1.2" fill="rgba(255,255,255,0.3)"/>
      <rect x="38" y="1" width="24" height="3" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="0.8"/>
      <rect x="22" y="120" width="56" height="27" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="0.6"/>
      <rect x="35" y="138" width="30" height="9" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="0.6"/>
      <circle cx="50" cy="129" r="1.2" fill="rgba(255,255,255,0.3)"/>
      <rect x="38" y="146" width="24" height="3" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="0.8"/>
      ${dotsHTML}
    </svg>`;
  },

  togglePosition(code) {
    const idx = Form.selectedPositions.findIndex(p => p.code === code);
    if (idx >= 0) {
      Form.selectedPositions.splice(idx, 1);
    } else if (Form.selectedPositions.length < 3) {
      Form.selectedPositions.push({ rank: Form.selectedPositions.length + 1, code });
    }
    // Update ranks
    Form.selectedPositions.forEach((p, i) => { p.rank = i + 1; });

    Form.buildPitchSelector();
    Form.renderSelectedPositions();
    Form.schedulePreview();
  },

  renderSelectedPositions() {
    const container = document.getElementById('selected-positions');
    if (!container) return;

    if (!Form.selectedPositions.length) {
      container.innerHTML = '<span class="form-hint">No positions selected yet</span>';
      return;
    }

    const rankLabel = ['1st (Primary)', '2nd', '3rd'];
    container.innerHTML = Form.selectedPositions.map((pos, i) => `
      <div class="sel-pos-item">
        <span class="sel-pos-rank">${rankLabel[i]}</span>
        <span class="sel-pos-code">${pos.code}</span>
        <button type="button" class="sel-pos-remove" data-code="${pos.code}" title="Remove">×</button>
      </div>`).join('');

    container.querySelectorAll('.sel-pos-remove').forEach(btn => {
      btn.addEventListener('click', e => Form.togglePosition(e.currentTarget.dataset.code));
    });
  }
};
