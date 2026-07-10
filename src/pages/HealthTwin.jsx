import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import {
  Activity, Brain, TrendingUp, AlertTriangle, CheckCircle, Sparkles, Shield, Target,
  Heart, Zap, TrendingDown, Moon, Flame, Award, Trophy, Users, Video, Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";
import HumanBody2D from "../components/symptom/HumanBody2D";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useHealthTwin } from "@/components/health-twin/HealthTwinProvider";
import TwinStateIndicator from "@/components/health-twin/TwinStateIndicator";

const VitalSignCard = ({ icon: Icon, title, value, unit, color, interpretation }) => (
  <motion.div whileHover={{ y: -5 }} className="h-full">
    <Card className="bg-slate-800/50 border-slate-700 h-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <p className="text-sm text-slate-300">{title}</p>
        </div>
        <p className="text-2xl font-bold text-white">{value} <span className="text-base font-normal text-slate-400">{unit}</span></p>
        {interpretation && (
          <div className={`mt-2 text-xs px-2 py-1 rounded ${
            interpretation.status === 'alert' ? 'bg-red-500/20 text-red-300' :
            interpretation.status === 'caution' ? 'bg-yellow-500/20 text-yellow-300' :
            'bg-green-500/20 text-green-300'
          }`}>
            {interpretation.interpretation}
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

export default function HealthTwin() {
  const [activeBodyPart, setActiveBodyPart] = useState(null);
  const [activeChartMetric, setActiveChartMetric] = useState('heart_rate');
  const [activeChartType, setActiveChartType] = useState('line');

  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  
  const {
    healthTwin,
    twinState,
    recentVitals,
    activeSymptoms,
    interpretVital,
    getRiskAssessment,
    getActionRecommendation,
    isReady,
    isLoading: isTwinLoading
  } = useHealthTwin();

  const { data: metrics } = useQuery({
    queryKey: ['allMetrics', user?.email],
    queryFn: () => base44.entities.HealthMetric.filter({ created_by: user.email }, '-timestamp', 100),
    initialData: [],
    refetchInterval: 5000,
    enabled: !!user?.email
  });

  const { data: achievements } = useQuery({
    queryKey: ['achievements', user?.email],
    queryFn: () => base44.entities.Achievement.filter({ created_by: user.email }, '-unlocked_at', 5),
    initialData: [],
    enabled: !!user?.email
  });

  const { data: familyMembers } = useQuery({
    queryKey: ['familyMembers', user?.email],
    queryFn: () => base44.entities.FamilyMember.filter({ created_by: user.email }),
    initialData: [],
    enabled: !!user?.email
  });

  const getLatestMetric = (type) => recentVitals.find(m => m.metric_type === type);

  const vitalSigns = useMemo(() => {
    const hr = getLatestMetric('heart_rate');
    const spo2 = getLatestMetric('spo2');
    const temp = getLatestMetric('temperature');
    const steps = getLatestMetric('steps');

    return {
      heart_rate: {
        title: "Heart Rate",
        value: hr?.value || 0,
        unit: "bpm",
        icon: Heart,
        color: "text-red-400",
        interpretation: isReady && hr ? interpretVital(hr) : null
      },
      spo2: {
        title: "Oxygen",
        value: spo2?.value || 0,
        unit: "%",
        icon: Zap,
        color: "text-blue-400",
        interpretation: isReady && spo2 ? interpretVital(spo2) : null
      },
      temperature: {
        title: "Temperature",
        value: temp?.value || 0,
        unit: "°C",
        icon: Activity,
        color: "text-orange-400",
        interpretation: isReady && temp ? interpretVital(temp) : null
      },
      steps: {
        title: "Steps",
        value: steps?.value || 0,
        unit: "",
        icon: Award,
        color: "text-green-400",
        interpretation: isReady && steps ? interpretVital(steps) : null
      },
    };
  }, [recentVitals, isReady, interpretVital]);

  const riskAssessment = getRiskAssessment();
  const actionRecommendation = getActionRecommendation();

  const refreshTwinMutation = useMutation({
    mutationFn: async () => {
      const healthContext = `User Profile: Age ${user?.age || 30}, Gender ${user?.gender || 'not specified'}. Conditions: ${user?.medical_conditions?.join(', ') || 'None'}. Recent metrics: ${recentVitals.slice(0, 10).map(m => `${m.metric_type}: ${m.value}`).join(', ')}. Active symptoms: ${activeSymptoms.map(s => s.description).join(', ') || 'None'}.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `As AUTRYST's AI Health Twin, perform a comprehensive health analysis. Analyze physiological signals, behavioral patterns, and predict future health trajectories. Generate risk assessment with confidence levels. Context: ${healthContext}`,
        response_json_schema: {
          type: "object",
          properties: {
            prediction_type: { type: "string", enum: ["risk_assessment", "future_health", "lifestyle_impact", "disease_prediction"] },
            risk_category: { type: "string" },
            risk_score: { type: "number" },
            timeframe: { type: "string" },
            contributing_factors: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            predicted_outcome: { type: "string" },
            confidence_level: { type: "number" },
            prevention_strategies: { type: "array", items: { type: "string" } }
          }
        }
      });

      await base44.entities.HealthTwinPrediction.create(result);
      queryClient.invalidateQueries(['healthTwin']);
      return result;
    },
    onSuccess: () => { toast.success("Health Twin synchronized!"); },
    onError: () => { toast.error("Failed to update Health Twin."); }
  });

  const chartData = useMemo(() => {
    const data = metrics
      .filter(m => m.metric_type === activeChartMetric)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-20)
      .map(m => ({
        name: new Date(m.timestamp).toLocaleTimeString(),
        value: m.value,
        fullTimestamp: m.timestamp
      }));
    return data;
  }, [metrics, activeChartMetric]);

  const getMetricConfig = (metricType) => {
    const configMap = {
      heart_rate: { title: "Heart Rate", unit: "bpm", color: "#f43f5e" },
      spo2: { title: "Oxygen", unit: "%", color: "#3b82f6" },
      temperature: { title: "Temperature", unit: "°C", color: "#fb923c" },
      steps: { title: "Steps", unit: "steps", color: "#22c55e" },
    };
    return configMap[metricType] || { title: metricType, unit: "", color: "#a855f7" };
  };

  const currentChartMetricConfig = getMetricConfig(activeChartMetric);

  const highlightedBodyParts = useMemo(() => {
    const parts = new Set();
    Object.values(vitalSigns).forEach(vital => {
      if (vital.interpretation?.status === 'alert') {
        if (vital.title.includes('Heart') || vital.title.includes('Oxygen')) parts.add('Chest');
        if (vital.title.includes('Temperature')) parts.add('Head');
      }
    });
    activeSymptoms.forEach(symptom => {
      if (symptom.description.toLowerCase().includes('chest') || symptom.description.toLowerCase().includes('heart')) parts.add('Chest');
      if (symptom.description.toLowerCase().includes('head') || symptom.description.toLowerCase().includes('dizziness')) parts.add('Head');
      if (symptom.description.toLowerCase().includes('stomach') || symptom.description.toLowerCase().includes('abdominal')) parts.add('Abdomen');
    });
    return Array.from(parts);
  }, [vitalSigns, activeSymptoms]);

  const handlePartClick = (partName) => {
    setActiveBodyPart(partName);
    toast.info(`Showing details for: ${partName}`);
  };

  return (
    <div className="p-3 md:p-6 min-h-screen bg-slate-900 text-white">
      <div className="max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">

        {/* Left Sidebar */}
        <aside className="lg:col-span-3 space-y-4 md:space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6 text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-slate-600">
                      <AvatarImage src={user?.avatar_url} />
                      <AvatarFallback className="text-3xl bg-slate-700">{user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold text-white">{user?.full_name}</h2>
                  <p className="text-sm text-slate-400">{user?.email}</p>
              </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-white"><Activity /> Live Vitals</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {!isReady && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Twin learning baseline...</span>
                  </div>
                )}
                {Object.values(vitalSigns).map(vital => <VitalSignCard key={vital.title} {...vital} />)}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-white"><Users /> Family Health</CardTitle></CardHeader>
            <CardContent>
                {familyMembers.length > 0 ? (
                    <div className="space-y-3">
                    {familyMembers.slice(0, 3).map(member => (
                        <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/50">
                            <Avatar className="w-8 h-8"><AvatarFallback>{member.name.charAt(0)}</AvatarFallback></Avatar>
                            <div><p className="text-sm font-medium text-white">{member.name}</p><p className="text-xs text-slate-400">{member.relationship}</p></div>
                        </div>
                    ))}
                    </div>
                ) : <p className="text-sm text-slate-400">No family members added.</p>}
                <Link to={createPageUrl("FamilyHealth")}><Button variant="outline" className="w-full mt-4 border-slate-600 hover:bg-slate-700 text-white">Manage Family</Button></Link>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-6 space-y-4 md:space-y-6">
            <TwinStateIndicator />

            <Card className="bg-slate-800/50 border-slate-700">
                 <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl text-white">Your Digital Twin</CardTitle>
                    <Button onClick={() => refreshTwinMutation.mutate()} disabled={refreshTwinMutation.isLoading || isTwinLoading}>
                        {refreshTwinMutation.isLoading ? <><Sparkles className="w-4 h-4 mr-2 animate-spin"/>Synchronizing...</> : <><Sparkles className="w-4 h-4 mr-2"/>Refresh Twin</>}
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                        <div className="h-[400px] w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl flex items-center justify-center">
                           <HumanBody2D highlightedParts={highlightedBodyParts} onPartClick={handlePartClick} />
                        </div>
                        <div className="space-y-4">
                           <h3 className="font-semibold text-lg text-white">AI Summary</h3>
                           {isTwinLoading ? <Skeleton className="h-20 w-full" /> :
                            <p className="text-slate-300 text-sm">
                                {healthTwin?.predicted_outcome || riskAssessment.explanation || "Your Health Twin is learning your baseline patterns. Continue logging vitals for personalized intelligence."}
                            </p>
                           }
                           <div className="p-4 bg-slate-700/50 rounded-lg">
                               <h4 className="font-semibold text-base mb-2 text-white">Twin Status</h4>
                               <div className="space-y-2 text-sm">
                                 <div className="flex justify-between">
                                   <span className="text-slate-400">State:</span>
                                   <span className="text-white font-medium capitalize">{twinState.status}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-slate-400">Confidence:</span>
                                   <span className="text-white font-medium capitalize">{twinState.confidence}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-slate-400">Data Coverage:</span>
                                   <span className="text-white font-medium">{Math.round(twinState.dataCoverage)}%</span>
                                 </div>
                               </div>
                           </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
                <Tabs defaultValue="risk">
                    <CardHeader><TabsList className="bg-slate-800 border border-slate-700"><TabsTrigger value="risk" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">Risk Assessment</TabsTrigger><TabsTrigger value="recommendations" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">Recommendations</TabsTrigger><TabsTrigger value="trends" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">Vitals Trends</TabsTrigger></TabsList></CardHeader>
                    <CardContent className="h-[350px]">
                        <TabsContent value="risk">
                           <ScrollArea className="h-full pr-4">
                                <div className="space-y-4">
                                {isTwinLoading && <Skeleton className="w-full h-24 rounded-xl"/>}
                                {isReady && healthTwin ? (
                                  <>
                                    <div className={`p-4 rounded-xl border ${
                                      riskAssessment.level === 'high' ? 'border-red-500/30 bg-red-500/10' :
                                      riskAssessment.level === 'moderate' ? 'border-orange-500/30 bg-orange-500/10' :
                                      'border-green-500/30 bg-green-500/10'
                                    }`}>
                                      <div className="flex justify-between items-center mb-2">
                                        <p className="font-semibold text-white">{healthTwin.risk_category || 'Overall Health Status'}</p>
                                        <Badge className={`${
                                          riskAssessment.level === 'high' ? 'bg-red-500' :
                                          riskAssessment.level === 'moderate' ? 'bg-orange-500' :
                                          'bg-green-500'
                                        } text-white`}>
                                          Risk Score: {riskAssessment.score}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-slate-300">{riskAssessment.explanation}</p>
                                      <p className="text-xs text-slate-400 mt-2">Timeframe: {healthTwin.timeframe} | Confidence: {healthTwin.confidence_level || twinState.confidence}%</p>
                                    </div>
                                    {healthTwin.contributing_factors?.length > 0 && (
                                      <div className="p-3 bg-slate-700/50 rounded-lg">
                                        <p className="text-sm font-semibold text-white mb-2">Contributing Factors:</p>
                                        <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                                          {healthTwin.contributing_factors.map((factor, i) => (
                                            <li key={i}>{factor}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-slate-400 text-center py-8">Health Twin is initializing. Continue monitoring vitals for risk assessment.</p>
                                )}
                                </div>
                           </ScrollArea>
                        </TabsContent>
                        <TabsContent value="recommendations">
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-3">
                                {isTwinLoading && <Skeleton className="w-full h-20 rounded-xl"/>}
                                {healthTwin?.recommendations?.length > 0 ? healthTwin.recommendations.map((rec, i) => (
                                    <motion.div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/50" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                                        <div><p className="font-medium text-white">{rec}</p></div>
                                    </motion.div>
                                )) : <p className="text-slate-400 text-center py-8">No recommendations yet. Twin is learning your patterns.</p>}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                         <TabsContent value="trends">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-white">{currentChartMetricConfig.title} (Last 20 readings)</h3>
                              <select
                                className="bg-slate-700 border border-slate-600 rounded-md text-white text-sm py-1 px-2"
                                value={activeChartMetric}
                                onChange={(e) => setActiveChartMetric(e.target.value)}
                              >
                                {Object.keys(vitalSigns).map(metricKey => (
                                  <option key={metricKey} value={metricKey}>
                                    {vitalSigns[metricKey].title}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            {chartData.length > 0 ? (
                              <Tabs defaultValue={activeChartType} onValueChange={setActiveChartType} className="w-full">
                                <TabsList className="mb-4 bg-slate-800 border border-slate-700">
                                  <TabsTrigger value="line" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">Line Chart</TabsTrigger>
                                  <TabsTrigger value="area" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">Area Chart</TabsTrigger>
                                  <TabsTrigger value="bar" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">Bar Chart</TabsTrigger>
                                </TabsList>

                                <TabsContent value="line">
                                  <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                      <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']}/>
                                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' }} labelStyle={{ color: '#f8fafc' }} formatter={(value) => [`${value} ${currentChartMetricConfig.unit}`, currentChartMetricConfig.title]}/>
                                      <Line type="monotone" dataKey="value" stroke={currentChartMetricConfig.color} dot={{ r: 3 }}/>
                                    </LineChart>
                                  </ResponsiveContainer>
                                </TabsContent>

                                <TabsContent value="area">
                                  <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                      <defs><linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={currentChartMetricConfig.color} stopOpacity={0.8}/><stop offset="95%" stopColor={currentChartMetricConfig.color} stopOpacity={0}/></linearGradient></defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                      <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']}/>
                                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' }} labelStyle={{ color: '#f8fafc' }} formatter={(value) => [`${value} ${currentChartMetricConfig.unit}`, currentChartMetricConfig.title]}/>
                                      <Area type="monotone" dataKey="value" stroke={currentChartMetricConfig.color} fill="url(#colorUv)" />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </TabsContent>

                                <TabsContent value="bar">
                                  <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                      <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']}/>
                                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' }} labelStyle={{ color: '#f8fafc' }} formatter={(value) => [`${value} ${currentChartMetricConfig.unit}`, currentChartMetricConfig.title]}/>
                                      <Bar dataKey="value" fill={currentChartMetricConfig.color} />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </TabsContent>
                              </Tabs>
                            ) : (
                              <p className="text-slate-400 text-center py-8">No data available for {currentChartMetricConfig.title}. Start logging vitals to see trends.</p>
                            )}
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </main>

        {/* Right Sidebar */}
        <aside className="lg:col-span-3 space-y-4 md:space-y-6">
            <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <CardContent className="p-6 text-center">
                    <p className="text-sm opacity-80">Overall Health Score</p>
                    <p className="text-6xl font-bold my-2">{isTwinLoading ? '...' : riskAssessment.score}</p>
                    <div className="w-full bg-white/20 h-2.5 rounded-full"><motion.div className="bg-white h-2.5 rounded-full" initial={{ width: '0%' }} animate={{ width: `${riskAssessment.score}%` }}/></div>
                    <p className="text-xs opacity-70 mt-2">Based on your Health Twin model</p>
                </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-white"><Trophy/> Achievements</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {achievements.length > 0 ? achievements.map(ach => (
                        <div key={ach.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-yellow-500/10"><Award className="w-5 h-5 text-yellow-400"/><p className="font-medium text-white">{ach.title}</p></div>
                    )) : <p className="text-sm text-slate-400">No recent achievements.</p>}
                     <Link to={createPageUrl("Achievements")}><Button variant="outline" className="w-full mt-2 border-slate-600 hover:bg-slate-700 text-white">View All</Button></Link>
                </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-white"><AlertTriangle /> Twin-Recommended Actions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {actionRecommendation.primary === 'urgent_consultation' && (
                      <Link to={createPageUrl("VideoCall")}><Button className="w-full bg-red-600 hover:bg-red-700 text-white animate-pulse"><Video className="w-4 h-4 mr-2"/> Urgent Consultation</Button></Link>
                    )}
                    {actionRecommendation.primary === 'ai_consultation' && (
                      <Link to={createPageUrl("AIDoctor")}><Button className="w-full bg-blue-600 hover:bg-blue-700 text-white"><Brain className="w-4 h-4 mr-2"/> AI Symptom Check</Button></Link>
                    )}
                    {actionRecommendation.secondary.includes('emergency') && (
                      <Link to={createPageUrl("Emergency")}><Button className="w-full bg-red-600 hover:bg-red-700 text-white"><AlertTriangle className="w-4 h-4 mr-2"/> Emergency Alert</Button></Link>
                    )}
                    {actionRecommendation.secondary.includes('share_family') && (
                      <Link to={createPageUrl("FamilyHealth")}><Button className="w-full bg-purple-600 hover:bg-purple-700 text-white"><Users className="w-4 h-4 mr-2"/> Share with Family</Button></Link>
                    )}
                    {actionRecommendation.secondary.includes('ai_coach') && (
                      <Link to={createPageUrl("AICoach")}><Button className="w-full bg-green-600 hover:bg-green-700 text-white"><Target className="w-4 h-4 mr-2"/> AI Coach</Button></Link>
                    )}
                </CardContent>
            </Card>
        </aside>

      </div>
    </div>
  );
}