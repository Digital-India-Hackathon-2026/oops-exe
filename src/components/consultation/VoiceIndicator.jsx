import React from 'react';
import { Mic } from 'lucide-react';

export default function VoiceIndicator({ isSpeaking, speaker }) {
  if (!isSpeaking) return null;

  return (
    <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-full border border-white/10">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full"
            style={{
              height: '20px',
              animation: `pulse 0.8s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4 text-white" />
        <span className="text-sm font-medium text-white">
          {speaker === 'ai' ? 'Dr. Auryst is speaking...' : 'You are speaking...'}
        </span>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scaleY(0.5);
            opacity: 0.5;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}