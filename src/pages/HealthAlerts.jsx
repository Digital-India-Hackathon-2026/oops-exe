import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  AlertCircle,
  CheckCircle,
  Calendar,
  Heart,
  Activity,
  Pill,
  Clock,
  TrendingUp,
  Shield,
  X
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function HealthAlerts() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "health",
      priority: "high",
      title: "Elevated Heart Rate Detected",
      message: "Your heart rate was consistently above 100 bpm for 30 minutes. Consider resting or consulting your doctor.",
      timestamp: "2024-12-29T14:30:00Z",
      read: false,
      icon: Heart,
      color: "from-red-500 to-red-600"
    },
    {
      id: 2,
      type: "reminder",
      priority: "medium",
      title: "Medication Reminder",
      message: "Time to take your vitamin D supplement. Don't forget your daily dose!",
      timestamp: "2024-12-29T08:00:00Z",
      read: false,
      icon: Pill,
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 3,
      type: "achievement",
      priority: "low",
      title: "New Achievement Unlocked!",
      message: "🏆 Congratulations! You've completed your 10,000 steps goal for 7 consecutive days!",
      timestamp: "2024-12-28T20:00:00Z",
      read: true,
      icon: CheckCircle,
      color: "from-green-500 to-green-600"
    },
    {
      id: 4,
      type: "appointment",
      priority: "high",
      title: "Upcoming Doctor Appointment",
      message: "Your annual checkup is scheduled for tomorrow at 10:00 AM with Dr. Smith.",
      timestamp: "2024-12-28T18:00:00Z",
      read: false,
      icon: Calendar,
      color: "from-purple-500 to-purple-600"
    },
    {
      id: 5,
      type: "family",
      priority: "medium",
      title: "Family Member Alert",
      message: "Sarah's glucose levels are slightly elevated. Recommend reducing sugar intake.",
      timestamp: "2024-12-28T15:00:00Z",
      read: true,
      icon: Activity,
      color: "from-orange-500 to-orange-600"
    },
    {
      id: 6,
      type: "insight",
      priority: "low",
      title: "Weekly Health Insight",
      message: "Your sleep quality improved by 15% this week. Keep up the good bedtime routine!",
      timestamp: "2024-12-27T10:00:00Z",
      read: true,
      icon: TrendingUp,
      color: "from-teal-500 to-teal-600"
    },
    {
      id: 7,
      type: "insurance",
      priority: "medium",
      title: "Insurance Claim Update",
      message: "Your recent medical claim has been approved. $280 will be credited to your account.",
      timestamp: "2024-12-27T09:00:00Z",
      read: true,
      icon: Shield,
      color: "from-indigo-500 to-indigo-600"
    }
  ]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now - then) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filterByType = (type) => {
    if (type === 'all') return notifications;
    return notifications.filter(n => n.type === type);
  };

  const NotificationCard = ({ notification }) => {
    const Icon = notification.icon;
    
    return (
      <div
        onClick={() => markAsRead(notification.id)}
        className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
          notification.read 
            ? 'bg-gradient-to-br from-gray-50 to-white border border-gray-100' 
            : 'bg-white border-2 border-teal-500 shadow-lg hover:shadow-xl'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${notification.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      notification.priority === 'high'
                        ? 'bg-red-50 text-red-700 border-red-200 text-xs'
                        : notification.priority === 'medium'
                        ? 'bg-orange-50 text-orange-700 border-orange-200 text-xs'
                        : 'bg-blue-50 text-blue-700 border-blue-200 text-xs'
                    }
                  >
                    {notification.priority} priority
                  </Badge>
                  <Badge variant="outline" className="capitalize text-xs">
                    {notification.type}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="text-gray-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">{notification.message}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{getTimeAgo(notification.timestamp)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 md:p-6 lg:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-600 flex items-center justify-center shadow-lg relative">
              <Bell className="w-5 h-5 md:w-6 md:h-6 text-white" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-xs px-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Health Alerts</h1>
              <p className="text-sm md:text-base text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="hover:bg-teal-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        {unreadCount === 0 && (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-teal-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">
                You've reviewed all your health notifications. Great job staying on top of your health!
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4 md:mb-6">
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="health">Health ({filterByType('health').length})</TabsTrigger>
            <TabsTrigger value="reminder">Reminders ({filterByType('reminder').length})</TabsTrigger>
            <TabsTrigger value="appointment">Appointments ({filterByType('appointment').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {notifications
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map(notification => (
                    <NotificationCard key={notification.id} notification={notification} />
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="health">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {filterByType('health').map(notification => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="reminder">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {filterByType('reminder').map(notification => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="appointment">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {filterByType('appointment').map(notification => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}