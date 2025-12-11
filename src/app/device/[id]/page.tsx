'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { User, Smartphone, History, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
      
      try {
        // 1. Fetch Device Details
        const deviceRef = doc(db, 'devices', id as string);
        const deviceSnap = await getDoc(deviceRef);
        
        if (!deviceSnap.exists()) {
          alert("Device not found");
          router.push('/dashboard');
          return;
        }
        
        const deviceData = deviceSnap.data();
        setDevice({ id: deviceSnap.id, ...deviceData });

        // 2. Fetch Customer Details
        if (deviceData.customer_id) {
          const customerRef = doc(db, 'customers', deviceData.customer_id);
          const customerSnap = await getDoc(customerRef);
          if (customerSnap.exists()) {
            setCustomer(customerSnap.data());
          }
        }

        // 3. Fetch Job History
        const jobsRef = collection(db, 'jobs');
        const q = query(
          jobsRef, 
          where('device_id', '==', id),
          orderBy('created_at', 'desc')
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

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading Profile...</div>;

  return (
    <div className="flex flex-col h-full">
        <Header title="Device Profile" />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-24">
            <div className="grid md:grid-cols-3 gap-6">
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
                            <p className="font-code text-muted-foreground">{device?.serial_number}</p>
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
                                <div key={job.id}>
                                    <div className="p-4 rounded-lg bg-secondary/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant={job.status === 'done' ? 'default' : 'secondary'} className={job.status === 'done' ? `bg-green-500/20 text-green-300 border-green-500/30` : `bg-blue-500/20 text-blue-300 border-blue-500/30`}>
                                                {job.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground font-code">
                                                {job.created_at?.seconds ? new Date(job.created_at.seconds * 1000).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground line-clamp-2">
                                            {job.ai_summary || job.notes || 'No notes recorded.'}
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

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 border-t border-border backdrop-blur-sm z-20 flex justify-end">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href={`/jobs/new?serial=${encodeURIComponent(device?.serial_number || '')}`}>
                        <Plus size={24} />
                        <span>New Job for this Device</span>
                    </Link>
                </Button>
             </div>
        </main>
    </div>
  );
}
