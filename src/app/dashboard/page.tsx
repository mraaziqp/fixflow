import { Header } from '@/components/layout/header';
import { getJobsWithRelations } from '@/lib/data';
import { KanbanBoard } from '@/components/dashboard/kanban-board';

export default function DashboardPage() {
  const jobs = getJobsWithRelations();

  return (
    <div className="flex flex-col h-full">
      <Header title="Action Dashboard" />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <KanbanBoard jobs={jobs} />
      </main>
    </div>
  );
}
