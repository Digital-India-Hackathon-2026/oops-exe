import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function QRCodeDisplay({ value, size = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    
    QRCode.toCanvas(
      canvasRef.current,
      value.toUpperCase(),
      {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      },
      (error) => {
        if (error) console.error("QR Code generation error:", error);
      }
    );
  }, [value, size]);

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <canvas ref={canvasRef} width={size} height={size} className="rounded" />
      </div>
      <p className="text-xs text-gray-400 mt-2">Scan with camera app</p>
    </div>
  );
}