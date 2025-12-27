import { getMetadata } from '@/lib/metadata';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, items } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { createItemSchema } from '@/lib/validations';
import { extractContent } from '@/lib/reader';

// CORS headers for browser extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  let userId = clerkUserId;

  // If no Clerk session, check for API token
  if (!userId) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = await db.query.users.findFirst({
        where: eq(users.apiToken, token),
      });
      if (user) {
        userId = user.id;
      }
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const body = await req.json();
  const result = createItemSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.issues }, { status: 400, headers: corsHeaders });
  }

  const validated = result.data;

  try {
    // Check if the item already exists for the user
    const existingItem = await db
      .select()
      .from(items)
      .where(and(eq(items.url, validated.url), eq(items.userId, userId)))
      .limit(1);

    if (existingItem.length > 0) {
      return NextResponse.json({ message: 'Item already exists' }, { status: 200, headers: corsHeaders });
    }

    const metadata = await getMetadata(validated.url);

    // Extract content if it's an article
    let extracted = null;
    if (metadata.type === 'article') {
      extracted = await extractContent(validated.url);
    }

    const newItem = await db.insert(items).values({
      id: uuidv4(),
      userId: userId,
      url: validated.url,
      title: metadata.title,
      description: metadata.description,
      image: metadata.image,
      // V2 Fields
      siteName: metadata.siteName,
      favicon: metadata.favicon,
      type: metadata.type || 'other',
      author: metadata.author,
      status: 'inbox',
      content: extracted?.content,
      textContent: extracted?.textContent,
    }).returning();

    return NextResponse.json(newItem[0], { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Error saving item:', error);
    return NextResponse.json({ error: 'Failed to save item' }, { status: 500, headers: corsHeaders });
  }
}

export async function GET(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  try {
    const userItems = await db.select().from(items).where(eq(items.userId, userId)).orderBy(items.createdAt);
    return NextResponse.json(userItems, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500, headers: corsHeaders });
  }
}
