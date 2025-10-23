// import express from 'express';
// import dotenv from 'dotenv';
// import logger from './logger';
// import routes from './routes';
// import { errorHandler } from './middleware/errorHandler';
// dotenv.config({ path: '.env.local' });

// const port = process.env.PORT || 3000;

// const app = express();

// app.use(express.json());
// app.use(
//   express.urlencoded({
//     extended: true,
//   }),
// );

// routes(app);

// app.use(errorHandler);

// app.listen(port, () => {
//   logger.info(`Running at ${port}`);
// });

import * as functions from 'firebase-functions';
import express from 'express';
import { attachRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { securityHeaders, rateLimit, requestSizeLimit, corsConfig } from './middleware/security.js';
import logger from './utils/logger/index.js';
import { onUserCreated, onUserDeleted } from "./triggers/auth.js";



const app = express();

// Security middleware (order matters!)
app.use(securityHeaders);
app.use(corsConfig);
app.use(rateLimit);
app.use(requestSizeLimit);
app.use(express.json({ limit: '1mb' }));

// attach routes like normal
attachRoutes(app);

// always put error handler last
app.use(errorHandler);

// instead of app.listen, export an https function
export const api = functions.https.onRequest(app);

export { onUserCreated, onUserDeleted };

logger.info('Firebase Express API initialized');
