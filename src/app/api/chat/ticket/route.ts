import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/features/auth/utils/session';

export const dynamic = 'force-dynamic';

function getStoreUrl(): string {
  return (
    process.env.WOOCOMMERCE_STORE_URL ||
    process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL ||
    'https://dashboard.abbeygate-england.com'
  ).replace(/\/$/, '');
}

function getHeadlessSecret(): string {
  return (
    process.env.WP_HEADLESS_SECRET ||
    'a9718d4e0887ce1bc851ad90b0b4a39742623ce5eb94faf28a5bfe8abc584eb3'
  );
}

/**
 * POST /api/chat/ticket
 * Creates a support ticket originated from the Website Live Chat Widget.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getSession();

    const {
      message,
      category = 'general',
      order_id,
      order_items,
      issue_type_label,
      page_url,
      guest_name,
      guest_email,
    } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter a message.' },
        { status: 400 }
      );
    }

    const userId = session?.userId ? Number(session.userId) : 0;
    const effectiveEmail = session?.email || guest_email;
    const effectiveName = guest_name || (session?.email ? session.email.split('@')[0] : 'Visitor');

    if (!userId && (!effectiveEmail || !effectiveEmail.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please provide an email address so our team can follow up.' },
        { status: 400 }
      );
    }

    // Generate informative subject with [Website Chat] prefix
    let subjectTitle = 'Website Enquiry';
    if (order_id) {
      const issueSuffix = issue_type_label ? ` - ${issue_type_label}` : '';
      const itemSuffix = order_items ? ` (${order_items})` : '';
      subjectTitle = `Order #${order_id}${issueSuffix}${itemSuffix}`;
    } else if (category === 'artwork_proof') {
      subjectTitle = 'Artwork & Proofing Enquiry';
    } else if (category === 'billing') {
      subjectTitle = 'Invoice & Payment Enquiry';
    } else if (body.subject) {
      subjectTitle = body.subject.trim();
    }

    const subject = `[Website Chat] ${subjectTitle}`.slice(0, 180);

    // Build structured, easy-to-read ticket content for WordPress staff
    const contextHeader = [
      '📍 SOURCE: Website Live Chat Widget',
      `Channel: Interactive Customer Assistant`,
      page_url ? `Page: ${page_url}` : null,
      order_id ? `Order Reference: #${order_id}` : null,
      order_items ? `Selected Item(s): ${order_items}` : null,
      issue_type_label ? `Issue Type: ${issue_type_label}` : null,
      effectiveName ? `Customer Name: ${effectiveName}` : null,
      effectiveEmail ? `Contact Email: ${effectiveEmail}` : null,
      '--------------------------------------------------',
      'CUSTOMER MESSAGE:',
      message.trim(),
    ]
      .filter(Boolean)
      .join('\n');

    const storeUrl = getStoreUrl();
    const res = await fetch(`${storeUrl}/wp-json/headless/v1/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-headless-secret': getHeadlessSecret(),
      },
      body: JSON.stringify({
        customer_id: userId || 0,
        guest_name: effectiveName,
        guest_email: effectiveEmail,
        subject,
        message: contextHeader,
        category: category || 'general',
        order_id: order_id ? Number(order_id) : null,
        order_items: order_items || null,
        priority: 'normal',
        source: 'website_chat',
      }),
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error('Failed to create ticket from chat:', data);
      return NextResponse.json(
        { success: false, error: data?.message || 'Failed to submit chat message.' },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket_id: data.ticket_id,
      ticket_number: data.ticket_number,
      message: 'Support ticket created successfully.',
    });
  } catch (error: any) {
    console.error('Chat ticket creation error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/ticket?id=...
 * Retrieves ticket status and threaded messages for an active chat.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing ticket ID.' }, { status: 400 });
    }

    const session = await getSession();
    const storeUrl = getStoreUrl();
    const customerQuery = session?.userId ? `?customer_id=${session.userId}` : '';

    const res = await fetch(`${storeUrl}/wp-json/headless/v1/tickets/${id}${customerQuery}`, {
      method: 'GET',
      headers: {
        'x-headless-secret': getHeadlessSecret(),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Ticket not found.' }, { status: 404 });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      ticket: data.ticket || null,
    });
  } catch (error: any) {
    console.error('Chat ticket fetch error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch ticket.' },
      { status: 500 }
    );
  }
}
