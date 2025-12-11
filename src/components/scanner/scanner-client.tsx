'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, ScanLine, Search } from 'lucide-react';

// In a real app, this would query the database. We'll simulate it.
import { devices, jobs } from '@/lib/data';

export function ScannerClient() {
  const router = useRouter();
  const [serial, setSerial] = useState('');

  const handleSearch = () => {
    if (!serial) return;

    const device = devices.find(d => d.serialNumber === serial);
    if (device) {
      // Find a job associated with this device to redirect to
      const job = jobs.find(j => j.deviceId === device.id);
      if (job) {
        router.push(`/jobs/${job.id}`);
      } else {
        // If device exists but no job, go to new job form with serial
        router.push(`/jobs/new?serial=${serial}`);
      }
    } else {
      // If device not found, go to new job form with serial
      router.push(`/jobs/new?serial=${serial}`);
    }
  };

  const handleNumpadClick = (value: string) => {
    if (value === 'del') {
      setSerial(s => s.slice(0, -1));
    } else {
      setSerial(s => s + value);
    }
  };

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0'];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Scan Device</CardTitle>
        <CardDescription>Scan a barcode or enter the serial number manually.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center relative">
            <Camera className="w-16 h-16 text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Camera view disabled</p>
            <ScanLine className="w-full h-1 text-primary absolute top-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        
        <div className="flex items-center gap-2">
            <Input 
                type="text" 
                placeholder="Enter Serial Number" 
                value={serial}
                onChange={(e) => setSerial(e.target.value.toUpperCase())}
                className="font-code text-center tracking-widest"
            />
             <Button onClick={handleSearch} disabled={!serial}>
                <Search className="mr-2 h-4 w-4" /> Search
            </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
            {numpadKeys.map(key => (
                <Button 
                    key={key} 
                    variant="outline"
                    className="h-14 text-xl font-bold"
                    onClick={() => handleNumpadClick(key)}
                >
                    {key === 'del' ? '⌫' : key}
                </Button>
            ))}
             <Button 
                variant="outline"
                className="h-14 col-span-3 text-xl font-bold"
                onClick={() => setSerial('')}
            >
                Clear
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
