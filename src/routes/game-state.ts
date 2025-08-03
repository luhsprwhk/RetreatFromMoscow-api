import express, { Request, Response } from 'express';
import { pool } from '../main.js';

const router = express.Router();

interface GameState {
  day: number;
  location: string;
  honor: number;
  morale: number;
  rations: number;
  firewood: number;
  special_items: Record<string, unknown>;
  men_alive: number;
  joubert_status: string;
  weather: string;
}
// Get current game state
router.get(
  '/state/:playerId',
  async (req: Request, res: Response): Promise<void> => {
    const { playerId } = req.params;

    try {
      const result = await pool.query(
        `SELECT day, location, honor, morale, rations, firewood, special_items, men_alive, joubert_status, weather
       FROM game_state WHERE player_id = $1 ORDER BY day DESC LIMIT 1`,
        [playerId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      const state = result.rows[0] as GameState & { special_items: string };
      const parsedState: GameState = {
        ...state,
        special_items: JSON.parse(state.special_items),
      };

      res.json({ player_id: playerId, state: parsedState });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
