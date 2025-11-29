import { NextResponse } from 'next/server';

// In-memory store for the email template
let emailTemplate = {
  subject: 'Your Invoice from {{companyName}}',
  body: `Hello {{customerName}},

Thank you for choosing {{companyName}}!

Here are the details of your recent session:
- PC: {{pcName}}
- Duration: {{duration}}
- Total Amount: {{amount}}

We hope to see you again soon!

Best,
The {{companyName}} Team
`,
};

// GET the current email template
export async function GET() {
  return NextResponse.json(emailTemplate);
}

// POST (update) the email template
export async function POST(request: Request) {
  try {
    const { subject, body } = await request.json();
    if (typeof subject !== 'string' || typeof body !== 'string') {
      return NextResponse.json({ message: 'Invalid subject or body' }, { status: 400 });
    }

    emailTemplate = { subject, body };
    
    return NextResponse.json({ success: true, message: 'Template updated successfully.' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
