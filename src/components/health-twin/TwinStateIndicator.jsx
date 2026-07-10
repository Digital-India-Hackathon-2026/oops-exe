import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Brain, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { useHealthTwin } from './HealthTwinProvider';

const statusConfig = {
  initializing: {
    icon: Loader2,
    color: 'bg-gray-500',
    label: 'Initializing',
    description: 'Building your health model'
  },
  stable: {
    icon: Brain,
    color: 'bg-green-500',
    label: 'Stable',
    description: 'All systems within baseline'
  },
  learning: {
    icon: Activity,
    color: 'bg-blue-500',
    label: 'Learning',
    description: 'Refining your baseline'
  },
  monitoring: {
    icon: Activity,
    color: 'bg-yellow-500',
    label: 'Monitoring',
    description: 'Signals require attention'
  },
  escalating: {
    icon: AlertCircle,
    color: 'bg-red-500',
    label: 'Escalating',
    description: 'Immediate action recommended'
  }
};

const confidenceConfig = {
  low: { label: 'Low Confidence', color: 'text-gray-500' },
  medium: { label: 'Medium Confidence', color: 'text-yellow-600' },
  high: { label: 'High Confidence', color: 'text-green-600' }
};

export default function TwinStateIndicator({ variant = 'full' }) {
  const { twinState, isReady } = useHealthTwin();
  
  const config = statusConfig[twinState.status];
  const Icon = config.icon;
  const confConfig = confidenceConfig[twinState.confidence];

  if (variant === 'compact') {
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className={`w-3 h-3 mr-1 ${twinState.status === 'initializing' ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Icon className={`w-4 h-4 ${twinState.status === 'initializing' ? 'animate-spin' : ''}`} />
        <span className="text-gray-600">{config.label}</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-white ${twinState.status === 'initializing' ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Health Twin: {config.label}</h3>
            <p className="text-sm text-gray-500">{config.description}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {isReady ? 'Active' : 'Initializing'}
        </Badge>
      </div>
      
      {isReady && (
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Model Confidence</span>
            <p className={`font-semibold ${confConfig.color}`}>{confConfig.label}</p>
          </div>
          <div>
            <span className="text-gray-500">Data Coverage</span>
            <p className="font-semibold text-gray-900">{Math.round(twinState.dataCoverage)}%</p>
          </div>
        </div>
      )}
      
      {twinState.lastUpdate && (
        <p className="text-xs text-gray-400 mt-3">
          Last updated {new Date(twinState.lastUpdate).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}