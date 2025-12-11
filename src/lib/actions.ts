'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { aiAssistedJobEntry } from '@/ai/flows/ai-assisted-job-entry';
import { intelligentJobStatusNotification } from '@/ai/flows/intelligent-job-status-notifications';
import { getJobById } from './data';
import { JobStatus } from './types';
import { db } from '@/firebase/client';
import { collection, addDoc, Timestamp, query, where, getDocs, doc } from 'firebase/firestore';


const NewJobSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  deviceSerial: z.string().min(1, 'Device serial is required'),
  deviceModel: z.string().min(1, 'Device model is required'),
  issueDescription: z.string().min(10, 'Please provide a detailed description'),
  tags: z.array(z.string()),
  urgency: z.enum(['low', 'medium', 'high']),
});

export async function createNewJob(formData: FormData) {
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

  const {
    customerName,
    customerPhone,
    customerEmail,
    deviceSerial,
    deviceModel,
    issueDescription,
    tags,
    urgency,
  } = validatedFields.data;

  try {
    let customerId = '';
    const customerQuery = query(collection(db, 'customers'), where('phone', '==', customerPhone));
    const customerSnap = await getDocs(customerQuery);
    
    if (!customerSnap.empty) {
        customerId = customerSnap.docs[0].id;
    } else {
        const customerRef = await addDoc(collection(db, 'customers'), {
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            createdAt: Timestamp.now(),
        });
        customerId = customerRef.id;
        // Also update the ID inside the document
        await addDoc(doc(db, 'customers', customerId), { id: customerId }, { merge: true });
    }
    
    let deviceId = '';
    const deviceQuery = query(collection(db, 'devices'), where('serialNumber', '==', deviceSerial));
    const deviceSnap = await getDocs(deviceQuery);

    if (!deviceSnap.empty) {
        deviceId = deviceSnap.docs[0].id;
    } else {
        const deviceRef = await addDoc(collection(db, 'devices'), {
            serialNumber: deviceSerial,
            model: deviceModel,
            type: 'Other', // Default type
            customerId: customerId,
        });
        deviceId = deviceRef.id;
        await addDoc(doc(db, 'devices', deviceId), { id: deviceId }, { merge: true });
    }
    
    const jobRef = await addDoc(collection(db, 'jobs'), {
        customerId,
        deviceId,
        description: issueDescription,
        tags,
        urgency,
        status: 'To Do',
        cost: 0, // Default cost
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    await addDoc(doc(db, 'jobs', jobRef.id), { id: jobRef.id }, { merge: true });

  } catch (error) {
    console.error("Error creating new job:", error);
    return {
        errors: { _form: ['An unexpected error occurred.'] }
    };
  }
  
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
    
    // In a real app, you would fetch from the database. Here we use mock data.
    const job = getJobById(jobId);
    if (!job) {
        throw new Error('Job not found');
    }
    
    const previousStatus = job.status;

    // Mock update
    job.status = newStatus;
    job.updatedAt = new Date().toISOString();

    let notificationData: { shouldNotify: boolean, message?: string, whatsAppUrl?: string } = {
        shouldNotify: false
    };

    if (newStatus !== previousStatus) {
        try {
            const result = await intelligentJobStatusNotification({
                jobStatus: newStatus,
                previousJobStatus: previousStatus,
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
        } catch (e) {
            console.error("Error with AI notification flow", e);
        }
    }


    revalidatePath('/dashboard');
    revalidatePath(`/jobs/${jobId}`);
    return notificationData;
}
