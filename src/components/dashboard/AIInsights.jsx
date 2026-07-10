import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertCircle, CheckCircle, Sparkles } from "lucide-react";

export default function AIInsights() {
  const insights = [
    {
      type: "positive",
      title: "Great Sleep Pattern",
      message: "Your sleep quality has improved by 12% this week. Keep maintaining your 10 PM bedtime routine!",
      icon: CheckCircle,
      color: "text-green-600",
      bg: "from-green-50 to-emerald-50"
    },
    {
      type: "attention",
      title: "Heart Rate Variability",
      message: "Your resting heart rate is slightly elevated. Consider stress-reduction exercises and ensure adequate hydration.",
      icon: AlertCircle,
      color: "text-orange-600",
      bg: "from-orange-50 to-amber-50"
    },
    {
      type: "recommendation",
      title: "Nutrition Optimization",
      message: "Based on your recent meals, increase protein intake by 15g daily to meet your fitness goals.",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "from-blue-50 to-teal-50"
    }
  ];

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          AI Health Insights
          <Badge className="ml-auto bg-purple-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Powered by Gemini
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div
              key={index}
              className={`p-4 rounded-xl bg-gradient-to-br ${insight.bg} border border-gray-100`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${insight.color} mt-0.5 flex-shrink-0`} />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{insight.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}