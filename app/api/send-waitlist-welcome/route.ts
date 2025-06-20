import { getEmailTemplate, getReactEmailTemplate } from '@/lib/email-templates';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendWaitlistWelcomeRequest {
  email: string;
  userName?: string;
}

// Email sending function using Resend SDK
async function sendEmail(to: string, subject: string, html: string, text: string, reactComponent?: React.ReactElement) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  
  // Validate required email configuration
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY environment variable is required');
  }
  
  if (!fromEmail) {
    throw new Error('FROM_EMAIL environment variable is required');
  }
  
  console.log('📧 [Send Waitlist Welcome] Sending via Resend to:', to);
  
  const emailPayload: {
    from: string;
    to: string[];
    subject: string;
    text: string;
    html?: string;
    react?: React.ReactElement;
  } = {
    from: fromEmail,
    to: [to],
    subject,
    text,
  };

  // Use React component if available, otherwise use HTML
  if (reactComponent) {
    emailPayload.react = reactComponent;
    console.log('📧 [Send Waitlist Welcome] Using React template');
  } else {
    emailPayload.html = html;
    console.log('📧 [Send Waitlist Welcome] Using HTML template');
  }

  const { data, error } = await resend.emails.send(emailPayload);

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }
  
  console.log('✅ [Send Waitlist Welcome] Successfully sent via Resend:', data?.id);
  return { id: data?.id, provider: 'resend' };
}

export async function POST(request: NextRequest) {
  console.log('🎉 [Send Waitlist Welcome] API called');
  
  try {
    const body: SendWaitlistWelcomeRequest = await request.json();
    const { email, userName } = body;
    
    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    console.log('📧 [Send Waitlist Welcome] Processing request for:', email);
    
    // Extract user name from email if not provided
    const finalUserName = userName || email.split('@')[0];
    
    // Try to get React email template first (for better rendering)
    const reactTemplate = await getReactEmailTemplate(
      'waitlist_welcome',
      '', // No token needed for welcome email
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      email,
      finalUserName
    );
    
    // Get email template (fallback to HTML)
    const emailTemplate = getEmailTemplate(
      'waitlist_welcome',
      '', // No token needed for welcome email
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      email,
      finalUserName
    );
    
    // Send the email (with React component if available)
    const emailResult = await sendEmail(
      email,
      emailTemplate.subject,
      emailTemplate.html,
      emailTemplate.text,
      reactTemplate || undefined
    );
    
    console.log('✅ [Send Waitlist Welcome] Email sent successfully:', {
      email,
      emailId: emailResult.id,
      provider: emailResult.provider,
      templateType: reactTemplate ? 'react' : 'html'
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Waitlist welcome email sent successfully',
      emailId: emailResult.id,
      provider: emailResult.provider,
      templateType: reactTemplate ? 'react' : 'html'
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ [Send Waitlist Welcome] Error:', error);
    
    // Return appropriate error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: 'Failed to send waitlist welcome email',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    message: 'Send Waitlist Welcome API is running',
    timestamp: new Date().toISOString()
  });
} 