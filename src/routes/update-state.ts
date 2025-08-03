import express, { Request, Response } from 'express';
import { pool } from '../main.js';
import { UpdateStateRequest, GameState } from '../types.js';

const router = express.Router();

router.post(
  '/update-state',
  async (
    req: Request<{}, {}, UpdateStateRequest>,
    res: Response
  ): Promise<void> => {
    const { player_id, updates } = req.body;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${idx}`);
      values.push(key === 'special_items' ? JSON.stringify(value) : value);
      idx++;
    }

    fields.push('last_seen = NOW()');
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

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      const state = result.rows[0] as GameState & { special_items: string };
      const parsedState: GameState = {
        ...state,
        special_items: JSON.parse(state.special_items),
      };

      res.json({ player_id, state: parsedState });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;