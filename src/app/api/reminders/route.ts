import { db } from '@/db';
import { reminders, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// CORS headers for browser extension
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401, headers: corsHeaders });
        }

        const token = authHeader.split(' ')[1];

        // Find user by token
        const user = await db.query.users.findFirst({
            where: eq(users.apiToken, token),
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: corsHeaders });
        }

        const body = await request.json();
        const { title, scheduledAt, recurrence } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400, headers: corsHeaders });
        }

        // Validate date
        const date = new Date(scheduledAt);
        if (isNaN(date.getTime())) {
            return NextResponse.json({ error: 'Invalid date' }, { status: 400, headers: corsHeaders });
        }

        const newReminder = {
            id: uuidv4(),
            userId: user.id,
            itemId: null, // General reminder
            title,
            scheduledAt: date,
            recurrence: recurrence || 'none',
        };

        await db.insert(reminders).values(newReminder);

        return NextResponse.json({ success: true, reminder: newReminder }, { headers: corsHeaders });
    } catch (error) {
        console.error('Error creating reminder:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }
}
