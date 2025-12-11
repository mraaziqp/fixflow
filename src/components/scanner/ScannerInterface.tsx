'use client';

import { useState, useRef, useEffect } from 'react';
import { useZxing } from 'react-zxing';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Keyboard, Camera, CheckCircle2, Flashlight, ZoomIn, ZoomOut, Focus, RotateCw } from 'lucide-react';

export default function ScannerInterface() {
  const router = useRouter();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualSerial, setManualSerial] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [cameraReady, setCameraReady] = useState(false);
  const [lastScanAttempt, setLastScanAttempt] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // 2. Enhanced Camera Hook with Advanced Constraints
  const { ref } = useZxing({
    onDecodeResult: (result) => {
      const scannedValue = result.getText();
      console.log('Barcode detected:', scannedValue);
      setLastScanAttempt(scannedValue);
      
      toast({
        title: 'Barcode Detected!',
        description: `Scanned: ${scannedValue}`,
      });
      
      handleScan(scannedValue);
    },
    onError: (error) => {
      console.error('Scanner error:', error);
    },
    paused: isChecking || manualMode,
    constraints: {
      video: {
        facingMode: { exact: 'environment' }, // Forces back camera
        width: { ideal: 1920, max: 4096 },
        height: { ideal: 1080, max: 2160 },
      } as MediaTrackConstraints,
    },
    timeBetweenDecodingAttempts: 100, // More frequent scans for better detection
  });

  // 3. Camera Controls Setup
  useEffect(() => {
    const setupCameraControls = async () => {
      if (!ref.current) return;
      
      const video = ref.current as HTMLVideoElement;
      videoRef.current = video;
      
      // Wait for video to load
      const checkVideo = setInterval(() => {
        if (video.srcObject) {
          streamRef.current = video.srcObject as MediaStream;
          setCameraReady(true);
          clearInterval(checkVideo);
          
          const track = streamRef.current.getVideoTracks()[0];
          const capabilities = track.getCapabilities();
          
          console.log('Camera capabilities:', capabilities);
          
          // Apply initial settings for best barcode reading
          applyAdvancedSettings(track, capabilities);
        }
      }, 100);
      
      return () => clearInterval(checkVideo);
    };

    if (!manualMode && ref.current) {
      setupCameraControls();
    }
  }, [ref, manualMode]);

  // 4. Apply Advanced Camera Settings
  const applyAdvancedSettings = (track: MediaStreamTrack, capabilities: any) => {
    try {
      const constraints: any = {};
      
      // Focus Mode - Continuous autofocus for moving objects
      if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
        constraints.focusMode = 'continuous';
      }
      
      // Exposure Mode
      if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
        constraints.exposureMode = 'continuous';
      }
      
      // White Balance
      if (capabilities.whiteBalanceMode && capabilities.whiteBalanceMode.includes('continuous')) {
        constraints.whiteBalanceMode = 'continuous';
      }
      
      // Zoom
      if (capabilities.zoom) {
        constraints.zoom = zoomLevel;
      }
      
      // Torch
      if (capabilities.torch) {
        constraints.torch = torchEnabled;
      }
      
      track.applyConstraints({ advanced: [constraints] }).catch(err => {
        console.log('Some constraints not supported:', err);
      });
    } catch (error) {
      console.log('Advanced settings error:', error);
    }
  };

  // 5. Toggle Torch/Flashlight
  const toggleTorch = () => {
    if (!streamRef.current) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;
    
    if (capabilities.torch) {
      const newTorchState = !torchEnabled;
      track.applyConstraints({
        advanced: [{ torch: newTorchState } as any]
      }).then(() => {
        setTorchEnabled(newTorchState);
        toast({
          title: newTorchState ? 'Flashlight On' : 'Flashlight Off',
        });
      }).catch(err => {
        console.error('Torch error:', err);
        toast({
          variant: 'destructive',
          title: 'Flashlight Not Available',
        });
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Flashlight Not Supported',
        description: 'Your device does not support flashlight control.',
      });
    }
  };

  // 6. Zoom Controls
  const adjustZoom = (delta: number) => {
    if (!streamRef.current) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;
    
    if (capabilities.zoom) {
      const newZoom = Math.max(
        capabilities.zoom.min,
        Math.min(capabilities.zoom.max, zoomLevel + delta)
      );
      
      track.applyConstraints({
        advanced: [{ zoom: newZoom } as any]
      }).then(() => {
        setZoomLevel(newZoom);
      }).catch(err => {
        console.error('Zoom error:', err);
      });
    }
  };

  // 7. Manual Focus Tap
  const handleFocusTap = async () => {
    if (!streamRef.current) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;
    
    if (capabilities.focusMode) {
      try {
        // Trigger a focus by switching modes
        await track.applyConstraints({
          advanced: [{ focusMode: 'single-shot' } as any]
        });
        
        setTimeout(async () => {
          await track.applyConstraints({
            advanced: [{ focusMode: 'continuous' } as any]
          });
        }, 1000);
        
        toast({
          title: 'Focus Adjusted',
        });
      } catch (err) {
        console.error('Focus error:', err);
      }
    }
  };

  // 8. Manual Entry Handler
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
          <div className="relative w-full max-w-md space-y-4">
            {/* Camera Viewport */}
            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-border">
              <video 
                ref={ref} 
                className="w-full h-full object-cover"
                onClick={handleFocusTap}
                playsInline
                autoPlay
                muted
              />
              
              {/* Overlay Frame */}
              <div className="absolute inset-0 border-2 border-primary/50 rounded-2xl pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-2 border-primary bg-primary/10 rounded-lg animate-pulse"></div>
              </div>
              
              {/* Instructions */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-black/60 px-4 py-2 rounded-full text-sm font-medium text-blue-200 backdrop-blur-sm">
                  Point at Barcode or Serial
                </span>
              </div>

              {/* Camera Status Indicator */}
              {!cameraReady && (
                <div className="absolute top-4 left-4 bg-yellow-500/80 text-black px-3 py-1 rounded-full text-xs font-bold">
                  Initializing Camera...
                </div>
              )}
            </div>

            {/* Camera Controls Panel */}
            <div className="bg-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                {/* Flashlight Toggle */}
                <button
                  onClick={toggleTorch}
                  disabled={!cameraReady}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    torchEnabled
                      ? 'bg-yellow-500 text-black'
                      : 'bg-secondary hover:bg-secondary/80 text-foreground'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Flashlight className="w-5 h-5" />
                  <span className="text-sm">Flash</span>
                </button>

                {/* Manual Focus */}
                <button
                  onClick={handleFocusTap}
                  disabled={!cameraReady}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Focus className="w-5 h-5" />
                  <span className="text-sm">Focus</span>
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjustZoom(-0.5)}
                  disabled={!cameraReady || zoomLevel <= 1}
                  className="px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                
                <div className="flex-1 bg-secondary/50 rounded-lg px-4 py-2 text-center">
                  <span className="text-sm font-medium text-foreground">
                    Zoom: {zoomLevel.toFixed(1)}x
                  </span>
                </div>
                
                <button
                  onClick={() => adjustZoom(0.5)}
                  disabled={!cameraReady}
                  className="px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>

              {/* Debug Info */}
              {lastScanAttempt && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Last Scan:</p>
                  <p className="text-sm font-mono text-foreground break-all">{lastScanAttempt}</p>
                </div>
              )}

              {/* Tips */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-foreground">💡 Scanning Tips:</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• Hold device steady 4-8 inches from barcode</li>
                  <li>• Ensure good lighting or use flash</li>
                  <li>• Tap screen to manually focus</li>
                  <li>• Try zooming if barcode is small</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
