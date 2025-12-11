import { Header } from '@/components/layout/header';
import { getJobById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { JobDetailsClient } from '@/components/jobs/job-details-client';

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const job = getJobById(params.id);

  if (!job) {
    notFound();
  }

  return (
    <div className="flex flex-col h-full">
      <Header title={`Job Details`} />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <JobDetailsClient job={job} />
      </main>
    </div>
  );
}
