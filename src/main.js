// index.js
import express from 'express';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

const app = express();
app.use(bodyParser.json());

// Configure your Postgres connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/RFM-Game',
});

// Start a new game session
app.post('/start-game', async (req, res) => {
  const { username } = req.body;
  const playerId = uuidv4();
  const now = new Date();
  try {
    // Create player record
    await pool.query(
      `INSERT INTO players (id, created_at, last_seen, username) VALUES ($1, $2, $2, $3)`,
      [playerId, now, username]
    );
    // Initial game state
    const initialState = {
      day: 1,
      location: 'Smolensk Outskirts',
      honor: 5,
      morale: 5,
      rations: 2,
      firewood: 1,
      special_items: {},
      men_alive: 7,
      joubert_status: 'stable',
      weather: 'snow, -20°C',
    };
    // Insert initial state
    await pool.query(
      `INSERT INTO game_state (id, player_id, day, location, honor, morale, rations, firewood, special_items, men_alive, joubert_status, weather, log)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [uuidv4(), playerId, initialState.day, initialState.location, initialState.honor, initialState.morale, initialState.rations, initialState.firewood, JSON.stringify(initialState.special_items), initialState.men_alive, initialState.joubert_status, initialState.weather, []]
    );
    res.json({ player_id: playerId, state: initialState });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch current game state
app.get('/state/:playerId', async (req, res) => {
  const { playerId } = req.params;
  try {
    const result = await pool.query(
      `SELECT day, location, honor, morale, rations, firewood, special_items, men_alive, joubert_status, weather
       FROM game_state WHERE player_id = $1 ORDER BY day DESC LIMIT 1`,
      [playerId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
    const state = result.rows[0];
    state.special_items = JSON.parse(state.special_items);
    res.json({ player_id: playerId, state });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update game state after a choice
app.post('/update-state', async (req, res) => {
  const { player_id, updates } = req.body;
  const fields = [];
  const values = [];
  let idx = 1;

  // Dynamically build SET clause
  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${idx}`);
    values.push(key === 'special_items' ? JSON.stringify(value) : value);
    idx++;
  }
  // Append last_seen update
  fields.push(`last_seen = NOW()`);
  // WHERE clause parameter
  const whereIndex = idx;
  values.push(player_id);

  const query = `
    UPDATE game_state
    SET ${fields.join(', ')}, log = log
    WHERE player_id = $${whereIndex}
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
    const state = result.rows[0];
    state.special_items = JSON.parse(state.special_items);
    res.json({ player_id, state });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Log an in-game event
app.post('/log-event', async (req, res) => {
  const { player_id, day, event_type, description } = req.body;
  try {
    await pool.query(
      `INSERT INTO events_log (id, player_id, day, event_type, description, timestamp)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [uuidv4(), player_id, day, event_type, description]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));