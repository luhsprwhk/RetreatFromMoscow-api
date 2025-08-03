import express from 'express';
import startGameRouter from './routes/start-game.js';
import gameStateRouter from './routes/game-state.js';
import updateStateRouter from './routes/update-state.js';
import logEventRouter from './routes/log-event.js';

const router = express.Router();

router.use(startGameRouter);
router.use(gameStateRouter);
router.use(updateStateRouter);
router.use(logEventRouter);

export default router;