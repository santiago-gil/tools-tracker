import { Express } from 'express';
import toolsRouter from './tools.js';
import usersRouter from './users.js';
import { apiDocument } from '../docs/api.js';

export function attachRoutes(app: Express) {
  app.use('/tools', toolsRouter);
  app.use('/users', usersRouter);

  // API documentation endpoint
  app.get('/docs', (req, res) => {
    try {
      res.json(apiDocument);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate API documentation',
        code: 'DOCS_ERROR'
      });
    }
  });

  // Public health check - no authentication required
  app.get('/healthcheck', (req, res) => {
    // Basic health check without sensitive data
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });
}