import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Heart, Activity, Moon, Footprints, Flame, Droplets, Thermometer, Wind, Brain, Shield, TrendingUp } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from "date-fns";
import { useHealthTwin } from "@/components/health-twin/HealthTwinProvider";

export default function Vitals() {
  const [activeMetric, setActiveMetric] = useState("heart_rate");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: metrics } = useQuery({
    queryKey: ['allMetrics', user?.email],
    queryFn: () => base44.entities.HealthMetric.filter({ created_by: user.email }, '-timestamp', 500),
    initialData: [],
    enabled: !!user?.email,
  });

  // Health Twin integration (read-only)
  const { twinState, interpretVital, recentVitals } = useHealthTwin();

  const metricConfig = {
    heart_rate: {
      title: "Heart Rate",
      icon: Heart,
      unit: "bpm",
      color: "#ef4444",
      normal: { min: 60, max: 100 }
    },
    spo2: {
      title: "Blood Oxygen",
      icon: Activity,
      unit: "%",
      color: "#3b82f6",
      normal: { min: 95, max: 100 }
    },
    blood_pressure: {
      title: "Blood Pressure",
      icon: Wind,
      unit: "mmHg",
      color: "#8b5cf6",
      normal: { min: 90, max: 140 }
    },
    steps: {
      title: "Steps",
      icon: Footprints,
      unit: "steps",
      color: "#10b981",
      normal: { min: 8000, max: 15000 }
    },
    sleep: {
      title: "Sleep",
      icon: Moon,
      unit: "hours",
      color: "#6366f1",
      normal: { min: 7, max: 9 }
    },
    calories: {
      title: "Calories",
      icon: Flame,
      unit: "kcal",
      color: "#f59e0b",
      normal: { min: 1800, max: 2500 }
    },
    temperature: {
      title: "Temperature",
      icon: Thermometer,
      unit: "°C",
      color: "#ec4899",
      normal: { min: 36.5, max: 37.5 }
    }
  };

  const getMetricData = (metricType) => {
    return metrics
      .filter(m => m.metric_type === metricType)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-30)
      .map(m => ({
        timestamp: format(new Date(m.timestamp), 'MM/dd HH:mm'),
        value: m.value,
        date: new Date(m.timestamp)
      }));
  };

  const getLatestValue = (metricType) => {
    const metric = metrics.find(m => m.metric_type === metricType);
    return metric?.value || 0;
  };

  const getAverageValue = (metricType, days = 7) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const recentMetrics = metrics.filter(
      m => m.metric_type === metricType && new Date(m.timestamp) >= cutoff
    );
    if (recentMetrics.length === 0) return 0;
    return recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
  };

  // Get personal baseline (learned from user history)
  const getPersonalBaseline = (metricType) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const historical = metrics.filter(
      m => m.metric_type === metricType && new Date(m.timestamp) >= cutoff
    );
    if (historical.length < 5) return null;
    
    const values = historical.map(m => m.value).sort((a, b) => a - b);
    const p25 = values[Math.floor(values.length * 0.25)];
    const p75 = values[Math.floor(values.length * 0.75)];
    return { min: Math.floor(p25), max: Math.ceil(p75) };
  };

  // Get signal state (stable/drifting/deviating)
  const getSignalState = (metricType) => {
    const latest = getLatestValue(metricType);
    const baseline = getPersonalBaseline(metricType);
    if (!baseline) return 'learning';
    
    const metric = recentVitals.find(m => m.metric_type === metricType);
    if (metric) {
      const interpretation = interpretVital(metric);
      if (interpretation) {
        return interpretation.status === 'normal' ? 'stable' : 
               interpretation.status === 'caution' ? 'drifting' : 'deviating';
      }
    }
    
    if (latest >= baseline.min && latest <= baseline.max) return 'stable';
    if (latest < baseline.min * 0.9 || latest > baseline.max * 1.1) return 'deviating';
    return 'drifting';
  };

  // Get trend interpretation
  const getTrendInterpretation = (metricType) => {
    const data = getMetricData(metricType);
    if (data.length < 5) return "Insufficient data for trend analysis.";
    
    const recent = data.slice(-7);
    const earlier = data.slice(-14, -7);
    if (earlier.length < 3) return "Building trend baseline...";
    
    const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, d) => sum + d.value, 0) / earlier.length;
    
    const diff = recentAvg - earlierAvg;
    const diffPercent = (diff / earlierAvg) * 100;
    
    if (Math.abs(diffPercent) < 3) return "Stable pattern maintained.";
    if (diff > 0) return `Gradual upward drift detected during recent periods.`;
    return `Gradual downward trend observed in recent measurements.`;
  };

  const config = metricConfig[activeMetric];
  const chartData = getMetricData(activeMetric);

  return (
    <div className="p-3 md:p-6 lg:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Vital Signs</h1>
            <p className="text-xs md:text-sm text-gray-500">Live physiological signals feeding your AI Health Twin</p>
          </div>
        </div>

        {/* Health Twin Context (read-only, persistent) */}
        <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-gray-900">
              🧠 Health Twin Status: <span className="capitalize">{twinState.status}</span> · <span className="capitalize">{twinState.confidence}</span> Confidence · {Math.round(twinState.dataCoverage)}% Data Coverage
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
          {Object.entries(metricConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const latest = getLatestValue(key);
            const signalState = getSignalState(key);
            const baseline = getPersonalBaseline(key);
            
            return (
              <Card
                key={key}
                onClick={() => setActiveMetric(key)}
                className={`cursor-pointer transition-all duration-300 border-0 ${
                  activeMetric === key ? 'ring-2 ring-teal-500 shadow-lg' : 'hover:shadow-md'
                }`}
                style={{ backgroundColor: activeMetric === key ? `${cfg.color}10` : 'white' }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                      style={{ backgroundColor: cfg.color }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">{cfg.title}</p>
                      <p className="text-lg font-bold text-gray-900">
                        {latest > 0 ? latest.toFixed(1) : '—'}
                      </p>
                      <p className="text-xs text-gray-500">{latest > 0 ? cfg.unit : ''}</p>
                    </div>
                    <Badge 
                      className={`text-[10px] ${
                        signalState === 'stable' ? 'bg-green-500' :
                        signalState === 'drifting' ? 'bg-yellow-500' :
                        signalState === 'deviating' ? 'bg-orange-500' :
                        'bg-gray-400'
                      }`}
                    >
                      {signalState === 'learning' ? 'Learning' : signalState}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">Current Signal</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-gray-900">
                  {getLatestValue(activeMetric) > 0 ? getLatestValue(activeMetric).toFixed(1) : '—'}
                </p>
                <span className="text-gray-500">{config.unit}</span>
              </div>
              <Badge className={`mt-2 text-xs ${
                getSignalState(activeMetric) === 'stable' ? 'bg-green-500' :
                getSignalState(activeMetric) === 'drifting' ? 'bg-yellow-500' :
                getSignalState(activeMetric) === 'deviating' ? 'bg-orange-500' :
                'bg-gray-400'
              }`}>
                {getSignalState(activeMetric)}
              </Badge>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">Your Learned Range</p>
              <div className="flex items-baseline gap-2">
                {getPersonalBaseline(activeMetric) ? (
                  <p className="text-2xl font-bold text-gray-900">
                    {getPersonalBaseline(activeMetric).min} – {getPersonalBaseline(activeMetric).max}
                  </p>
                ) : (
                  <p className="text-lg text-gray-500">Learning baseline...</p>
                )}
                <span className="text-gray-500">{config.unit}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Based on your 30-day history</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">Population Reference</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-400">
                  {config.normal.min} – {config.normal.max}
                </p>
                <span className="text-gray-400">{config.unit}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Standard clinical range</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <config.icon className="w-5 h-5" style={{ color: config.color }} />
              {config.title} Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Trend Interpretation (Health Twin derived) */}
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-900">Trend Interpretation (last 7 days):</p>
                  <p className="text-sm text-blue-800">{getTrendInterpretation(activeMetric)}</p>
                </div>
              </div>
            </div>
            <Tabs defaultValue="line" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="line">Line Chart</TabsTrigger>
                <TabsTrigger value="area">Area Chart</TabsTrigger>
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
              </TabsList>

              <TabsContent value="line">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="timestamp" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={config.color}
                      strokeWidth={3}
                      dot={{ fill: config.color, r: 4 }}
                      activeDot={{ r: 6 }}
                      name={config.title}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="area">
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={config.color} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={config.color} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="timestamp" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={config.color}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      name={config.title}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="bar">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="timestamp" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    />
                    <Bar dataKey="value" fill={config.color} radius={[8, 8, 0, 0]} name={config.title} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* System Readiness Panel */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-50 to-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-600" />
              System Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <p className="text-xs text-slate-600 mb-1">Physiological Load</p>
                <p className="text-lg font-semibold text-slate-900">
                  {twinState.status === 'stable' ? 'Low' :
                   twinState.status === 'monitoring' ? 'Moderate' : 'High'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <p className="text-xs text-slate-600 mb-1">Recovery State</p>
                <p className="text-lg font-semibold text-slate-900">
                  {getLatestValue('sleep') >= 7 ? 'Adequate' : 'Reduced'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <p className="text-xs text-slate-600 mb-1">Escalation Readiness</p>
                <p className="text-lg font-semibold text-slate-900">
                  {twinState.escalationReady ? 'Armed' : 'Not Armed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Health Insights (Health Twin sourced) */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              Health Twin Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {twinState.explainability && twinState.explainability.length > 0 
                ? twinState.explainability[0]
                : `Recent ${config.title.toLowerCase()} patterns are ${getSignalState(activeMetric)}. The system is monitoring baseline trends before adjusting recommendations.`}
            </p>
            {twinState.deviations && twinState.deviations.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-white border border-blue-200">
                <p className="text-xs font-semibold text-blue-900 mb-1">Detected Deviations:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  {twinState.deviations.slice(0, 2).map((dev, i) => (
                    <li key={i}>• {dev}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}