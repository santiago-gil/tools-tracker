import pino from 'pino';
import dayjs from 'dayjs';
let transport;
// Use pino-pretty only in development
if (process.env.NODE_ENV !== 'production') {
    transport = pino.transport({
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
        },
    });
}
const logger = pino({
    base: { pid: false },
    timestamp: () => `,"time":"${dayjs().format()}"`,
}, transport);
export default logger;
//# sourceMappingURL=index.js.map