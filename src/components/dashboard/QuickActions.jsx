import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Video, Brain, Scan, FileText, Zap, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function QuickActions() {
  const actions = [
    {
      icon: Video,
      title: "AI Video Call",
      description: "Consult with AI Doctor",
      color: "from-blue-500 to-indigo-600",
      url: createPageUrl("VideoCall"),
    },
    {
      icon: Brain,
      title: "AI Coach",
      description: "Get health insights",
      color: "from-purple-500 to-pink-600",
      url: createPageUrl("AICoach"),
    },
    {
      icon: Scan,
      title: "Food Scanner",
      description: "Analyze your meal",
      color: "from-green-500 to-teal-600",
      url: createPageUrl("FoodScanner"),
    },
    {
      icon: Activity,
      title: "Health Twin",
      description: "Predictive analytics",
      color: "from-teal-500 to-cyan-600",
      url: createPageUrl("HealthTwin"),
    },
    {
      icon: FileText,
      title: "Health Reports",
      description: "View your records",
      color: "from-orange-500 to-red-600",
      url: createPageUrl("Reports"),
    },
    {
      icon: Zap,
      title: "Achievements",
      description: "Track your progress",
      color: "from-amber-500 to-orange-600",
      url: createPageUrl("Achievements"),
    },
  ];

  return (
    <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
      <CardHeader className="relative">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to={action.url}>
                <div className="p-4 rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${action.color.split(' ')[1].replace('to-', '')} 0%, transparent 100%)`,
                      opacity: 0.1
                    }}
                  />
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-lg relative z-10`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1 relative z-10">{action.title}</h4>
                  <p className="text-xs text-gray-500 relative z-10">{action.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}