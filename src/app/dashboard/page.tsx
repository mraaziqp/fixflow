'use client';

import { useState, useEffect } from 'react';
import { getJobsWithRelations } from '@/lib/data';
import type { JobWithRelations, JobStatus } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { JobCard } from '@/components/jobs/job-card';
import { Button } from '@/components/ui/button';
import { Filter, Loader2 } from 'lucide-react';
import { customers as mockCustomers } from '@/lib/data';

type Tab = 'To Do' | 'Waiting' | 'Ready' | 'Done';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('To Do');
  const [jobs, setJobs] = useState<JobWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Record<string, { name: string; phone: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Real-time Jobs (mocked) and Customers
  useEffect(() => {
    const allJobs = getJobsWithRelations();
    setJobs(allJobs);

    const map: Record<string, { name: string; phone: string }> = {};
    mockCustomers.forEach(customer => {
        map[customer.id] = { name: customer.name, phone: customer.phone };
    });
    setCustomers(map);

    setLoading(false);
  }, []);


  // 3. Filter Logic (Search + Tabs)
  const filteredJobs = jobs.filter(job => {
    const custName = customers[job.customer.id]?.name?.toLowerCase() || '';
    const matchesSearch = custName.includes(searchTerm.toLowerCase()) || 
                          job.id.includes(searchTerm) || 
                          job.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (searchTerm && !matchesSearch) return false;

    // Tab Logic
    if (activeTab === 'To Do') return job.status === 'To Do';
    if (activeTab === 'Waiting') return job.status === 'Waiting';
    if (activeTab === 'Ready') return job.status === 'Ready';
    if (activeTab === 'Done') return job.status === 'Done';
    return false;
  });

  const getJobCountForTab = (tab: Tab) => {
    return jobs.filter(j => {
       if (tab === 'To Do') return j.status === 'To Do';
       if (tab === 'Waiting') return j.status === 'Waiting';
       if (tab === 'Ready') return j.status === 'Ready';
       if (tab === 'Done') return j.status === 'Done';
       return false;
    }).length;
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Action Dashboard" />
      
      <div className="border-b border-border px-4 md:px-6">
        <div className="flex p-1 bg-muted rounded-lg my-4">
          {(['To Do', 'Waiting', 'Ready', 'Done'] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'secondary': 'ghost'}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 text-sm font-bold rounded-md capitalize transition-all"
            >
              {tab}
              <span className="ml-2 px-1.5 py-0.5 bg-background/50 rounded-full text-xs opacity-80">
                {getJobCountForTab(tab)}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
            <Filter size={48} className="mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No Jobs Here</h3>
            <p>There are no jobs in the '{activeTab}' stage.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job}
                customerPhone={customers[job.customer.id]?.phone}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
