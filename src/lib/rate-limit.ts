import { db } from '@/db';
import { rateLimits } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * A database-backed rate limiter for server actions.
 * Ensures reliability across serverless instances/restarts.
 */
export async function rateLimit(key: string, limit: number = 10, windowMs: number = 60000) {
    const now = new Date();
    const futureReset = new Date(now.getTime() + windowMs);

    // Atomic Upsert with Conditional Reset logic
    const results = await db.insert(rateLimits)
        .values({
            key,
            count: 1,
            reset: futureReset
        })
        .onConflictDoUpdate({
            target: rateLimits.key,
            set: {
                count: sql`CASE WHEN rate_limits.reset < ${now} THEN 1 ELSE rate_limits.count + 1 END`,
                reset: sql`CASE WHEN rate_limits.reset < ${now} THEN ${futureReset} ELSE rate_limits.reset END`
            }
        })
        .returning();

    const result = results[0];
    const success = result.count <= limit;
    const remaining = Math.max(0, limit - result.count);

    return {
        success,
        limit,
        remaining,
        reset: result.reset.getTime(),
    };
}
