'use server';
/**
 * @fileOverview An AI flow to generate and "send" an invoice email.
 *
 * - sendInvoiceEmail - A function that handles generating the email content.
 * - SendInvoiceEmailInput - The input type for the sendInvoiceEmail function.
 * - SendInvoiceEmailOutput - The return type for the sendInvoiceEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

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
    You are an email sending service. Your task is to generate a professional invoice email.
    
    Generate a subject and a body for an invoice email based on the following details.
    
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
    // In a real application, you would add logic here to use a service like
    // SendGrid, Resend, or Nodemailer to actually send the email.
    // For now, we will just generate the content and return success.

    console.log(`INFO: Simulating sending email to ${input.customerEmail}`);

    const { output } = await prompt(input);
    
    // Simulate a short delay for sending the email
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`INFO: Email content generated for ${input.customerEmail}`);
    console.log('Subject:', output!.emailSubject);
    console.log('Body:', output!.emailBody);

    return output!;
  }
);
