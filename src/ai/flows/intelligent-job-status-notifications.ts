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
import {JobStatus} from '@/lib/types';

const jobStatuses: [JobStatus, ...JobStatus[]] = ['To Do', 'Waiting', 'Ready', 'Done'];

const IntelligentJobStatusNotificationInputSchema = z.object({
  jobStatus: z.enum(jobStatuses).describe('The new status of the job.'),
  previousJobStatus: z.enum(jobStatuses).describe('The previous status of the job.'),
  customerName: z.string().describe('The name of the customer.'),
  device: z.string().describe('The device being serviced.'),
  cost: z.number().describe('The cost of the job.'),
  jobId: z.string().describe('The ID of the job.'),
});
export type IntelligentJobStatusNotificationInput = z.infer<typeof IntelligentJobStatusNotificationInputSchema>;

const IntelligentJobStatusNotificationOutputSchema = z.object({
  shouldNotify: z.boolean().describe('Whether a notification should be sent to the customer.'),
  notificationMessage: z.string().optional().describe('The message to send to the customer, if any.'),
});
export type IntelligentJobStatusNotificationOutput = z.infer<typeof IntelligentJobStatusNotificationOutputSchema>;

const AINotificationSchema = z.object({
  notify: z.boolean(),
  whatsapp_draft: z.string().optional(),
});

export async function intelligentJobStatusNotification(
  input: IntelligentJobStatusNotificationInput
): Promise<IntelligentJobStatusNotificationOutput> {
  return intelligentJobStatusNotificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentJobStatusNotificationPrompt',
  input: {schema: IntelligentJobStatusNotificationInputSchema},
  output: {schema: AINotificationSchema},
  prompt: `You are a workshop assistant. 
The status of a repair for {{{customerName}}}'s {{{device}}} changed from {{{previousJobStatus}}} to {{{jobStatus}}}.
Should we notify the customer? 
If yes, draft a short, friendly WhatsApp message (under 20 words).
If the status is 'Waiting', we MUST notify them that parts are ordered.`,
});

const intelligentJobStatusNotificationFlow = ai.defineFlow(
  {
    name: 'intelligentJobStatusNotificationFlow',
    inputSchema: IntelligentJobStatusNotificationInputSchema,
    outputSchema: IntelligentJobStatusNotificationOutputSchema,
  },
  async input => {
    // 1. HARD CODED RULES (For speed/safety)
    // Always notify on completion ('Ready' or 'Done')
    if (input.jobStatus === 'Done' || input.jobStatus === 'Ready') {
      return {
        shouldNotify: true,
        notificationMessage: `Hi ${input.customerName}, great news! Your ${input.device} is ready for collection. Total: $${input.cost.toFixed(2)}. Job ID: ${input.jobId}.`,
      };
    }

    // Never notify for internal movements ('To Do')
    if (input.jobStatus === 'To Do') {
      return {shouldNotify: false};
    }

    // 2. AI JUDGMENT (For edge cases, e.g., 'Waiting')
    const {output: aiResult} = await prompt(input);

    if (aiResult?.notify && aiResult.whatsapp_draft) {
      return {
        shouldNotify: true,
        notificationMessage: aiResult.whatsapp_draft,
      };
    }

    return {shouldNotify: false};
  }
);
