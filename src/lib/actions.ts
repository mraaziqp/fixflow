'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { aiAssistedJobEntry } from '@/ai/flows/ai-assisted-job-entry';
import { intelligentJobStatusNotification } from '@/ai/flows/intelligent-job-status-notifications';
import { getJobById } from './data';
import { JobStatus } from './types';

const NewJobSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  customerEmail: z.string().email('Invalid email address'),
  deviceSerial: z.string().min(1, 'Device serial is required'),
  deviceModel: z.string().min(1, 'Device model is required'),
  issueDescription: z.string().min(10, 'Please provide a detailed description'),
  tags: z.array(z.string()),
  urgency: z.enum(['low', 'medium', 'high']),
});

export async function createNewJob(formData: FormData) {
  // This is a mock action. In a real app, you would validate and save to a database.
  const validatedFields = NewJobSchema.safeParse({
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    customerEmail: formData.get('customerEmail'),
    deviceSerial: formData.get('deviceSerial'),
    deviceModel: formData.get('deviceModel'),
    issueDescription: formData.get('issueDescription'),
    tags: formData.getAll('tags'),
    urgency: formData.get('urgency'),
  });

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  // Here you would add the new job to the database.
  console.log('New job created:', validatedFields.data);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function getAIAssistance(issueDescription: string) {
  if (!issueDescription || issueDescription.length < 10) {
    return { error: 'Please provide a more detailed description.' };
  }
  try {
    const result = await aiAssistedJobEntry({ issueDescription });
    return { data: result };
  } catch (error) {
    console.error('AI assistance failed:', error);
    return { error: 'Failed to get AI assistance. Please try again.' };
  }
}

export async function updateJobStatus(jobId: string, newStatus: JobStatus) {
    // This is a mock function. In a real app this would update the database.
    console.log(`Updating job ${jobId} to ${newStatus}`);
    
    const job = getJobById(jobId);
    if (!job) {
        throw new Error('Job not found');
    }

    job.status = newStatus;
    job.updatedAt = new Date().toISOString();

    let notificationData: { shouldNotify: boolean, message?: string, whatsAppUrl?: string } = {
        shouldNotify: false
    };

    if (newStatus === 'Ready' || newStatus === 'Done') {
        const result = await intelligentJobStatusNotification({
            jobStatus: newStatus,
            jobDetails: job.description,
            customerName: job.customer.name,
            device: job.device.model,
            cost: job.cost,
            jobId: job.id,
        });

        if (result.shouldNotify && result.notificationMessage) {
            notificationData.shouldNotify = true;
            notificationData.message = result.notificationMessage;
            const whatsAppUrl = `https://wa.me/${job.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(result.notificationMessage)}`;
            notificationData.whatsAppUrl = whatsAppUrl;
        }
    }

    revalidatePath('/dashboard');
    revalidatePath(`/jobs/${jobId}`);
    return notificationData;
}
