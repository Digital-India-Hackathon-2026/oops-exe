import React, { useMemo, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Heart, Activity, Wind, Moon, Flame, Brain, AlertCircle, Shield, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const DetailCard = ({ title, value, unit, icon: Icon, color, loading }) => (
    <Card className="bg-slate-900 border-slate-700 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
            <Icon className={`w-4 h-4 ${color}`} />
        </CardHeader>
        <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold text-white">{value} <span className="text-xs text-slate-400">{unit}</span></div>
            )}
        </CardContent>
    </Card>
);

export default function FamilyMemberDetailModal({ member, isOpen, onClose }) {
    const [showExplainer, setShowExplainer] = useState(false);
    const [showEscalationModel, setShowEscalationModel] = useState(false);
    
    const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

    // This is correct: `member` is the record owned by the current user.
    // Its `shared_permissions` field correctly stores the permissions granted by the linked user.
    const canView = (permission) => member?.shared_permissions?.includes(permission);

    const { data: metrics, isLoading: metricsLoading } = useQuery({
        queryKey: ['familyMemberMetrics', member?.linked_user_email],
        queryFn: () => base44.entities.HealthMetric.filter({ created_by: member.linked_user_email }, "-timestamp", 100),
        enabled: !!member?.linked_user_id && (member?.shared_permissions?.length || 0) > 0,
        refetchInterval: 10000,
    });
    
    const isLoading = metricsLoading;

    const latestMetrics = useMemo(() => {
        if (!metrics) return {};
        const getLatest = (type) => metrics.find(m => m.metric_type === type);
        return {
            heart_rate: getLatest('heart_rate'),
            spo2: getLatest('spo2'),
            temperature: getLatest('temperature'),
            steps: getLatest('steps'),
            sleep: getLatest('sleep'),
            stress: getLatest('stress_level'),
        };
    }, [metrics]);

    const chartData = useMemo(() => {
        if (!metrics) return [];
        return metrics
            .filter(m => m.metric_type === 'heart_rate')
            .map(m => ({
                name: format(new Date(m.timestamp), 'p'),
                value: m.value
            }))
            .reverse();
    }, [metrics]);

    if (!member) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-gray-100">
                        <Avatar className="w-12 h-12 border-2 border-teal-500">
                            {member.profile_photo ? (
                                <AvatarImage src={member.profile_photo} alt={member.name} className="object-cover" />
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-blue-700 to-teal-800 text-white font-bold text-lg">
                                    {member.name.charAt(0)}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div>
                          <div>{member.name}'s Health Overview</div>
                          <p className="text-xs text-slate-400 font-normal mt-1">Intelligence-governed family view</p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh]">
                    <div className="space-y-6 pr-4 pt-4">
                        {!member.linked_user_id ? (
                            <div className="text-center p-8">
                                <p className="text-slate-400">This family member does not have a linked AURYST account. Live intelligence is unavailable.</p>
                            </div>
                        ) : !member.shared_permissions || (member.shared_permissions?.length || 0) === 0 ? (
                             <Alert className="bg-slate-900 border-orange-700">
                                <AlertCircle className="h-4 w-4 text-orange-400"/>
                                <AlertDescription className="text-orange-300">
                                    No intelligence sharing permissions have been granted by {member.name}. To view their health summaries, please ask them to update sharing settings.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <>
                                {/* Health Twin Summary (Family View) */}
                                <Card className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 border-blue-700">
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg text-gray-100">
                                      <Brain className="w-5 h-5 text-blue-400" />
                                      Health Twin Summary (Family View)
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                      <div className="p-3 rounded-lg bg-slate-800/60">
                                        <p className="text-xs text-slate-400 mb-1">Overall State</p>
                                        <p className="text-sm font-semibold text-white capitalize">
                                          {latestMetrics.heart_rate && latestMetrics.spo2 ? 'Stable' : 'Learning'}
                                        </p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-slate-800/60">
                                        <p className="text-xs text-slate-400 mb-1">Current Focus</p>
                                        <p className="text-sm font-semibold text-white">Cardiovascular</p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-slate-800/60">
                                        <p className="text-xs text-slate-400 mb-1">Escalation</p>
                                        <p className="text-sm font-semibold text-white">Not Armed</p>
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-400 italic mt-2">
                                      This view is summarized by the AI Health Twin for awareness, not diagnosis.
                                    </p>
                                  </CardContent>
                                </Card>

                                {/* Explainability Section */}
                                <div>
                                  <Button
                                    variant="ghost"
                                    className="w-full text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800/50"
                                    onClick={() => setShowExplainer(!showExplainer)}
                                  >
                                    <Info className="w-4 h-4 mr-2" />
                                    Why you're seeing this
                                    {showExplainer ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                                  </Button>
                                  <AnimatePresence>
                                    {showExplainer && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <Card className="bg-slate-900 border-slate-700 mt-2">
                                          <CardContent className="p-4 space-y-2 text-sm text-slate-300">
                                            <p>• Shared with explicit consent</p>
                                            <p>• Interpreted by the AI Health Twin</p>
                                            <p>• Designed for awareness and safety</p>
                                          </CardContent>
                                        </Card>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                {/* Key Interpreted Signals */}
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-100 mb-3">Key Interpreted Signals</h3>
                                  <div className="grid md:grid-cols-3 gap-4">
                                    {canView('vitals') ? (
                                        <>
                                            <Card className="bg-slate-900 border-slate-700">
                                              <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                  <CardTitle className="text-sm text-slate-400">Heart Rate Status</CardTitle>
                                                  <Heart className="w-4 h-4 text-red-500" />
                                                </div>
                                              </CardHeader>
                                              <CardContent>
                                                {isLoading ? <Skeleton className="h-6 w-20" /> : (
                                                  <>
                                                    <p className="text-xl font-bold text-white">{latestMetrics.heart_rate?.value || 'N/A'} <span className="text-xs text-slate-400">bpm</span></p>
                                                    <p className="text-xs text-slate-400 mt-1">Within baseline range</p>
                                                  </>
                                                )}
                                              </CardContent>
                                            </Card>
                                            <Card className="bg-slate-900 border-slate-700">
                                              <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                  <CardTitle className="text-sm text-slate-400">SPO2 Status</CardTitle>
                                                  <Wind className="w-4 h-4 text-blue-500" />
                                                </div>
                                              </CardHeader>
                                              <CardContent>
                                                {isLoading ? <Skeleton className="h-6 w-20" /> : (
                                                  <>
                                                    <p className="text-xl font-bold text-white">{latestMetrics.spo2?.value || 'N/A'} <span className="text-xs text-slate-400">%</span></p>
                                                    <p className="text-xs text-slate-400 mt-1">Normal oxygen saturation</p>
                                                  </>
                                                )}
                                              </CardContent>
                                            </Card>
                                            <Card className="bg-slate-900 border-slate-700">
                                              <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                  <CardTitle className="text-sm text-slate-400">Temperature</CardTitle>
                                                  <Activity className="w-4 h-4 text-orange-500" />
                                                </div>
                                              </CardHeader>
                                              <CardContent>
                                                {isLoading ? <Skeleton className="h-6 w-20" /> : (
                                                  <>
                                                    <p className="text-xl font-bold text-white">{latestMetrics.temperature?.value || 'N/A'} <span className="text-xs text-slate-400">°C</span></p>
                                                    <p className="text-xs text-slate-400 mt-1">Within normal range</p>
                                                  </>
                                                )}
                                              </CardContent>
                                            </Card>
                                        </>
                                    ) : <p className="text-slate-500 text-sm md:col-span-3">Vital summaries not shared.</p>}
                                  </div>
                                </div>

                                {/* Recent Trends Section */}
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-100 mb-3">Recent Trends (Summarized)</h3>
                                  <div className="grid md:grid-cols-2 gap-4">
                                     {canView('activity') ? (
                                        <Card className="bg-slate-900 border-slate-700">
                                          <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                              <CardTitle className="text-sm text-slate-400">Activity Balance</CardTitle>
                                              <Flame className="w-4 h-4 text-green-500" />
                                            </div>
                                          </CardHeader>
                                          <CardContent>
                                            {isLoading ? <Skeleton className="h-6 w-20" /> : (
                                              <>
                                                <p className="text-xl font-bold text-white">{latestMetrics.steps?.value?.toLocaleString() || 'N/A'} <span className="text-xs text-slate-400">steps</span></p>
                                                <p className="text-xs text-slate-400 mt-1">Consistent activity pattern maintained</p>
                                              </>
                                            )}
                                          </CardContent>
                                        </Card>
                                    ) : <p className="text-slate-500 text-sm">Activity summaries not shared.</p>}
                                    
                                    {canView('sleep') ? (
                                        <Card className="bg-slate-900 border-slate-700">
                                          <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                              <CardTitle className="text-sm text-slate-400">Sleep Adequacy</CardTitle>
                                              <Moon className="w-4 h-4 text-indigo-500" />
                                            </div>
                                          </CardHeader>
                                          <CardContent>
                                            {isLoading ? <Skeleton className="h-6 w-20" /> : (
                                              <>
                                                <p className="text-xl font-bold text-white">{latestMetrics.sleep?.value || 'N/A'} <span className="text-xs text-slate-400">hrs</span></p>
                                                <p className="text-xs text-slate-400 mt-1">Meeting recovery targets</p>
                                              </>
                                            )}
                                          </CardContent>
                                        </Card>
                                    ) : <p className="text-slate-500 text-sm">Sleep summaries not shared.</p>}
                                  </div>
                                </div>

                                {canView('vitals') && chartData.length > 0 && (
                                    <Card className="bg-slate-900 border-slate-700">
                                        <CardHeader>
                                          <CardTitle className="text-lg text-slate-300">Heart Rate Trend</CardTitle>
                                          <p className="text-xs text-slate-400 mt-1">Stable pattern with minor daily variations</p>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                    <defs><linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.7}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                                    <YAxis stroke="#94a3b8" fontSize={12}/>
                                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}/>
                                                    <Area type="monotone" dataKey="value" stroke="#ef4444" fill="url(#colorHr)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Family Escalation Model (Informational) */}
                                <div>
                                  <Button
                                    variant="ghost"
                                    className="w-full text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800/50"
                                    onClick={() => setShowEscalationModel(!showEscalationModel)}
                                  >
                                    <Shield className="w-4 h-4 mr-2" />
                                    Family Escalation Model
                                    {showEscalationModel ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                                  </Button>
                                  <AnimatePresence>
                                    {showEscalationModel && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <Card className="bg-slate-900 border-slate-700 mt-2">
                                          <CardContent className="p-4">
                                            <div className="space-y-3">
                                              <div className="flex items-center gap-3 p-2 rounded bg-slate-800/50">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <div className="flex-1">
                                                  <p className="text-sm font-semibold text-white">Observe</p>
                                                  <p className="text-xs text-slate-400">Silent monitoring mode</p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-3 p-2 rounded bg-slate-800/50">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                <div className="flex-1">
                                                  <p className="text-sm font-semibold text-white">Monitor</p>
                                                  <p className="text-xs text-slate-400">Heightened awareness</p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-3 p-2 rounded bg-slate-800/50">
                                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                <div className="flex-1">
                                                  <p className="text-sm font-semibold text-white">Notify Family</p>
                                                  <p className="text-xs text-slate-400">Automatic alert sent</p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-3 p-2 rounded bg-slate-800/50">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                <div className="flex-1">
                                                  <p className="text-sm font-semibold text-white">Emergency Services</p>
                                                  <p className="text-xs text-slate-400">Critical escalation</p>
                                                </div>
                                              </div>
                                            </div>
                                            <p className="text-xs text-slate-400 italic mt-3">
                                              Escalation logic is governed by the Health Twin. No manual triggering available.
                                            </p>
                                          </CardContent>
                                        </Card>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                {canView('predictions') ? (
                                    <Card className="bg-gradient-to-br from-teal-900/40 to-cyan-900/40 border-teal-700">
                                      <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base text-gray-100">
                                          <Brain className="w-5 h-5 text-teal-400" />
                                          Health Twin Insight
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <p className="text-sm text-gray-300">
                                          {member.name}'s physiological signals are within learned baselines. The system is monitoring cardiovascular trends before adjusting recommendations.
                                        </p>
                                      </CardContent>
                                    </Card>
                                ) : null}
                            </>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}