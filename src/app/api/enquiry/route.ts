import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { enquiryRateLimit } from '@/lib/rate-limit';

// Use a placeholder if no key is provided so build doesn't fail, but it will fail at runtime.
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const { success } = await enquiryRateLimit.limit(ip);
    
    if (!success) {
      return NextResponse.json({ error: 'Too many enquiry attempts, please try again later.' }, { status: 429 });
    }

    const formData = await req.formData();
    
    const name = formData.get('name') as string;
    const company = formData.get('company') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const material = formData.get('material') as string;
    const finish = formData.get('finish') as string;
    const dimensions = formData.get('dimensions') as string;
    const quantity = formData.get('quantity') as string;
    const dateRequired = formData.get('dateRequired') as string;
    const notes = formData.get('notes') as string;

    if (!name || !email || !material || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const fullPhone = phone ? phone : 'N/A';

    // 1. Send internal email to sales
    const salesEmailHtml = `
      <h2>New Quote Request</h2>
      <h3>Contact Details</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Company:</strong> ${company || 'N/A'}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${fullPhone}</p>
      
      <h3>Project Details</h3>
      <p><strong>Material Type:</strong> ${material}</p>
      <p><strong>Finish / Branding:</strong> ${finish || 'N/A'}</p>
      <p><strong>Dimensions:</strong> ${dimensions || 'N/A'}</p>
      <p><strong>Quantity:</strong> ${quantity}</p>
      <p><strong>Date Required:</strong> ${dateRequired || 'N/A'}</p>
      
      <h3>Additional Information</h3>
      <p><strong>Notes:</strong><br/> ${notes ? notes.replace(/\n/g, '<br/>') : 'N/A'}</p>
    `;

    // 2. Send confirmation to customer
    const customerEmailHtml = `
      <h2>Thank you for your enquiry, ${name}!</h2>
      <p>We have received your quote request and our team will get back to you within 1 business day.</p>
      <br/>
      <p>Best regards,</p>
      <p><strong>Abbeygate Manufacturing Company Ltd</strong></p>
    `;

    // In development or if there's no real key, don't actually throw but return a mock success
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not set. Mocking email submission.");
      return NextResponse.json({ success: true, mocked: true });
    }

    const { data: salesData, error: salesError } = await resend.emails.send({
      from: 'Abbeygate Enquiries <onboarding@resend.dev>', // Use a verified domain in production
      to: ['sales@abbeygate-england.com'], // Or an env variable
      subject: `New Quote Request from ${company || name}`,
      html: salesEmailHtml,
      replyTo: email,
    });

    if (salesError) {
      console.error('Resend Error (Sales):', salesError);
      return NextResponse.json({ error: salesError.message }, { status: 500 });
    }

    const { data: customerData, error: customerError } = await resend.emails.send({
      from: 'Abbeygate Enquiries <onboarding@resend.dev>', // Use a verified domain in production
      to: [email],
      subject: `We've received your quote request`,
      html: customerEmailHtml,
    });

    if (customerError) {
      console.error('Resend Error (Customer):', customerError);
      // Even if customer email fails, the sales email went through, so we can still return success 
      // but maybe log it.
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Enquiry API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
