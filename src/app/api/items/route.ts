import { getMetadata } from '@/lib/metadata';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, items } from '@/db/schema';
import { eq, and, or, ilike, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { createItemSchema } from '@/lib/validations';
import { extractContent } from '@/lib/reader';
import { rateLimit } from '@/lib/rate-limit';
import { ensureUser } from '@/lib/user';

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
  let userId: string | null = null;

  try {
    // Try Clerk auth first
    userId = await ensureUser();
  } catch (error) {
    // Fallback to API Token if Clerk auth fails
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
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing token' }, { status: 401, headers: corsHeaders });
  }

  // Rate Limiting (3 requests per minute per user)
  const { success: rateSuccess } = await rateLimit(`api:createItem:${userId}`, 3);
  if (!rateSuccess) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429, headers: corsHeaders });
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

    let metadata;
    try {
      metadata = await getMetadata(validated.url);
    } catch (e) {
      console.error('Metadata fetch failed (API), safely falling back:', e);
      metadata = {
        title: validated.title || validated.url,
        description: '',
        image: null,
        siteName: new URL(validated.url).hostname,
        favicon: null,
        type: 'other',
        author: null
      };
    }

    // Extract content if it's an article
    let extracted = null;
    if (metadata.type === 'article') {
      try {
        extracted = await extractContent(validated.url);
      } catch (e) {
        console.error('Content extraction failed (API), skipping:', e);
      }
    }

    const newItem = await db.insert(items).values({
      id: uuidv4(),
      userId: userId,
      url: validated.url,
      title: metadata.title || validated.title || 'Untitled',
      description: metadata.description,
      image: metadata.image,
      // V2 Fields
      siteName: metadata.siteName,
      favicon: metadata.favicon,
      type: (metadata.type || 'other') as any,
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

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const search = url.searchParams.get('search');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const page = parseInt(url.searchParams.get('page') || '1');
  const offset = (page - 1) * limit;

  try {
    const userItems = await db.query.items.findMany({
      where: (items, { eq, and, or, ilike }) => {
        const conditions = [eq(items.userId, userId)];

        if (status) {
          conditions.push(eq(items.status, status as any));
        }

        if (type && type !== 'all') {
          conditions.push(eq(items.type, type as any));
        }

        if (search) {
          const searchPattern = `%${search}%`;
          conditions.push(or(
            ilike(items.title, searchPattern),
            ilike(items.url, searchPattern),
            ilike(items.description, searchPattern)
          )!);
        }

        return and(...conditions);
      },
      orderBy: (items, { desc }) => [desc(items.createdAt)],
      limit: limit,
      offset: offset
    });

    return NextResponse.json(userItems, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500, headers: corsHeaders });
  }
}
