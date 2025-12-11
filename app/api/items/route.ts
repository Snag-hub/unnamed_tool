import { getMetadata } from '@/lib/metadata';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { db } from '@/db';
import { items } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Check if the item already exists for the user
    const existingItem = await db
      .select()
      .from(items)
      .where(eq(items.url, url))
      .limit(1);

    if (existingItem.length > 0) {
      return NextResponse.json({ message: 'Item already exists' }, { status: 200 });
    }

    const metadata = await getMetadata(url);

    const newItem = await db.insert(items).values({
      id: uuidv4(),
      userId: session.user.id!,
      url,
      title: metadata.title,
      description: metadata.description,
      image: metadata.image,
    }).returning();

    return NextResponse.json(newItem[0], { status: 201 });
  } catch (error) {
    console.error('Error saving item:', error);
    return NextResponse.json({ error: 'Failed to save item' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userItems = await db.select().from(items).where(eq(items.userId, session.user.id!));
    return NextResponse.json(userItems, { status: 200 });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
