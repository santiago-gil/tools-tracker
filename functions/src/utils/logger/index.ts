import pino from "pino";
import dayjs from "dayjs";

let transport;

// Use pino-pretty in development
if (process.env.NODE_ENV !== "production") {
  transport = pino.transport({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "yyyy-mm-dd HH:MM:ss",
      ignore: "pid,hostname",
    },
  });
}

const logger = pino(
  {
    base: { pid: false },
    // Default timestamp using dayjs (ISO string format)
    timestamp: () => `,"time":"${dayjs().format()}"`,

    // 
    hooks: {
      logMethod(args, method) {
        // If running in Firestore emulator, add extra timestamp prefix
        if (process.env.FIRESTORE_EMULATOR_HOST) {
          const now = new Date().toISOString();
          args.unshift(`[${now}]`); // prepend to arguments
        }
        // Call the original log method with modified args
        method.apply(this, args);
      },
    },
  },
  transport
);

export default logger;