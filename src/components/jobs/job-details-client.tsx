'use client';

import { useState, useTransition } from 'react';
import type { JobWithRelations, JobStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User, Smartphone, Wrench, DollarSign, Hash, Clock, Tag, MessageSquare, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { updateJobStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

type JobDetailsClientProps = {
  job: JobWithRelations;
};

type NotificationInfo = {
    shouldNotify: boolean;
    message?: string;
    whatsAppUrl?: string;
}

export function JobDetailsClient({ job: initialJob }: JobDetailsClientProps) {
  const [job, setJob] = useState(initialJob);
  const [currentStatus, setCurrentStatus] = useState<JobStatus>(job.status);
  const [notification, setNotification] = useState<NotificationInfo | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleStatusChange = (newStatus: JobStatus) => {
    setCurrentStatus(newStatus);
    setNotification(null); // Clear previous notification when status changes
  };

  const handleUpdateStatus = () => {
    startTransition(async () => {
      try {
        const result = await updateJobStatus(job.id, currentStatus);
        setJob(prev => ({...prev, status: currentStatus, updatedAt: new Date().toISOString()}));
        
        if (result.shouldNotify) {
            setNotification(result);
            toast({ title: 'Notification Ready', description: 'A notification for the customer has been prepared.' });
        } else {
            toast({ title: 'Status Updated', description: `Job status changed to ${currentStatus}.` });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update job status.' });
      }
    });
  };

  const statusOptions: JobStatus[] = ['To Do', 'Waiting', 'Ready', 'Done'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold">Job ID: <span className="font-code">{job.id}</span></h1>
            <p className="text-muted-foreground">Last updated: {format(new Date(job.updatedAt), "PPP p")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select onValueChange={(value: JobStatus) => handleStatusChange(value)} defaultValue={currentStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Change status..." />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(status => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleUpdateStatus} disabled={currentStatus === job.status || isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update
          </Button>
        </div>
      </div>
      
      {notification?.shouldNotify && notification.whatsAppUrl && (
         <Alert className="border-accent">
            <MessageSquare className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent">Customer Notification Ready!</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <p>Click to send the update via WhatsApp.</p>
              <Button asChild variant="outline" size="sm">
                <Link href={notification.whatsAppUrl} target="_blank">
                  Notify Customer
                </Link>
              </Button>
            </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wrench className="text-primary"/> Job Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-muted-foreground">Description</h3>
              <p>{job.description}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h3 className="font-semibold text-muted-foreground flex items-center gap-2"><Tag className="w-4 h-4"/> Tags</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {job.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-muted-foreground flex items-center gap-2"><Hash className="w-4 h-4"/> Urgency</h3>
                    <p className="capitalize">{job.urgency}</p>
                </div>
                 <div>
                    <h3 className="font-semibold text-muted-foreground flex items-center gap-2"><DollarSign className="w-4 h-4"/> Cost</h3>
                    <p>${job.cost.toFixed(2)}</p>
                </div>
                 <div>
                    <h3 className="font-semibold text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4"/> Created</h3>
                    <p>{format(new Date(job.createdAt), "PPP")}</p>
                </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="text-primary"/> Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Name:</strong> {job.customer.name}</p>
              <p><strong>Phone:</strong> {job.customer.phone}</p>
              <p><strong>Email:</strong> {job.customer.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Smartphone className="text-primary"/> Device Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Model:</strong> {job.device.model}</p>
              <p><strong>Serial:</strong> <span className="font-code">{job.device.serialNumber}</span></p>
              <p><strong>Type:</strong> {job.device.type}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
