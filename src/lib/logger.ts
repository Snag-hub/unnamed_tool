
import { db } from '@/db';
import { systemLogs } from '@/db/schema';
import { InferInsertModel } from 'drizzle-orm';

type LogLevel = 'info' | 'warn' | 'error';
type LogContext = Record<string, any>;

class Logger {
    async log(level: LogLevel, message: string, error?: unknown, context?: LogContext) {
        // Console log for immediate dev feedback
        if (level === 'error') {
            console.error(`[${level.toUpperCase()}] ${message}`, error, context);
        } else {
            console.log(`[${level.toUpperCase()}] ${message}`, context);
        }

        try {
            const errorStack = error instanceof Error ? error.stack : String(error);

            await db.insert(systemLogs).values({
                level,
                message,
                stack: error ? errorStack : undefined,
                context: context,
            });
        } catch (loggingError) {
            // Fallback if logging fails (e.g. DB down)
            console.error('Failed to write log to DB:', loggingError);
        }
    }

    error(message: string, error?: unknown, context?: LogContext) {
        return this.log('error', message, error, context);
    }

    warn(message: string, context?: LogContext) {
        return this.log('warn', message, undefined, context);
    }

    info(message: string, context?: LogContext) {
        return this.log('info', message, undefined, context);
    }
}

export const logger = new Logger();
