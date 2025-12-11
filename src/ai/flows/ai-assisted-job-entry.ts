'use server';
/**
 * @fileOverview This file defines a Genkit flow for AI-assisted job entry, allowing technicians to use voice or text input to generate relevant tags and urgency levels for a job.
 *
 * @interface AIAssistedJobEntryInput - Defines the input schema for the AI-assisted job entry flow.
 * @interface AIAssistedJobEntryOutput - Defines the output schema for the AI-assisted job entry flow.
 * @function aiAssistedJobEntry - The main function that triggers the AI-assisted job entry flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIAssistedJobEntryInputSchema = z.object({
  issueDescription: z.string().describe('A description of the issue with the device, provided by the technician.'),
});

export type AIAssistedJobEntryInput = z.infer<typeof AIAssistedJobEntryInputSchema>;

const AIAssistedJobEntryOutputSchema = z.object({
  tags: z.array(z.string()).describe('An array of relevant tags for the job, suggested by the AI.'),
  urgency: z.enum(['low', 'medium', 'high']).describe('The urgency level for the job, suggested by the AI.'),
});

export type AIAssistedJobEntryOutput = z.infer<typeof AIAssistedJobEntryOutputSchema>;

export async function aiAssistedJobEntry(input: AIAssistedJobEntryInput): Promise<AIAssistedJobEntryOutput> {
  return aiAssistedJobEntryFlow(input);
}

const aiAssistedJobEntryPrompt = ai.definePrompt({
  name: 'aiAssistedJobEntryPrompt',
  input: {schema: AIAssistedJobEntryInputSchema},
  output: {schema: AIAssistedJobEntryOutputSchema},
  prompt: `You are an AI assistant helping technicians to quickly create job entries by suggesting relevant tags and urgency levels based on their descriptions of the issue.

  Based on the following issue description: {{{issueDescription}}}
  Suggest relevant tags and an urgency level for the job.  The urgency should be 'low', 'medium', or 'high'.
  The tags should be short and relevant to the issue.  Return a JSON object with the tags and urgency.
  `,
});

const aiAssistedJobEntryFlow = ai.defineFlow(
  {
    name: 'aiAssistedJobEntryFlow',
    inputSchema: AIAssistedJobEntryInputSchema,
    outputSchema: AIAssistedJobEntryOutputSchema,
  },
  async input => {
    const {output} = await aiAssistedJobEntryPrompt(input);
    return output!;
  }
);
