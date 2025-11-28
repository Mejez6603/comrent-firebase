'use server';
/**
 * @fileOverview An AI flow to generate and send an invoice email.
 *
 * - generateInvoiceEmail - Generates the content for an invoice email.
 * - sendGeneratedEmail - Sends a pre-generated email.
 * - GenerateInvoiceEmailInput - The input type for the generation function.
 * - GenerateInvoiceEmailOutput - The return type for the generation function.
 * - SendGeneratedEmailInput - The input type for the sending function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Resend } from 'resend';

// Schema for generating email content
const GenerateInvoiceEmailInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  pcName: z.string().describe('The name of the PC rented.'),
  duration: z.string().describe('The duration of the rental session.'),
  amount: z.string().describe('The total cost of the rental.'),
  companyName: z.string().describe('The name of your rental company.'),
});
export type GenerateInvoiceEmailInput = z.infer<typeof GenerateInvoiceEmailInputSchema>;

const GenerateInvoiceEmailOutputSchema = z.object({
  emailSubject: z.string().describe('The subject line of the email.'),
  emailBody: z.string().describe('The full body content of the email in plain text.'),
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

const emailGenerationPrompt = ai.definePrompt({
  name: 'generateInvoiceEmailPrompt',
  input: { schema: GenerateInvoiceEmailInputSchema },
  output: { format: "json", schema: GenerateInvoiceEmailOutputSchema },
  prompt: `
    You are an assistant that generates professional and friendly invoice emails.
    Your task is to create a subject and a plain text body for an invoice email based on the provided details.
    
    Generate the email for the following invoice:
    - Customer Name: {{{customerName}}}
    - Service: PC Rental ({{{pcName}}})
    - Session Duration: {{{duration}}}
    - Amount Due: {{{amount}}}
    - Company Name: {{{companyName}}}
  `,
});


const generateInvoiceEmailFlow = ai.defineFlow(
  {
    name: 'generateInvoiceEmailFlow',
    inputSchema: GenerateInvoiceEmailInputSchema,
    outputSchema: GenerateInvoiceEmailOutputSchema,
  },
  async (input) => {
    const response = await emailGenerationPrompt(input);
    const output = response.output;
    if (!output) {
      throw new Error('Failed to generate email content.');
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
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      console.log(`INFO: Sending email to ${input.customerEmail}`);
      const { data, error } = await resend.emails.send({
        from: input.fromAddress,
        to: [input.customerEmail],
        subject: input.emailSubject,
        text: input.emailBody,
      });

      if (error) {
        console.error('Resend API Error:', error);
        return { success: false, message: error.message };
      }

      console.log('INFO: Email sent successfully:', data);
      return { success: true, message: `Email sent successfully to ${input.customerEmail}` };
    } catch (e: any) {
      console.error('Failed to send email:', e);
      return { success: false, message: e.message || 'An unknown error occurred.' };
    }
  }
);

export async function sendGeneratedEmail(
    input: SendGeneratedEmailInput
  ): Promise<{ success: boolean, message: string }> {
    return sendGeneratedEmailFlow(input);
  }
