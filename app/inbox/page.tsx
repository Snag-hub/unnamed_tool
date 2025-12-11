import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { db } from '@/db';
import { items } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function InboxPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1>You need to be signed in to view your inbox.</h1>
      </div>
    );
  }

  const userItems = await db.select().from(items).where(eq(items.userId, session.user.id!));

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">My Inbox</h1>
      {userItems.length === 0 ? (
        <p>No items in your inbox yet. Save some links!</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 w-full max-w-2xl">
          {userItems.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-lg font-semibold">
                {item.title || item.url}
              </a>
              {item.description && <p className="text-gray-600 text-sm mt-1">{item.description}</p>}
              {item.image && <img src={item.image} alt={item.title || 'Item image'} className="mt-2 rounded-md max-h-48 object-cover" />}
              <p className="text-gray-500 text-xs mt-2">Saved on: {new Date(item.createdAt!).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
