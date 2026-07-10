import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Heart, Activity, Moon, Flame, Droplets, Brain, 
  AlertCircle, Users, Camera, Zap, Clock, TrendingUp,
  Bell, Settings, Video, Pill, Shield, Target, Award,
  CheckCircle, Phone, Calendar, ArrowRight, Sparkles,
  ThermometerSun, Wind, Footprints, Plus, Trophy, Info
} from "lucide-react";
import { useHealthTwin } from "@/components/health-twin/HealthTwinProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [liveVitals, setLiveVitals] = useState({
    heart_rate: 72,
    spo2: 98,
    blood_pressure_systolic: 120,
    blood_pressure_diastolic: 80,
    temperature: 36.8,
    steps: 7245,
    sleep_hours: 7.5,
    calories: 1843,
    stress_level: 35
  });

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: metrics } = useQuery({
    queryKey: ['recentMetrics', user?.email],
    queryFn: () => base44.entities.HealthMetric.filter({ created_by: user.email }, '-timestamp', 100),
    initialData: [],
    enabled: !!user?.email
  });

  const { data: familyMembers } = useQuery({
    queryKey: ['familyMembers', user?.email],
    queryFn: () => base44.entities.FamilyMember.filter({ created_by: user.email }),
    initialData: [],
    enabled: !!user?.email
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pendingConnectionRequests'],
    queryFn: async () => {
      if (!user?.id) return [];
      const requests = await base44.entities.FamilyConnectionRequest.filter({
        target_user_id: user.id,
        status: 'pending'
      });
      return requests;
    },
    enabled: !!user?.id,
    refetchInterval: 3000,
  });

  const { data: emergencyContacts } = useQuery({
    queryKey: ['emergencyContacts', user?.email],
    queryFn: () => base44.entities.EmergencyContact.filter({ created_by: user.email }),
    initialData: [],
    enabled: !!user?.email
  });

  // Health Twin integration
  const { twinState, recentVitals, interpretVital } = useHealthTwin();

  // Seed demo data on mount if user is in demo mode
  useEffect(() => {
    if (user?.demo_mode) {
      base44.functions.invoke('seedDemoData', {}).catch(err => {
        console.log('Demo data already seeded or user not in demo mode:', err);
      });
    }
  }, [user]);

  // Simulate real-time wearable data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveVitals(prev => ({
        heart_rate: Math.max(60, Math.min(100, prev.heart_rate + (Math.random() - 0.5) * 3)),
        spo2: Math.max(95, Math.min(100, prev.spo2 + (Math.random() - 0.5) * 0.5)),
        blood_pressure_systolic: Math.max(110, Math.min(140, prev.blood_pressure_systolic + (Math.random() - 0.5) * 2)),
        blood_pressure_diastolic: Math.max(70, Math.min(90, prev.blood_pressure_diastolic + (Math.random() - 0.5) * 1)),
        temperature: Math.max(36.0, Math.min(37.5, prev.temperature + (Math.random() - 0.5) * 0.1)),
        steps: Math.min(15000, prev.steps + Math.floor(Math.random() * 15)),
        sleep_hours: prev.sleep_hours,
        calories: Math.min(3000, prev.calories + Math.floor(Math.random() * 8)),
        stress_level: Math.max(0, Math.min(100, prev.stress_level + (Math.random() - 0.5) * 2))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Add notifications for pending requests
  useEffect(() => {
    if (pendingRequests.length > 0) {
      const newNotifications = pendingRequests.map(req => ({
        id: req.id,
        type: 'request',
        title: 'New Family Connection Request',
        message: `${req.requester_name} wants to share health data with you`,
        timestamp: new Date().toISOString(),
        unread: true
      }));
      setNotifications(prev => [...newNotifications, ...prev.filter(n => n.type !== 'request')]);
    }
  }, [pendingRequests]);

  // Calculate health score
  const calculateHealthScore = () => {
    const hrScore = 100 - Math.abs(liveVitals.heart_rate - 75);
    const spo2Score = liveVitals.spo2;
    const bpScore = 100 - Math.abs(liveVitals.blood_pressure_systolic - 120) * 2;
    const stressScore = 100 - liveVitals.stress_level;
    const sleepScore = (liveVitals.sleep_hours / 8) * 100;
    
    return Math.round((hrScore + spo2Score + bpScore + stressScore + sleepScore) / 5);
  };

  const healthScore = calculateHealthScore();

  // Get chart data for trends
  const getChartData = () => {
    const heartRateMetrics = metrics.filter(m => m.metric_type === 'heart_rate').slice(-10);
    
    // If we have less than 4 data points, generate synthetic data for better visualization
    if (heartRateMetrics.length < 4) {
      const now = new Date();
      return Array.from({ length: 8 }, (_, i) => {
        const timeOffset = (7 - i) * 30 * 60 * 1000; // 30 minutes apart
        const timestamp = new Date(now.getTime() - timeOffset);
        return {
          time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Math.round(70 + Math.random() * 15) // Realistic heart rate range 70-85
        };
      });
    }
    
    return heartRateMetrics.map(m => ({
      time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: m.value
    }));
  };

  const chartData = getChartData();

  // AI Recommendations
  const aiRecommendations = [
    {
      id: 1,
      title: "Stay Hydrated",
      description: "You've only consumed 1.2L today. Aim for 2.5L for optimal health.",
      icon: Droplets,
      color: "from-blue-500 to-cyan-500",
      points: 50,
      completed: false
    },
    {
      id: 2,
      title: "Evening Walk",
      description: "Take a 15-minute walk to reach your 10,000 step goal.",
      icon: Footprints,
      color: "from-green-500 to-emerald-500",
      points: 75,
      completed: false
    },
    {
      id: 3,
      title: "Reduce Stress",
      description: "Your stress levels are elevated. Try 10 minutes of meditation.",
      icon: Brain,
      color: "from-purple-500 to-pink-500",
      points: 100,
      completed: false
    }
  ];

  // Health alerts
  const healthAlerts = [];
  if (liveVitals.heart_rate > 95) {
    healthAlerts.push({
      type: 'warning',
      message: 'Elevated heart rate detected',
      icon: Heart,
      color: 'text-orange-500'
    });
  }
  if (liveVitals.stress_level > 70) {
    healthAlerts.push({
      type: 'critical',
      message: 'High stress levels - take a break',
      icon: AlertCircle,
      color: 'text-red-500'
    });
  }
  if (liveVitals.spo2 < 95) {
    healthAlerts.push({
      type: 'critical',
      message: 'Low oxygen saturation',
      icon: Activity,
      color: 'text-red-500'
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      {/* Top Header Bar */}
      <motion.div 
        className="bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4 sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Heart className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                AUTRYST
              </h1>
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <motion.div className="relative" whileHover={{ scale: 1.05 }}>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {(notifications.filter(n => n.unread).length + pendingRequests.length) > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {notifications.filter(n => n.unread).length + pendingRequests.length}
                  </motion.span>
                )}
              </Button>

              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <ScrollArea className="h-96">
                    <div className="p-2">
                      {pendingRequests.map(req => (
                        <div key={req.id} className="p-3 hover:bg-gray-50 rounded-lg mb-2">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-900">New Connection Request</p>
                              <p className="text-xs text-gray-600">{req.requester_name} wants to share health data</p>
                              <Link to={createPageUrl("FamilyHealth")}>
                                <Button size="sm" className="mt-2" variant="outline">
                                  View Request
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && pendingRequests.length === 0 && (
                        <div className="p-8 text-center">
                          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </motion.div>

            {/* Settings */}
            <Link to={createPageUrl("Settings")}>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>

            {/* User Profile */}
            <motion.div 
              className="flex items-center gap-3 pl-4 border-l border-gray-200"
              whileHover={{ scale: 1.05 }}
            >
              <div>
                <p className="text-sm font-semibold text-gray-900 text-right">{user?.full_name || 'User'}</p>
                <div className="flex items-center gap-2 justify-end">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-xs text-gray-600">Health Score: {healthScore}%</p>
                </div>
              </div>
              <Avatar className="w-10 h-10 border-2 border-teal-500">
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-blue-600 text-white font-bold">
                  {user?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header with Health Twin Context */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!
            </h2>
            <p className="text-gray-600">
              Your Health Twin's overview for today
            </p>
          </div>


        </motion.div>

        {/* Health Alerts */}
        {healthAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-red-500 bg-red-50/50 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-500 animate-pulse" />
                  <div>
                    <h3 className="font-semibold text-red-900">Health Alerts</h3>
                    <div className="space-y-1 mt-2">
                      {healthAlerts.map((alert, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-red-700">
                          <alert.icon className={`w-4 h-4 ${alert.color}`} />
                          <span>{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Metrics Overview with Twin Interpretations */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Heart Rate"
            value={Math.round(liveVitals.heart_rate)}
            unit="bpm"
            icon={Heart}
            color="from-red-500 to-pink-600"
            isLive={true}
            delay={0.1}
            twinInterpretation="Within your usual range"
          />
          <MetricCard
            title="Blood Pressure"
            value={`${Math.round(liveVitals.blood_pressure_systolic)}/${Math.round(liveVitals.blood_pressure_diastolic)}`}
            unit="mmHg"
            icon={TrendingUp}
            color="from-purple-500 to-indigo-600"
            isLive={true}
            delay={0.2}
            twinInterpretation="Stable today"
          />
          <MetricCard
            title="Oxygen Level"
            value={Math.round(liveVitals.spo2)}
            unit="%"
            icon={Activity}
            color="from-blue-500 to-cyan-600"
            isLive={true}
            delay={0.3}
            twinInterpretation="Optimal range"
          />
          <MetricCard
            title="Sleep Quality"
            value={liveVitals.sleep_hours.toFixed(1)}
            unit="hours"
            icon={Moon}
            color="from-indigo-500 to-purple-600"
            isLive={false}
            delay={0.4}
            twinInterpretation="Good recovery"
          />
          <MetricCard
            title="Stress Level"
            value={Math.round(liveVitals.stress_level) > 0 ? Math.round(liveVitals.stress_level) : '—'}
            unit={Math.round(liveVitals.stress_level) > 0 ? "%" : ""}
            icon={Brain}
            color="from-orange-500 to-red-600"
            isLive={true}
            delay={0.5}
            twinInterpretation={Math.round(liveVitals.stress_level) > 0 ? "Moderate baseline" : "No data"}
          />
          <MetricCard
            title="Steps Today"
            value={Math.round(liveVitals.steps).toLocaleString()}
            unit=""
            icon={Footprints}
            color="from-green-500 to-emerald-600"
            isLive={true}
            delay={0.6}
            twinInterpretation="Below daily target"
          />
          <MetricCard
            title="Calories Burned"
            value={Math.round(liveVitals.calories) > 0 ? Math.round(liveVitals.calories) : '—'}
            unit={Math.round(liveVitals.calories) > 0 ? "kcal" : ""}
            icon={Flame}
            color="from-amber-500 to-orange-600"
            isLive={true}
            delay={0.7}
            twinInterpretation={Math.round(liveVitals.calories) > 0 ? "On track" : "No data"}
          />
          <MetricCard
            title="Temperature"
            value={liveVitals.temperature.toFixed(1)}
            unit="°C"
            icon={ThermometerSun}
            color="from-pink-500 to-rose-600"
            isLive={true}
            delay={0.8}
            twinInterpretation="Normal range"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Activity Trends */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                      <span>Heart Rate Trends</span>
                    </div>
                    <Badge className="bg-green-500">
                      <Clock className="w-3 h-3 mr-1" />
                      Live
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium">
                      📊 Trend Summary: No significant deviation detected yet.
                    </p>
                  </div>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#14b8a6"
                          strokeWidth={3}
                          dot={{ fill: '#14b8a6', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-gray-500">
                      No data available yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Family Health Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span>Family Health</span>
                    </div>
                    <Link to={createPageUrl("FamilyHealth")}>
                      <Button variant="ghost" size="sm">
                        View All
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {familyMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">No family members added yet</p>
                      <Link to={createPageUrl("FamilyHealth")}>
                        <Button className="bg-gradient-to-r from-teal-500 to-blue-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Family Member
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {familyMembers.slice(0, 4).map((member, idx) => (
                        <Link key={member.id} to={createPageUrl("FamilyHealth")}>
                          <motion.div
                            className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 hover:shadow-md transition-all cursor-pointer"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="w-10 h-10 border-2 border-purple-500">
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
                                  {member.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.relationship}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <Badge className="bg-green-500 text-xs">Healthy</Badge>
                            </div>
                            <p className="text-xs text-gray-600 italic">Shared with permission · Interpreted by Health Twin</p>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Video Call & Prescription */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-teal-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <Video className="w-5 h-5 text-blue-600" />
                        Medical Consultation
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Supportive AI video and symptom information (not medical advice)
                      </p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Link to={createPageUrl("VideoCall")}>
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-teal-600">
                        <Video className="w-4 h-4 mr-2" />
                        Start Video Call
                      </Button>
                    </Link>
                    <Link to={createPageUrl("AIDoctor")}>
                      <Button variant="outline" className="w-full">
                        <Activity className="w-4 h-4 mr-2" />
                        Symptom Checker
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 md:space-y-6">
            {/* AI Coach Recommendations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-teal-600" />
                    <span>Health Twin–Suggested Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiRecommendations.map((rec, idx) => (
                    <motion.div
                      key={rec.id}
                      className={`p-4 rounded-xl bg-gradient-to-br ${rec.color} bg-opacity-10 border cursor-pointer hover:shadow-md transition-all`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + idx * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${rec.color} flex items-center justify-center flex-shrink-0`}>
                          <rec.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                          <p className="text-xs text-gray-600 mb-2">{rec.description}</p>
                          <p className="text-xs text-slate-500 mb-2 italic">Based on today's health signals</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              +{rec.points} pts
                            </Badge>
                            <Button size="sm" variant="ghost" className="h-7 text-xs">
                              Complete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <Link to={createPageUrl("AICoach")}>
                    <Button variant="outline" className="w-full mt-2">
                      View All Recommendations
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Emergency Contacts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    <span>Emergency Contacts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {emergencyContacts.length === 0 ? (
                    <div className="text-center py-4">
                      <Shield className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-3">No emergency contacts added</p>
                      <Link to={createPageUrl("Emergency")}>
                        <Button size="sm" variant="outline">
                          Add Contact
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {emergencyContacts.slice(0, 3).map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg bg-white/50 border border-red-100">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{contact.name}</p>
                            <p className="text-xs text-gray-600">{contact.relationship}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="text-red-600">
                            <Phone className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Link to={createPageUrl("Emergency")}>
                        <Button variant="outline" className="w-full mt-2" size="sm">
                          View All Contacts
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Gamification Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    <span>Your Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#f3f4f6"
                          strokeWidth="10"
                        />
                        <motion.circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="url(#gradient)"
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${healthScore * 3.51} 351`}
                          initial={{ strokeDasharray: "0 351" }}
                          animate={{ strokeDasharray: `${healthScore * 3.51} 351` }}
                          transition={{ duration: 2, ease: "easeOut" }}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#14b8a6" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-gray-900">{healthScore}%</p>
                          <p className="text-xs text-gray-600">Health Indicator</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 italic mt-2">Based on trends, not diagnosis</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Daily Goal</span>
                        <span className="font-semibold text-gray-900">
                          {Math.round(liveVitals.steps)}/10,000 steps
                        </span>
                      </div>
                      <Progress value={(liveVitals.steps / 10000) * 100} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Weekly Streak</span>
                        <span className="font-semibold text-gray-900">5 days</span>
                      </div>
                      <Progress value={71} className="h-2" />
                    </div>
                  </div>

                  <Link to={createPageUrl("Achievements")}>
                    <Button variant="outline" className="w-full">
                      <Trophy className="w-4 h-4 mr-2" />
                      View Achievements
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to={createPageUrl("FoodScanner")}>
                  <QuickActionButton
                    icon={Camera}
                    label="Scan Food"
                    color="from-green-500 to-emerald-600"
                  />
                </Link>
                <Link to={createPageUrl("Vitals")}>
                  <QuickActionButton
                    icon={Heart}
                    label="Log Vitals"
                    color="from-red-500 to-pink-600"
                  />
                </Link>
                <Link to={createPageUrl("HealthTwin")}>
                  <QuickActionButton
                    icon={Brain}
                    label="Health Twin"
                    color="from-purple-500 to-indigo-600"
                  />
                </Link>
                <Link to={createPageUrl("Reports")}>
                  <QuickActionButton
                    icon={Calendar}
                    label="View Reports"
                    color="from-blue-500 to-cyan-600"
                  />
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// Metric Card Component with Health Twin interpretation
function MetricCard({ title, value, unit, icon: Icon, color, isLive, delay, metricType, twinInterpretation }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden relative">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            {isLive && (
              <Badge className="bg-green-500 text-xs">
                <motion.div
                  className="w-2 h-2 rounded-full bg-white mr-1"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Live
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2 mb-2">
            <motion.p
              className="text-3xl font-bold text-gray-900"
              key={value}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {value}
            </motion.p>
            <span className="text-sm text-gray-500">{unit}</span>
          </div>
          {twinInterpretation && (
            <p className="text-xs text-slate-600 italic">{twinInterpretation}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Quick Action Button Component
function QuickActionButton({ icon: Icon, label, color }) {
  return (
    <motion.button
      className={`w-full p-4 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg hover:shadow-xl transition-all`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="w-8 h-8 mx-auto mb-2" />
      <p className="text-sm font-semibold">{label}</p>
    </motion.button>
  );
}