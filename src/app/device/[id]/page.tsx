'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { User, Smartphone, History, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function DeviceProfile() {
  const { id } = useParams(); // Device ID
  const router = useRouter();

  const [device, setDevice] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // 1. Fetch Device Details
        const deviceRef = doc(db, 'devices', id as string);
        const deviceSnap = await getDoc(deviceRef);
        
        if (!deviceSnap.exists()) {
          // TODO: Add a proper not-found page or toast
          console.error("Device not found");
          router.push('/dashboard');
          return;
        }
        
        const deviceData = deviceSnap.data();
        setDevice({ id: deviceSnap.id, ...deviceData });

        // 2. Fetch Customer Details
        if (deviceData.customerId) {
          const customerRef = doc(db, 'customers', deviceData.customerId);
          const customerSnap = await getDoc(customerRef);
          if (customerSnap.exists()) {
            setCustomer({id: customerSnap.id, ...customerSnap.data()});
          }
        }

        // 3. Fetch Job History
        const jobsRef = collection(db, 'jobs');
        const q = query(
          jobsRef, 
          where('deviceId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const historySnap = await getDocs(q);
        const historyData = historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHistory(historyData);

      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const ProfileSkeleton = () => (
    <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader><CardTitle><Skeleton className="h-6 w-24"/></CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-8 w-4/5" />
                    <Skeleton className="h-6 w-3/5" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle><Skeleton className="h-6 w-32"/></CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-7 w-4/5" />
                    <Skeleton className="h-5 w-full" />
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader><CardTitle><Skeleton className="h-6 w-40"/></CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        </div>
    </div>
  )


  return (
    <div className="flex flex-col h-full">
        <Header title="Device Profile" />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-24">
            {loading ? <ProfileSkeleton /> : (
            <div className="grid md:grid-cols-3 gap-6 animate-in fade-in-0 duration-500">
                {/* Left Column */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary"><User /> Owner</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                             <h2 className="text-2xl font-bold">{customer?.name || 'Unknown'}</h2>
                            <a href={`tel:${customer?.phone}`} className="text-lg text-muted-foreground hover:text-primary underline decoration-dotted font-code">
                                {customer?.phone}
                            </a>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary"><Smartphone /> Hardware</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-xl font-bold">{device?.model}</h2>
                            <p className="font-code text-muted-foreground">{device?.serialNumber}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2"><History /> Repair History</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {history.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground italic border border-dashed border-border rounded-xl">
                                No previous jobs found.
                                </div>
                            ) : (
                                history.map((job, index) => (
                                <div 
                                    key={job.id} 
                                    className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                                    style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
                                >
                                    <div className="p-4 rounded-lg bg-secondary/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant={job.status === 'Done' ? 'default' : 'secondary'} className={job.status === 'Done' ? `bg-green-500/20 text-green-300 border-green-500/30` : `bg-blue-500/20 text-blue-300 border-blue-500/30`}>
                                                {job.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground font-code">
                                                {job.createdAt?.seconds ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground line-clamp-2">
                                            {job.ai_summary || job.description || 'No description recorded.'}
                                        </p>
                                        <div className="mt-2 text-xs text-muted-foreground font-code">
                                            Job #{job.id.slice(0,5)}
                                        </div>
                                    </div>
                                    {index < history.length -1 && <Separator className="my-4" />}
                                </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 border-t border-border backdrop-blur-sm z-20 flex justify-end">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20 transition-transform hover:scale-105 active:scale-95">
                    <Link href={`/jobs/new?serial=${encodeURIComponent(device?.serialNumber || '')}`}>
                        <Plus size={24} />
                        <span>New Job for this Device</span>
                    </Link>
                </Button>
             </div>
        </main>
    </div>
  );
}
