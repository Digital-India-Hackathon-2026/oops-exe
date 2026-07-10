import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X, Loader2, SwitchCamera, Keyboard, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import QrScanner from "qr-scanner";

export default function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const [status, setStatus] = useState("init"); // init, scanning, found, error, manual
  const [facingMode, setFacingMode] = useState("environment");
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    if (status !== "manual" && videoRef.current) {
      initCamera();
    }
    return cleanup;
  }, [facingMode]);

  const cleanup = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
  };

  const initCamera = async () => {
    cleanup();
    setStatus("init");
    
    try {
      if (!videoRef.current) return;

      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          const code = result.data.trim().toUpperCase();
          
          // Validate it's our invite code format (4-8 alphanumeric characters)
          if (/^[A-Z0-9]{4,8}$/.test(code)) {
            setStatus("found");
            cleanup();
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            toast.success(`✓ Code scanned: ${code}`);
            setTimeout(() => onScan(code), 300);
          } else {
            toast.error("Invalid code format. Please scan a valid AUTRYST invite code.");
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: facingMode,
          maxScansPerSecond: 5,
        }
      );

      qrScannerRef.current = qrScanner;
      
      await qrScanner.start();
      setStatus("scanning");
      
    } catch (e) {
      console.error("Camera error:", e);
      setStatus("error");
      toast.error("Camera access denied or unavailable");
    }
  };

  const handleManual = () => {
    const code = manualCode.trim().toUpperCase();
    if (/^[A-Z0-9]{4,8}$/.test(code)) {
      if (navigator.vibrate) navigator.vibrate(100);
      onScan(code);
    } else {
      toast.error("Enter a valid 4-8 character code");
    }
  };

  if (status === "manual") {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Enter Code</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5 text-gray-400" /></Button>
        </div>
        <div className="bg-slate-900 rounded-xl p-6 text-center space-y-4">
          <Keyboard className="w-12 h-12 text-purple-400 mx-auto" />
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="XXXXXX"
            maxLength={8}
            className="text-3xl font-mono text-center tracking-[0.5em] uppercase bg-slate-800 border-slate-600 text-white h-16"
            autoFocus
          />
          <div className="flex gap-2">
            <Button onClick={() => { setStatus("init"); initCamera(); }} variant="outline" className="flex-1 border-slate-600">
              <Camera className="w-4 h-4 mr-2" />Camera
            </Button>
            <Button onClick={handleManual} disabled={manualCode.length < 4} className="flex-1 bg-purple-600 hover:bg-purple-700">
              <CheckCircle className="w-4 h-4 mr-2" />Submit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />Scan QR Code
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5 text-gray-400" /></Button>
      </div>

      <div className="relative aspect-square bg-black rounded-xl overflow-hidden">
        {status === "init" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            <p className="text-gray-400 mt-2">Starting camera...</p>
          </div>
        )}
        
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-white font-medium mb-2">Camera Not Available</p>
            <div className="flex gap-2">
              <Button onClick={initCamera} variant="outline" size="sm">Retry</Button>
              <Button onClick={() => setStatus("manual")} size="sm" className="bg-purple-600">Enter Code</Button>
            </div>
          </div>
        )}
        
        {status === "found" && (
          <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center z-20">
            <div className="bg-green-500 rounded-full p-6 animate-pulse">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
          </div>
        )}

        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        
        {status === "scanning" && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-[15%] rounded-2xl" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />
            <div className="absolute inset-[15%] border-2 border-purple-500/50 rounded-2xl">
              <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-purple-400 rounded-tl-2xl" />
              <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-purple-400 rounded-tr-2xl" />
              <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-purple-400 rounded-bl-2xl" />
              <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-purple-400 rounded-br-2xl" />
            </div>
            <div 
              className="absolute left-[15%] right-[15%] h-1 bg-purple-500 rounded-full"
              style={{ 
                animation: "scannerLine 1.5s ease-in-out infinite",
                boxShadow: "0 0 20px 4px rgba(168, 85, 247, 0.8)"
              }}
            />
          </div>
        )}
        
        <style>{`
          @keyframes scannerLine {
            0%, 100% { top: 15%; }
            50% { top: 82%; }
          }
        `}</style>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={() => {
            setFacingMode(f => f === "environment" ? "user" : "environment");
          }}
          variant="outline"
          className="flex-1 border-slate-600"
          disabled={status !== "scanning"}
        >
          <SwitchCamera className="w-4 h-4 mr-2" />Flip
        </Button>
        <Button onClick={() => { cleanup(); setStatus("manual"); }} className="flex-1 bg-purple-600 hover:bg-purple-700">
          <Keyboard className="w-4 h-4 mr-2" />Type Code
        </Button>
      </div>
      
      {status === "scanning" && (
        <p className="text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Scanning for QR code...
        </p>
      )}
    </div>
  );
}