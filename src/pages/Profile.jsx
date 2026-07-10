import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { User, Heart, Settings, LogOut, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({});
  
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  React.useEffect(() => {
    if (user) {
      setProfileData({
        age: user.age || "",
        gender: user.gender || "",
        height: user.height || "",
        weight: user.weight || "",
        blood_group: user.blood_group || "",
        medical_conditions: user.medical_conditions || [],
        allergies: user.allergies || [],
        medications: user.medications || [],
        demo_mode: user.demo_mode ?? true,
        daily_goal_steps: user.daily_goal_steps || 10000,
        daily_goal_calories: user.daily_goal_calories || 2000,
        daily_goal_sleep: user.daily_goal_sleep || 8
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfileMutation.mutateAsync(profileData);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
    setIsSaving(false);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 lg:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Profile & Settings</h1>
              <p className="text-sm md:text-base text-gray-500">Manage your health information</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                Personal Information
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => {
                  if (isEditing) {
                    setProfileData({
                      age: user.age || "",
                      gender: user.gender || "",
                      height: user.height || "",
                      weight: user.weight || "",
                      blood_group: user.blood_group || "",
                      medical_conditions: user.medical_conditions || [],
                      allergies: user.allergies || [],
                      medications: user.medications || [],
                      demo_mode: user.demo_mode ?? true,
                      daily_goal_steps: user.daily_goal_steps || 10000,
                      daily_goal_calories: user.daily_goal_calories || 2000,
                      daily_goal_sleep: user.daily_goal_sleep || 8
                    });
                  }
                  setIsEditing(!isEditing);
                }}
              >
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-100">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{user?.full_name || 'User'}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                  {profileData.demo_mode && (
                    <Badge variant="outline" className="mt-1 bg-orange-50 text-orange-700 border-orange-200">
                      Demo Mode Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={profileData.age}
                  onChange={(e) => setProfileData({...profileData, age: parseInt(e.target.value)})}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={profileData.gender}
                  onValueChange={(value) => setProfileData({...profileData, gender: value})}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={profileData.height}
                  onChange={(e) => setProfileData({...profileData, height: parseFloat(e.target.value)})}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={profileData.weight}
                  onChange={(e) => setProfileData({...profileData, weight: parseFloat(e.target.value)})}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="blood_group">Blood Group</Label>
                <Select
                  value={profileData.blood_group}
                  onValueChange={(value) => setProfileData({...profileData, blood_group: value})}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isEditing && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Daily Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="steps">Daily Steps Goal</Label>
              <Input
                id="steps"
                type="number"
                value={profileData.daily_goal_steps}
                onChange={(e) => setProfileData({...profileData, daily_goal_steps: parseInt(e.target.value)})}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="calories">Daily Calories Goal</Label>
              <Input
                id="calories"
                type="number"
                value={profileData.daily_goal_calories}
                onChange={(e) => setProfileData({...profileData, daily_goal_calories: parseInt(e.target.value)})}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="sleep">Daily Sleep Goal (hours)</Label>
              <Input
                id="sleep"
                type="number"
                value={profileData.daily_goal_sleep}
                onChange={(e) => setProfileData({...profileData, daily_goal_sleep: parseInt(e.target.value)})}
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              App Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
              <div>
                <h4 className="font-semibold text-gray-900">Demo Mode</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Enable simulated data for testing features
                </p>
              </div>
              <Switch
                checked={profileData.demo_mode}
                onCheckedChange={(checked) => {
                  setProfileData({...profileData, demo_mode: checked});
                  if (isEditing) {
                    updateProfileMutation.mutate({demo_mode: checked});
                  }
                }}
              />
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-100">
              <h4 className="font-semibold text-gray-900 mb-2">About Auryst</h4>
              <p className="text-sm text-gray-600">
                AI-powered health ecosystem • Version 1.0.0
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}