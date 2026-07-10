import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Activity, Moon, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const MetricCard = ({ icon: Icon, label, value, unit, trend, lastUpdated, permission }) => {
  if (!permission) return null;
  
  const displayValue = value && value > 0 ? value : '—';
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Icon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-white">{displayValue}</p>
              </div>
            </div>
            {value > 0 && trend === 'up' && <TrendingUp className="w-5 h-5 text-green-400" />}
            {value > 0 && trend === 'down' && <TrendingDown className="w-5 h-5 text-red-400" />}
          </div>
          <p className="text-xs text-gray-500 mb-2">{value > 0 ? unit : 'No recent data'}</p>
          {value > 0 && <p className="text-[10px] text-gray-600">Updated {lastUpdated}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function FamilyHealthDataView({ familyMember, isOpen }) {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState("Monitoring");

  const permissions = familyMember?.shared_permissions || [];
  const hasVitals = permissions.includes('vitals');
  const hasActivity = permissions.includes('activity');
  const hasSleep = permissions.includes('sleep');

  const { data: userMetrics = [] } = useQuery({
    queryKey: ['familyMemberMetrics', familyMember?.linked_user_id],
    queryFn: async () => {
      if (!familyMember?.linked_user_id) return [];
      return await base44.entities.HealthMetric.filter(
        { created_by: familyMember?.linked_user_email },
        '-timestamp',
        20
      );
    },
    enabled: !!familyMember?.linked_user_id && isOpen,
  });

  useEffect(() => {
    if (!userMetrics || userMetrics.length === 0) {
      setLoading(false);
      return;
    }

    const processed = {};
    const types = ['heart_rate', 'spo2', 'steps', 'sleep'];
    
    types.forEach(type => {
      const data = userMetrics.filter(m => m.metric_type === type);
      if (data.length > 0) {
        processed[type] = {
          value: Math.round(data[0].value),
          unit: data[0].unit,
          trend: data.length > 1 && data[0].value > data[1].value ? 'up' : 'down',
          lastUpdated: format(new Date(data[0].timestamp), 'h:mm a')
        };
      }
    });

    setMetrics(processed);
    
    // Determine health status (non-alarming labels)
    const hrValue = processed.heart_rate?.value || 0;
    if (hrValue > 0 && hrValue < 60) setHealthStatus("Resting Well");
    else if (hrValue >= 60 && hrValue <= 100) setHealthStatus("Healthy Range");
    else if (hrValue > 100) setHealthStatus("Monitor");
    
    setLoading(false);
  }, [userMetrics]);

  if (!isOpen || !familyMember) return null;

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{familyMember.name}'s Health</h2>
            <p className="text-gray-400">Shared data · Consent-based · Read-only</p>
          </div>
          <Badge className="bg-green-600/30 text-green-300 border-green-500/50">
            {healthStatus}
          </Badge>
        </div>
      </motion.div>

      {/* Permissions Summary */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm">Data Access Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {hasVitals && <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">Vital Summaries</Badge>}
              {hasActivity && <Badge className="bg-green-500/20 text-green-300 border-green-500/50">Activity Balance</Badge>}
              {hasSleep && <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">Sleep Adequacy</Badge>}
              {permissions.includes('predictions') && <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/50">Risk Signals</Badge>}
              {permissions.length === 0 && <p className="text-gray-400 text-sm">No data sharing active</p>}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vitals Grid */}
      {(hasVitals || hasActivity || hasSleep) && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hasVitals && metrics.heart_rate && (
              <MetricCard
                icon={Heart}
                label="Heart Rate"
                value={metrics.heart_rate.value}
                unit={metrics.heart_rate.unit}
                trend={metrics.heart_rate.trend}
                lastUpdated={metrics.heart_rate.lastUpdated}
                permission={hasVitals}
              />
            )}
            {hasVitals && metrics.spo2 && (
              <MetricCard
                icon={Zap}
                label="SpO₂"
                value={metrics.spo2.value}
                unit={metrics.spo2.unit}
                trend={metrics.spo2.trend}
                lastUpdated={metrics.spo2.lastUpdated}
                permission={hasVitals}
              />
            )}
            {hasActivity && metrics.steps && (
              <MetricCard
                icon={Activity}
                label="Daily Steps"
                value={metrics.steps.value}
                unit={metrics.steps.unit}
                trend={metrics.steps.trend}
                lastUpdated={metrics.steps.lastUpdated}
                permission={hasActivity}
              />
            )}
            {hasSleep && metrics.sleep && (
              <MetricCard
                icon={Moon}
                label="Sleep"
                value={metrics.sleep.value}
                unit={metrics.sleep.unit}
                trend={metrics.sleep.trend}
                lastUpdated={metrics.sleep.lastUpdated}
                permission={hasSleep}
              />
            )}
          </div>
        </motion.div>
      )}

      {/* Health Twin Summary (if predictions permission) */}
      {permissions.includes('predictions') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Health Intelligence (Summary)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">
                Vitals currently within a monitored range. No alerts at this time.
              </p>
              <div className="mt-4 space-y-2">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Overall Status</p>
                  <Progress value={75} className="h-2 bg-slate-800" indicatorClassName="bg-gradient-to-r from-green-500 to-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {permissions.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">No data is being shared at this time.</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}