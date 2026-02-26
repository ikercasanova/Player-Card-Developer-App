'use strict';

/* ═══════════════════════════════════════════════════════════════
   app.js — Main controller: routing, dashboard, modal, events
═══════════════════════════════════════════════════════════════ */

const App = {

  currentPlayerId: null,

  // ── Bootstrap ─────────────────────────────────────────────

  init() {
    Form.init();

    // Nav buttons
    document.getElementById('btn-add-player').addEventListener('click', () => App.showForm());
    document.getElementById('btn-backup').addEventListener('click', App.backup);
    document.getElementById('btn-restore').addEventListener('click', () =>
      document.getElementById('input-restore').click()
    );
    document.getElementById('input-restore').addEventListener('change', App.restore);

    // Form view
    document.getElementById('btn-back').addEventListener('click', () => App.showDashboard());
    document.getElementById('player-form').addEventListener('submit', App.savePlayer);
    document.getElementById('btn-delete').addEventListener('click', App.confirmDelete);
    document.getElementById('btn-preview').addEventListener('click', () => {
      const player = Form.getData();
      player.id = App.currentPlayerId;
      App._renderStandalonePreview(player);
      App.setView('preview');
    });
    document.getElementById('btn-export-pdf').addEventListener('click', () => {
      const player = Form.getData();
      player.id = App.currentPlayerId;
      PDF.export(player);
    });

    // Preview view
    document.getElementById('btn-preview-back').addEventListener('click', () => {
      if (App.currentPlayerId) {
        App.setView('form');
      } else {
        App.showDashboard();
      }
    });
    document.getElementById('btn-preview-export').addEventListener('click', () => {
      if (App.currentPlayerId) {
        const player = DB.get(App.currentPlayerId) || Form.getData();
        PDF.export(player);
      }
    });

    // Delete modal
    document.getElementById('btn-modal-cancel').addEventListener('click', App.closeModal);
    document.getElementById('btn-modal-confirm').addEventListener('click', App.deletePlayer);
    document.getElementById('modal-delete').addEventListener('click', e => {
      if (e.target === document.getElementById('modal-delete')) App.closeModal();
    });

    // Handle window resize → re-scale preview
    window.addEventListener('resize', () => {
      if (document.getElementById('view-form').classList.contains('active')) {
        Form.scalePreview();
      }
    });

    App.showDashboard();
  },

  // ── View Routing ──────────────────────────────────────────

  setView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${name}`).classList.add('active');
  },

  showDashboard() {
    App.currentPlayerId = null;
    App.setView('dashboard');
    App.renderDashboard();
  },

  showForm(playerId = null) {
    App.currentPlayerId = playerId;
    App.setView('form');

    const player = playerId ? DB.get(playerId) : null;
    Form.load(player);

    document.getElementById('form-title').textContent = player ? 'Edit Player' : 'Add Player';
    document.getElementById('btn-delete').style.display         = player ? '' : 'none';
    document.getElementById('btn-export-pdf').style.display     = player ? 'inline-flex' : 'none';
    document.getElementById('btn-export-pdf-preview').style.display = player ? 'inline-flex' : 'none';

    // Initial preview render (debounced)
    Form.schedulePreview();
  },

  // ── Dashboard ─────────────────────────────────────────────

  renderDashboard() {
    const players = DB.getAll();
    const grid  = document.getElementById('player-grid');
    const empty = document.getElementById('empty-state');

    grid.innerHTML = '';

    if (!players.length) {
      grid.style.display  = 'none';
      empty.style.display = 'block';
      return;
    }

    grid.style.display  = 'grid';
    empty.style.display = 'none';

    players.forEach(player => {
      const card = document.createElement('div');
      card.className = 'player-card-thumb';

      const positions = player.positions || [];
      const posHTML = positions.slice(0, 3).map((p, i) =>
        `<span class="thumb-pos-badge ${i === 0 ? '' : 'thumb-pos-badge-secondary'}">${p.code}</span>`
      ).join('');

      const photoHTML = player.photoBase64
        ? `<img src="${player.photoBase64}" class="player-thumb-photo" alt="${player.firstName}">`
        : `<div class="player-thumb-photo-placeholder">
            <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="14" r="8" fill="#ccc"/>
              <path d="M4 36c0-8.8 7.2-16 16-16s16 7.2 16 16" fill="#ccc"/>
            </svg>
           </div>`;

      card.innerHTML = `
        ${photoHTML}
        <div class="player-thumb-info">
          <div class="player-thumb-name">${player.firstName || ''} ${player.lastName || ''}</div>
          <div class="player-thumb-pos">${posHTML}</div>
        </div>
        <div class="player-thumb-actions">
          <button class="btn btn-sm btn-card-preview" data-id="${player.id}">Preview</button>
          <button class="btn btn-sm btn-card-edit"    data-id="${player.id}">Edit</button>
        </div>`;

      card.querySelector('.btn-card-preview').addEventListener('click', e => {
        e.stopPropagation();
        App._showSavedPreview(player.id);
      });
      card.querySelector('.btn-card-edit').addEventListener('click', e => {
        e.stopPropagation();
        App.showForm(player.id);
      });
      card.addEventListener('click', () => App.showForm(player.id));

      grid.appendChild(card);
    });
  },

  // ── Standalone Preview ────────────────────────────────────

  _showSavedPreview(playerId) {
    const player = DB.get(playerId);
    if (!player) return;
    App.currentPlayerId = playerId;
    App._renderStandalonePreview(player);
    App.setView('preview');
    document.getElementById('btn-preview-export').style.display = 'inline-flex';
  },

  _renderStandalonePreview(player) {
    document.getElementById('preview-player-name').textContent =
      `${player.firstName || ''} ${player.lastName || ''}`.trim();

    const container = document.getElementById('standalone-card-preview');
    container.innerHTML = '';
    container.appendChild(buildCard(player));
  },

  // ── Save ──────────────────────────────────────────────────

  savePlayer(e) {
    e.preventDefault();

    const player = Form.getData();
    if (!player.firstName && !player.lastName) {
      alert('Please enter at least a first or last name.');
      return;
    }

    if (App.currentPlayerId) player.id = App.currentPlayerId;
    const saved = DB.save(player);
    App.currentPlayerId = saved.id;

    document.getElementById('form-title').textContent = 'Edit Player';
    document.getElementById('btn-delete').style.display             = 'inline-flex';
    document.getElementById('btn-export-pdf').style.display         = 'inline-flex';
    document.getElementById('btn-export-pdf-preview').style.display = 'inline-flex';

    // Brief "Saved" feedback on the button
    const btn = document.querySelector('#player-form [type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Saved ✓';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1600);
  },

  // ── Delete ────────────────────────────────────────────────

  confirmDelete() {
    if (!App.currentPlayerId) return;
    const player = DB.get(App.currentPlayerId);
    if (!player) return;
    document.getElementById('modal-player-name').textContent =
      `${player.firstName || ''} ${player.lastName || ''}`.trim();
    document.getElementById('modal-delete').style.display = 'flex';
  },

  deletePlayer() {
    if (!App.currentPlayerId) return;
    DB.delete(App.currentPlayerId);
    App.closeModal();
    App.showDashboard();
  },

  closeModal() {
    document.getElementById('modal-delete').style.display = 'none';
  },

  // ── Backup / Restore ──────────────────────────────────────

  backup() {
    const json = DB.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ITP_Players_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  restore(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const count = DB.importJSON(ev.target.result);
        alert(`Successfully imported ${count} player${count !== 1 ? 's' : ''}.`);
        App.showDashboard();
      } catch (err) {
        alert(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset so same file can be re-imported
  }

};

// ── Entry point ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
