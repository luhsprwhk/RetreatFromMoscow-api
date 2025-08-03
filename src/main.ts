import express from 'express';
import { Pool } from 'pg';
import Router from './router.js';

const app = express();
app.use(express.json());
app.use('/', Router);

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/napoleongame',
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, (): void => {
  console.log(`Server listening on port ${PORT}`);
});
