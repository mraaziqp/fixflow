'use client';

import { useState } from 'react';
import { useZxing } from 'react-zxing';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Keyboard, Camera, CheckCircle2 } from 'lucide-react';

export default function ScannerInterface() {
  const router = useRouter();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualSerial, setManualSerial] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);

  // 1. The "Check Logic" - The Brain of the Scanner
  const handleScan = async (serialValue: string) => {
    if (isChecking || !serialValue) return;
    
    const trimmedSerial = serialValue.trim().toUpperCase();
    if (trimmedSerial.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Invalid Serial',
        description: 'Serial number is too short. Please try again.',
      });
      return;
    }

    setIsChecking(true);
    setScanSuccess(false);
    
    try {
      // Query Firestore for existing device
      const devicesRef = collection(db, 'devices');
      const q = query(devicesRef, where('serialNumber', '==', trimmedSerial));
      const querySnapshot = await getDocs(q);

      setScanSuccess(true);
      
      if (!querySnapshot.empty) {
        // CASE A: EXISTING DEVICE -> Go to History
        const deviceDoc = querySnapshot.docs[0];
        toast({
          title: 'Device Found',
          description: 'Redirecting to device history...',
        });
        setTimeout(() => router.push(`/device/${deviceDoc.id}`), 500);
      } else {
        // CASE B: NEW DEVICE -> Go to Intake Form
        toast({
          title: 'New Device',
          description: 'Redirecting to job intake form...',
        });
        setTimeout(() => router.push(`/jobs/new?serial=${encodeURIComponent(trimmedSerial)}`), 500);
      }
    } catch (error) {
      console.error("Database check failed", error);
      toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Failed to check device. Please try manual entry or check your connection.',
      });
      setIsChecking(false);
      setScanSuccess(false);
    }
  };

  // 2. The Camera Hook with Improved Constraints
  const { ref } = useZxing({
    onDecodeResult: (result) => handleScan(result.getText()),
    paused: isChecking || manualMode,
    constraints: {
      video: {
        facingMode: 'environment', // Forces the back camera
        width: { min: 640, ideal: 1280, max: 1920 }, // Higher res for sharpness
        height: { min: 480, ideal: 720, max: 1080 },
        // Try to force autofocus if the browser supports it
        focusMode: 'continuous', 
      } as MediaTrackConstraints, 
    },
    // Add a time between scans to prevent double-scanning rapid fire
    timeBetweenDecodingAttempts: 300, 
  });

  // 3. Manual Entry Handler
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSerial.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Serial',
        description: 'Please enter a serial number.',
      });
      return;
    }
    handleScan(manualSerial);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground">
      
      {/* HEADER / TOGGLE */}
      <div className="flex justify-center p-4 bg-card shadow-md z-10">
        <div className="flex bg-secondary rounded-lg p-1">
          <button
            onClick={() => setManualMode(false)}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              !manualMode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <Camera className="w-5 h-5 inline mr-2" />
            Scan
          </button>
          <button
            onClick={() => setManualMode(true)}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              manualMode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <Keyboard className="w-5 h-5 inline mr-2" />
            Type
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
        
        {isChecking ? (
          // LOADING STATE
          <div className="flex flex-col items-center">
            {scanSuccess ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4 animate-in zoom-in duration-300" />
                <h2 className="text-xl font-semibold text-green-500">Success!</h2>
              </>
            ) : (
              <>
                <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
                <h2 className="text-xl font-semibold">Checking Database...</h2>
              </>
            )}
          </div>
        ) : manualMode ? (
          // MANUAL KEYPAD MODE
          <form onSubmit={handleManualSubmit} className="w-full max-w-sm space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Enter Serial</h2>
              <p className="text-muted-foreground">Type the serial number manually</p>
            </div>
            
            <input
              type="text"
              value={manualSerial}
              onChange={(e) => setManualSerial(e.target.value.toUpperCase())}
              placeholder="e.g. CFI-1002A..."
              className="w-full h-16 text-center text-2xl tracking-widest bg-secondary border-2 border-border rounded-xl focus:border-primary focus:outline-none font-code uppercase text-foreground"
              autoFocus
            />
            
            <button
              type="submit"
              disabled={!manualSerial}
              className="w-full h-16 bg-primary hover:bg-primary/90 rounded-xl text-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground"
            >
              Go
            </button>
          </form>
        ) : (
          // CAMERA MODE
          <div className="relative w-full max-w-md aspect-square bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-border">
            <video ref={ref} className="w-full h-full object-cover" />
            
            {/* Overlay Frame */}
            <div className="absolute inset-0 border-2 border-primary/50 rounded-2xl pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-2 border-primary bg-primary/10 rounded-lg animate-pulse"></div>
            </div>
            
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="bg-black/60 px-4 py-2 rounded-full text-sm font-medium text-blue-200 backdrop-blur-sm">
                Point at Barcode or Serial
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
