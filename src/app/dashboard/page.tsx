'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { JobStatus } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { JobCard } from '@/components/jobs/job-card';
import { Button } from '@/components/ui/button';
import { Filter, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Tab = 'To Do' | 'Waiting' | 'Ready' | 'Done';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('To Do');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Record<string, { name: string; phone: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Real-time Jobs
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching jobs:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Customer Names & Phones
  useEffect(() => {
    const fetchCustomers = async () => {
      const snap = await getDocs(collection(db, 'customers'));
      const map: Record<string, { name: string, phone: string }> = {};
      snap.docs.forEach(doc => {
          const data = doc.data();
          map[doc.id] = { name: data.name || 'Unknown', phone: data.phone || '' };
      });
      setCustomers(map);
    };
    fetchCustomers();
  }, []);


  // 3. Filter Logic (Search + Tabs)
  const filteredJobs = jobs.filter(job => {
    const custName = customers[job.customerId]?.name?.toLowerCase() || '';
    const matchesSearch = custName.includes(searchTerm.toLowerCase()) || 
                          job.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
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
    if (loading) return <Loader2 className="w-4 h-4 animate-spin" />;
    return jobs.filter(j => {
       if (tab === 'To Do') return j.status === 'To Do';
       if (tab === 'Waiting') return j.status === 'Waiting';
       if (tab === 'Ready') return j.status === 'Ready';
       if (tab === 'Done') return j.status === 'Done';
       return false;
    }).length;
  }

  const JobSkeleton = () => (
    <div className="p-4 rounded-lg border bg-card shadow-sm">
        <div className="flex justify-between items-start mb-3">
            <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex gap-2 mb-4">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex justify-between items-center mt-2 border-t border-border pt-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-28" />
        </div>
    </div>
  );

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
              <span className="ml-2 px-2 py-0.5 bg-background/50 rounded-full text-xs opacity-80 min-w-[28px] flex items-center justify-center">
                {getJobCountForTab(tab)}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <JobSkeleton key={i} />)}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center animate-in fade-in-50 duration-500">
            <Filter size={48} className="mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No Jobs Here</h3>
            <p>There are no jobs in the '{activeTab}' stage.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredJobs.map((job, index) => (
              <div 
                key={job.id} 
                className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
              >
                <JobCard 
                  job={{
                      ...job,
                      customer: {
                          name: customers[job.customerId]?.name || '...',
                          phone: customers[job.customerId]?.phone || '',
                          id: job.customerId,
                          email: ''
                      },
                      device: {
                          model: 'Loading...', // This should be ideally part of the job data
                          id: job.deviceId,
                          serialNumber: '',
                          type: 'Other'
                      }
                  }}
                  customerPhone={customers[job.customerId]?.phone}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
