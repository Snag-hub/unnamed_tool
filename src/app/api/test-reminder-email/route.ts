import { db } from '@/db';
import { items } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint for enhanced reminder email
 * Usage: GET /api/test-reminder-email?email=user@example.com
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Missing "email" query parameter' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXTAUTH_URL || 'https://dos4doers.app';

    // Fetch top 5 latest inbox items for demo (using any user's items)
    const latestInboxItems = await db
      .select({
        id: items.id,
        title: items.title,
        url: items.url,
        favicon: items.favicon,
        siteName: items.siteName,
        image: items.image,
        createdAt: items.createdAt,
      })
      .from(items)
      .where(eq(items.status, 'inbox'))
      .limit(5);

    // Mock reminder data
    const mockReminders = [
      {
        title: 'Review quarterly goals',
        url: '/settings',
        siteName: 'DOs 4 DOERs',
        recurrence: 'weekly'
      },
      {
        title: 'Team standup meeting',
        url: '/meetings',
        siteName: 'DOs 4 DOERs Meeting',
        recurrence: 'none'
      }
    ];

    // Build reminder cards HTML
    const reminderCardsHtml = mockReminders
      .map(
        (item) => `
                <div style="background: white; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px; margin-bottom: 12px; transition: transform 0.2s;">
                  <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <div style="flex-shrink: 0; width: 40px; height: 40px; background: linear-gradient(135deg, #00D4FF 0%, #0EA5E9 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 20px;">⏰</span>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                      <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #18181b;">
                        <a href="${appUrl + item.url}" style="color: #18181b; text-decoration: none;">${item.title}</a>
                      </h3>
                      <p style="margin: 0; font-size: 13px; color: #71717a;">
                        ${item.siteName} • Reminder Due${item.recurrence !== 'none' ? ` • 🔁 ${item.recurrence}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              `
      )
      .join('');

    // Build inbox items cards HTML
    const inboxCardsHtml = latestInboxItems.length > 0 ? latestInboxItems
      .map(
        (item) => `
                <a href="${item.url}" style="display: block; text-decoration: none; background: white; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; margin-bottom: 12px; transition: transform 0.2s;">
                  ${item.image ? `
                  <div style="width: 100%; height: 160px; background: linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%); position: relative; overflow: hidden;">
                    <img src="${item.image}" alt="${item.title || 'Article'}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
                  </div>
                  ` : ''}
                  <div style="padding: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                      ${item.favicon ? `<img src="${item.favicon}" width="16" height="16" style="border-radius: 4px;" onerror="this.style.display='none'" />` : ''}
                      ${item.siteName ? `<span style="font-size: 12px; color: #71717a; font-weight: 500;">${item.siteName}</span>` : ''}
                    </div>
                    <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #18181b; line-height: 1.4;">
                      ${item.title || 'Untitled'}
                    </h3>
                    <div style="display: inline-block; padding: 4px 12px; background: #eff6ff; color: #2563eb; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Read Now →
                    </div>
                  </div>
                </a>
              `
      )
      .join('') : '';

    const enhancedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>DOs 4 DOERs - Your Reminders</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header with Gradient -->
            <div style="background: linear-gradient(135deg, #0A1628 0%, #1e293b 100%); padding: 40px 24px; text-align: center; border-radius: 0 0 24px 24px;">
              <img src="${appUrl}/icon-192.png" width="56" height="56" style="border-radius: 14px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);" alt="DOs 4 DOERs Logo" />
              <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Your Daily Digest</h1>
              <p style="color: #94a3b8; margin: 0; font-size: 15px; font-weight: 500;">Hi there, here's what needs your attention</p>
            </div>

            <!-- Content -->
            <div style="padding: 32px 24px;">
              <!-- Reminders Section -->
              <div style="margin-bottom: 32px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(180deg, #00D4FF 0%, #0EA5E9 100%); border-radius: 2px;"></div>
                  <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #18181b;">⏰ Reminders Due</h2>
                </div>
                ${reminderCardsHtml}
              </div>

              <!-- Latest Inbox Items Section -->
              ${latestInboxItems.length > 0 ? `
              <div style="margin-bottom: 32px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(180deg, #00D4FF 0%, #0EA5E9 100%); border-radius: 2px;"></div>
                  <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #18181b;">📚 Latest from Your Inbox</h2>
                </div>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #71717a;">Here are your 5 most recent saved items</p>
                ${inboxCardsHtml}
              </div>
              ` : ''}

              <!-- CTA Button -->
              <div style="text-align: center; margin-top: 32px;">
                <a href="${appUrl}/inbox" style="display: inline-block; background: linear-gradient(135deg, #00D4FF 0%, #0EA5E9 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3); transition: transform 0.2s;">
                  Open DOs 4 DOERs →
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #fafafa; padding: 24px; text-align: center; border-radius: 24px 24px 0 0; margin-top: 32px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #a1a1aa; font-weight: 500;">
                Less planning. More doing.
              </p>
              <p style="margin: 0; font-size: 11px; color: #d4d4d8;">
                <a href="${appUrl}/settings" style="color: #71717a; text-decoration: none;">Manage Preferences</a> • 
                <a href="${appUrl}/inbox" style="color: #71717a; text-decoration: none;">View Inbox</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

    const result = await sendEmail({
      to: email,
      subject: `DOs 4 DOERs: 2 Reminder(s)${latestInboxItems.length > 0 ? ` + ${latestInboxItems.length} New Items` : ''} [TEST]`,
      html: enhancedHtml,
    });

    return NextResponse.json({
      success: true,
      message: 'Enhanced reminder test email sent successfully',
      emailId: result?.id,
      reminderCount: 2,
      inboxItemsCount: latestInboxItems.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test reminder email failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
