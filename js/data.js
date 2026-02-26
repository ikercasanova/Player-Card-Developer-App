'use strict';

/* ═══════════════════════════════════════════════════════════════
   data.js — localStorage CRUD for ITP Player Cards
   Storage key: itp_players_v1
═══════════════════════════════════════════════════════════════ */

const DB_KEY = 'itp_players_v1';

const DB = {

  getAll() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  get(id) {
    return DB.getAll().find(p => p.id === id) || null;
  },

  save(player) {
    const players = DB.getAll();
    const now = new Date().toISOString();

    if (!player.id) {
      // New player
      player = {
        ...player,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };
      players.push(player);
    } else {
      const idx = players.findIndex(p => p.id === player.id);
      if (idx >= 0) {
        players[idx] = { ...player, updatedAt: now };
        player = players[idx];
      } else {
        player = { ...player, createdAt: now, updatedAt: now };
        players.push(player);
      }
    }

    try {
      localStorage.setItem(DB_KEY, JSON.stringify(players));
    } catch (e) {
      alert('Storage quota exceeded. Try removing some players or large images.');
      throw e;
    }

    return player;
  },

  delete(id) {
    const players = DB.getAll().filter(p => p.id !== id);
    localStorage.setItem(DB_KEY, JSON.stringify(players));
  },

  exportJSON() {
    return JSON.stringify(DB.getAll(), null, 2);
  },

  importJSON(json) {
    const players = JSON.parse(json);
    if (!Array.isArray(players)) throw new Error('Invalid format: expected an array of players');
    localStorage.setItem(DB_KEY, JSON.stringify(players));
    return players.length;
  }

};
