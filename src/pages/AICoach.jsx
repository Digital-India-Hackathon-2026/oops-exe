import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, Heart, Activity, Moon, Flame, Droplets, Wind, Apple, 
  Dumbbell, Target, Zap, Footprints, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Clock, Shield, Sparkles, Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useHealthTwin } from "@/components/health-twin/HealthTwinProvider";
import TwinStateIndicator from "@/components/health-twin/TwinStateIndicator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AICoach() {
  const [conversation, setConversation] = useState([]);
  const [expandedAction, setExpandedAction] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Generate demo vitals if no data exists
  const generateDemoVitals = async () => {
    if (!user?.email) return;
    const existingVitals = await base44.entities.HealthMetric.filter({ created_by: user.email }, '-timestamp', 1);
    if (existingVitals.length === 0) {
      const demoData = [
        { metric_type: 'heart_rate', value: 72, unit: 'bpm', timestamp: new Date().toISOString(), source: 'demo' },
        { metric_type: 'spo2', value: 98, unit: '%', timestamp: new Date().toISOString(), source: 'demo' },
        { metric_type: 'sleep', value: 8, unit: 'hrs', timestamp: new Date().toISOString(), source: 'demo' },
        { metric_type: 'calories', value: 2100, unit: 'kcal', timestamp: new Date().toISOString(), source: 'demo' },
        { metric_type: 'stress_level', value: 35, unit: '%', timestamp: new Date().toISOString(), source: 'demo' },
        { metric_type: 'steps', value: 7245, unit: 'steps', timestamp: new Date().toISOString(), source: 'demo' },
      ];
      await base44.entities.HealthMetric.bulkCreate(demoData);
      queryClient.invalidateQueries({ queryKey: ['twinVitals'] });
    }
  };

  // Generate demo data on mount
  React.useEffect(() => {
    generateDemoVitals();
  }, [user?.email]);

  // CRITICAL: All intelligence from Health Twin
  const {
    healthTwin,
    twinState,
    recentVitals,
    interpretVital,
    getRiskAssessment,
    getActionRecommendation,
    isReady
  } = useHealthTwin();

  const riskAssessment = getRiskAssessment();
  const actionRecommendation = getActionRecommendation();

  // Helper to get latest metric
  const getLatestMetric = (type) => recentVitals.find(m => m.metric_type === type);

  // Vitals with Twin interpretation
  const vitalCards = [
    {
      type: 'heart_rate',
      title: "Heart Rate",
      value: getLatestMetric('heart_rate')?.value || 0,
      unit: "bpm",
      icon: Heart,
      color: "from-red-500 to-pink-600"
    },
    {
      type: 'spo2',
      title: "Oxygen",
      value: getLatestMetric('spo2')?.value || 0,
      unit: "%",
      icon: Activity,
      color: "from-blue-500 to-cyan-600"
    },
    {
      type: 'sleep',
      title: "Sleep",
      value: getLatestMetric('sleep')?.value || 0,
      unit: "hrs",
      icon: Moon,
      color: "from-indigo-500 to-purple-600"
    },
    {
      type: 'calories',
      title: "Calories",
      value: getLatestMetric('calories')?.value || 0,
      unit: "kcal",
      icon: Flame,
      color: "from-orange-500 to-red-600"
    },
    {
      type: 'stress_level',
      title: "Stress",
      value: getLatestMetric('stress_level')?.value || 0,
      unit: "%",
      icon: Brain,
      color: "from-teal-500 to-green-600"
    },
    {
      type: 'steps',
      title: "Steps",
      value: getLatestMetric('steps')?.value || 0,
      unit: "",
      icon: Footprints,
      color: "from-green-500 to-emerald-600"
    }
  ];

  // Twin-driven action cards
  const getActionCards = () => {
    const baseActions = [];

    // Workout
    baseActions.push({
      id: 'workout',
      icon: Dumbbell,
      title: "Start Workout",
      description: "AI-guided exercise",
      color: "from-purple-500 to-indigo-600",
      reasoning: isReady 
        ? `Recommended because ${twinState.status === 'stable' ? 'vitals are within baseline and no risk flags present' : 
            twinState.status === 'monitoring' ? 'light activity may help normalize elevated signals' :
            'Twin suggests rest - postpone intensive activity'}`
        : "Twin is learning your optimal workout timing",
      enabled: twinState.status !== 'escalating'
    });

    // Meditation
    const stressLevel = getLatestMetric('stress_level')?.value || 0;
    baseActions.push({
      id: 'meditation',
      icon: Wind,
      title: "Meditation",
      description: "Stress management",
      color: "from-teal-500 to-cyan-600",
      reasoning: isReady 
        ? `Recommended because ${stressLevel > 50 ? 'stress levels elevated compared to baseline' : 
            'regular practice maintains mental baseline and prevents drift'}`
        : "Twin is learning your stress patterns",
      enabled: true
    });

    // Meal Plan
    baseActions.push({
      id: 'meal',
      icon: Apple,
      title: "Meal Plan",
      description: "Nutrition guidance",
      color: "from-green-500 to-emerald-600",
      reasoning: isReady && healthTwin
        ? `Recommended based on activity level (${getLatestMetric('steps')?.value || 0} steps) and metabolic baseline`
        : "Twin is learning your nutritional needs",
      enabled: true
    });

    // Sleep
    const sleepHours = getLatestMetric('sleep')?.value || 0;
    baseActions.push({
      id: 'sleep',
      icon: Moon,
      title: "Sleep Better",
      description: "Rest optimization",
      color: "from-indigo-500 to-purple-600",
      reasoning: isReady 
        ? `Recommended because ${sleepHours < 7 ? 'sleep below your 7-8hr baseline' : 
            'maintaining quality sleep prevents health drift'}`
        : "Twin is learning your sleep patterns",
      enabled: true
    });

    // Goals
    baseActions.push({
      id: 'goals',
      icon: Target,
      title: "Adjust Goals",
      description: "Twin-adaptive targets",
      color: "from-amber-500 to-orange-600",
      reasoning: `Goals automatically adjusted by Twin based on ${twinState.status} state and ${Math.round(twinState.dataCoverage)}% data coverage`,
      enabled: true
    });

    return baseActions;
  };

  // Twin-driven daily goals
  const getDailyGoals = () => {
    const stepsTarget = 10000;
    const caloriesTarget = 2000;
    const sleepTarget = 8;
    const waterTarget = 2.5;

    // Adjust based on Twin state
    const adjustmentFactor = twinState.status === 'monitoring' ? 0.8 : 
                             twinState.status === 'escalating' ? 0.6 : 1.0;

    return [
      {
        icon: Footprints,
        label: "Steps",
        current: getLatestMetric('steps')?.value || 0,
        target: Math.round(stepsTarget * adjustmentFactor),
        adjustment: adjustmentFactor !== 1.0 ? `Reduced due to ${twinState.status} state` : null
      },
      {
        icon: Flame,
        label: "Calories",
        current: getLatestMetric('calories')?.value || 0,
        target: Math.round(caloriesTarget * adjustmentFactor),
        adjustment: adjustmentFactor !== 1.0 ? `Adjusted by Twin` : null
      },
      {
        icon: Moon,
        label: "Sleep",
        current: getLatestMetric('sleep')?.value || 0,
        target: sleepTarget,
        adjustment: twinState.status === 'escalating' ? 'Priority increased for recovery' : null
      },
      {
        icon: Droplets,
        label: "Water",
        current: 1.8, // Simulated
        target: waterTarget,
        adjustment: null
      }
    ];
  };

  // System Readiness (Twin-driven)
  const getSystemReadiness = () => {
    const sleepHours = getLatestMetric('sleep')?.value || 0;
    const stressLevel = getLatestMetric('stress_level')?.value || 0;

    return {
      recovery: sleepHours >= 7 ? 'Good' : sleepHours >= 6 ? 'Moderate' : 'Poor',
      stress: stressLevel < 40 ? 'Controlled' : stressLevel < 70 ? 'Elevated' : 'High',
      training: twinState.status === 'stable' ? 'High' : 
                twinState.status === 'monitoring' ? 'Moderate' : 'Low'
    };
  };

  const systemReadiness = getSystemReadiness();

  const [activeAction, setActiveAction] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [metricsObserved, setMetricsObserved] = useState(null);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [pendingActivityType, setPendingActivityType] = useState(null);

  // Chat handler (Twin-aware, friendly)
  const handleChat = async (message) => {
    if (!message.trim()) return;

    setConversation(prev => [...prev, { role: 'user', content: message, timestamp: new Date() }]);

    const context = `User health model state: ${twinState.status}, confidence: ${twinState.confidence}, risk score: ${riskAssessment.score}. Recent vitals: ${recentVitals.slice(0, 3).map(v => `${v.metric_type}=${v.value}`).join(', ')}`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You're AUTRYST AI Coach - a friendly, supportive health buddy! 

Context: ${context}

User: "${message}"

If they ask about workout/meditation/meal/sleep/goals: Say something like "That's awesome! Just tap the [Action Name] card below and I'll create a personalized plan for you! 🎯"

For other questions: Be warm, encouraging, and reference their Health Twin data. Talk like a friend, not a robot. Use emojis naturally.

Keep it super short - max 50 words. Be casual and upbeat!`
      });

      setConversation(prev => [...prev, { 
        role: 'coach', 
        content: typeof response === 'string' ? response : response.response || 'Hey! Let me check your Health Twin data...', 
        timestamp: new Date() 
      }]);
    } catch (error) {
      setConversation(prev => [...prev, { 
        role: 'coach', 
        content: 'Hmm, need a bit more data to help with that. Keep tracking your vitals! 💪', 
        timestamp: new Date() 
      }]);
    }
  };

  // Timer effect for active sessions
  React.useEffect(() => {
    if (!activeSession) return;
    
    const interval = setInterval(() => {
      setSessionTimer(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeSession]);

  // Monitor health metrics during active session
  React.useEffect(() => {
    if (!activeSession) return;
    
    const checkMetrics = async () => {
      const latestMetrics = await base44.entities.HealthMetric.filter({
        created_by: user.email
      }, '-timestamp', 5);
      
      const sessionStart = new Date(activeSession.start_time);
      const relevantMetrics = latestMetrics.filter(m => new Date(m.timestamp) >= sessionStart);
      
      if (relevantMetrics.length > 0) {
        const heartRate = relevantMetrics.find(m => m.metric_type === 'heart_rate');
        const steps = relevantMetrics.find(m => m.metric_type === 'steps');
        
        if (activeSession.activity_type === 'workout') {
          if (heartRate && heartRate.value > 90) {
            setMetricsObserved(`💓 I can see your heart rate is ${Math.round(heartRate.value)} bpm - you're working hard!`);
          } else if (steps && steps.value > 100) {
            setMetricsObserved(`👟 I see you moving! ${steps.value} steps detected`);
          }
        } else if (activeSession.activity_type === 'meditation') {
          if (heartRate && heartRate.value >= 60 && heartRate.value <= 80) {
            setMetricsObserved(`🧘 Your heart rate is calm at ${Math.round(heartRate.value)} bpm - great meditation!`);
          }
        }
      }
    };
    
    const interval = setInterval(checkMetrics, 5000);
    return () => clearInterval(interval);
  }, [activeSession, user?.email]);

  // Handle action execution - only generates plan, does NOT start session
  const handleAction = async (actionId, actionTitle) => {
    setActiveAction(actionId);
    setActionResult(null);
    
    try {
      let planResult;
      switch(actionId) {
        case 'workout':
          planResult = await base44.functions.invoke('generateWorkoutPlan', {});
          break;
        case 'meditation':
          planResult = await base44.functions.invoke('generateMeditationPlan', {});
          break;
        case 'meal':
          planResult = await base44.functions.invoke('generateMealPlan', {});
          break;
        case 'sleep':
          planResult = await base44.functions.invoke('generateSleepPlan', {});
          break;
        case 'goals':
          planResult = await base44.functions.invoke('adjustGoals', {});
          break;
      }

      setGeneratedPlan(planResult.data);
      setPendingActivityType(actionId);
      toast.success(planResult.data.message);
      
    } catch (error) {
      console.error("Error:", error);
      toast.error('Oops! Something went wrong. Try again?');
    } finally {
      setActiveAction(null);
    }
  };

  // Start activity session after user reviews plan
  const handleStartSession = async () => {
    if (!generatedPlan || !pendingActivityType) return;
    
    try {
      toast.loading('Starting your session...');
      
      const sessionResult = await base44.functions.invoke('startActivitySession', {
        activity_type: pendingActivityType,
        plan_details: generatedPlan,
        planned_duration_minutes: pendingActivityType === 'workout' ? 20 : pendingActivityType === 'meditation' ? 10 : 15
      });

      setActiveSession(sessionResult.data.session);
      setSessionTimer(0);
      setMetricsObserved(null);
      setGeneratedPlan(null);
      setPendingActivityType(null);
      
      toast.dismiss();
      toast.success('Session started! Timer is now running 🎯');
      
    } catch (error) {
      toast.dismiss();
      console.error("Error starting session:", error);
      toast.error('Failed to start session. Try again?');
    }
  };

  // Complete activity session
  const handleCompleteActivity = async () => {
    if (!activeSession) return;
    
    try {
      toast.loading('Analyzing your performance...');
      
      const result = await base44.functions.invoke('completeActivitySession', {
        session_id: activeSession.id
      });
      
      toast.dismiss();
      
      if (result.data.verified) {
        toast.success(`🎉 ${result.data.feedback}`, { duration: 6000 });
        toast.success(`+${result.data.points_earned} points earned! 🌟`);
      } else {
        toast.info(result.data.feedback, { duration: 5000 });
      }
      
      setActionResult({
        ...activeSession.plan_details,
        points_earned: result.data.points_earned,
        verification: result.data
      });
      
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['userActivitySessions'] });
      
      setActiveSession(null);
      setSessionTimer(0);
      setMetricsObserved(null);
      
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to complete session. Try again?');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AUTRYST AI Coach</h1>
          <p className="text-sm md:text-base text-gray-600">Guidance powered by your AI Health Twin</p>
        </div>

        {/* Health Twin Status (persistent, non-dismissible) */}
        <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-md">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                🧠 Health Twin Status: <span className="capitalize">{twinState.status}</span> · <span className="capitalize">{twinState.confidence}</span> Confidence · {Math.round(twinState.dataCoverage)}% Data Coverage
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Section (Twin-interpreted) */}
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Live Vitals (Twin-Interpreted)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {vitalCards.map((vital, index) => {
              const metric = getLatestMetric(vital.type);
              const interpretation = metric && isReady ? interpretVital(metric) : null;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${vital.color} flex items-center justify-center shadow-lg`}>
                          <vital.icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-xs text-gray-600 font-medium">{vital.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{Math.round(vital.value)}</p>
                        <p className="text-xs text-gray-500">{vital.unit}</p>
                        {interpretation ? (
                          <div className={`text-xs px-2 py-1 rounded-full text-center ${
                            interpretation.status === 'alert' ? 'bg-red-100 text-red-700' :
                            interpretation.status === 'caution' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {interpretation.interpretation}
                          </div>
                        ) : (
                          <div className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                            Learning baseline...
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Action Cards (Twin-reasoned) */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {getActionCards().map((action, idx) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${action.color} ${!action.enabled && 'opacity-50'}`}>
                        <div className="flex items-start gap-3 mb-3">
                          <action.icon className="w-6 h-6 text-white" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{action.title}</h3>
                            <p className="text-xs text-white/80">{action.description}</p>
                          </div>
                        </div>
                        
                        {/* MANDATORY: Reasoning */}
                        <div className="text-xs text-white/90 bg-white/10 rounded-lg p-2 mb-2">
                          {action.reasoning}
                        </div>

                        {activeSession && activeSession.plan_details && 
                         ((activeSession.plan_details.plan && action.id === 'workout') ||
                          (activeSession.plan_details.session && action.id === 'meditation') ||
                          (activeSession.plan_details.mealPlan && action.id === 'meal') ||
                          (activeSession.plan_details.plan?.winddown_activities && action.id === 'sleep') ||
                          (activeSession.plan_details.goals && action.id === 'goals')) ? (
                          <div className="space-y-2">
                            <div className="bg-white/20 rounded-lg p-3 text-white text-center">
                              <p className="text-sm font-semibold mb-1">Session Active</p>
                              <p className="text-2xl font-bold">
                                {Math.floor(sessionTimer / 60)}:{String(sessionTimer % 60).padStart(2, '0')}
                              </p>
                              {metricsObserved && (
                                <p className="text-xs mt-2 bg-white/10 rounded px-2 py-1">{metricsObserved}</p>
                              )}
                            </div>
                            <Button 
                              className="w-full bg-green-600 hover:bg-green-700 text-white border-none"
                              onClick={handleCompleteActivity}
                            >
                              ✓ Complete & Earn Points
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            className="w-full bg-white/20 hover:bg-white/30 text-white border-none"
                            disabled={!action.enabled || activeAction === action.id || activeSession}
                            onClick={() => handleAction(action.id, action.title)}
                          >
                            {activeAction === action.id ? 'Creating...' : action.title}
                          </Button>
                        )}

                        {/* Explainability mode */}
                        <button
                          onClick={() => setExpandedAction(expandedAction === action.id ? null : action.id)}
                          className="w-full mt-2 text-xs text-white/70 hover:text-white flex items-center justify-center gap-1"
                        >
                          {expandedAction === action.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          Why AUTRYST suggested this
                        </button>

                        <AnimatePresence>
                          {expandedAction === action.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-2 text-xs text-white/80 bg-white/10 rounded-lg p-2"
                            >
                              <ul className="list-disc list-inside space-y-1">
                                <li>Health Twin state: {twinState.status}</li>
                                <li>Risk assessment: {riskAssessment.level} ({riskAssessment.score}/100)</li>
                                <li>Data confidence: {twinState.confidence}</li>
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Interface (Friendly) */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Chat with Your Coach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-56 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 mb-3">
                  {conversation.length === 0 ? (
                    <div className="text-center text-gray-500 py-6">
                      <p className="text-sm mb-2">👋 Hey there!</p>
                      <p className="text-xs">Ask me anything - I'm here to help!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversation.map((msg, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-2.5 rounded-xl ${
                            msg.role === 'user' 
                              ? 'bg-blue-500 text-white ml-6' 
                              : 'bg-white text-gray-800 mr-6 shadow-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="text-xs text-gray-400 mb-2 text-center">
                  Powered by your Health Twin · Not medical advice
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type here... 💬"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleChat(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl"
                    onClick={(e) => {
                      const input = e.target.previousElementSibling;
                      if (input?.value?.trim()) {
                        handleChat(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* System Readiness */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-600" />
                  System Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recovery Status</span>
                  <Badge className={
                    systemReadiness.recovery === 'Good' ? 'bg-green-500' :
                    systemReadiness.recovery === 'Moderate' ? 'bg-yellow-500' : 'bg-red-500'
                  }>
                    {systemReadiness.recovery}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stress Load</span>
                  <Badge className={
                    systemReadiness.stress === 'Controlled' ? 'bg-green-500' :
                    systemReadiness.stress === 'Elevated' ? 'bg-yellow-500' : 'bg-red-500'
                  }>
                    {systemReadiness.stress}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Training Readiness</span>
                  <Badge className={
                    systemReadiness.training === 'High' ? 'bg-green-500' :
                    systemReadiness.training === 'Moderate' ? 'bg-yellow-500' : 'bg-red-500'
                  }>
                    {systemReadiness.training}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Daily Goals (Twin-adjusted) */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Daily Goals (Adjusted by your AI Health Twin)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getDailyGoals().map((goal, i) => {
                  const progress = (goal.current / goal.target) * 100;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <goal.icon className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-800">{goal.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {Math.round(goal.current)}/{goal.target}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      {goal.adjustment && (
                        <p className="text-xs text-orange-600 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {goal.adjustment}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Plan Preview Modal (before starting session) */}
        <Dialog open={!!generatedPlan} onOpenChange={() => { setGeneratedPlan(null); setPendingActivityType(null); }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-white to-purple-50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Award className="w-6 h-6 text-purple-600" />
                Your Personalized Plan
              </DialogTitle>
            </DialogHeader>
            
            {generatedPlan && (
              <div className="space-y-4">
                {/* Workout Plan */}
                {generatedPlan.plan && generatedPlan.plan.exercises && (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4">
                      <h3 className="font-bold text-purple-900 mb-2">🔥 Warm-up</h3>
                      <p className="text-sm text-gray-700">{generatedPlan.plan.warmup}</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                      <h3 className="font-bold text-purple-900 mb-3">💪 Main Exercises</h3>
                      <div className="space-y-2">
                        {generatedPlan.plan.exercises.map((ex, i) => (
                          <div key={i} className="bg-purple-50 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-semibold text-gray-900">{ex.name}</p>
                              <Badge className="bg-purple-600">{ex.duration}</Badge>
                            </div>
                            <p className="text-xs text-gray-600">{ex.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-4">
                      <h3 className="font-bold text-blue-900 mb-2">😌 Cool Down</h3>
                      <p className="text-sm text-gray-700">{generatedPlan.plan.cooldown}</p>
                    </div>

                    <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                      <p className="text-sm font-medium text-yellow-900">💬 {generatedPlan.plan.motivation}</p>
                    </div>
                  </div>
                )}

                {/* Meditation Session */}
                {generatedPlan.session && (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-teal-100 to-cyan-100 rounded-xl p-4">
                      <h3 className="font-bold text-teal-900 mb-2">🌸 Opening</h3>
                      <p className="text-sm text-gray-700">{generatedPlan.session.opening}</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border-2 border-teal-200">
                      <h3 className="font-bold text-teal-900 mb-2">🫁 Breathing</h3>
                      <p className="text-sm text-gray-700">{generatedPlan.session.breathing}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-4">
                      <h3 className="font-bold text-indigo-900 mb-2">🧘 Practice</h3>
                      <p className="text-sm text-gray-700">{generatedPlan.session.main_practice}</p>
                    </div>

                    <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl p-4">
                      <h3 className="font-bold text-pink-900 mb-2">✨ Closing</h3>
                      <p className="text-sm text-gray-700">{generatedPlan.session.closing}</p>
                    </div>

                    <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200 text-center">
                      <p className="text-sm font-medium text-yellow-900 italic">"{generatedPlan.session.affirmation}"</p>
                    </div>
                  </div>
                )}

                {/* Meal Plan */}
                {generatedPlan.mealPlan && (
                  <div className="space-y-3">
                    {['breakfast', 'lunch', 'dinner'].map((meal) => (
                      <div key={meal} className="bg-white rounded-xl p-4 border-2 border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-green-900 capitalize">{meal}</h3>
                          <Badge className="bg-green-600">{generatedPlan.mealPlan[meal].calories} cal</Badge>
                        </div>
                        <p className="text-sm text-gray-900 font-medium mb-1">{generatedPlan.mealPlan[meal].meal}</p>
                        <p className="text-xs text-gray-600">💡 {generatedPlan.mealPlan[meal].benefit}</p>
                      </div>
                    ))}
                    
                    <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                      <p className="text-sm font-medium text-yellow-900">🌟 Tip: {generatedPlan.mealPlan.tip}</p>
                    </div>
                  </div>
                )}

                {/* Sleep Plan */}
                {generatedPlan.plan && generatedPlan.plan.winddown_activities && (
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
                      <h3 className="font-bold text-indigo-900 mb-2">🌙 Wind-Down Routine</h3>
                      <ul className="space-y-1">
                        {generatedPlan.plan.winddown_activities.map((activity, i) => (
                          <li key={i} className="text-sm text-gray-700">✓ {activity}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-4">
                      <h3 className="font-bold text-blue-900 mb-2">🛏️ Bedroom Tips</h3>
                      <ul className="space-y-1">
                        {generatedPlan.plan.bedroom_tips.map((tip, i) => (
                          <li key={i} className="text-sm text-gray-700">• {tip}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                      <h3 className="font-bold text-purple-900 mb-2">😌 Relaxation</h3>
                      <p className="text-sm text-gray-700">{generatedPlan.plan.relaxation_technique}</p>
                    </div>

                    <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                      <h3 className="font-bold text-yellow-900 mb-1">🎯 Your Goal</h3>
                      <p className="text-sm text-gray-700">{generatedPlan.plan.sleep_goal}</p>
                    </div>
                  </div>
                )}

                {/* Goals */}
                {generatedPlan.goals && (
                  <div className="space-y-3">
                    {Object.entries(generatedPlan.goals).filter(([key]) => key !== 'motivation').map(([key, goal]) => (
                      <div key={key} className="bg-white rounded-xl p-4 border-2 border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-orange-900 capitalize">{key.replace('_goal', '').replace('_', ' ')}</h3>
                          <Badge className="bg-orange-600 text-lg">{goal.target}</Badge>
                        </div>
                        <p className="text-sm text-gray-700">💡 {goal.reason}</p>
                      </div>
                    ))}
                    
                    <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl p-4 border-2 border-orange-300">
                      <p className="text-sm font-bold text-orange-900 text-center">🚀 {generatedPlan.goals.motivation}</p>
                    </div>
                  </div>
                )}

                {/* START ACTIVITY BUTTON */}
                <div className="pt-4">
                  <Button 
                    onClick={handleStartSession}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg py-6 rounded-xl shadow-lg"
                  >
                    ▶️ Start Activity & Begin Timer
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Click to start tracking your activity and earn points upon completion
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Action Result Modal (after completion) */}
        <Dialog open={!!actionResult} onOpenChange={() => setActionResult(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-white to-purple-50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Award className="w-6 h-6 text-purple-600" />
                Activity Completed!
              </DialogTitle>
            </DialogHeader>
            
            {actionResult && (
              <div className="space-y-4">
                {/* Workout Plan */}
                {actionResult.plan && actionResult.plan.exercises && (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4">
                      <h3 className="font-bold text-purple-900 mb-2">🔥 Warm-up</h3>
                      <p className="text-sm text-gray-700">{actionResult.plan.warmup}</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                      <h3 className="font-bold text-purple-900 mb-3">💪 Main Exercises</h3>
                      <div className="space-y-2">
                        {actionResult.plan.exercises.map((ex, i) => (
                          <div key={i} className="bg-purple-50 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-semibold text-gray-900">{ex.name}</p>
                              <Badge className="bg-purple-600">{ex.duration}</Badge>
                            </div>
                            <p className="text-xs text-gray-600">{ex.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-4">
                      <h3 className="font-bold text-blue-900 mb-2">😌 Cool Down</h3>
                      <p className="text-sm text-gray-700">{actionResult.plan.cooldown}</p>
                    </div>

                    <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                      <p className="text-sm font-medium text-yellow-900">💬 {actionResult.plan.motivation}</p>
                    </div>
                  </div>
                )}

                {/* Meditation Session */}
                {actionResult.session && (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-teal-100 to-cyan-100 rounded-xl p-4">
                      <h3 className="font-bold text-teal-900 mb-2">🌸 Opening</h3>
                      <p className="text-sm text-gray-700">{actionResult.session.opening}</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border-2 border-teal-200">
                      <h3 className="font-bold text-teal-900 mb-2">🫁 Breathing</h3>
                      <p className="text-sm text-gray-700">{actionResult.session.breathing}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-4">
                      <h3 className="font-bold text-indigo-900 mb-2">🧘 Practice</h3>
                      <p className="text-sm text-gray-700">{actionResult.session.main_practice}</p>
                    </div>

                    <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl p-4">
                      <h3 className="font-bold text-pink-900 mb-2">✨ Closing</h3>
                      <p className="text-sm text-gray-700">{actionResult.session.closing}</p>
                    </div>

                    <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200 text-center">
                      <p className="text-sm font-medium text-yellow-900 italic">"{actionResult.session.affirmation}"</p>
                    </div>
                  </div>
                )}

                {/* Meal Plan */}
                {actionResult.mealPlan && (
                  <div className="space-y-3">
                    {['breakfast', 'lunch', 'dinner'].map((meal) => (
                      <div key={meal} className="bg-white rounded-xl p-4 border-2 border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-green-900 capitalize">{meal}</h3>
                          <Badge className="bg-green-600">{actionResult.mealPlan[meal].calories} cal</Badge>
                        </div>
                        <p className="text-sm text-gray-900 font-medium mb-1">{actionResult.mealPlan[meal].meal}</p>
                        <p className="text-xs text-gray-600">💡 {actionResult.mealPlan[meal].benefit}</p>
                      </div>
                    ))}
                    
                    <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                      <p className="text-sm font-medium text-yellow-900">🌟 Tip: {actionResult.mealPlan.tip}</p>
                    </div>
                  </div>
                )}

                {/* Sleep Plan */}
                {actionResult.plan && actionResult.plan.winddown_activities && (
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
                      <h3 className="font-bold text-indigo-900 mb-2">🌙 Wind-Down Routine</h3>
                      <ul className="space-y-1">
                        {actionResult.plan.winddown_activities.map((activity, i) => (
                          <li key={i} className="text-sm text-gray-700">✓ {activity}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-4">
                      <h3 className="font-bold text-blue-900 mb-2">🛏️ Bedroom Tips</h3>
                      <ul className="space-y-1">
                        {actionResult.plan.bedroom_tips.map((tip, i) => (
                          <li key={i} className="text-sm text-gray-700">• {tip}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                      <h3 className="font-bold text-purple-900 mb-2">😌 Relaxation</h3>
                      <p className="text-sm text-gray-700">{actionResult.plan.relaxation_technique}</p>
                    </div>

                    <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                      <h3 className="font-bold text-yellow-900 mb-1">🎯 Your Goal</h3>
                      <p className="text-sm text-gray-700">{actionResult.plan.sleep_goal}</p>
                    </div>
                  </div>
                )}

                {/* Goals */}
                {actionResult.goals && (
                  <div className="space-y-3">
                    {Object.entries(actionResult.goals).filter(([key]) => key !== 'motivation').map(([key, goal]) => (
                      <div key={key} className="bg-white rounded-xl p-4 border-2 border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-orange-900 capitalize">{key.replace('_goal', '').replace('_', ' ')}</h3>
                          <Badge className="bg-orange-600 text-lg">{goal.target}</Badge>
                        </div>
                        <p className="text-sm text-gray-700">💡 {goal.reason}</p>
                      </div>
                    ))}
                    
                    <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl p-4 border-2 border-orange-300">
                      <p className="text-sm font-bold text-orange-900 text-center">🚀 {actionResult.goals.motivation}</p>
                    </div>
                  </div>
                )}

                {actionResult.points_earned > 0 && (
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 border-2 border-green-400">
                    <div className="flex items-center justify-center gap-2">
                      <Award className="w-6 h-6 text-green-700" />
                      <p className="text-lg font-bold text-green-900">
                        +{actionResult.points_earned} Points Earned! 🎉
                      </p>
                    </div>
                    {actionResult.verification && (
                      <p className="text-sm text-green-800 text-center mt-2">
                        {actionResult.verification.feedback}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}