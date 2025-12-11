'use client';

import type { JobWithRelations, JobStatus } from '@/lib/types';
import { JobCard } from '@/components/jobs/job-card';

type KanbanBoardProps = {
  jobs: JobWithRelations[];
};

const columns: JobStatus[] = ['To Do', 'Waiting', 'Ready'];

export function KanbanBoard({ jobs }: KanbanBoardProps) {
  
  const jobsByStatus = (status: JobStatus) => {
    return jobs.filter(job => job.status === status);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full items-start">
      {columns.map((status) => (
        <div key={status} className="flex flex-col gap-4 bg-card/50 p-4 rounded-lg h-full">
          <h2 className="text-lg font-bold text-primary tracking-wider">{status} ({jobsByStatus(status).length})</h2>
          <div className="flex flex-col gap-4 overflow-y-auto">
            {jobsByStatus(status).length > 0 ? (
              jobsByStatus(status).map((job) => <JobCard key={job.id} job={job} />)
            ) : (
              <p className="text-muted-foreground text-sm italic">No jobs in this stage.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
