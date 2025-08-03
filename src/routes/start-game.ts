import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../main.js';
import { StartGameRequest, GameState } from '../types.js';

const router = express.Router();

router.post(
  '/start-game',
  async (
    req: Request<{}, {}, StartGameRequest>,
    res: Response
  ): Promise<void> => {
    const { username } = req.body;
    const playerId = uuidv4();
    const now = new Date();

    try {
      await pool.query(
        'INSERT INTO players (id, created_at, last_seen, username) VALUES ($1, $2, $2, $3)',
        [playerId, now, username]
      );

      const initialState: GameState = {
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

      await pool.query(
        `INSERT INTO game_state (id, player_id, day, location, honor, morale, rations, firewood, special_items, men_alive, joubert_status, weather, log)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          uuidv4(),
          playerId,
          initialState.day,
          initialState.location,
          initialState.honor,
          initialState.morale,
          initialState.rations,
          initialState.firewood,
          JSON.stringify(initialState.special_items),
          initialState.men_alive,
          initialState.joubert_status,
          initialState.weather,
          [],
        ]
      );

      res.json({ player_id: playerId, state: initialState });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;