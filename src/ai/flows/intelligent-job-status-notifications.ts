'use server';

/**
 * @fileOverview This file defines a Genkit flow for intelligently determining if a job status change warrants a customer notification.
 *
 * - intelligentJobStatusNotification - A function that determines whether to send a notification to the customer based on the job status.
 * - IntelligentJobStatusNotificationInput - The input type for the intelligentJobStatusNotification function.
 * - IntelligentJobStatusNotificationOutput - The return type for the intelligentJobStatusNotification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentJobStatusNotificationInputSchema = z.object({
  jobStatus: z.string().describe('The new status of the job.'),
  jobDetails: z.string().describe('Details about the job, such as description and any issues.'),
  customerName: z.string().describe('The name of the customer.'),
  device: z.string().describe('The device being serviced.'),
  cost: z.number().describe('The cost of the job.'),
  jobId: z.string().describe('The ID of the job.'),
});
export type IntelligentJobStatusNotificationInput = z.infer<
  typeof IntelligentJobStatusNotificationInputSchema
>;

const IntelligentJobStatusNotificationOutputSchema = z.object({
  shouldNotify: z.boolean().describe('Whether a notification should be sent to the customer.'),
  notificationMessage: z
    .string()
    .optional()
    .describe('The message to send to the customer, if any.'),
});
export type IntelligentJobStatusNotificationOutput = z.infer<
  typeof IntelligentJobStatusNotificationOutputSchema
>;

export async function intelligentJobStatusNotification(
  input: IntelligentJobStatusNotificationInput
): Promise<IntelligentJobStatusNotificationOutput> {
  return intelligentJobStatusNotificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentJobStatusNotificationPrompt',
  input: {schema: IntelligentJobStatusNotificationInputSchema},
  output: {schema: IntelligentJobStatusNotificationOutputSchema},
  prompt: `Based on the following job status, details, and customer information, determine if a notification should be sent to the customer.

Job Status: {{{jobStatus}}}
Job Details: {{{jobDetails}}}
Customer Name: {{{customerName}}}
Device: {{{device}}}
Cost: {{{cost}}}
Job ID: {{{jobId}}}

Consider whether the status change is significant enough to warrant a notification.  If the status is "Done", notify the customer.  If the job details suggest an unexpected delay or additional cost, consider notifying the customer as well. If a notification is warranted, create a suitable notification message.

Return a JSON object indicating whether a notification should be sent and, if so, the content of the notification.`,
});

const intelligentJobStatusNotificationFlow = ai.defineFlow(
  {
    name: 'intelligentJobStatusNotificationFlow',
    inputSchema: IntelligentJobStatusNotificationInputSchema,
    outputSchema: IntelligentJobStatusNotificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
