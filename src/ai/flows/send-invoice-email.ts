'use server';
/**
 * @fileOverview An AI flow to send a pre-generated invoice email.
 *
 * - sendGeneratedEmail - Sends a pre-generated email.
 * - GenerateInvoiceEmailOutput - The type for the email content.
 * - SendGeneratedEmailInput - The input type for the sending function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Resend } from 'resend';

// This is just a type definition now, as generation happens client-side.
const GenerateInvoiceEmailOutputSchema = z.object({
  emailSubject: z.string().describe('The final, generated email subject line.'),
  emailBody: z.string().describe('The final, generated email body.'),
});
export type GenerateInvoiceEmailOutput = z.infer<typeof GenerateInvoiceEmailOutputSchema>;


// Schema for sending the generated email
const SendGeneratedEmailInputSchema = z.object({
  customerEmail: z.string().describe("The recipient's email address."),
  emailSubject: z.string().describe('The subject line of the email.'),
  emailBody: z.string().describe('The body of the email.'),
  fromAddress: z.string().describe("The sender's email address (e.g., 'Your Company <no-reply@yourdomain.com>')"),
  paymentScreenshotUrl: z.string().optional().describe('The data URI of the payment screenshot to attach.'),
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
        console.error('Resend API key is missing.');
        // This return is crucial to prevent the "undefined" error.
        return { success: false, message: 'Server configuration error: Email service is not set up.' };
      }
      const resend = new Resend(process.env.RESEND_API_KEY);

      const attachments = [];
      if (input.paymentScreenshotUrl) {
        // Resend expects a Buffer, so we need to convert the base64 data URI
        const base64Data = input.paymentScreenshotUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        attachments.push({
          filename: 'payment-screenshot.png',
          content: buffer,
        });
      }

      console.log(`INFO: Sending email to ${input.customerEmail}`);
      const { data, error } = await resend.emails.send({
        from: input.fromAddress,
        to: [input.customerEmail],
        subject: input.emailSubject,
        text: input.emailBody,
        attachments: attachments,
      });

      if (error) {
        console.error('Resend API Error:', error);
        return { success: false, message: `Failed to send email: ${error.message}` };
      }

      console.log('INFO: Email sent successfully:', data);
      return { success: true, message: `Email sent successfully to ${input.customerEmail}` };
    } catch (e: any) {
      console.error('Failed to send email:', e);
      // This return is crucial to prevent the "undefined" error.
      return { success: false, message: e.message || 'An unknown error occurred while sending the email.' };
    }
  }
);

export async function sendGeneratedEmail(
    input: SendGeneratedEmailInput
  ): Promise<{ success: boolean, message: string }> {
    const result = await sendGeneratedEmailFlow(input);
    // Ensure we always return a valid object, even if the flow somehow fails unexpectedly.
    return result || { success: false, message: 'The email sending process failed unexpectedly.' };
  }
