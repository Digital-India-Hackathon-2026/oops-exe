import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Activity,
  Heart,
  Scan,
  Trophy,
  Brain,
  AlertCircle,
  User,
  LayoutDashboard,
  Video,
  ShoppingCart,
  Shield,
  Users,
  Bell,
  Settings,
  FileText,
  MapPin,
  X,
  ExternalLink,
  Mic,
  CheckCircle
} from "lucide-react";
import { HealthTwinProvider } from "@/components/health-twin/HealthTwinProvider";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "AI Video Call",
    url: createPageUrl("VideoCall"),
    icon: Video,
  },
  {
    title: "AI Coach",
    url: createPageUrl("AICoach"),
    icon: Brain,
  },
  {
    title: "Symptom Checker",
    url: createPageUrl("AIDoctor"),
    icon: Activity,
  },
  {
    title: "Health Twin",
    url: createPageUrl("HealthTwin"),
    icon: Activity,
  },
  {
    title: "Food Scanner",
    url: createPageUrl("FoodScanner"),
    icon: Scan,
  },
  {
    title: "Vitals",
    url: createPageUrl("Vitals"),
    icon: Heart,
  },
  {
    title: "Family Health",
    url: createPageUrl("FamilyHealth"),
    icon: Users,
  },
  {
    title: "Health Market",
    url: createPageUrl("HealthMarket"),
    icon: ShoppingCart,
  },
  {
    title: "Insurance Summary",
    url: createPageUrl("Insurance"),
    icon: Shield,
  },
  {
    title: "Achievements",
    url: createPageUrl("Achievements"),
    icon: Trophy,
  },
  {
    title: "Health Alerts",
    url: createPageUrl("HealthAlerts"),
    icon: Bell,
  },
  {
    title: "OCR Scanner",
    url: createPageUrl("Reports"),
    icon: Scan,
  },
  {
    title: "Emergency",
    url: createPageUrl("Emergency"),
    icon: AlertCircle,
  },
  {
    title: "Profile",
    url: createPageUrl("Profile"),
    icon: User,
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showEmergencyPopup, setShowEmergencyPopup] = useState(false);
  const [dismissedEmergencies, setDismissedEmergencies] = useState(() => {
    try {
      const stored = sessionStorage.getItem('dismissedEmergencies');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showSafePopup, setShowSafePopup] = useState(null);
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    initialData: null,
  });

  // Orientation Layer: Intercept entry if not completed
  useEffect(() => {
    if (user && currentPageName !== "Landing" && currentPageName !== "LiveIncidentMap") {
      const orientationCompleted = sessionStorage.getItem("auryst_orientation_completed");
      if (!orientationCompleted) {
        navigate(createPageUrl("Landing"));
      }
    }
  }, [user, currentPageName, navigate]);

  // Query for active family emergencies
  const { data: familyMembers = [] } = useQuery({
    queryKey: ['familyMembersLayout', user?.email],
    queryFn: () => base44.entities.FamilyMember.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: familyEmergencies = [] } = useQuery({
    queryKey: ['familyEmergenciesLayout', familyMembers],
    queryFn: async () => {
      if (!familyMembers || familyMembers.length === 0) return [];
      
      const emergencies = [];
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      for (const member of familyMembers) {
        if (member.linked_user_id) {
          try {
            const incidents = await base44.entities.EmergencyIncident.filter({
              user_id: member.linked_user_id,
              status: 'active'
            });
            if (incidents.length > 0) {
              const incident = incidents[0];
              const startTime = new Date(incident.start_time);
              if (startTime > tenMinutesAgo) {
                emergencies.push({
                  ...incident,
                  member_name: member.name,
                  member_id: member.id
                });
              }
            }
          } catch (e) {
            console.error("Error fetching emergency:", e);
          }
        }
      }
      return emergencies;
    },
    enabled: !!familyMembers && familyMembers.length > 0,
    refetchInterval: 10000,
  });

  const { data: recentEndedEmergencies = [] } = useQuery({
    queryKey: ['recentEndedEmergencies', familyMembers],
    queryFn: async () => {
      if (!familyMembers || familyMembers.length === 0) return [];
      
      const ended = [];
      for (const member of familyMembers) {
        if (member.linked_user_id) {
          try {
            const incidents = await base44.entities.EmergencyIncident.filter({
              user_id: member.linked_user_id,
              status: 'ended'
            }, '-end_time', 1);
            if (incidents.length > 0) {
              const incident = incidents[0];
              const endTime = new Date(incident.end_time);
              const now = new Date();
              if ((now - endTime) < 30000) {
                ended.push({
                  ...incident,
                  member_name: member.name
                });
              }
            }
          } catch (e) {
            console.error("Error:", e);
          }
        }
      }
      return ended;
    },
    enabled: !!familyMembers && familyMembers.length > 0,
    refetchInterval: 15000,
  });

  useEffect(() => {
    const newEmergencies = familyEmergencies.filter(e => !dismissedEmergencies.includes(e.id));
    if (newEmergencies.length > 0) {
      setShowEmergencyPopup(true);
    } else {
      setShowEmergencyPopup(false);
    }
  }, [familyEmergencies, dismissedEmergencies]);

  useEffect(() => {
    if (recentEndedEmergencies.length > 0 && !showSafePopup) {
      setShowSafePopup(recentEndedEmergencies[0]);
      setTimeout(() => setShowSafePopup(null), 10000);
    }
  }, [recentEndedEmergencies]);

  const dismissEmergency = (id) => {
    const newDismissed = [...dismissedEmergencies, id];
    setDismissedEmergencies(newDismissed);
    try {
      sessionStorage.setItem('dismissedEmergencies', JSON.stringify(newDismissed));
    } catch {}
    if (familyEmergencies.filter(e => !newDismissed.includes(e.id)).length === 0) {
      setShowEmergencyPopup(false);
    }
  };

  const activeEmergencies = familyEmergencies.filter(e => !dismissedEmergencies.includes(e.id));

  // Landing page and LiveIncidentMap: no sidebar, just content
  if (currentPageName === "Landing" || currentPageName === "LiveIncidentMap") {
    return <>{children}</>;
  }

  return (
    <HealthTwinProvider user={user}>
      <SidebarProvider>
        <style>{`
        :root {
          --primary: 168 85% 40%;
          --primary-foreground: 0 0% 100%;
          --accent: 24 95% 53%;
          --accent-foreground: 0 0% 100%;
          --success: 142 71% 45%;
          --destructive: 0 84% 60%;
          --background: 0 0% 100%;
          --card: 0 0% 100%;
          --card-foreground: 222 47% 11%;
        }
        
        body {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }
      `}</style>
      
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r border-gray-100 bg-white/80 backdrop-blur-xl">
          <SidebarHeader className="border-b border-gray-100 p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg md:text-xl text-gray-900">AUTRYST</h2>
                <p className="text-[10px] md:text-xs text-gray-500">AI Health Ecosystem</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-teal-50 hover:text-teal-700 transition-all duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-600'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3">
                          <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                          <span className="text-sm md:text-base font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-100 p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-semibold text-xs md:text-sm">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-xs md:text-sm truncate">{user?.full_name || 'User'}</p>
                <p className="text-[10px] md:text-xs text-gray-500 truncate">{user?.email || ''}</p>
                {user?.demo_mode && (
                  <Badge className="bg-orange-500 text-xs mt-1">Demo Mode</Badge>
                )}
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3 md:hidden sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-teal-600" />
                <h1 className="text-lg font-bold text-gray-900">AUTRYST</h1>
              </div>
              {user?.demo_mode && (
                <Badge className="ml-auto bg-orange-500">Demo</Badge>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Global Emergency Popup */}
      <AnimatePresence>
        {showEmergencyPopup && activeEmergencies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -50 }}
            className="fixed top-4 right-4 z-[9999] max-w-sm w-full"
          >
            {activeEmergencies.map((emergency) => (
              <motion.div
                key={emergency.id}
                className="bg-red-600 rounded-2xl shadow-2xl shadow-red-500/50 p-3 md:p-4 mb-3 border-2 border-red-400"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <AlertCircle className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-white text-base md:text-lg">🚨 EMERGENCY</h3>
                      <p className="text-red-100 text-xs md:text-sm">{emergency.member_name || emergency.user_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissEmergency(emergency.id)}
                    className="text-white/70 hover:text-white p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 text-white/90 text-sm mb-3">
                  <div className="flex items-center gap-1">
                    <Mic className="w-4 h-4" />
                    <span>Audio Live</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>Location Live</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Link to={createPageUrl(`LiveIncidentMap?incidentId=${emergency.id}`)} className="flex-1">
                    <Button className="w-full bg-white text-red-600 hover:bg-red-50 text-xs md:text-sm">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1" /> View Live Map
                    </Button>
                  </Link>
                  {emergency.last_known_location && (
                    <a 
                      href={`https://www.google.com/maps?q=${emergency.last_known_location.lat},${emergency.last_known_location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm px-3">
                        <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safe Confirmation Popup */}
      <AnimatePresence>
        {showSafePopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -50 }}
            className="fixed top-4 right-4 z-[9999] max-w-sm w-full"
          >
            <div className="bg-green-600 rounded-2xl shadow-2xl shadow-green-500/50 p-4 border-2 border-green-400">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-white" />
                  <div>
                    <h3 className="font-bold text-white text-lg">✅ SAFE NOW</h3>
                    <p className="text-green-100 text-sm">{showSafePopup.member_name || showSafePopup.user_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSafePopup(null)}
                  className="text-white/70 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-white/90 text-sm">
                Emergency ended at {new Date(showSafePopup.end_time).toLocaleTimeString()}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SidebarProvider>
    </HealthTwinProvider>
    );
    }