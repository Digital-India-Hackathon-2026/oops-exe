import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Award,
  TrendingUp,
  Heart,
  Activity,
  Moon,
  Apple,
  Dumbbell,
  Droplets,
  Flame,
  Brain,
  Clock,
  Calendar,
  Users,
  Share2,
  Crown,
  Sparkles,
  Gift,
  CheckCircle,
  Lock,
  Unlock,
  TrendingDown,
  Medal,
  Flag,
  ArrowRight,
  Plus,
  RefreshCw,
  Bell,
  MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function Achievements() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(null);
  const [liveStats, setLiveStats] = useState({
    steps_today: 7245,
    calories_burned: 1843,
    active_minutes: 87,
    water_intake: 6,
    meals_logged: 3,
    sleep_hours: 7.5
  });
  
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: achievements, isLoading } = useQuery({
    queryKey: ["achievements", user?.email],
    queryFn: () => base44.entities.Achievement.filter({ created_by: user.email }, "-unlocked_at"),
    enabled: !!user?.email,
    initialData: [],
  });
  
  const { data: challenges, isLoading: challengesLoading } = useQuery({
    queryKey: ["challenges", user?.email],
    queryFn: () => base44.entities.Challenge.filter({ created_by: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: metrics } = useQuery({
    queryKey: ['recentMetrics'],
    queryFn: () => base44.entities.HealthMetric.filter({}, '-timestamp', 100),
    initialData: [],
  });

  const totalPoints = achievements.reduce((sum, ach) => sum + (ach.points || 0), 0);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        steps_today: Math.min(15000, prev.steps_today + Math.floor(Math.random() * 20)),
        calories_burned: Math.min(3000, prev.calories_burned + Math.floor(Math.random() * 5)),
        active_minutes: Math.min(120, prev.active_minutes + Math.floor(Math.random() * 2)),
        water_intake: prev.water_intake,
        meals_logged: prev.meals_logged,
        sleep_hours: prev.sleep_hours
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // User stats for gamification
  const userStats = {
    health_xp: totalPoints || 0, // Use calculated totalPoints
    level: Math.floor((totalPoints || 0) / 1000) + 1, // Use calculated totalPoints
    current_streak: 7,
    badges_unlocked: achievements.length,
    total_achievements: 48,
    achievements_this_week: 3,
    next_level_xp: (Math.floor((totalPoints || 0) / 1000) + 1) * 1000 // Use calculated totalPoints
  };

  const xpToNextLevel = userStats.next_level_xp - userStats.health_xp;
  const levelProgress = ((userStats.health_xp % 1000) / 1000) * 100;

  // Achievement categories
  const categories = [
    { id: "all", name: "All", icon: Award, color: "from-purple-500 to-pink-600" },
    { id: "exercise", name: "Exercise", icon: Dumbbell, color: "from-red-500 to-orange-600" },
    { id: "nutrition", name: "Nutrition", icon: Apple, color: "from-green-500 to-emerald-600" },
    { id: "sleep", name: "Sleep", icon: Moon, color: "from-indigo-500 to-purple-600" },
    { id: "consistency", name: "Streaks", icon: Flame, color: "from-orange-500 to-red-600" },
    { id: "milestone", name: "Milestones", icon: Flag, color: "from-blue-500 to-cyan-600" }
  ];

  // Rarity configuration
  const rarityConfig = {
    common: { 
      color: "from-gray-400 to-gray-500", 
      bg: "bg-gray-50", 
      text: "text-gray-700", 
      border: "border-gray-200",
      emoji: "🥉",
      glow: "shadow-gray-500/20"
    },
    rare: { 
      color: "from-blue-400 to-blue-600", 
      bg: "bg-blue-50", 
      text: "text-blue-700", 
      border: "border-blue-200",
      emoji: "🥈",
      glow: "shadow-blue-500/30"
    },
    epic: { 
      color: "from-purple-400 to-purple-600", 
      bg: "bg-purple-50", 
      text: "text-purple-700", 
      border: "border-purple-200",
      emoji: "🥇",
      glow: "shadow-purple-500/40"
    },
    legendary: { 
      color: "from-amber-400 to-amber-600", 
      bg: "bg-amber-50", 
      text: "text-amber-700", 
      border: "border-amber-200",
      emoji: "👑",
      glow: "shadow-amber-500/50"
    }
  };

  // Locked achievements (goals to pursue)
  const lockedAchievements = [
    {
      id: "10k_steps",
      title: "10K Champion",
      description: "Walk 10,000 steps in a single day",
      category: "exercise",
      rarity: "rare",
      points: 150,
      progress: (liveStats.steps_today / 10000) * 100,
      currentValue: liveStats.steps_today,
      targetValue: 10000
    },
    {
      id: "30day_streak",
      title: "Consistency Master",
      description: "Maintain a 30-day activity streak",
      category: "consistency",
      rarity: "epic",
      points: 500,
      progress: (userStats.current_streak / 30) * 100,
      currentValue: userStats.current_streak,
      targetValue: 30
    },
    {
      id: "nutrition_expert",
      title: "Nutrition Expert",
      description: "Log 100 healthy meals",
      category: "nutrition",
      rarity: "epic",
      points: 400,
      progress: 67,
      currentValue: 67,
      targetValue: 100
    },
    {
      id: "sleep_master",
      title: "Sleep Master",
      description: "Get 8+ hours of quality sleep for 14 consecutive days",
      category: "sleep",
      rarity: "rare",
      points: 200,
      progress: 35,
      currentValue: 5,
      targetValue: 14
    },
    {
      id: "hydration_hero",
      title: "Hydration Hero",
      description: "Drink 2.5L water daily for 7 days",
      category: "consistency",
      rarity: "common",
      points: 100,
      progress: 42,
      currentValue: 3,
      targetValue: 7
    },
    {
      id: "fitness_legend",
      title: "Fitness Legend",
      description: "Burn 50,000 calories through exercise",
      category: "exercise",
      rarity: "legendary",
      points: 1000,
      progress: 45,
      currentValue: 22500,
      targetValue: 50000
    }
  ];

  // Active challenges
  const activeChallenges = [
    {
      id: "weekly_cardio",
      title: "Cardio Week Challenge",
      description: "Complete 150 minutes of cardio this week",
      reward: 250,
      progress: 68,
      currentValue: 102,
      targetValue: 150,
      endDate: "2024-12-31",
      icon: Heart,
      color: "from-red-500 to-pink-600"
    },
    {
      id: "hydration_week",
      title: "Hydration Goal",
      description: "Drink 2L water daily for 7 days",
      reward: 150,
      progress: 57,
      currentValue: 4,
      targetValue: 7,
      endDate: "2024-12-28",
      icon: Droplets,
      color: "from-blue-500 to-cyan-600"
    },
    {
      id: "meal_tracker",
      title: "Meal Logging Streak",
      description: "Log all meals for 5 consecutive days",
      reward: 200,
      progress: 80,
      currentValue: 4,
      targetValue: 5,
      endDate: "2024-12-27",
      icon: Apple,
      color: "from-green-500 to-emerald-600"
    }
  ];

  // Leaderboard (mock data)
  const leaderboard = [
    { rank: 1, name: "Sarah Johnson", xp: 12847, avatar: "SJ", streak: 45 },
    { rank: 2, name: "Mike Chen", xp: 11293, avatar: "MC", streak: 38 },
    { rank: 3, name: "Emma Davis", xp: 10651, avatar: "ED", streak: 42 },
    { rank: 4, name: user?.full_name || "You", xp: userStats.health_xp, avatar: user?.full_name?.charAt(0) || "U", streak: userStats.current_streak, isCurrentUser: true },
    { rank: 5, name: "Alex Kumar", xp: 9234, avatar: "AK", streak: 29 }
  ];

  // Filter achievements
  const filteredAchievements = selectedCategory === "all" 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const filteredLocked = selectedCategory === "all"
    ? lockedAchievements
    : lockedAchievements.filter(a => a.category === selectedCategory);

  // AI-powered goal suggestions
  const suggestNextGoal = async () => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI fitness coach for AUTRYST. Based on the user's current achievements and progress, suggest 3 achievable yet challenging goals.

Current Stats:
- Level: ${userStats.level}
- Steps Today: ${liveStats.steps_today}
- Active Minutes: ${liveStats.active_minutes}
- Current Streak: ${userStats.current_streak} days
- Badges Earned: ${userStats.badges_unlocked}

Recent Achievements: ${achievements.slice(0, 5).map(a => a.title).join(', ')}

Suggest goals that will:
1. Challenge the user appropriately
2. Align with their progress pattern
3. Provide meaningful rewards

Return in JSON format with goal title, description, target value, and estimated difficulty.`,
        response_json_schema: {
          type: "object",
          properties: {
            goals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  target_value: { type: "number" },
                  estimated_days: { type: "number" },
                  difficulty: { type: "string" },
                  reward_points: { type: "number" }
                }
              }
            }
          }
        }
      });

      toast.success(`🎯 New personalized goals suggested!`);
      console.log("AI Goal Suggestions:", result);

    } catch (error) {
      console.error("Error getting goal suggestions:", error);
      toast.error("Failed to get goal suggestions");
    }
  };

  // Simulate achievement unlock
  const simulateUnlock = (achievement) => {
    setShowUnlockAnimation(achievement);
    toast.success(`🎉 Achievement Unlocked: ${achievement.title}! +${achievement.points} XP`);
    setTimeout(() => setShowUnlockAnimation(null), 3000);
  };

  if (isLoading || challengesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-2">
          <RefreshCw className="animate-spin" /> Loading Achievements...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-3 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header with Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 p-8 shadow-2xl"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyb1VuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-4 md:gap-6">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/40">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <motion.div
                  className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-white font-bold text-sm">{userStats.level}</span>
                </motion.div>
              </motion.div>
              
              <div className="text-white">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Achievements</h1>
                <p className="text-white/80 text-sm md:text-base lg:text-lg">Level {userStats.level} • {userStats.health_xp.toLocaleString()} XP</p>
                <div className="flex items-center gap-4 mt-3">
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/40">
                    <Flame className="w-3 h-3 mr-1" />
                    {userStats.current_streak} day streak
                  </Badge>
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/40">
                    <Award className="w-3 h-3 mr-1" />
                    {userStats.badges_unlocked}/{userStats.total_achievements} badges
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-right text-white">
                <p className="text-sm text-white/80 mb-2">Next Level</p>
                <p className="text-2xl font-bold">{xpToNextLevel} XP to go</p>
                <Progress value={levelProgress} className="h-3 mt-2 w-64 bg-white/20" />
              </div>
              <Button
                onClick={suggestNextGoal}
                className="bg-white text-purple-600 hover:bg-white/90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Goal Suggestions
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Live Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {[
            { label: "Steps Today", value: liveStats.steps_today.toLocaleString(), icon: Activity, color: "from-blue-500 to-cyan-600", live: true },
            { label: "Calories Burned", value: liveStats.calories_burned, icon: Flame, color: "from-orange-500 to-red-600", live: true },
            { label: "Active Minutes", value: liveStats.active_minutes, icon: Clock, color: "from-green-500 to-emerald-600", live: true },
            { label: "Water Intake", value: `${liveStats.water_intake}/8`, icon: Droplets, color: "from-blue-400 to-blue-600", live: false },
            { label: "Meals Logged", value: liveStats.meals_logged, icon: Apple, color: "from-green-400 to-green-600", live: false },
            { label: "Sleep Quality", value: `${liveStats.sleep_hours}h`, icon: Moon, color: "from-indigo-500 to-purple-600", live: false }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    {stat.live && (
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
                  <p className="text-xs text-white/70">{stat.label}</p>
                  <motion.p
                    key={stat.value}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-bold text-white"
                  >
                    {stat.value}
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Active Challenges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-6 h-6 text-pink-400" />
                      <span>Active Challenges</span>
                    </div>
                    <Badge className="bg-pink-500">
                      {activeChallenges.length} Active
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeChallenges.map((challenge, i) => (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${challenge.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                          <challenge.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-white">{challenge.title}</h4>
                              <p className="text-sm text-white/70 mt-1">{challenge.description}</p>
                            </div>
                            <Badge className="bg-yellow-500">
                              +{challenge.reward} XP
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/70">Progress</span>
                              <span className="font-semibold text-white">{challenge.currentValue}/{challenge.targetValue}</span>
                            </div>
                            <Progress value={challenge.progress} className="h-3 bg-white/10" />
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-xs text-white/60">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Ends {new Date(challenge.endDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>{challenge.progress}% complete</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Achievements Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <CardTitle className="text-white">Your Achievements</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      {categories.map((cat) => (
                        <Button
                          key={cat.id}
                          variant={selectedCategory === cat.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={selectedCategory === cat.id ? `bg-gradient-to-r ${cat.color} text-white` : "bg-white/10 text-white border-white/20 hover:bg-white/20"}
                        >
                          <cat.icon className="w-4 h-4 mr-1" />
                          {cat.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="unlocked" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/10">
                      <TabsTrigger value="unlocked" className="text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                        Unlocked ({filteredAchievements.length})
                      </TabsTrigger>
                      <TabsTrigger value="locked" className="text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                        In Progress ({filteredLocked.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="unlocked" className="mt-6">
                      <ScrollArea className="h-[600px] pr-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          {filteredAchievements.map((achievement, i) => {
                            const rarity = rarityConfig[achievement.rarity || 'common'];
                            
                            return (
                              <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className={`relative p-6 rounded-2xl border-2 ${rarity.border} ${rarity.bg} bg-opacity-20 backdrop-blur-sm hover:shadow-2xl ${rarity.glow} transition-all duration-300 cursor-pointer overflow-hidden`}
                              >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full"></div>
                                
                                <div className="relative">
                                  <div className="flex items-center justify-between mb-4">
                                    <Badge variant="outline" className={`${rarity.bg} ${rarity.text} border-0`}>
                                      {achievement.rarity}
                                    </Badge>
                                    <span className="text-3xl">{rarity.emoji}</span>
                                  </div>
                                  
                                  <div className="text-center mb-4">
                                    <div className={`w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br ${rarity.color} flex items-center justify-center text-4xl shadow-xl`}>
                                      {rarity.emoji}
                                    </div>
                                    <h4 className="font-bold text-lg text-white">{achievement.title}</h4>
                                    <p className="text-sm text-white/70 mt-2">{achievement.description}</p>
                                  </div>

                                  <div className="flex items-center justify-between pt-4 border-t border-white/20">
                                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                      <Star className="w-3 h-3 mr-1" />
                                      +{achievement.points} XP
                                    </Badge>
                                    <span className="text-xs text-white/60">
                                      {new Date(achievement.unlocked_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="locked" className="mt-6">
                      <ScrollArea className="h-[600px] pr-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          {filteredLocked.map((achievement, i) => {
                            const rarity = rarityConfig[achievement.rarity];
                            
                            return (
                              <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                onClick={() => simulateUnlock(achievement)}
                                className="relative p-6 rounded-2xl border-2 border-white/20 bg-white/5 backdrop-blur-sm hover:shadow-2xl hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
                                
                                <div className="relative">
                                  <div className="flex items-center justify-between mb-4">
                                    <Badge variant="outline" className="bg-white/10 text-white/70 border-white/20">
                                      {achievement.rarity}
                                    </Badge>
                                    <Lock className="w-5 h-5 text-white/50" />
                                  </div>
                                  
                                  <div className="text-center mb-4">
                                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center shadow-xl backdrop-blur-sm">
                                      <Lock className="w-10 h-10 text-white/50" />
                                    </div>
                                    <h4 className="font-bold text-lg text-white">{achievement.title}</h4>
                                    <p className="text-sm text-white/70 mt-2">{achievement.description}</p>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-white/70">Progress</span>
                                      <span className="font-semibold text-white">
                                        {achievement.currentValue}/{achievement.targetValue}
                                      </span>
                                    </div>
                                    <Progress value={achievement.progress} className="h-3 bg-white/10" />
                                  </div>

                                  <div className="flex items-center justify-between pt-4 border-t border-white/20 mt-4">
                                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                      <Star className="w-3 h-3 mr-1" />
                                      +{achievement.points} XP
                                    </Badge>
                                    <span className="text-xs text-white/60">
                                      {Math.round(achievement.progress)}% complete
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Health Twin Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-teal-400" />
                    Health Twin Progress
                  </CardTitle>
                  <p className="text-xs text-white/70">Your achievements reflected</p>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-teal-500/20 to-purple-500/20 flex items-center justify-center border border-white/20">
                    <div className="text-center text-white">
                      <Trophy className="w-16 h-16 mx-auto mb-3 text-yellow-400" />
                      <p className="text-sm">Achievements boost your</p>
                      <p className="text-lg font-bold mt-1">Health Twin Vitality</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Leaderboard */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-400" />
                    Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {leaderboard.map((user, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`p-4 rounded-xl ${
                            user.isCurrentUser 
                              ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-400' 
                              : 'bg-white/5 border border-white/10'
                          } backdrop-blur-sm`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                              i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900' :
                              i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                              'bg-white/20 text-white'
                            }`}>
                              {i < 3 ? (i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉') : user.rank}
                            </div>
                            <Avatar className="w-10 h-10 border-2 border-white/30">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
                                {user.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold text-white">{user.name}</p>
                              <div className="flex items-center gap-3 text-xs text-white/70">
                                <span>{user.xp.toLocaleString()} XP</span>
                                <div className="flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-orange-400" />
                                  <span>{user.streak}</span>
                                </div>
                              </div>
                            </div>
                            {user.isCurrentUser && (
                              <Badge className="bg-purple-500">You</Badge>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

            {/* Share Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-pink-400/30 backdrop-blur-md shadow-2xl">
                <CardContent className="p-6 text-center">
                  <Share2 className="w-10 h-10 mx-auto mb-3 text-white" />
                  <h3 className="font-bold text-white mb-2">Share Your Success</h3>
                  <p className="text-sm text-white/70 mb-4">
                    Inspire others with your achievements!
                  </p>
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Progress
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Achievement Unlock Animation */}
      <AnimatePresence>
        {showUnlockAnimation && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative max-w-md w-full"
              initial={{ scale: 0.5, rotateY: -180 }}
              animate={{ scale: 1, rotateY: 0 }}
              exit={{ scale: 0.5, rotateY: 180 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-600 shadow-2xl">
                <motion.div
                  className="absolute inset-0 rounded-3xl"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(251, 191, 36, 0.5)",
                      "0 0 60px rgba(251, 191, 36, 0.8)",
                      "0 0 20px rgba(251, 191, 36, 0.5)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                <div className="relative text-center text-white">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <div className="text-8xl mb-4">🏆</div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h2 className="text-3xl font-bold mb-2">Achievement Unlocked!</h2>
                    <h3 className="text-2xl font-semibold mb-4">{showUnlockAnimation.title}</h3>
                    <p className="text-white/90 mb-6">{showUnlockAnimation.description}</p>
                    <Badge className="bg-white text-purple-600 text-lg px-4 py-2">
                      <Star className="w-5 h-5 mr-2" />
                      +{showUnlockAnimation.points} XP
                    </Badge>
                  </motion.div>
                </div>

                {/* Confetti Effect */}
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-white"
                    initial={{
                      x: "50%",
                      y: "50%",
                      scale: 0
                    }}
                    animate={{
                      x: `${50 + (Math.random() - 0.5) * 200}%`,
                      y: `${50 + (Math.random() - 0.5) * 200}%`,
                      scale: [0, 1, 0],
                      opacity: [1, 1, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 0.3 + Math.random() * 0.3,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}