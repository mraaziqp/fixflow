import { Header } from '@/components/layout/header';
import { NewJobForm } from '@/components/jobs/new-job-form';
import type { SuspenseProps } from 'react';
import { Suspense } from 'react';

// Wrapper to make sure searchParams are passed in Suspense fallback
function NewJobFormWithParams(props: { searchParams: { [key: string]: string | string[] | undefined } }) {
  return <NewJobForm searchParams={props.searchParams} />;
}

export default function NewJobPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  return (
    <div className="flex flex-col h-full">
      <Header title="Create New Job" />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <Suspense fallback={<div>Loading...</div>}>
            <NewJobFormWithParams searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
