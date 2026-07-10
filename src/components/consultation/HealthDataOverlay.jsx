import React from 'react';
import { Activity, Heart, Droplets, Moon } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function HealthDataOverlay({ metrics, isVisible }) {
  if (!isVisible) return null;

  const getLatestMetric = (type) => {
    const metric = metrics.find(m => m.metric_type === type);
    return metric || null;
  };

  const vitalsData = [
    { 
      icon: Heart, 
      label: 'Heart Rate', 
      value: getLatestMetric('heart_rate')?.value || 72, 
      unit: 'bpm',
      color: 'text-red-500',
      status: 'normal'
    },
    { 
      icon: Activity, 
      label: 'Blood Oxygen', 
      value: getLatestMetric('spo2')?.value || 98, 
      unit: '%',
      color: 'text-blue-500',
      status: 'normal'
    },
    { 
      icon: Droplets, 
      label: 'Blood Pressure', 
      value: getLatestMetric('blood_pressure')?.value || 120, 
      unit: 'mmHg',
      color: 'text-purple-500',
      status: 'normal'
    },
    { 
      icon: Moon, 
      label: 'Sleep Quality', 
      value: getLatestMetric('sleep')?.value || 7.5, 
      unit: 'hrs',
      color: 'text-indigo-500',
      status: 'normal'
    },
  ];

  return (
    <div className="absolute top-4 right-4 space-y-2">
      {vitalsData.map((vital, index) => (
        <div
          key={index}
          className="bg-black/60 backdrop-blur-md rounded-xl p-3 min-w-[180px] border border-white/10"
          style={{
            animation: `slideInRight 0.5s ease-out ${index * 0.1}s both`
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <vital.icon className={`w-4 h-4 ${vital.color}`} />
              <span className="text-xs text-white/80">{vital.label}</span>
            </div>
            <Badge 
              variant="outline" 
              className="bg-green-500/20 text-green-300 border-green-500/30 text-xs"
            >
              {vital.status}
            </Badge>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{vital.value}</span>
            <span className="text-sm text-white/60">{vital.unit}</span>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}