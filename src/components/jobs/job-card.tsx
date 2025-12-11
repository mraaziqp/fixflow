'use client';

import { useState } from 'react';
import type { JobWithRelations, JobStatus } from '@/lib/types';
import { updateJobStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Clock, AlertCircle, MessageCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface JobCardProps {
  job: JobWithRelations;
  customerPhone?: string;
}

export function JobCard({ job, customerPhone }: JobCardProps) {
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const statusColors: { [key in JobStatus]: string } = {
    'To Do': 'border-l-blue-500',
    'Waiting': 'border-l-purple-500',
    'Ready': 'border-l-yellow-500',
    'Done': 'border-l-green-500',
  };
  
  const statusSelectBg: { [key in JobStatus]: string } = {
    'To Do': 'bg-blue-500/10 text-blue-300 border-blue-500/50',
    'Waiting': 'bg-purple-500/10 text-purple-300 border-purple-500/50',
    'Ready': 'bg-yellow-500/10 text-yellow-300 border-yellow-500/50',
    'Done': 'bg-green-500/10 text-green-300 border-green-500/50',
  }

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (newStatus === job.status) return;
    setUpdating(true);
    try {
        const result = await updateJobStatus(job.id, newStatus);
        
        if (result.shouldNotify && result.whatsAppUrl) {
            toast({ 
              title: 'Status Updated & Notification Ready', 
              description: 'A customer notification has been prepared.'
            });
        } else {
            toast({ title: 'Status Updated', description: `Job status changed to ${newStatus}.` });
        }
    } catch (err) {
      console.error("Status update failed", err);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update status.' });
    } finally {
      setUpdating(false);
    }
  };

  const getWhatsAppLink = () => {
    if (!customerPhone) return '#';
    
    const cleanPhone = customerPhone.replace(/\D/g, '');
    
    const message = `Hi ${job.customer.name}, great news! Your ${job.device.model} is ready for collection! 
Job Reference: #${job.id.slice(0, 5)}. 
Total: $${job.cost.toFixed(2)}.`;
    
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const statusOptions: JobStatus[] = ['To Do', 'Waiting', 'Ready', 'Done'];

  return (
    <div className={`relative p-4 rounded-r-lg border-l-4 shadow-sm h-full flex flex-col justify-between transition-all bg-card hover:bg-secondary/50 hover:shadow-primary/10 ${statusColors[job.status] || 'bg-card'}`}>
      
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <Link href={`/jobs/${job.id}`}>
              <h3 className="font-bold text-lg hover:underline">{job.customer.name}</h3>
            </Link>
            <p className="text-muted-foreground text-sm">{job.ai_summary || job.device.model}</p>
          </div>
          <Link href={`/device/${job.deviceId}`} className="font-code text-xs text-muted-foreground hover:text-primary">#{job.id.slice(0, 5)}</Link>
        </div>

        <div className="flex flex-wrap gap-2 my-4">
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
      </div>

      <div className="flex justify-between items-center mt-2 border-t border-border pt-3 gap-2">
        <div className="flex items-center text-xs text-muted-foreground gap-1 min-w-[80px]">
          <Clock size={12} />
          <span>{job.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : 'N/A'}</span>
        </div>

        <div className="flex items-center gap-2 w-full justify-end">
            {job.status === 'Done' && customerPhone && (
                <a 
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-3 rounded-md flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all"
                >
                <MessageCircle size={14} />
                <span>Notify</span>
                </a>
            )}
            
            <select
                value={job.status}
                onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
                disabled={updating}
                className={`bg-background text-xs p-2 rounded-md border focus:border-primary focus:ring-primary outline-none uppercase font-bold tracking-wider transition-colors ${
                    statusSelectBg[job.status]
                } ${
                    job.status === 'Done' ? 'w-auto' : 'flex-1'
                }`}
            >
            {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
            ))}
            </select>
        </div>
      </div>
    </div>
  );
}
