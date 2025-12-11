import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    // If not authenticated, redirect to sign-in page (or home page)
    // The user will then be able to sign in and re-share
    return NextResponse.redirect(new URL('/', req.url));
  }

  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || '';
  const text = searchParams.get('text') || '';
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.redirect(new URL('/', req.url)); // Redirect home if no URL
  }

  // Construct the API endpoint URL for saving items
  const saveApiUrl = new URL('/api/items', req.url);

  // Use the fetch API to send a POST request to the /api/items endpoint
  // This will save the shared item to the database
  try {
    const response = await fetch(saveApiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, title: title || text }),
    });

    if (response.ok) {
      // Redirect to the inbox page after successful save
      return NextResponse.redirect(new URL('/inbox', req.url));
    } else {
      console.error('Failed to save item via share target:', response.statusText);
      return NextResponse.redirect(new URL('/', req.url)); // Redirect home on error
    }
  } catch (error) {
    console.error('Error in share target handler:', error);
    return NextResponse.redirect(new URL('/', req.url)); // Redirect home on error
  }
}
