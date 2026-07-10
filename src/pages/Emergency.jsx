import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Phone, Bell, Mic, MapPin, StopCircle, Share2, CheckCircle, WifiOff, BatteryWarning, MessageSquareWarning, Shield, XCircle, Brain, User, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useHealthTwin } from "@/components/health-twin/HealthTwinProvider";

export default function EmergencyPage() {
  const [activeIncident, setActiveIncident] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [stopReason, setStopReason] = useState("safe");
  const [stopMessage, setStopMessage] = useState("");
  const [timer, setTimer] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [currentLocation, setCurrentLocation] = useState(null);

  const locationWatcherId = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['emergencyContacts'],
    queryFn: () => base44.entities.EmergencyContact.list(),
    enabled: !!user,
  });

  // Health Twin integration (read-only)
  const { twinState } = useHealthTwin();

  const createIncidentMutation = useMutation({
    mutationFn: (data) => base44.entities.EmergencyIncident.create(data),
  });
  
  const updateIncidentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmergencyIncident.update(id, data),
  });

  const uploadAudioMutation = useMutation({
    mutationFn: (file) => base44.integrations.Core.UploadFile({ file }),
  });

  // System status listeners
  useEffect(() => {
    const onlineHandler = () => setIsOnline(true);
    const offlineHandler = () => setIsOnline(false);
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    navigator.getBattery?.().then(battery => {
      setBatteryLevel(battery.level);
      battery.onlevelchange = () => setBatteryLevel(battery.level);
    });

    return () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (activeIncident) {
      timerIntervalRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
      setTimer(0);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [activeIncident]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startEmergency = async () => {
    setIsActivating(true);

    let newIncident;
    let initialPosition = null;

    try {
      // 1. Request Permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      initialPosition = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      });
      navigator.vibrate?.(200);
      speak("Your emergency alert is now active. Live location and audio are being shared with your trusted contacts.");
      
      // 2. Start Audio Recording
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = event => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.start();
      
      // 3. Create Incident on Backend
      const incidentData = {
        user_id: user.id,
        user_name: user.full_name,
        status: "active",
        start_time: new Date().toISOString(),
        last_known_location: {
          lat: initialPosition.coords.latitude,
          lng: initialPosition.coords.longitude,
          accuracy: initialPosition.coords.accuracy,
          timestamp: new Date(initialPosition.timestamp).toISOString(),
        },
        location_history: [{
          lat: initialPosition.coords.latitude,
          lng: initialPosition.coords.longitude,
          timestamp: new Date(initialPosition.timestamp).toISOString(),
        }]
      };
      newIncident = await createIncidentMutation.mutateAsync(incidentData);
      setActiveIncident(newIncident);

      // 4. Start Location Watching with high accuracy and continuous updates
      let locationHistory = [...(newIncident?.location_history || [])];
      let updateCounter = 0;
      
      locationWatcherId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: new Date(pos.timestamp).toISOString(),
          };
          
          console.log('📍 Live location update:', newLocation);
          
          setCurrentLocation(newLocation);
          locationHistory.push(newLocation);
          
          // Update immediately for real-time tracking
          updateCounter++;
          
          updateIncidentMutation.mutate({
            id: newIncident.id,
            data: { 
                last_known_location: newLocation,
                location_history: locationHistory.slice(-50) // Keep last 50 points
             }
          });
          
          // Update local state for real-time display
          setActiveIncident(prev => prev ? {
            ...prev, 
            last_known_location: newLocation, 
            location_history: locationHistory
          } : prev);
          
          // Log every 5 updates
          if (updateCounter % 5 === 0) {
            console.log(`✅ ${updateCounter} location updates sent`);
          }
        },
        (err) => {
          console.error(`LOCATION ERROR(${err.code}): ${err.message}`);
          toast.warning("Location accuracy may be reduced. Make sure GPS is enabled.");
        },
        { 
          enableHighAccuracy: true, 
          timeout: 5000, 
          maximumAge: 0 
        }
      );
      
      // Emergency mode is now active locally. Now, attempt to send notifications.
      toast.success("Emergency mode activated. Recording has started.");

    } catch (error) {
      console.error("Failed to start emergency mode:", error);
      toast.error("Could not activate emergency mode. Check permissions and try again.");
      if (mediaRecorderRef.current?.stream) mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      if (locationWatcherId.current) navigator.geolocation.clearWatch(locationWatcherId.current);
      setIsActivating(false);
      return; // Stop execution if critical setup fails
    }

    // 5. Send Notifications (Decoupled from main activation)
    try {
        const liveMapUrl = `${window.location.origin}${createPageUrl(`LiveIncidentMap?incidentId=${newIncident.id}`)}`;
        const googleMapsUrl = `https://www.google.com/maps?q=${initialPosition.coords.latitude},${initialPosition.coords.longitude}`;
        const emailBody = `
          <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #fff3f3; border-radius: 12px;">
            <h2 style="color: #d90429;">🚨 EMERGENCY ALERT</h2>
            <p><strong>${user.full_name}</strong> has activated an emergency alert at <strong>${new Date(newIncident.start_time).toLocaleString()}</strong>.</p>
            <p><b>Initial Location:</b></p>
            <p>Latitude: ${initialPosition.coords.latitude.toFixed(6)}, Longitude: ${initialPosition.coords.longitude.toFixed(6)}</p>
            <p>Accuracy: ${initialPosition.coords.accuracy?.toFixed(0) || 'N/A'} meters</p>
            <p>
              <a href="${googleMapsUrl}" target="_blank" style="background-color:#d90429; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; display:inline-block; margin:10px 5px 10px 0;">📍 View on Google Maps</a>
              <a href="${liveMapUrl}" target="_blank" style="background-color:#1e40af; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; display:inline-block; margin:10px 0;">🔴 View Live Tracking</a>
            </p>
            <p style="margin-top:15px;">A voice recording is in progress and will be available in the final report after the emergency ends.</p>
            <p style="color:#6c757d; font-size:12px; margin-top:20px;">This alert was generated automatically by the AUTRYST AI Emergency System.</p>
          </div>
        `;

        const emailPromises = contacts.map(contact => {
            if (contact.email) {
                return base44.integrations.Core.SendEmail({
                    to: contact.email,
                    subject: `🚨 Emergency Alert from ${user.full_name}`,
                    body: emailBody,
                });
            }
            return Promise.resolve();
        });

        await Promise.all(emailPromises);
        toast.success("Emergency contacts have been notified.");
    } catch (notificationError) {
        console.error("Failed to send notifications:", notificationError);
        const errorMessage = notificationError.message.includes("limit of integrations") 
            ? "Your monthly integration limit has been reached. Please upgrade your plan to send notifications."
            : "Could not send notifications to contacts.";
        toast.warning(`Notifications Failed: ${errorMessage}`, { duration: 10000 });
    } finally {
        setIsActivating(false);
    }
  };
  
  const handleStopEmergency = async () => {
    setShowStopDialog(false);
    await stopEmergency(stopReason, stopMessage);
  };

  const stopEmergency = async (reason = "safe", message = "") => {
    if (!activeIncident) return;
    
    setIsStopping(true);

    try {
      // 1. Stop watchers and recorders
      if (locationWatcherId.current) {
        navigator.geolocation.clearWatch(locationWatcherId.current);
        locationWatcherId.current = null;
      }
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      }
      
      // 2. Finalize Incident Data
      const endTime = new Date().toISOString();
      let finalIncidentData = { status: "ended", end_time: endTime };

      // 3. Upload Audio
      let audioUrl = null;
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `incident_${activeIncident.id}.webm`, { type: 'audio/webm' });
        
        try {
            const { file_url } = await uploadAudioMutation.mutateAsync(audioFile);
            audioUrl = file_url;
            finalIncidentData.audio_report_url = audioUrl;
            toast.success("Audio report saved.");
        } catch (err) {
            toast.error("Failed to save audio report.");
        }
      }
      
      // 4. Update incident on backend
      await updateIncidentMutation.mutateAsync({
        id: activeIncident.id,
        data: finalIncidentData,
      });
      
      // 5. Build reason-specific message for email
      const reasonMessages = {
        safe: "I am safe now. The situation has been resolved.",
        mistake: "This was triggered by mistake. I am okay, no emergency occurred.",
        resolved: "The situation has been handled and resolved.",
        other: message || "Emergency ended."
      };
      
      const reasonTitles = {
        safe: "✅ SAFE - Emergency Ended",
        mistake: "ℹ️ FALSE ALARM - Triggered by Mistake",
        resolved: "✅ RESOLVED - Situation Handled",
        other: "✅ Emergency Ended"
      };

      const reasonColors = {
        safe: { bg: "#e8f9e9", title: "#2d6a4f" },
        mistake: { bg: "#fff3cd", title: "#856404" },
        resolved: { bg: "#e8f9e9", title: "#2d6a4f" },
        other: { bg: "#e8f9e9", title: "#2d6a4f" }
      };

      const colors = reasonColors[reason] || reasonColors.safe;
      
      // 6. Send Final Report Email
      try {
        const lastLocation = activeIncident.last_known_location || currentLocation;
        const googleMapsUrl = lastLocation ? `https://www.google.com/maps?q=${lastLocation.lat},${lastLocation.lng}` : '';
        const summaryEmailBody = `
          <div style="font-family:'Segoe UI',sans-serif; padding:20px; background-color:${colors.bg}; border-radius:12px;">
            <h2 style="color:${colors.title};">${reasonTitles[reason]}</h2>
            <p><strong>${user.full_name}</strong> has ended the emergency session at <strong>${new Date(endTime).toLocaleString()}</strong>.</p>
            <div style="background-color:white; padding:15px; border-radius:8px; margin:15px 0; border-left:4px solid ${colors.title};">
              <p style="margin:0; font-weight:bold;">Reason:</p>
              <p style="margin:5px 0 0 0;">${reasonMessages[reason]}</p>
              ${message && reason === 'other' ? `<p style="margin:10px 0 0 0; font-style:italic;">"${message}"</p>` : ''}
            </div>
            ${lastLocation ? `
            <p><b>Last Known Location:</b></p>
            <p>Latitude: ${lastLocation.lat.toFixed(6)}, Longitude: ${lastLocation.lng.toFixed(6)}</p>
            <p><a href="${googleMapsUrl}" target="_blank" style="background-color:${colors.title}; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; display:inline-block; margin-top:10px;">📍 View on Google Maps</a></p>
            ` : ''}
            ${audioUrl ? `<p style="margin-top:15px;"><b>Voice Recording:</b> <a href="${audioUrl}" style="color:${colors.title};">Listen to Audio</a></p>` : ''}
            <hr style="margin-top:20px;">
            <p style="font-size:12px; color:#6c757d;">Sent automatically by AUTRYST Emergency System</p>
          </div>
        `;

        const emailPromises = contacts.map(contact => {
            if (contact.email) {
                return base44.integrations.Core.SendEmail({ 
                  to: contact.email, 
                  subject: `${reasonTitles[reason]} - ${user.full_name}`, 
                  body: summaryEmailBody 
                });
            }
            return Promise.resolve();
        });
        await Promise.all(emailPromises);
        toast.success("Emergency session ended. Final report sent to contacts.");
      } catch (notificationError) {
          console.error("Failed to send final report:", notificationError);
          toast.warning("Could not send final report to some contacts.");
      }
      
      setActiveIncident(null);
      setStopReason("safe");
      setStopMessage("");
    } catch(error) {
      console.error("Error stopping emergency:", error);
      toast.error("Could not stop emergency session. Please try again.");
    } finally {
      setIsStopping(false);
    }
  };
  
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const copyLiveLink = () => {
    const liveMapUrl = `${window.location.origin}${createPageUrl(`LiveIncidentMap?incidentId=${activeIncident.id}`)}`;
    navigator.clipboard.writeText(liveMapUrl);
    toast.success("Live link copied to clipboard.");
  };

  const hasContacts = contacts && contacts.length > 0;

  return (
    <div className="p-3 md:p-6 lg:p-8 min-h-screen bg-slate-900 text-white relative">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Emergency SOS</h1>
              <p className="text-xs md:text-sm text-slate-400">Immediate emergency alert with Health Twin context</p>
            </div>
          </div>
          <Link to={createPageUrl("EmergencyContacts")}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white hidden md:flex">
              <Phone className="w-4 h-4 mr-2" />
              Manage Contacts
            </Button>
          </Link>
        </div>

        {/* Health Twin Context Indicator (read-only, passive) */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border-2 border-blue-500/50">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-blue-400" />
            <p className="text-sm font-medium text-slate-100">
              🧠 Health Twin Status: {twinState?.status === 'monitoring' ? 'Monitoring' : twinState?.status === 'stable' ? 'Stable' : 'Active'} · Emergency-ready
            </p>
          </div>
        </div>

        {!hasContacts && !activeIncident && (
          <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-red-300">
            <MessageSquareWarning className="h-4 w-4" />
            <AlertDescription>
              You have no emergency contacts. Please <Link to={createPageUrl("EmergencyContacts")} className="font-bold underline hover:text-white">add at least one contact</Link> to enable the emergency alert system.
            </AlertDescription>
          </Alert>
        )}

        <AnimatePresence mode="wait">
          {!activeIncident ? (
            <motion.div key="inactive" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              
              {/* Pre-Emergency Context Display */}
              {hasContacts && (
                <Card className="border-slate-700 bg-slate-800/50 mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      What will be shared if activated
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-300">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 text-blue-400" />
                      <div>
                        <p className="font-medium">Live location</p>
                        <p className="text-xs text-slate-400">Continuous GPS tracking</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mic className="w-4 h-4 mt-0.5 text-cyan-400" />
                      <div>
                        <p className="font-medium">Audio recording</p>
                        <p className="text-xs text-slate-400">Ambient sound capture</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Brain className="w-4 h-4 mt-0.5 text-purple-400" />
                      <div>
                        <p className="font-medium">Basic Health Twin snapshot (non-diagnostic)</p>
                        <p className="text-xs text-slate-400">Recent vitals context for responders</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 mt-0.5 text-green-400" />
                      <div>
                        <p className="font-medium">Emergency contacts notified</p>
                        <p className="text-xs text-slate-400">{contacts.length} contact{contacts.length !== 1 ? 's' : ''} will receive alerts</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg text-xs text-blue-200">
                      AUTRYST shares essential context to help responders act faster. No diagnosis is performed.
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Health Twin Snapshot (passive, display only) */}
              {hasContacts && user && (
                <Card className="border-slate-700 bg-slate-800/50 mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-teal-400" />
                      Health Twin Snapshot
                    </CardTitle>
                    <p className="text-xs text-slate-400">This information will be shared with responders</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg bg-slate-700/50">
                        <p className="text-xs text-slate-400 mb-1">Current Health State</p>
                        <p className="font-medium text-slate-200 capitalize">
                          {twinState?.status === 'monitoring' ? 'Monitoring' : twinState?.status === 'stable' ? 'Stable' : 'Active'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-700/50">
                        <p className="text-xs text-slate-400 mb-1">Known Conditions</p>
                        <p className="font-medium text-slate-200">
                          {user?.medical_conditions?.length > 0 ? user.medical_conditions.slice(0, 2).join(', ') : 'None reported'}
                        </p>
                      </div>
                    </div>
                    {(user?.allergies || user?.blood_group) && (
                      <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-700/30">
                        <p className="text-xs text-amber-400 font-medium mb-2">Emergency Notes</p>
                        {user?.allergies && (
                          <p className="text-xs text-slate-300">Allergies: {user.allergies.join(', ')}</p>
                        )}
                        {user?.blood_group && (
                          <p className="text-xs text-slate-300">Blood Group: {user.blood_group}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Family & Contact Integration */}
              {hasContacts && (
                <Card className="border-slate-700 bg-slate-800/50 mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-green-400" />
                        Emergency Contacts ({contacts.length} active)
                      </CardTitle>
                      <Link to={createPageUrl("EmergencyContacts")}>
                        <Button variant="outline" size="sm" className="text-xs border-slate-600 hover:bg-slate-700">
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {contacts.slice(0, 3).map((contact, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-300 p-2 rounded bg-slate-700/30">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>{contact.name}</span>
                          <span className="text-xs text-slate-500">({contact.relationship})</span>
                        </div>
                      ))}
                      {contacts.length > 3 && (
                        <p className="text-xs text-slate-400 pl-2">+{contacts.length - 3} more</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-3 italic">
                      Contacts receive alerts instantly with live status.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Emergency Button Card */}
              <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl">
                <CardContent className="p-8 text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-48 h-48 mx-auto mb-6 rounded-full flex items-center justify-center shadow-2xl transition-all ${hasContacts ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/30 cursor-pointer' : 'bg-slate-700 cursor-not-allowed'}`}
                      >
                         <div className={`absolute w-48 h-48 rounded-full ${hasContacts ? 'bg-red-500 animate-pulse opacity-50' : ''}`}></div>
                        <AlertTriangle className="w-24 h-24 text-white" />
                      </motion.div>
                    </DialogTrigger>
                    {hasContacts && (
                      <DialogContent className="bg-slate-900 border-slate-700 text-white">
                        <DialogHeader>
                          <DialogTitle className="text-2xl text-red-400 flex items-center gap-2">
                            <AlertTriangle /> Confirm Emergency Activation
                          </DialogTitle>
                          <DialogDescription className="text-slate-400 pt-4">
                            You are about to start a live emergency session. This will:
                            <ul className="list-disc list-inside mt-2 space-y-1 text-left">
                              <li>Start sharing your live location and audio.</li>
                              <li>Immediately notify all your emergency contacts.</li>
                              <li>Create a permanent incident report.</li>
                            </ul>
                            <p className="mt-4 font-bold text-slate-300">Only activate in a genuine emergency.</p>
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                        <Button className="bg-slate-700 hover:bg-slate-600 text-white">Cancel</Button>
                        <Button disabled={isActivating} onClick={startEmergency} className="bg-red-600 hover:bg-red-700 text-white">
                        {isActivating ? "Activating..." : "Confirm & Activate"}
                        </Button>
                        </DialogFooter>
                      </DialogContent>
                    )}
                  </Dialog>
                  <h2 className="text-2xl font-bold text-slate-100 mb-2">Emergency Alert</h2>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">
                    {hasContacts ? 'Press the button to send an alert with your live location and audio to your emergency contacts.' : 'Add emergency contacts to enable this feature.'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-2 border-red-500/50 rounded-2xl p-1 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 border-4 border-red-500/80 rounded-xl animate-pulse pointer-events-none"></div>
              <Card className="border-0 bg-slate-800/50 shadow-2xl shadow-red-500/20 relative z-10">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-red-400">
                    <span className="flex items-center gap-2">
                      <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><Bell className="animate-pulse" /></motion.div>
                      Emergency Active
                    </span>
                    <span className="font-mono text-2xl">{formatTime(timer)}</span>
                  </CardTitle>
                  <p className="text-sm text-slate-400">Alert sent at {activeIncident?.start_time ? new Date(activeIncident.start_time).toLocaleTimeString() : '--'}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-3">
                      <h4 className="font-semibold text-slate-300 mb-2">Live Status</h4>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-cyan-400"><Mic/> Audio Streaming</div>
                         <div className="flex items-center gap-2 text-green-400"><MapPin/> Location Sharing</div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700">
                         <span>Incident ID: <span className="font-mono">{activeIncident.id.slice(0, 8)}...</span></span>
                         <div className="flex items-center gap-3">
                            {!isOnline && <span className="flex items-center gap-1 text-amber-400"><WifiOff className="w-3 h-3" />Offline</span>}
                            {batteryLevel < 0.2 && <span className="flex items-center gap-1 text-red-400"><BatteryWarning className="w-3 h-3" />Low Battery ({Math.round(batteryLevel * 100)}%)</span>}
                         </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 relative z-20">
                        <button 
                          type="button"
                          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer rounded-md flex items-center justify-center font-medium transition-colors"
                          onClick={() => {
                            const url = `${window.location.origin}${createPageUrl(`LiveIncidentMap?incidentId=${activeIncident.id}`)}`;
                            window.open(url, '_blank');
                          }}
                        >
                          <MapPin className="w-4 h-4 mr-2"/>View Live Map
                        </button>
                        <button 
                          type="button"
                          onClick={() => copyLiveLink()}
                          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white cursor-pointer rounded-md flex items-center justify-center font-medium transition-colors"
                        >
                          <Share2 className="w-4 h-4 mr-2"/>Share Live Link
                        </button>
                    </div>

                    <button 
                        type="button"
                        className="w-full h-16 bg-red-600 hover:bg-red-700 text-xl font-bold cursor-pointer rounded-md flex items-center justify-center text-white transition-colors relative z-20"
                        onClick={() => setShowStopDialog(true)}
                    >
                        <StopCircle className="w-6 h-6 mr-3"/> STOP EMERGENCY
                    </button>
                    
                    <Dialog open={showStopDialog} onOpenChange={(open) => {
                      setShowStopDialog(open);
                      if (!open) {
                        setStopReason("safe");
                        setStopMessage("");
                      }
                    }}>
                        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                  <CheckCircle className="w-6 h-6 text-green-500" />
                                  End Emergency Session
                                </DialogTitle>
                                <DialogDescription className="text-slate-400 pt-2">
                                    Please tell us why you're ending the emergency. This will be shared with your contacts.
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="py-4 space-y-4">
                              <RadioGroup value={stopReason} onValueChange={setStopReason} className="space-y-3">
                                <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-900/30 border border-green-700/50 cursor-pointer hover:bg-green-900/50" onClick={() => setStopReason("safe")}>
                                  <RadioGroupItem value="safe" id="safe" className="border-green-500 text-green-500" />
                                  <Label htmlFor="safe" className="cursor-pointer flex-1">
                                    <span className="font-semibold text-green-400">I am safe now</span>
                                    <p className="text-xs text-slate-400 mt-1">The situation has been resolved</p>
                                  </Label>
                                </div>
                                
                                <div className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-900/30 border border-yellow-700/50 cursor-pointer hover:bg-yellow-900/50" onClick={() => setStopReason("mistake")}>
                                  <RadioGroupItem value="mistake" id="mistake" className="border-yellow-500 text-yellow-500" />
                                  <Label htmlFor="mistake" className="cursor-pointer flex-1">
                                    <span className="font-semibold text-yellow-400">Triggered by mistake</span>
                                    <p className="text-xs text-slate-400 mt-1">It was an accidental activation</p>
                                  </Label>
                                </div>
                                
                                <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-900/30 border border-blue-700/50 cursor-pointer hover:bg-blue-900/50" onClick={() => setStopReason("resolved")}>
                                  <RadioGroupItem value="resolved" id="resolved" className="border-blue-500 text-blue-500" />
                                  <Label htmlFor="resolved" className="cursor-pointer flex-1">
                                    <span className="font-semibold text-blue-400">Situation handled</span>
                                    <p className="text-xs text-slate-400 mt-1">Help arrived or issue resolved</p>
                                  </Label>
                                </div>
                                
                                <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer hover:bg-slate-700" onClick={() => setStopReason("other")}>
                                  <RadioGroupItem value="other" id="other" className="border-slate-500 text-slate-400" />
                                  <Label htmlFor="other" className="cursor-pointer flex-1">
                                    <span className="font-semibold text-slate-300">Other reason</span>
                                    <p className="text-xs text-slate-400 mt-1">Add a custom message</p>
                                  </Label>
                                </div>
                              </RadioGroup>
                              
                              {stopReason === "other" && (
                                <Textarea
                                  placeholder="Describe what happened..."
                                  value={stopMessage}
                                  onChange={(e) => setStopMessage(e.target.value)}
                                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                  rows={3}
                                />
                              )}
                            </div>
                            
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" className="bg-slate-700 hover:bg-slate-600 text-white" disabled={isStopping} onClick={() => setShowStopDialog(false)}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleStopEmergency} 
                                  className="bg-green-600 hover:bg-green-700 text-white" 
                                  disabled={isStopping || (stopReason === "other" && !stopMessage.trim())}
                                >
                                  {isStopping ? "Ending..." : "Confirm & End Emergency"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}