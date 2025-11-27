'use server';
/**
 * @fileOverview An AI flow to generate and send an invoice email.
 *
 * - sendInvoiceEmail - A function that handles generating and sending the email.
 * - SendInvoiceEmailInput - The input type for the sendInvoiceEmail function.
 * - SendInvoiceEmailOutput - The return type for the sendInvoiceEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Resend } from 'resend';

const SendInvoiceEmailInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  customerEmail: z.string().describe('The email address of the customer.'),
  pcName: z.string().describe('The name of the PC rented.'),
  duration: z.string().describe('The duration of the rental session.'),
  amount: z.string().describe('The total cost of the rental.'),
  companyName: z.string().describe('The name of your rental company.'),
});
export type SendInvoiceEmailInput = z.infer<typeof SendInvoiceEmailInputSchema>;

const SendInvoiceEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was sent successfully.'),
  emailSubject: z.string().describe('The subject line of the email.'),
  emailBody: z.string().describe('The full body content of the email.'),
});
export type SendInvoiceEmailOutput = z.infer<
  typeof SendInvoiceEmailOutputSchema
>;

export async function sendInvoiceEmail(
  input: SendInvoiceEmailInput
): Promise<SendInvoiceEmailOutput> {
  return sendInvoiceEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sendInvoiceEmailPrompt',
  input: { schema: SendInvoiceEmailInputSchema },
  output: { schema: SendInvoiceEmailOutputSchema },
  prompt: `
    You are an email generating service. Your task is to generate a professional invoice email.
    
    Generate a subject and a body for an invoice email based on the following details.
    The email body should be plain text, not HTML.
    
    - Customer Name: {{{customerName}}}
    - Rented PC: {{{pcName}}}
    - Session Duration: {{{duration}}}
    - Total Amount: {{{amount}}}
    - Company Name: {{{companyName}}}
    
    The email should be friendly and clear.
    
    Crucially, you must always respond by setting 'success' to true in the output JSON.
    DO NOT add any markdown like \`\`\`json to your output.
  `,
});

const sendInvoiceEmailFlow = ai.defineFlow(
  {
    name: 'sendInvoiceEmailFlow',
    inputSchema: SendInvoiceEmailInputSchema,
    outputSchema: SendInvoiceEmailOutputSchema,
  },
  async (input) => {
    // 1. Generate the email content using AI
    console.log(`INFO: Generating email content for ${input.customerEmail}`);
    const { output } = await prompt(input);

    if (!output) {
      throw new Error('Failed to generate email content.');
    }

    // 2. Send the email using Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      console.log(`INFO: Sending email to ${input.customerEmail} via Resend.`);
      
      // IMPORTANT: To send emails, you must have a domain verified with Resend.
      // Replace 'onboarding@resend.dev' with an email from your verified domain.
      // Once your domain is verified, you can send emails to any address.
      const { data, error } = await resend.emails.send({
        from: 'ComRent <onboarding@resend.dev>', // TODO: Replace with your verified domain email, e.g., 'YourName <hello@yourdomain.com>'
        to: [input.customerEmail],
        subject: output.emailSubject,
        text: output.emailBody,
      });

      if (error) {
        console.error('Resend API Error:', error);
        // We will still return the generated content, but mark success as false
        return { ...output, success: false };
      }

      console.log('INFO: Email sent successfully via Resend:', data);
      return { ...output, success: true };

    } catch (e) {
      console.error('Failed to send email:', e);
      return { ...output, success: false };
    }
  }
);
