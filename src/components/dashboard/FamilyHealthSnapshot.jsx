import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, AlertCircle, Heart } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function FamilyHealthSnapshot({ familyMembers, isDemoMode }) {
  // Demo mode family members
  const demoMembers = [
    { name: "Sarah", health_score: 92, status: "excellent", relationship: "spouse" },
    { name: "Emma", health_score: 88, status: "good", relationship: "child" },
    { name: "Michael", health_score: 76, status: "needs attention", relationship: "parent" }
  ];

  const members = isDemoMode && familyMembers.length === 0 ? demoMembers : familyMembers.slice(0, 3);

  if (members.length === 0) {
    return null;
  }

  const getStatusColor = (score) => {
    if (score >= 90) return "from-green-500 to-green-600";
    if (score >= 75) return "from-blue-500 to-blue-600";
    return "from-orange-500 to-orange-600";
  };

  const getStatusBadge = (score) => {
    if (score >= 90) return { text: "Excellent", class: "bg-green-50 text-green-700 border-green-200" };
    if (score >= 75) return { text: "Good", class: "bg-blue-50 text-blue-700 border-blue-200" };
    return { text: "Attention", class: "bg-orange-50 text-orange-700 border-orange-200" };
  };

  return (
    <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Users className="w-5 h-5 text-pink-600" />
            </motion.div>
            Family Health
          </CardTitle>
          <Link to={createPageUrl("FamilyHealth")}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm text-teal-600 font-medium hover:text-teal-700"
            >
              View All →
            </motion.button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="space-y-4">
          {members.map((member, index) => {
            const healthScore = member.health_score || 85;
            const statusBadge = getStatusBadge(healthScore);
            
            return (
              <motion.div
                key={member.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 10 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <Avatar className="w-14 h-14 border-4 border-white shadow-lg">
                  <AvatarFallback className={`bg-gradient-to-br ${getStatusColor(healthScore)} text-white text-lg font-bold`}>
                    {(member.name || 'U').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{member.name || 'Family Member'}</h4>
                    <Badge variant="outline" className="text-xs capitalize">
                      {member.relationship}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${getStatusColor(healthScore)} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${healthScore}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">{healthScore}%</span>
                  </div>
                </div>
                <Badge variant="outline" className={`${statusBadge.class} text-xs whitespace-nowrap`}>
                  {statusBadge.text}
                </Badge>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}