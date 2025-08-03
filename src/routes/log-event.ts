import express, { Request, Response } from 'express';
import { pool } from '../main.js';
import { v4 as uuidv4 } from 'uuid';
const router = express.Router();
import { LogEventRequest } from '../types.js';

router.post(
  '/log-event',
  async (
    req: Request<{}, {}, LogEventRequest>,
    res: Response
  ): Promise<void> => {
    const { player_id, day, event_type, description } = req.body;

    try {
      await pool.query(
        'INSERT INTO events_log (id, player_id, day, event_type, description, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())',
        [uuidv4(), player_id, day, event_type, description]
      );

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
