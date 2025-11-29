'use server';
/**
 * @fileOverview An AI flow to generate and send an invoice email.
 *
 * - sendGeneratedEmail - Sends a pre-generated email.
 * - SendGeneratedEmailInput - The input type for the sending function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Resend } from 'resend';

// Schema for sending the generated email
const SendGeneratedEmailInputSchema = z.object({
  customerEmail: z.string().describe("The recipient's email address."),
  emailSubject: z.string().describe('The subject line of the email.'),
  emailBody: z.string().describe('The body of the email.'),
  fromAddress: z.string().describe("The sender's email address (e.g., 'Your Company <no-reply@yourdomain.com>')")
});
export type SendGeneratedEmailInput = z.infer<typeof SendGeneratedEmailInputSchema>;


const sendGeneratedEmailFlow = ai.defineFlow(
  {
    name: 'sendGeneratedEmailFlow',
    inputSchema: SendGeneratedEmailInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (input) => {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured in environment variables.');
      }
      const resend = new Resend(process.env.RESEND_API_KEY);

      console.log(`INFO: Sending email to ${input.customerEmail}`);
      const { data, error } = await resend.emails.send({
        from: input.fromAddress,
        to: [input.customerEmail],
        subject: input.emailSubject,
        text: input.emailBody, // Use text instead of html for simplicity, as our current template is text-based
      });

      if (error) {
        console.error('Resend API Error:', error);
        return { success: false, message: error.message };
      }

      console.log('INFO: Email sent successfully:', data);
      return { success: true, message: `Email sent successfully to ${input.customerEmail}` };
    } catch (e: any) {
      console.error('Failed to send email:', e);
      // Ensure that even in case of an exception, we return a structured error.
      return { success: false, message: e.message || 'An unknown error occurred.' };
    }
  }
);

export async function sendGeneratedEmail(
    input: SendGeneratedEmailInput
  ): Promise<{ success: boolean, message: string }> {
    return sendGeneratedEmailFlow(input);
  }