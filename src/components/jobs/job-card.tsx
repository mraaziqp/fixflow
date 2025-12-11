'use client';

import { useState } from 'react';
import type { JobWithRelations, JobStatus } from '@/lib/types';
import { updateJobStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface JobCardProps {
  job: JobWithRelations;
}

export function JobCard({ job }: JobCardProps) {
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const statusColors: { [key in JobStatus]: string } = {
    'To Do': 'border-l-blue-500',
    'Waiting': 'border-l-purple-500',
    'Ready': 'border-l-yellow-500',
    'Done': 'border-l-green-500 opacity-75',
  };
  
  const urgencyColor = {
    low: 'border-green-400',
    medium: 'border-yellow-400',
    high: 'border-red-400',
  };


  const handleStatusChange = async (newStatus: JobStatus) => {
    if (newStatus === job.status) return;
    setUpdating(true);
    try {
        const result = await updateJobStatus(job.id, newStatus);
        
        if (result.shouldNotify) {
            toast({ title: 'Status Updated & Notification Ready', description: 'A customer notification has been prepared.' });
        } else {
            toast({ title: 'Status Updated', description: `Job status changed to ${newStatus}.` });
        }
        // The page will re-render due to revalidation from the server action
    } catch (err) {
      console.error("Status update failed", err);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update status.' });
    } finally {
      setUpdating(false);
    }
  };

  const statusOptions: JobStatus[] = ['To Do', 'Waiting', 'Ready', 'Done'];

  return (
    <div className={`relative p-4 rounded-r-lg border-l-4 shadow-sm mb-3 transition-all bg-card ${statusColors[job.status]}`}>
      
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg">{job.customer.name}</h3>
          <p className="text-muted-foreground text-sm">{job.device.model}</p>
        </div>
        <span className="font-code text-xs text-muted-foreground">#{job.id.slice(0, 5)}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {job.tags?.map((tag: string, i: number) => (
          <span key={i} className="px-2 py-0.5 bg-secondary rounded text-xs text-secondary-foreground border border-border">
            {tag}
          </span>
        ))}
        {job.urgency === 'high' && (
          <span className="px-2 py-0.5 bg-destructive/20 text-red-200 rounded text-xs border border-destructive/50 flex items-center gap-1">
            <AlertCircle size={10} /> Urgent
          </span>
        )}
      </div>

      <div className="flex justify-between items-center mt-2 border-t border-border pt-3">
        <div className="flex items-center text-xs text-muted-foreground gap-1">
          <Clock size={12} />
          <span>{format(new Date(job.createdAt), "dd/MM/yyyy")}</span>
        </div>

        <select
          value={job.status}
          onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
          disabled={updating}
          className="bg-background text-xs p-2 rounded border border-input focus:border-primary outline-none uppercase font-bold tracking-wider"
        >
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
