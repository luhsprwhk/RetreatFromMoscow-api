import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

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

interface StartGameRequest {
  username: string;
}

interface UpdateStateRequest {
  player_id: string;
  updates: Partial<GameState>;
}

interface LogEventRequest {
  player_id: string;
  day: number;
  event_type: string;
  description: string;
}

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/napoleongame',
});

app.post(
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

app.get(
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

app.post(
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

app.post(
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, (): void => {
  console.log(`Server listening on port ${PORT}`);
});
