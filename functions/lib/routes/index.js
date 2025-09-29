import toolsRouter from './tools.js';
import usersRouter from './users.js';
export function attachRoutes(app) {
    app.use('/api/tools', toolsRouter);
    app.use('/api/users', usersRouter);
    app.get('/api/healthcheck', (_, res) => res.sendStatus(200));
}
//# sourceMappingURL=index.js.map