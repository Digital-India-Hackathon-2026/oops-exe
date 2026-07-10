import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Settings as SettingsIcon, 
  User,
  Bell,
  Shield,
  Smartphone,
  Moon,
  Eye,
  LogOut,
  Save,
  Sparkles,
  Activity,
  Database,
  Camera,
  Loader2,
  CheckCircle,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import ProfilePhotoUpload from "../components/profile/ProfilePhotoUpload";

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [settings, setSettings] = useState({
    // Notifications
    healthAlerts: true,
    achievementNotifications: true,
    medicationReminders: true,
    familyAlerts: true,
    emailNotifications: false,
    pushNotifications: true,

    // Privacy
    shareDataWithFamily: true,
    anonymousHealthData: false,

    // Display
    darkMode: false,
    compactView: false,

    // Data
    syncWearable: true,
    autoBackup: true,

    // Demo Mode
    demoMode: user?.demo_mode || false
  });

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    age: user?.age || '',
    height: user?.height || '',
    weight: user?.weight || '',
    blood_group: user?.blood_group || '',
    daily_goal_steps: user?.daily_goal_steps || 10000,
    daily_goal_sleep: user?.daily_goal_sleep || 8,
    daily_goal_calories: user?.daily_goal_calories || 2000
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      alert('Profile updated successfully!');
    },
  });

  const handleSaveProfile = async () => {
    await updateProfileMutation.mutateAsync({
      ...profileData,
      age: parseInt(profileData.age) || user?.age,
      height: parseInt(profileData.height) || user?.height,
      weight: parseFloat(profileData.weight) || user?.weight,
      daily_goal_steps: parseInt(profileData.daily_goal_steps),
      daily_goal_sleep: parseInt(profileData.daily_goal_sleep),
      daily_goal_calories: parseInt(profileData.daily_goal_calories)
    });
  };

  const toggleDemoMode = async () => {
    await updateProfileMutation.mutateAsync({
      demo_mode: !settings.demoMode
    });
    setSettings({ ...settings, demoMode: !settings.demoMode });
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await base44.auth.logout();
    }
  };

  const handlePhotoUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
  };

  return (
    <div className="p-3 md:p-6 lg:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg">
            <SettingsIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm md:text-base text-gray-500">Manage your app preferences</p>
          </div>
        </div>

        {user?.demo_mode && (
          <Alert className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <Sparkles className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Demo Mode is Active:</strong> You're using simulated health data. 
              Toggle off in the Advanced section to use real data.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="display">
              <Eye className="w-4 h-4 mr-2" />
              Display
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Database className="w-4 h-4 mr-2" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo Section */}
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 pb-6 border-b border-gray-200">
                  <ProfilePhotoUpload user={user} onPhotoUpdated={handlePhotoUpdated} />
                  <div className="text-center sm:text-left">
                    <h3 className="text-xl font-bold text-gray-900">{user?.full_name || 'User'}</h3>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Click the camera icon to update your photo.<br/>
                      Face detection ensures family members can recognize you.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={profileData.age}
                      onChange={(e) => setProfileData({...profileData, age: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={profileData.height}
                      onChange={(e) => setProfileData({...profileData, height: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={profileData.weight}
                      onChange={(e) => setProfileData({...profileData, weight: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="blood">Blood Group</Label>
                    <Input
                      id="blood"
                      value={profileData.blood_group}
                      onChange={(e) => setProfileData({...profileData, blood_group: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Daily Health Goals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="steps">Steps Goal</Label>
                      <Input
                        id="steps"
                        type="number"
                        value={profileData.daily_goal_steps}
                        onChange={(e) => setProfileData({...profileData, daily_goal_steps: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sleep">Sleep Goal (hours)</Label>
                      <Input
                        id="sleep"
                        type="number"
                        value={profileData.daily_goal_sleep}
                        onChange={(e) => setProfileData({...profileData, daily_goal_sleep: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="calories">Calorie Goal</Label>
                      <Input
                        id="calories"
                        type="number"
                        value={profileData.daily_goal_calories}
                        onChange={(e) => setProfileData({...profileData, daily_goal_calories: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isLoading}
                  className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Health Alerts</p>
                    <p className="text-sm text-gray-500">Critical health notifications</p>
                  </div>
                  <Switch
                    checked={settings.healthAlerts}
                    onCheckedChange={(checked) => setSettings({...settings, healthAlerts: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Achievement Notifications</p>
                    <p className="text-sm text-gray-500">Badges and milestone alerts</p>
                  </div>
                  <Switch
                    checked={settings.achievementNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, achievementNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Medication Reminders</p>
                    <p className="text-sm text-gray-500">Daily medication alerts</p>
                  </div>
                  <Switch
                    checked={settings.medicationReminders}
                    onCheckedChange={(checked) => setSettings({...settings, medicationReminders: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Family Health Alerts</p>
                    <p className="text-sm text-gray-500">Notifications about family members</p>
                  </div>
                  <Switch
                    checked={settings.familyAlerts}
                    onCheckedChange={(checked) => setSettings({...settings, familyAlerts: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive alerts via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-500">Mobile push alerts</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Share Data with Family</p>
                    <p className="text-sm text-gray-500">Allow family members to view your health data</p>
                  </div>
                  <Switch
                    checked={settings.shareDataWithFamily}
                    onCheckedChange={(checked) => setSettings({...settings, shareDataWithFamily: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Anonymous Health Data</p>
                    <p className="text-sm text-gray-500">Contribute anonymously to health research</p>
                  </div>
                  <Switch
                    checked={settings.anonymousHealthData}
                    onCheckedChange={(checked) => setSettings({...settings, anonymousHealthData: checked})}
                  />
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Your health data is encrypted and HIPAA-compliant. We never share your personal information without your explicit consent.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Dark Mode</p>
                    <p className="text-sm text-gray-500">Switch to dark theme</p>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => setSettings({...settings, darkMode: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Compact View</p>
                    <p className="text-sm text-gray-500">Show more information in less space</p>
                  </div>
                  <Switch
                    checked={settings.compactView}
                    onCheckedChange={(checked) => setSettings({...settings, compactView: checked})}
                  />
                </div>

                <Alert className="bg-gray-50 border-gray-200">
                  <Eye className="h-4 w-4 text-gray-600" />
                  <AlertDescription className="text-gray-700">
                    Display settings will take effect immediately and apply across all pages.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Sync Wearable Device</p>
                    <p className="text-sm text-gray-500">Automatically sync data from your wearable</p>
                  </div>
                  <Switch
                    checked={settings.syncWearable}
                    onCheckedChange={(checked) => setSettings({...settings, syncWearable: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Auto Backup</p>
                    <p className="text-sm text-gray-500">Automatically backup your health data</p>
                  </div>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => setSettings({...settings, autoBackup: checked})}
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-600" />
                        Demo Mode
                      </p>
                      <p className="text-sm text-gray-500">Use simulated data for testing</p>
                    </div>
                    <Switch
                      checked={settings.demoMode}
                      onCheckedChange={toggleDemoMode}
                    />
                  </div>
                  {settings.demoMode && (
                    <Alert className="bg-orange-50 border-orange-200">
                      <Activity className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        Demo mode is active. All health data and interactions are simulated for demonstration purposes.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}