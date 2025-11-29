'use server';
/**
 * @fileOverview An AI flow to generate and send an invoice email.
 *
 * - generateInvoiceEmail - Generates the content for an invoice email using a template.
 * - sendGeneratedEmail - Sends a pre-generated email.
 * - GenerateInvoiceEmailInput - The input type for the generation function.
 * - GenerateInvoiceEmailOutput - The return type for the generation function.
 * - SendGeneratedEmailInput - The input type for the sending function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Resend } from 'resend';

// Schemas for generating the email content
const GenerateInvoiceEmailInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  pcName: z.string().describe('The name of the PC that was rented.'),
  duration: z.string().describe('The duration of the rental session (e.g., "1 hour").'),
  amount: z.string().describe('The total amount paid for the session (e.g., "₱15.00").'),
  companyName: z.string().describe('The name of the rental company.'),
  subjectTemplate: z.string().describe('The master template for the email subject line.'),
  bodyTemplate: z.string().describe('The master template for the email body.'),
});
export type GenerateInvoiceEmailInput = z.infer<typeof GenerateInvoiceEmailInputSchema>;

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
  fromAddress: z.string().describe("The sender's email address (e.g., 'Your Company <no-reply@yourdomain.com>')")
});
export type SendGeneratedEmailInput = z.infer<typeof SendGeneratedEmailInputSchema>;


const generateInvoicePrompt = ai.definePrompt({
    name: 'generateInvoicePrompt',
    input: { schema: GenerateInvoiceEmailInputSchema },
    output: { schema: GenerateInvoiceEmailOutputSchema },
    prompt: `You are an assistant that populates email templates.
    
    Given the following subject and body templates, and the user's session data, generate the final email content.
    Replace all placeholders like {{placeholder}} with the provided data.
    
    Subject Template: {{{subjectTemplate}}}
    Body Template: {{{bodyTemplate}}}
    
    Data:
    - Customer Name: {{customerName}}
    - PC Name: {{pcName}}
    - Duration: {{duration}}
    - Amount: {{amount}}
    - Company Name: {{companyName}}
    `,
});

const generateInvoiceEmailFlow = ai.defineFlow(
    {
      name: 'generateInvoiceEmailFlow',
      inputSchema: GenerateInvoiceEmailInputSchema,
      outputSchema: GenerateInvoiceEmailOutputSchema,
    },
    async (input) => {
      const { output } = await generateInvoicePrompt(input);
      if (!output) {
        throw new Error('Failed to generate invoice email content.');
      }
      return output;
    }
);

export async function generateInvoiceEmail(
    input: GenerateInvoiceEmailInput
  ): Promise<GenerateInvoiceEmailOutput> {
    return generateInvoiceEmailFlow(input);
}


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
        return { success: false, message: 'Server configuration error: Email service is not set up.' };
      }
      const resend = new Resend(process.env.RESEND_API_KEY);

      console.log(`INFO: Sending email to ${input.customerEmail}`);
      const { data, error } = await resend.emails.send({
        from: input.fromAddress,
        to: [input.customerEmail],
        subject: input.emailSubject,
        text: input.emailBody, // Use text instead of html for simplicity
      });

      if (error) {
        console.error('Resend API Error:', error);
        return { success: false, message: `Failed to send email: ${error.message}` };
      }

      console.log('INFO: Email sent successfully:', data);
      return { success: true, message: `Email sent successfully to ${input.customerEmail}` };
    } catch (e: any) {
      console.error('Failed to send email:', e);
      return { success: false, message: e.message || 'An unknown error occurred while sending the email.' };
    }
  }
);

export async function sendGeneratedEmail(
    input: SendGeneratedEmailInput
  ): Promise<{ success: boolean, message: string }> {
    return sendGeneratedEmailFlow(input);
  }
