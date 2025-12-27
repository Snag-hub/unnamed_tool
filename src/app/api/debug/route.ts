import { db } from '@/db';
import { items } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { userId } = await auth();

        const debugInfo = {
            hasUserId: !!userId,
            env: {
                hasDbUrl: !!process.env.DATABASE_URL,
                hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
                hasClerkPub: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
            },
            dbCheck: 'Pending'
        };

        try {
            // Try a simple query
            const result = await db.select().from(items).limit(1);
            debugInfo.dbCheck = 'Success';
        } catch (dbError: any) {
            debugInfo.dbCheck = `Error: ${dbError.message || 'Unknown DB error'}`;
        }

        return NextResponse.json(debugInfo);
    } catch (error: any) {
        return NextResponse.json({
            error: error.message || 'Unknown error',
            stack: error.stack
        }, { status: 500 });
    }
}
