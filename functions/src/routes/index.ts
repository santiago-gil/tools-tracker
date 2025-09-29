import { Express } from 'express';
import toolsRouter from './tools.js';
import usersRouter from './users.js';

export function attachRoutes(app: Express) {
  app.use('/api/tools', toolsRouter);
  app.use('/api/users', usersRouter);
  app.get('/api/healthcheck', (_, res) => res.sendStatus(200));
}