import { Express } from 'express';
import toolsRouter from './tools.js';
import usersRouter from './users.js';
import { apiDocument } from '../docs/api.js';

export function attachRoutes(app: Express) {
  app.use('/api/tools', toolsRouter);
  app.use('/api/users', usersRouter);

  // API documentation endpoint
  app.get('/api/docs', (req, res) => {
    res.json(apiDocument);
  });

  // Public health check - no authentication required
  app.get('/api/healthcheck', (req, res) => {
    // Basic health check without sensitive data
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });
}