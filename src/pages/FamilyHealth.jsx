import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  Plus,
  UserPlus,
  Shield,
  Copy,
  CheckCircle,
  XCircle,
  Share2,
  Bell,
  Timer,
  Trash2,
  AlertTriangle,
  MapPin,
  Mic,
  ExternalLink,
  QrCode,
  Camera,
  Brain
} from "lucide-react";
import { useHealthTwin } from "@/components/health-twin/HealthTwinProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FamilyMemberDetailModal from "../components/family/FamilyMemberDetailModal";
import QRCodeDisplay from "../components/family/QRCodeDisplay";
import QRScanner from "../components/family/QRScanner";

const permissionOptions = [
  { id: "vitals", label: "Vital summaries" },
  { id: "activity", label: "Activity balance" },
  { id: "sleep", label: "Sleep adequacy" },
  { id: "predictions", label: "Risk signals" },
];

export default function FamilyHealth() {
  const [showJoinFamilyModal, setShowJoinFamilyModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [permissionsToShare, setPermissionsToShare] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [codeExpiry, setCodeExpiry] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [codeStatus, setCodeStatus] = useState("none"); // none, active, used, expired
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);
  const [permissions, setPermissions] = useState([]); // Used for the permissions dialog
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [showPermissionsAfterScan, setShowPermissionsAfterScan] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Health Twin governance (read-only)
  const { twinState } = useHealthTwin();

  const { data: familyMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['familyMembers', user?.email],
    queryFn: () => base44.entities.FamilyMember.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['pendingConnectionRequests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.FamilyConnectionRequest.filter({
        target_user_id: user.id,
        status: 'pending'
      });
    },
    enabled: !!user?.id,
    refetchInterval: 3000,
  });

  // Query for active emergency incidents from family members (only show if within 10 minutes)
  const { data: familyEmergencies = [] } = useQuery({
    queryKey: ['familyEmergencies', familyMembers],
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
              // Only show if emergency started within last 10 minutes
              if (startTime > tenMinutesAgo) {
                emergencies.push({
                  ...incident,
                  member_name: member.name,
                  member_id: member.id
                });
              }
            }
          } catch (e) {
            console.error("Error fetching emergency for member:", e);
          }
        }
      }
      return emergencies;
    },
    enabled: !!familyMembers && familyMembers.length > 0,
    refetchInterval: 15000,
  });

  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingCode(true);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      return await base44.entities.FamilyInviteCode.create({
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        creator_user_id: user.id,
        creator_name: user.full_name, // Added creator_name
        creator_email: user.email,
        expires_at: expiresAt,
        status: "active"
      });
    },
    onSuccess: (newCode) => {
      setInviteCode(newCode.code);
      setCodeExpiry(new Date(newCode.expires_at));
      setCodeStatus("active");
      toast.success("Invite code generated! It's valid for 10 minutes.");
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
    },
    onError: (error) => {
      console.error("Error creating invite code:", error);
      toast.error("Failed to generate code");
    },
    onSettled: () => setIsGeneratingCode(false)
  });

  const [isSending, setIsSending] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  const validateCodeAndShowPermissions = async (code) => {
    setIsValidatingCode(true);
    
    try {
      const trimmedCode = code.trim().toUpperCase();
      
      if (!trimmedCode || trimmedCode.length === 0) {
        toast.error("Please enter an invite code.");
        return false;
      }
      
      // Search for the invite code
      const codes = await base44.entities.FamilyInviteCode.filter({ 
        code: trimmedCode, 
        status: "active" 
      });
      
      if (codes.length === 0) {
        toast.error("Invalid or expired code. Please check and try again.");
        return false;
      }

      const inviteCodeData = codes[0];
      
      // Check expiry
      if (new Date(inviteCodeData.expires_at) < new Date()) {
        await base44.entities.FamilyInviteCode.update(inviteCodeData.id, { status: 'expired' });
        toast.error("This code has expired. Please ask for a new one.");
        return false;
      }
      
      // Prevent using your own code
      if (inviteCodeData.creator_user_id === user.id) {
        toast.error("❌ You cannot use your own invite code.");
        return false;
      }
      
      // Check if already connected
      const existingConnection = await base44.entities.FamilyMember.filter({
        created_by: user.email,
        linked_user_id: inviteCodeData.creator_user_id
      });
      
      if (existingConnection.length > 0) {
        toast.error(`👨‍👩‍👧 You are already part of ${inviteCodeData.creator_name || "this person"}'s family network!`, {
          duration: 5000,
        });
        return false;
      }
      
      // Check for existing pending request
      const existingRequest = await base44.entities.FamilyConnectionRequest.filter({
        requester_id: user.id,
        target_user_id: inviteCodeData.creator_user_id,
        status: 'pending'
      });
      
      if (existingRequest.length > 0) {
        toast.error(`⏳ You already have a pending request with ${inviteCodeData.creator_name || "this person"}. Please wait for their response.`, {
          duration: 5000,
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Code validation error:", error);
      toast.error("Failed to validate code. Please try again.");
      return false;
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleSendRequest = async (code, permissions) => {
    if (isSending) {
      console.log("⚠️ Already sending, ignoring duplicate click");
      return;
    }

    setIsSending(true);
    
    try {
      console.log("🚀 Starting request with:", { code, permissions, userId: user?.id });
      
      const trimmedCode = code.trim().toUpperCase();
      
      // Validation
      if (!trimmedCode || trimmedCode.length === 0) {
        throw new Error("Please enter an invite code.");
      }
      if (!permissions || permissions.length === 0) {
        throw new Error("You must select at least one permission to share.");
      }
      if (!user || !user.id) {
        throw new Error("User not authenticated. Please refresh and try again.");
      }
      
      console.log("✓ Validation passed, searching for code:", trimmedCode);
      
      // Search for the invite code
      const codes = await base44.entities.FamilyInviteCode.filter({ 
        code: trimmedCode, 
        status: "active" 
      });
      
      console.log("📋 Found codes:", codes.length);
      
      if (codes.length === 0) {
        throw new Error("Invalid or expired code. Please check and try again.");
      }

      const inviteCodeData = codes[0];
      console.log("📝 Code data:", { 
        creator: inviteCodeData.creator_user_id, 
        expires: inviteCodeData.expires_at 
      });
      
      // Check expiry
      if (new Date(inviteCodeData.expires_at) < new Date()) {
        await base44.entities.FamilyInviteCode.update(inviteCodeData.id, { status: 'expired' });
        throw new Error("This code has expired. Please ask for a new one.");
      }
      
      // Prevent using your own code
      if (inviteCodeData.creator_user_id === user.id) {
        throw new Error("You cannot use your own invite code.");
      }
      
      // Check if already connected
      const existingConnection = await base44.entities.FamilyMember.filter({
        created_by: user.email,
        linked_user_id: inviteCodeData.creator_user_id
      });
      
      console.log("🔗 Existing connections:", existingConnection.length);
      
      if (existingConnection.length > 0) {
        throw new Error("You are already connected with this family member.");
      }
      
      // Check for existing pending request
      const existingRequest = await base44.entities.FamilyConnectionRequest.filter({
        requester_id: user.id,
        target_user_id: inviteCodeData.creator_user_id,
        status: 'pending'
      });
      
      console.log("⏳ Pending requests:", existingRequest.length);
      
      if (existingRequest.length > 0) {
        throw new Error("You already have a pending request with this user.");
      }
      
      const creatorFullName = inviteCodeData.creator_name || "Code Generator";
      
      console.log("📤 Creating connection request...");

      // Create the connection request
      const requestData = {
        requester_id: user.id,
        requester_name: user.full_name || "User",
        requester_email: user.email,
        requester_photo: user.profile_photo || null,
        target_user_id: inviteCodeData.creator_user_id,
        target_user_name: creatorFullName,
        target_user_email: inviteCodeData.creator_email,
        status: 'pending',
        invite_code_id: inviteCodeData.id,
        requested_permissions: permissions,
        health_summary: { relation: "family", message: "A new user wants to connect." }
      };
      
      console.log("📋 Request data:", requestData);
      
      const newRequest = await base44.entities.FamilyConnectionRequest.create(requestData);
      
      console.log("✅ Request created:", newRequest?.id);
      
      if (!newRequest || !newRequest.id) {
        throw new Error("Failed to create connection request. Please try again.");
      }
      
      // Send notification email to code creator (non-blocking)
      try {
        await base44.integrations.Core.SendEmail({
          to: inviteCodeData.creator_email,
          subject: "New Family Health Request - AURYST",
          body: `Hello ${creatorFullName},\n\n${user?.full_name} (${user?.email}) has requested to join your Family Health Network.\n\nPlease review and approve or decline their request on your AURYST dashboard.\n\nThank you,\nAURYST Team`
        });
        console.log("📧 Email sent successfully");
      } catch (emailError) {
        console.log("📧 Email failed (non-critical):", emailError);
      }
      
      console.log("🎉 Success! Showing success message and closing modal");
      toast.success("✅ Connection request sent! The code creator will review your request.");
      
      // Close modal and reset state
      setShowJoinFamilyModal(false);
      setShowScanner(false);
      setScannedCode(null);
      setShowPermissionsAfterScan(false);
      setJoinCode("");
      setPermissionsToShare([]);
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ["pendingConnectionRequests"] });
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      
    } catch (error) {
      console.error("❌ Request failed:", error);
      toast.error(error?.message || "Failed to send request. Please try again.");
    } finally {
      console.log("🔄 Resetting isSending state");
      setIsSending(false);
    }
  };

  const manageRequestMutation = useMutation({
    mutationFn: async ({ request, action }) => {
      if (action === "accept") {
        // Check if already connected (prevent duplicates)
        const existingMember = await base44.entities.FamilyMember.filter({
          created_by: user.email,
          linked_user_id: request.requester_id
        });
        
        if (existingMember.length > 0) {
          // Already connected, just update the request status
          await base44.entities.FamilyConnectionRequest.update(request.id, { status: "accepted" });
          throw new Error("This user is already in your family circle.");
        }
        
        await base44.entities.FamilyConnectionRequest.update(request.id, { status: "accepted" });

        // Create a record for the requester (User B) in the current user's (User A's) list.
        await base44.entities.FamilyMember.create({
          name: request.requester_name,
          relationship: "family",
          age: 0, 
          gender: "unknown", 
          linked_user_id: request.requester_id,
          linked_user_email: request.requester_email,
          created_by: user.email,
          shared_permissions: request.requested_permissions || [],
          profile_photo: request.requester_photo || null
        });

        // Check if reciprocal record exists before creating
        const existingReciprocal = await base44.entities.FamilyMember.filter({
          created_by: request.requester_email,
          linked_user_id: user.id
        });
        
        if (existingReciprocal.length === 0) {
          // Create reciprocal record only if it doesn't exist
          await base44.entities.FamilyMember.create({
              name: user.full_name,
              relationship: "family",
              age: user.age || 0,
              gender: user.gender || 'other',
              linked_user_id: user.id,
              linked_user_email: user.email,
              created_by: request.requester_email,
              shared_permissions: [],
              profile_photo: user.profile_photo || null
          });
        }
        
        if (request.invite_code_id) {
            const codeToUpdate = await base44.entities.FamilyInviteCode.get(request.invite_code_id);
            if (codeToUpdate) {
                await base44.entities.FamilyInviteCode.update(codeToUpdate.id, { status: "used" });
                if (inviteCode && codeToUpdate.code === inviteCode) {
                    setCodeStatus("used");
                }
            }
        }
        
        // Send approval email to requester
        try {
          await base44.integrations.Core.SendEmail({
            to: request.requester_email,
            subject: "Family Health Access Approved - AURYST",
            body: `Hello ${request.requester_name},\n\n${user?.full_name} has accepted your request to share health data on AURYST. You can now see their shared data on your family health dashboard.\n\nThank you,\nAURYST Team`
          });
        } catch (e) {
          console.log("Could not send approval email:", e);
        }

      } else {
        await base44.entities.FamilyConnectionRequest.update(request.id, { status: "rejected" });
        
        // Send rejection email to requester
        try {
          await base44.integrations.Core.SendEmail({
            to: request.requester_email,
            subject: "Family Health Access Denied - AURYST",
            body: `Hello ${request.requester_name},\n\n${user?.full_name} has declined your request to share health data on AURYST. No data has been shared.\n\nThank you,\nAURYST Team`
          });
        } catch (e) {
          console.log("Could not send rejection email:", e);
        }
      }
    },
    onSuccess: (_, { action, request }) => {
      toast.success(`Request ${action}ed successfully!`);
      queryClient.invalidateQueries({ queryKey: ["pendingConnectionRequests"] });
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
    },
    onError: (error) => {
      console.error("Request management error:", error);
      toast.error("Failed to manage request: " + (error.message || "Unknown error"));
    },
  });
  
  const deleteFamilyMemberMutation = useMutation({
    mutationFn: async (memberId) => {
        const member = familyMembers.find(m => m.id === memberId);
        if (!member) throw new Error("Member not found");

        await base44.entities.FamilyMember.delete(memberId);
        
        if (member.linked_user_email) {
            try {
              const theirRecordOfMe = await base44.entities.FamilyMember.filter({ created_by: member.linked_user_email, linked_user_id: user.id });
              if (theirRecordOfMe.length > 0) {
                  await base44.entities.FamilyMember.delete(theirRecordOfMe[0].id);
              }
            } catch (e) {
              console.error("Could not delete reciprocal record:", e);
            }

            try {
              await base44.integrations.Core.SendEmail({
                  to: member.linked_user_email,
                  subject: "Removed from Family Health Network - AURYST",
                  body: `Hello ${member.name},\n\nYou have been removed from ${user?.full_name}'s family health network. Your health data is no longer being shared.\n\nThank you,\nAURYST Team`
              });
            } catch (e) {
              console.log("Could not send notification email:", e);
            }
        }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      toast.success("Family member removed successfully");
    },
    onError: (error) => toast.error("Failed to remove family member: " + error.message),
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ memberId, permissions: updatedPermissions }) => {
        // This mutation updates what the current user (A) shares with a family member (B).
        // It needs to find the record owned by B that links to A and update its permissions.
        const memberToUpdate = familyMembers.find(m => m.id === memberId);
        if (!memberToUpdate) throw new Error("Family member not found.");
        
        const reciprocalRecordQuery = await base44.entities.FamilyMember.filter({
            created_by: memberToUpdate.linked_user_email,
            linked_user_id: user.id
        });

        if (reciprocalRecordQuery.length > 0) {
            await base44.entities.FamilyMember.update(reciprocalRecordQuery[0].id, { shared_permissions: updatedPermissions });
        } else {
             throw new Error("Reciprocal connection not found. Cannot update permissions.");
        }
    },
    onSuccess: () => {
      toast.success("Permissions updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
      setMemberToEdit(null);
    },
    onError: (error) => toast.error("Failed to update permissions: " + error.message)
  });

  useEffect(() => {
    if (!codeExpiry || codeStatus !== "active") return;
    const interval = setInterval(() => {
      const diff = new Date(codeExpiry) - new Date();
      if (diff <= 0) {
        setTimeRemaining(null);
        setCodeStatus("expired");
        clearInterval(interval);
      } else {
        setTimeRemaining({ minutes: Math.floor(diff / 60000), seconds: Math.floor((diff % 60000) / 1000) });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [codeExpiry, codeStatus]);

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };
  
  const getStatusBadgeColor = () => {
    switch (codeStatus) {
      case "active": return "bg-green-500 text-white";
      case "used": return "bg-blue-500 text-white";
      case "expired": return "bg-red-500 text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  const handleOpenPermissions = async (member) => {
    if (!member.linked_user_id) {
      toast.info("This member is not linked to an AURYST account. Permissions can't be managed.");
      return;
    }
    
    // To show what User A shares with B, we must fetch the record owned by B that links to A.
    const reciprocalRecordQuery = await base44.entities.FamilyMember.filter({
        created_by: member.linked_user_email,
        linked_user_id: user.id
    });
    
    if (reciprocalRecordQuery.length > 0) {
        setPermissions(reciprocalRecordQuery[0].shared_permissions || []);
        setMemberToEdit(member);
    } else {
        toast.error("Could not load sharing settings. Connection data is missing.");
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 p-3 md:p-6 lg:p-8 text-white">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center shadow-xl"><Users className="w-6 h-6 md:w-7 md:h-7 text-white" /></div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-100">Family Health Network</h1>
                    <p className="text-xs md:text-sm text-gray-400">A trusted network for shared health intelligence</p>
                </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowJoinFamilyModal(true)}><UserPlus className="w-4 h-4 mr-2" /> Join a Family</Button>
        </div>

        {/* Health Twin Governance Indicator (read-only, persistent) */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border-2 border-blue-600/50 shadow-lg">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-blue-400" />
            <p className="text-sm font-medium text-gray-100">
              🧠 Health Twin Governance: Active · Consent-based sharing
            </p>
          </div>
        </div>

        {/* Emergency Alerts Section */}
        <AnimatePresence>
          {familyEmergencies.filter(e => !dismissedAlerts.includes(e.id)).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-6"
            >
              <Card className="border-2 border-red-500 bg-red-900/30 backdrop-blur-sm shadow-2xl shadow-red-500/20 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600">
                  <CardTitle className="flex items-center gap-3 text-white">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                      <AlertTriangle className="w-6 h-6" />
                    </motion.div>
                    <span className="text-xl">🚨 FAMILY EMERGENCY ALERTS</span>
                    <Badge className="ml-auto bg-white text-red-600 animate-pulse">{familyEmergencies.filter(e => !dismissedAlerts.includes(e.id)).length} Active</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {familyEmergencies.filter(e => !dismissedAlerts.includes(e.id)).map((emergency) => (
                      <motion.div
                        key={emergency.id}
                        className="p-4 rounded-xl bg-slate-900/80 border-2 border-red-500/50"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                                <AlertTriangle className="w-6 h-6 text-white" />
                              </motion.div>
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-lg">{emergency.member_name || emergency.user_name}</h4>
                              <p className="text-red-300 text-sm">Emergency Active</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-500 text-white animate-pulse">
                              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></span>
                              LIVE
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-400 hover:text-white hover:bg-slate-700"
                              onClick={() => setDismissedAlerts(prev => [...prev, emergency.id])}
                            >
                              <XCircle className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-slate-800 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-cyan-400 mb-1">
                              <Mic className="w-4 h-4" />
                              <span className="text-xs">Audio</span>
                            </div>
                            <p className="text-white text-sm font-semibold">Recording</p>
                          </div>
                          <div className="bg-slate-800 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-green-400 mb-1">
                              <MapPin className="w-4 h-4" />
                              <span className="text-xs">Location</span>
                            </div>
                            <p className="text-white text-sm font-semibold">Sharing</p>
                          </div>
                        </div>

                        {emergency.last_known_location && (
                          <div className="bg-slate-800 p-3 rounded-lg mb-3">
                            <p className="text-xs text-slate-400 mb-1">Last Known Location</p>
                            <p className="text-white text-sm font-mono">
                              {emergency.last_known_location.lat.toFixed(6)}, {emergency.last_known_location.lng.toFixed(6)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Accuracy: {emergency.last_known_location.accuracy?.toFixed(0) || 'N/A'}m
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Link to={createPageUrl(`LiveIncidentMap?incidentId=${emergency.id}`)} className="flex-1">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                              <MapPin className="w-4 h-4 mr-2" /> View Live Map
                            </Button>
                          </Link>
                          {emergency.last_known_location && (
                            <a 
                              href={`https://www.google.com/maps?q=${emergency.last_known_location.lat},${emergency.last_known_location.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1"
                            >
                              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                <ExternalLink className="w-4 h-4 mr-2" /> Google Maps
                              </Button>
                            </a>
                          )}
                        </div>
                        
                        <p className="text-xs text-slate-400 mt-3 text-center">
                          Started: {new Date(emergency.start_time).toLocaleString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1">
                <Card className="shadow-2xl border-0 bg-slate-800/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-800 to-pink-900 text-white"><CardTitle className="flex items-center justify-between text-lg"><div className="flex items-center gap-2"><Timer className="w-5 h-5" /><span>Your Invite Code</span></div><Badge className={`${getStatusBadgeColor()} text-xs`}>{codeStatus}</Badge></CardTitle></CardHeader>
                    <CardContent className="p-6 text-center">
                        {codeStatus === "none" ? (
                            <div className="space-y-4">
                                <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-purple-900 to-pink-900 rounded-full flex items-center justify-center"><Plus className="w-8 h-8 text-white" /></div>
                                <p className="text-gray-300 mb-4 text-sm">Generate a code to invite a family member</p>
                                <div className="text-xs text-slate-400 space-y-1 mb-4 text-left">
                                  <p>• Codes expire automatically</p>
                                  <p>• Access can be revoked anytime</p>
                                  <p>• Data visibility is scoped and governed</p>
                                </div>
                                <Button onClick={() => generateCodeMutation.mutate()} disabled={isGeneratingCode} className="w-full bg-gradient-to-r from-purple-700 to-pink-800 hover:from-purple-800 hover:to-pink-900 shadow-lg">{isGeneratingCode ? "Generating..." : "Generate New Code"}</Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block p-4 rounded-xl bg-gradient-to-br from-purple-700 to-pink-800 mb-2 relative"><p className="text-4xl font-bold text-white tracking-widest font-mono">{inviteCode}</p></motion.div>
                                
                                {/* QR Code Display */}
                                {codeStatus === "active" && (
                                    <div className="my-4">
                                        <QRCodeDisplay value={inviteCode} size={160} />
                                    </div>
                                )}
                                
                                {codeStatus === "active" && timeRemaining ? (
                                    <div><p className="text-2xl font-bold text-gray-100">{String(timeRemaining.minutes).padStart(2, '0')}:{String(timeRemaining.seconds).padStart(2, '0')}</p><p className="text-sm text-gray-400">Time Remaining</p><Progress value={((timeRemaining.minutes * 60 + timeRemaining.seconds) / 600) * 100} className="h-2 mt-2" style={{ background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))' }} /></div>
                                ) : codeStatus === "used" ? (
                                    <p className="text-sm text-blue-400">This code has been used.</p>
                                ) : codeStatus === "expired" ? (
                                     <p className="text-sm text-red-400">This code has expired.</p>
                                ) : null}
                                <div className="flex flex-wrap gap-2 justify-center">
                                    <Button onClick={copyInviteCode} className="bg-purple-600 hover:bg-purple-700 text-white">{copiedCode ? <><CheckCircle className="w-4 h-4 mr-2" />Copied!</> : <><Copy className="w-4 h-4 mr-2" />Copy Code</>}</Button>
                                        <Button onClick={() => navigator.share({ text: `Join my family health network on AURYST! Use code: ${inviteCode}`})} className="bg-pink-600 hover:bg-pink-700 text-white"><Share2 className="w-4 h-4 mr-2" />Share</Button>
                                </div>
                                 <Button onClick={() => generateCodeMutation.mutate()} disabled={isGeneratingCode} className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white text-sm">{isGeneratingCode ? "Generating..." : "Generate a New Code"}</Button>
                                <Alert className="bg-slate-700 border-slate-600 text-gray-300 mt-4">
                                  <Shield className="h-4 w-4 text-purple-400" />
                                  <AlertDescription className="text-xs">
                                    Share this code or QR. They'll request consent-based access to intelligence summaries, not raw data.
                                  </AlertDescription>
                                </Alert>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
                <Card className="shadow-2xl border-0 bg-slate-800/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-800 to-teal-900 text-white"><CardTitle className="flex items-center gap-2 text-lg"><Users className="w-5 h-5 text-blue-300" /><span>Your Family Circle ({familyMembers?.length || 0})</span></CardTitle></CardHeader>
                    <CardContent className="p-6">
                        {membersLoading ? <div className="text-center py-8 text-gray-400">Loading...</div> : familyMembers.length === 0 ? (
                            <div className="text-center py-8"><div className="w-16 h-16 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center"><Users className="w-8 h-8 text-blue-500" /></div><h3 className="text-xl font-semibold text-gray-100 mb-2">No Family Members Yet</h3><p className="text-gray-400">Generate an invite code or join a family.</p></div>
                        ) : (
                            <ScrollArea className="h-[300px] pr-4"><div className="space-y-4">
                                {familyMembers.map((member, idx) => (
                                    <motion.div key={member.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700 hover:border-blue-600 transition-all cursor-pointer" onClick={() => setSelectedMember(member)}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                              <Avatar className="w-12 h-12 border-2 border-slate-600">
                                                {member.profile_photo ? (
                                                  <AvatarImage src={member.profile_photo} alt={member.name} className="object-cover" />
                                                ) : (
                                                  <AvatarFallback className="bg-blue-700 text-white text-lg font-bold">{member.name.charAt(0)}</AvatarFallback>
                                                )}
                                              </Avatar>
                                              <div><h4 className="font-bold text-gray-100">{member.name}</h4><p className="text-sm text-gray-400">{member.relationship}</p></div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {member.linked_user_id && (
                                                  <div className="flex flex-col items-end gap-1">
                                                    <Badge className={`bg-slate-700 border ${member.shared_permissions?.length > 0 ? 'border-green-500 text-green-300' : 'border-slate-600 text-slate-400'}`}>
                                                      {member.shared_permissions?.length > 0 ? 'Active' : 'Paused'}
                                                    </Badge>
                                                    {member.shared_permissions?.length > 0 && (
                                                      <span className="text-[10px] text-slate-400">
                                                        {member.shared_permissions.length} scope{member.shared_permissions.length !== 1 ? 's' : ''}
                                                      </span>
                                                    )}
                                                  </div>
                                                )}
                                                {member.linked_user_id && <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenPermissions(member); }} title="Manage shared permissions"><Share2 className="w-4 h-4 text-slate-400 hover:text-blue-300" /></Button>}
                                                <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              onClick={(e) => { 
                                                e.stopPropagation(); 
                                                if (confirm(`Are you sure you want to remove ${member.name} from your family circle?`)) {
                                                  deleteFamilyMemberMutation.mutate(member.id); 
                                                }
                                              }} 
                                              title="Remove family member"
                                              disabled={deleteFamilyMemberMutation.isPending}
                                            >
                                              <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                                            </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div></ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-3">
                <Card className="shadow-2xl border-0 bg-slate-800/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-orange-800 to-amber-900 text-white"><CardTitle className="flex items-center gap-2 text-lg"><Bell className="w-5 h-5 text-amber-300" /><span>Pending Connection Requests ({pendingRequests?.length || 0})</span></CardTitle></CardHeader>
                    <CardContent className="p-6">
                        {requestsLoading ? <div className="text-center py-8 text-gray-400">Loading...</div> : pendingRequests.length === 0 ? (
                            <div className="text-center py-8"><div className="w-16 h-16 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center"><CheckCircle className="w-8 h-8 text-green-500" /></div><h3 className="text-xl font-semibold text-gray-100 mb-2">No Pending Requests</h3><p className="text-gray-400">All caught up!</p></div>
                        ) : (
                            <ScrollArea className="h-[250px] pr-4"><div className="space-y-4">
                                {pendingRequests.map((request) => (
                                    <div key={request.id} className="p-4 rounded-xl bg-slate-900/50 flex flex-col md:flex-row items-start md:items-center justify-between border border-slate-700">
                                        <div className="flex items-center gap-4 mb-3 md:mb-0">
                                          <Avatar className="w-12 h-12 border-2 border-slate-600">
                                            {request.requester_photo ? (
                                              <AvatarImage src={request.requester_photo} alt={request.requester_name} className="object-cover" />
                                            ) : (
                                              <AvatarFallback className="bg-amber-700 text-white font-bold">{request.requester_name?.charAt(0) || 'U'}</AvatarFallback>
                                            )}
                                          </Avatar>
                                          <div>
                                            <p className="font-semibold text-gray-100">{request.requester_name}</p>
                                            <p className="text-sm text-gray-400">wants to connect with you.</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                              size="sm" 
                                              className="bg-red-600 hover:bg-red-700 text-white" 
                                              onClick={() => manageRequestMutation.mutate({ request, action: 'reject' })}
                                              disabled={manageRequestMutation.isPending}
                                            >
                                              <XCircle className="w-4 h-4 mr-2" />{manageRequestMutation.isPending ? 'Processing...' : 'Decline'}
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              className="bg-green-600 hover:bg-green-700" 
                                              onClick={() => manageRequestMutation.mutate({ request, action: 'accept' })}
                                              disabled={manageRequestMutation.isPending}
                                            >
                                              <CheckCircle className="w-4 h-4 mr-2" />{manageRequestMutation.isPending ? 'Processing...' : 'Accept'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div></ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
      </div>

      <Dialog open={showJoinFamilyModal} onOpenChange={(open) => {
        setShowJoinFamilyModal(open);
        if (!open) {
          setShowScanner(false);
          setScannedCode(null);
          setShowPermissionsAfterScan(false);
          setJoinCode("");
          setPermissionsToShare([]);
        }
      }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Join a Family Health Network</DialogTitle>
            <DialogDescription>
              {showScanner ? "Position the QR code within the frame" : 
               showPermissionsAfterScan ? "Select what you'll share" :
               "Enter the invite code or scan a QR code to connect"}
            </DialogDescription>
          </DialogHeader>
          
          {showScanner ? (
            <QRScanner 
              onScan={async (code) => {
                setScannedCode(code);
                setJoinCode(code);
                setShowScanner(false);
                toast.success(`✓ Code scanned: ${code}`);
                
                // Validate the code immediately
                const isValid = await validateCodeAndShowPermissions(code);
                if (isValid) {
                  setShowPermissionsAfterScan(true);
                } else {
                  // Reset and close modal if validation fails
                  setScannedCode(null);
                  setJoinCode("");
                  setShowJoinFamilyModal(false);
                }
              }}
              onClose={() => {
                setShowScanner(false);
                setScannedCode(null);
              }}
            />
          ) : showPermissionsAfterScan ? (
            <div className="space-y-4 py-4">
              <div className="bg-slate-900/50 p-4 rounded-lg border border-green-600/50 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-white font-semibold">Code Scanned</p>
                </div>
                <p className="text-2xl font-mono text-center tracking-widest text-white bg-slate-800 py-2 rounded">
                  {scannedCode}
                </p>
              </div>

              <div>
                <Label className="text-gray-300">Select Sharing Scope</Label>
                <p className="text-xs text-gray-400 mb-2">Choose what health intelligence summaries you'll share</p>
                <div className="space-y-2 rounded-lg bg-slate-900/50 p-4 border border-slate-700">
                  {permissionOptions.map(option => (
                    <div key={option.id} className="flex items-center space-x-3">
                      <Checkbox 
                        id={`scan-share-${option.id}`} 
                        checked={permissionsToShare.includes(option.id)} 
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPermissionsToShare([...permissionsToShare, option.id]);
                          } else {
                            setPermissionsToShare(permissionsToShare.filter(id => id !== option.id));
                          }
                        }} 
                        className="border-slate-500 data-[state=checked]:bg-blue-500" 
                      />
                      <label htmlFor={`scan-share-${option.id}`} className="text-sm font-medium leading-none cursor-pointer text-gray-200">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
                {permissionsToShare.length > 0 && (
                  <p className="text-xs text-green-400 mt-2">✓ {permissionsToShare.length} permission(s) selected</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPermissionsAfterScan(false);
                    setScannedCode(null);
                    setJoinCode("");
                    setPermissionsToShare([]);
                  }}
                  variant="outline"
                  className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-700"
                  type="button"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (isSending) return;

                    if (!scannedCode?.trim()) {
                      toast.error("No code detected. Please try scanning again.");
                      return;
                    }
                    if (permissionsToShare.length === 0) {
                      toast.error("Please select at least one permission to share");
                      return;
                    }
                    if (!user?.id) {
                      toast.error("Please refresh the page and try again");
                      return;
                    }

                    handleSendRequest(scannedCode.trim().toUpperCase(), permissionsToShare);
                  }} 
                  disabled={isSending || !scannedCode?.trim() || permissionsToShare.length === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-teal-700 hover:from-blue-700 hover:to-teal-800"
                >
                  {isSending ? (
                    <span className="flex items-center gap-2 justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Sending...
                    </span>
                  ) : (
                    "Send Request"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex gap-2 mb-4">
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }} 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <QrCode className="w-4 h-4 mr-2" /> Enter Code
                </Button>
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowScanner(true);
                  }} 
                  className="flex-1 bg-slate-700 hover:bg-slate-600"
                >
                  <Camera className="w-4 h-4 mr-2" /> Scan QR
                </Button>
              </div>

              <div>
                <Label htmlFor="joinCode" className="text-gray-300">Enter Code</Label>
                <Input 
                  id="joinCode" 
                  value={joinCode} 
                  onChange={(e) => {
                    const newCode = e.target.value.toUpperCase();
                    setJoinCode(newCode);
                  }}
                  placeholder="XXXXXX" 
                  maxLength={8} 
                  className="text-2xl font-bold text-center tracking-widest uppercase bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Sharing Scope</Label>
                <p className="text-xs text-gray-400 mb-2">Select the intelligence summaries you'll share (not raw data)</p>
                <div className="space-y-2 rounded-lg bg-slate-900/50 p-4 border border-slate-700">
                  {permissionOptions.map(option => (
                    <div key={option.id} className="flex items-center space-x-3">
                      <Checkbox 
                        id={`share-${option.id}`} 
                        checked={permissionsToShare.includes(option.id)} 
                        onCheckedChange={(checked) => {
                          const newPerms = checked 
                            ? [...permissionsToShare, option.id]
                            : permissionsToShare.filter(id => id !== option.id);
                          setPermissionsToShare(newPerms);
                        }} 
                        className="border-slate-500 data-[state=checked]:bg-blue-500" 
                      />
                      <label htmlFor={`share-${option.id}`} className="text-sm font-medium leading-none cursor-pointer text-gray-200">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
                {permissionsToShare.length > 0 && (
                  <p className="text-xs text-green-400 mt-2">✓ {permissionsToShare.length} permission(s) selected</p>
                )}
              </div>

              <Button
                onClick={async () => {
                  if (isSending || isValidatingCode) return;
                  
                  const code = joinCode.trim().toUpperCase();

                  if (!code || code.length === 0) {
                    toast.error("Please enter an invite code.");
                    return;
                  }
                  if (code.length < 4) {
                    toast.error("Code must be at least 4 characters.");
                    return;
                  }
                  if (permissionsToShare.length === 0) {
                    toast.error("Please select at least one permission to share.");
                    return;
                  }
                  if (!user?.id) {
                    toast.error("User not authenticated. Please refresh and try again.");
                    return;
                  }

                  // Validate code first
                  const isValid = await validateCodeAndShowPermissions(code);
                  if (isValid) {
                    handleSendRequest(code, permissionsToShare);
                  } else {
                    // Close modal if validation fails (already connected or pending)
                    setShowJoinFamilyModal(false);
                    setJoinCode("");
                    setPermissionsToShare([]);
                  }
                }}
                disabled={isSending || isValidatingCode || !joinCode.trim() || permissionsToShare.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-700 hover:from-blue-700 hover:to-teal-800"
              >
                {isSending || isValidatingCode ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {isValidatingCode ? "Validating..." : "Sending Request..."}
                  </span>
                ) : (
                  "Send Join Request"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!memberToEdit} onOpenChange={() => setMemberToEdit(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white"><DialogHeader><DialogTitle>Share Intelligence with {memberToEdit?.name}</DialogTitle><DialogDescription className="text-gray-400">Select the Health Twin summaries you want {memberToEdit?.name} to see. Changes save instantly.</DialogDescription></DialogHeader>
          <div className="py-4 space-y-3">
            {permissionOptions.map(option => (<div key={option.id} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700"><Checkbox id={option.id} checked={permissions.includes(option.id)} onCheckedChange={(checked) => { const newPerms = checked ? [...permissions, option.id] : permissions.filter(id => id !== option.id); setPermissions(newPerms); updatePermissionsMutation.mutate({ memberId: memberToEdit.id, permissions: newPerms }); }} className="border-slate-500 data-[state=checked]:bg-blue-500" /><label htmlFor={option.id} className="text-sm font-medium leading-none cursor-pointer text-gray-200">{option.label}</label></div>))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMemberToEdit(null)} className="border-slate-700 text-gray-300 hover:bg-slate-700">Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <FamilyMemberDetailModal member={selectedMember} isOpen={!!selectedMember} onClose={() => setSelectedMember(null)} />
    </div>
  );
}