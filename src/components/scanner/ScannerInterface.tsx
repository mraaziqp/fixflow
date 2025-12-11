'use client';

import { useState } from 'react';
import { useZxing } from 'react-zxing';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Loader2, Keyboard, Camera } from 'lucide-react';

export default function ScannerInterface() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualSerial, setManualSerial] = useState('');

  // 1. The "Check Logic" - The Brain of the Scanner
  const handleScan = async (serialValue: string) => {
    if (isChecking || !serialValue) return;
    
    setIsChecking(true);
    try {
      // Query Firestore for existing device
      const devicesRef = collection(db, 'devices');
      const q = query(devicesRef, where('serialNumber', '==', serialValue));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // CASE A: EXISTING DEVICE -> Go to History
        const deviceDoc = querySnapshot.docs[0];
        router.push(`/device/${deviceDoc.id}`);
      } else {
        // CASE B: NEW DEVICE -> Go to Intake Form
        // We pass the serial as a query param so the form is pre-filled
        router.push(`/jobs/new?serial=${encodeURIComponent(serialValue)}`);
      }
    } catch (error) {
      console.error("Database check failed", error);
      alert("Error checking database. Please try manual entry.");
      setIsChecking(false);
    }
  };

  // 2. The Camera Hook
  const { ref } = useZxing({
    onDecodeResult: (result) => handleScan(result.getText()),
    paused: isChecking || manualMode, // Pause camera when processing or in manual mode
  });

  // 3. Manual Entry Handler
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-semibold">Checking Database...</h2>
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
