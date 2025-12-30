import { getMetadata } from '@/lib/metadata';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, items } from '@/db/schema';
import { eq, and, or, ilike, desc } from 'drizzle-orm';
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

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const search = url.searchParams.get('search');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const page = parseInt(url.searchParams.get('page') || '1');
  const offset = (page - 1) * limit;

  try {
    const conditions = [eq(items.userId, userId)];

    if (status) {
      conditions.push(eq(items.status, status as any));
    }

    if (type && type !== 'all') {
      conditions.push(eq(items.type, type as any));
    }

    if (search) {
      const searchPattern = `%${search}%`;
      // Check if ilike is available or use another approach. Assuming ilike is imported or available via drizzle. 
      // The actions.ts uses `ilike` and `or`. I need to make sure they are imported.
      // Checking imports below... yes, I need to add imports.
      // For now, I will assume imports are needed and add them in a separate step or try to include them here if I can view the file imports again.
      // Actually, standard `replace_file_content` replaces a block. I will just use sql raw or basic conditions if imports are missing, 
      // BUT I should check imports first to be safe. 
      // Wait, I can just use `conditions` array logic which is safe.
      // I'll stick to a simpler implementation first or checking imports.
      // Let's assume standard drizzle operators are needed.
    }

    // Constructing query
    // I need to import `desc`, `ilike`, `or` if I use them.
    // Let's postpone the search logic slightly or include the imports in the replacement if possible.
    // Or better, let's just do the replacement of the whole function and I will fix imports in a second pass.

    // Wait, I can't easily see imports effectively without viewing again.
    // I'll view the file one more time to be absolutely sure about imports.
    // Actually, I can just include the imports at the top of the file in a separate call or use `multi_replace`.

    // Let's replace the whole GET function first.
    let query = db.select().from(items).where(and(...conditions)).orderBy(desc(items.createdAt)).limit(limit).offset(offset);

    // Wait, Drizzle `and` accepts formatted args.

    // I'll rewrite the query construction properly.

    // To implement search properly I need `ilike` and `or` from `drizzle-orm`.
    // The current file only imports `eq` and `and`.

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
