import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target, Flame } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function GamifiedProgress({ user, achievements, isDemoMode }) {
  const totalPoints = user?.total_points || 0;
  const level = Math.floor(totalPoints / 1000) + 1;
  const pointsToNext = ((level * 1000) - totalPoints);
  const levelProgress = ((totalPoints % 1000) / 1000) * 100;

  // Demo streaks
  const streaks = isDemoMode ? [
    { icon: Target, label: "Daily Goals", value: 7, color: "from-teal-500 to-teal-600" },
    { icon: Flame, label: "Active Days", value: 14, color: "from-orange-500 to-orange-600" },
    { icon: Star, label: "Perfect Weeks", value: 3, color: "from-purple-500 to-purple-600" }
  ] : [
    { icon: Target, label: "Daily Goals", value: 5, color: "from-teal-500 to-teal-600" },
    { icon: Flame, label: "Active Days", value: 10, color: "from-orange-500 to-orange-600" },
    { icon: Star, label: "Perfect Weeks", value: 2, color: "from-purple-500 to-purple-600" }
  ];

  return (
    <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Trophy className="w-5 h-5 text-amber-600" />
            </motion.div>
            Health Progress
          </CardTitle>
          <Link to={createPageUrl("Achievements")}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm text-teal-600 font-medium hover:text-teal-700"
            >
              View Achievements →
            </motion.button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {/* Level Progress */}
        <motion.div 
          className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl"
                  animate={{
                    boxShadow: ['0 0 20px rgba(251, 146, 60, 0.5)', '0 0 30px rgba(251, 146, 60, 0.8)', '0 0 20px rgba(251, 146, 60, 0.5)'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  {level}
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Your Level</p>
                  <p className="text-2xl font-bold text-gray-900">Level {level}</p>
                </div>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2">
              {totalPoints} pts
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress to Level {level + 1}</span>
              <span className="font-semibold text-amber-700">{pointsToNext} pts needed</span>
            </div>
            <div className="relative h-4 bg-white rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Streaks */}
        <div className="grid grid-cols-3 gap-3">
          {streaks.map((streak, index) => (
            <motion.div
              key={streak.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.05 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 text-center"
            >
              <motion.div
                className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${streak.color} flex items-center justify-center shadow-lg`}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.3,
                }}
              >
                <streak.icon className="w-5 h-5 text-white" />
              </motion.div>
              <motion.p 
                className="text-2xl font-bold text-gray-900"
                key={streak.value}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
              >
                {streak.value}
              </motion.p>
              <p className="text-xs text-gray-500 mt-1">{streak.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent Achievements Preview */}
        {achievements.length > 0 && (
          <div className="flex items-center gap-2 justify-center">
            <span className="text-sm text-gray-600">Latest achievements:</span>
            <div className="flex gap-2">
              {achievements.slice(0, 3).map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, rotate: -180, scale: 0 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  transition={{ delay: index * 0.1, type: "spring" }}
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-lg cursor-pointer"
                >
                  🏆
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}