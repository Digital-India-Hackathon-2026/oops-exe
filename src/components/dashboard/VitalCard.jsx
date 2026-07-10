import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export default function VitalCard({ title, value, unit, trend, trendValue, icon: Icon, status = "normal", isDemoMode }) {
  const statusColors = {
    normal: "from-teal-500 to-teal-600",
    warning: "from-orange-500 to-orange-600",
    danger: "from-red-500 to-red-600"
  };

  const statusGlow = {
    normal: "shadow-teal-500/50",
    warning: "shadow-orange-500/50",
    danger: "shadow-red-500/50"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className={`overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-white/90 backdrop-blur-xl relative group ${statusGlow[status]}`}>
        {/* Animated Background Gradient */}
        <motion.div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(135deg, ${status === 'normal' ? 'rgba(20, 184, 166, 0.1)' : status === 'warning' ? 'rgba(251, 146, 60, 0.1)' : 'rgba(239, 68, 68, 0.1)'} 0%, transparent 100%)`
          }}
        />

        {/* Demo Mode Pulse Indicator */}
        {isDemoMode && (
          <motion.div
            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        )}

        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between mb-4">
            <motion.div 
              className={`p-3 rounded-2xl bg-gradient-to-br ${statusColors[status]} shadow-xl relative`}
              animate={{
                boxShadow: ['0 10px 30px -10px rgba(0,0,0,0.3)', '0 10px 40px -10px rgba(0,0,0,0.4)', '0 10px 30px -10px rgba(0,0,0,0.3)'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <Icon className="w-6 h-6 text-white" />
              <motion.div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${statusColors[status]} blur-xl opacity-50`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.7, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </motion.div>
            {trend && (
              <motion.div 
                className={`flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${
                  trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {trendValue}
              </motion.div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
            <div className="flex items-baseline gap-2">
              <motion.h3 
                className="text-4xl font-bold text-gray-900"
                key={value}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {value}
              </motion.h3>
              <span className="text-sm text-gray-500 font-medium">{unit}</span>
            </div>
          </div>

          {/* Real-time Indicator */}
          {isDemoMode && (
            <motion.div 
              className="mt-4 flex items-center gap-2 text-xs text-blue-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-blue-500"
                animate={{
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
              <span className="font-medium">Simulated</span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}