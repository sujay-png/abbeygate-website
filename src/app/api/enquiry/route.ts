import { NextRequest, NextResponse } from 'next/server';
import { enquiryRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const { success } = await enquiryRateLimit.limit(ip);
    
    if (!success) {
      return NextResponse.json({ error: 'Too many enquiry attempts, please try again later.' }, { status: 429 });
    }

    const formData = await req.formData();
    
    // Add form_type for WP
    formData.append('form_type', 'quote');

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const material = formData.get('material') as string;
    const quantity = formData.get('quantity') as string;

    if (!name || !email || !material || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const wpUrl = process.env.WOOCOMMERCE_STORE_URL || 'https://dashboard.abbeygate-england.com';
    const secret = process.env.WP_HEADLESS_SECRET;

    if (!secret) {
      console.warn("WP_HEADLESS_SECRET is not set. Cannot submit to WordPress.");
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const response = await fetch(`${wpUrl}/wp-json/headless/v1/submit-form`, {
      method: 'POST',
      headers: {
        'x-headless-secret': secret,
      },
      // Passing FormData directly to fetch automatically sets Content-Type to multipart/form-data with boundary
      body: formData,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('WP API Error (Enquiry Non-JSON):', text);
      return NextResponse.json({ error: 'Invalid response from backend.' }, { status: 500 });
    }

    if (!response.ok) {
      console.error('WP API Error (Enquiry):', data);
      return NextResponse.json({ error: data.message || 'Failed to submit form to backend.' }, { status: response.status });
    }

    return NextResponse.json({ success: true, message: data.message });
  } catch (error: any) {
    console.error('Enquiry API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
