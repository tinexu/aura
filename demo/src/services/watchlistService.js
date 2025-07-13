// src/services/watchlistService.js
const fs = require('fs');
const path = require('path');

function loadWatchlist(filename) {
  try {
    const fullPath = path.join(__dirname, '..', 'data', filename);
    const data = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(data); // Expecting array of names or entries
  } catch (err) {
    console.error('Failed to load watchlist:', filename);
    return [];
  }
}

module.exports = { loadWatchlist };