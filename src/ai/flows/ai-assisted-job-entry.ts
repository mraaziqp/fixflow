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
  issueDescription: z.string().describe("A description of the issue with the device, provided by the technician."),
});

export type AIAssistedJobEntryInput = z.infer<typeof AIAssistedJobEntryInputSchema>;

const AIAssistedJobEntryOutputSchema = z.object({
  tags: z.array(z.string()).describe("An array of 1-3 technical issue tags (e.g., 'HDMI', 'Power Supply', 'Disc Drive')."),
  urgency: z.enum(['low', 'medium', 'high']).describe("The urgency level for the job, suggested by the AI based on keywords (e.g., 'urgent', 'ASAP' = High)."),
  summary: z.string().describe('A 5-word summary of the issue for a title.'),
});

export type AIAssistedJobEntryOutput = z.infer<typeof AIAssistedJobEntryOutputSchema>;

export async function aiAssistedJobEntry(input: AIAssistedJobEntryInput): Promise<AIAssistedJobEntryOutput> {
  return aiAssistedJobEntryFlow(input);
}

const aiAssistedJobEntryPrompt = ai.definePrompt({
  name: 'aiAssistedJobEntryPrompt',
  input: {schema: AIAssistedJobEntryInputSchema},
  output: {schema: AIAssistedJobEntryOutputSchema},
  prompt: `You are a console repair expert. Analyze this technician's raw note: "{{{issueDescription}}}".
      
      Tasks:
      1. Extract 1-3 technical issue tags (e.g., 'HDMI', 'Power Supply', 'Disc Drive').
      2. Determine urgency based on keywords (e.g., 'urgent', 'ASAP' = High).
      3. Summarize the issue in 5 words for a title.`,
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

    