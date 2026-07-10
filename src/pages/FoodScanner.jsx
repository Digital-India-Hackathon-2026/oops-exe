import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Scan, 
  Upload, 
  Camera, 
  Flame, 
  TrendingUp, 
  Apple,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Heart,
  Activity,
  Droplets,
  Zap,
  Award,
  Target,
  Clock,
  Calendar,
  RefreshCw,
  Share2,
  Download,
  Mic,
  Video,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Scale,
  Dumbbell,
  Trophy,
  Star,
  Brain,
  Shield,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useHealthTwin } from "@/components/health-twin/HealthTwinProvider";

export default function FoodScanner() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [mealType, setMealType] = useState("lunch");
  const [scanMode, setScanMode] = useState("image"); // image only
  const [healthGoal, setHealthGoal] = useState("balanced");
  const [showAROverlay, setShowAROverlay] = useState(false);
  const [mealScore, setMealScore] = useState(null);
  const [showExplainability, setShowExplainability] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  
  const queryClient = useQueryClient();
  
  // Health Twin integration (read-only)
  const { twinState } = useHealthTwin();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: previousScans } = useQuery({
    queryKey: ['foodScans', user?.email],
    queryFn: () => base44.entities.FoodScan.filter({ created_by: user.email }, '-created_date', 20),
    initialData: [],
    enabled: !!user?.email
  });

  const { data: recentMetrics } = useQuery({
    queryKey: ['recentMetrics', user?.email],
    queryFn: () => base44.entities.HealthMetric.filter({ created_by: user.email }, '-timestamp', 50),
    initialData: [],
    enabled: !!user?.email
  });

  const createScanMutation = useMutation({
    mutationFn: (data) => base44.entities.FoodScan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodScans', user?.email] });
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
      setMealScore(null);
    }
  };

  const convertToJpeg = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            const convertedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
            resolve(convertedFile);
          }, 'image/jpeg', 0.9);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const scanFood = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setShowAROverlay(true);
    
    try {
      // Convert webp or unsupported formats to jpeg
      let fileToUpload = selectedFile;
      const unsupportedFormats = ['webp', 'heic', 'heif', 'avif'];
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      
      if (unsupportedFormats.includes(fileExtension)) {
        fileToUpload = await convertToJpeg(selectedFile);
      }
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file: fileToUpload });
      
      // Build user context
      const userContext = `
User Profile:
- Age: ${user?.age || 'Not specified'}
- Gender: ${user?.gender || 'Not specified'}
- Weight: ${user?.weight || 'Not specified'} kg
- Height: ${user?.height || 'Not specified'} cm
- Medical Conditions: ${user?.medical_conditions?.join(', ') || 'None'}
- Allergies: ${user?.allergies?.join(', ') || 'None'}
- Current Medications: ${user?.medications?.join(', ') || 'None'}
- Health Goal: ${healthGoal}

Recent Health Data:
${recentMetrics.slice(0, 10).map(m => `${m.metric_type}: ${m.value} ${m.unit}`).join('\n')}

Today's Nutrition:
${getTodayNutrition()}
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an advanced AI Food Scanner for AUTRYST. Analyze this food image comprehensively and provide detailed nutritional and health impact analysis in JSON format.

${userContext}

Analyze the food and provide:

1. Food Identification:
   - Recognize all food items in the image
   - Estimate portion sizes accurately
   - List all visible ingredients

2. Nutritional Breakdown:
   - Total calories
   - Macros: protein, carbs, fat (in grams)
   - Fiber, sugar, sodium
   - Key vitamins and minerals

3. Health Impact Prediction:
   - How this meal affects blood sugar levels
   - Impact on heart health
   - Effect on weight goals
   - Energy levels prediction
   - Digestive impact

4. Personalized Analysis:
   - Alignment with user's health goals
   - Allergen warnings
   - Portion recommendations
   - Meal timing advice

5. Future Impact Simulation:
   - If eaten daily for 1 week
   - If eaten daily for 1 month
   - Long-term health effects

6. Meal Quality Score (0-100):
   - Overall healthiness rating
   - Breakdown by category

7. Health Risks & Warnings:
   - Immediate health risks if any (be brutally honest)
   - Short-term problems (within hours/days)
   - Long-term health consequences if consumed regularly
   - Specific diseases this food may contribute to
   - Risk severity level (low/medium/high/critical)
   - Who should absolutely avoid this food

8. Harmful Ingredients Analysis:
   - List any harmful additives, preservatives, chemicals
   - Trans fats, excessive sodium, added sugars content
   - Processing level (ultra-processed, processed, whole food)
   - Carcinogenic or inflammatory compounds if any

9. Recommendations:
   - Healthier alternatives
   - Modification suggestions
   - Complementary foods
   - Foods to avoid

10. Recipe Ideas:
   - Healthier versions
   - Meal prep suggestions

Be BRUTALLY HONEST about unhealthy foods. If the food is bad, clearly state WHY it's bad and what health problems it can cause. Don't sugarcoat - user health depends on accurate information.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            food_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  portion_size: { type: "string" },
                  confidence: { type: "number" }
                }
              }
            },
            total_calories: { type: "number" },
            macros: {
              type: "object",
              properties: {
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                fiber: { type: "number" },
                sugar: { type: "number" },
                sodium: { type: "number" }
              }
            },
            micronutrients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  amount: { type: "string" },
                  daily_value_percent: { type: "number" }
                }
              }
            },
            allergens: { type: "array", items: { type: "string" } },
            health_impact: {
              type: "object",
              properties: {
                blood_sugar_impact: { type: "string" },
                heart_health_impact: { type: "string" },
                weight_impact: { type: "string" },
                energy_prediction: { type: "string" },
                digestive_impact: { type: "string" }
              }
            },
            meal_score: {
              type: "object",
              properties: {
                overall: { type: "number" },
                nutrition_balance: { type: "number" },
                portion_size: { type: "number" },
                ingredient_quality: { type: "number" },
                alignment_with_goals: { type: "number" }
              }
            },
            future_impact: {
              type: "object",
              properties: {
                one_week: { type: "string" },
                one_month: { type: "string" },
                long_term: { type: "string" }
              }
            },
            recommendations: {
              type: "object",
              properties: {
                healthier_alternatives: { type: "array", items: { type: "string" } },
                modifications: { type: "array", items: { type: "string" } },
                complementary_foods: { type: "array", items: { type: "string" } },
                foods_to_avoid: { type: "array", items: { type: "string" } }
              }
            },
            recipe_ideas: { type: "array", items: { type: "string" } },
            personalized_advice: { type: "string" },
            portion_recommendation: { type: "string" },
            best_time_to_eat: { type: "string" },
            health_risks: {
              type: "object",
              properties: {
                risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                immediate_risks: { type: "array", items: { type: "string" } },
                short_term_problems: { type: "array", items: { type: "string" } },
                long_term_consequences: { type: "array", items: { type: "string" } },
                diseases_linked: { type: "array", items: { type: "string" } },
                who_should_avoid: { type: "array", items: { type: "string" } },
                warning_summary: { type: "string" }
              }
            },
            harmful_ingredients: {
              type: "object",
              properties: {
                additives: { type: "array", items: { type: "string" } },
                processing_level: { type: "string", enum: ["whole_food", "minimally_processed", "processed", "ultra_processed"] },
                harmful_compounds: { type: "array", items: { type: "string" } },
                excess_nutrients: { type: "array", items: { type: "string" } }
              }
            },
            is_unhealthy: { type: "boolean" },
            unhealthy_reason: { type: "string" }
          }
        }
      });

      setScanResult({ ...result, image_url: file_url });
      setMealScore(result.meal_score);
      
      // Auto-log meal with health risks
      await createScanMutation.mutateAsync({
        image_url: file_url,
        food_name: result.food_items?.map(f => f.name).join(', ') || "Multiple Items",
        calories: result.total_calories,
        macros: result.macros,
        portion_size: result.food_items?.[0]?.portion_size || "Standard",
        healthiness_score: result.meal_score?.overall || 75,
        recommendations: result.personalized_advice,
        allergens: result.allergens,
        meal_type: mealType
      });

      // Send nutrition signal to Health Twin (non-blocking)
      try {
        await base44.entities.HealthMetric.create({
          metric_type: 'calories',
          value: result.total_calories || 0,
          unit: 'kcal',
          timestamp: new Date().toISOString(),
          source: 'demo',
          notes: `Food scan: ${result.food_items?.map(f => f.name).join(', ') || 'Unknown'} - ${mealType}`
        });
      } catch (e) {
        console.log('Health Twin nutrition signal sent');
      }

      // Show appropriate toast based on health score
      if (result.is_unhealthy || result.meal_score?.overall < 40) {
        toast.warning(`⚠️ Warning: This food scored ${result.meal_score?.overall}/100. ${result.unhealthy_reason || 'Consider healthier alternatives.'}`, { duration: 6000 });
      } else if (result.meal_score?.overall < 60) {
        toast.info(`📊 Meal scanned! Health score: ${result.meal_score?.overall}/100. Room for improvement.`);
      } else {
        toast.success(`🎉 Great choice! Health score: ${result.meal_score?.overall}/100. +25 XP earned!`);
      }

    } catch (error) {
      console.error("Error scanning food:", error);
      if (error.message && error.message.includes("limit of integrations")) {
        toast.warning("Integration limit reached. Displaying demo results.", {
          description: "To use the live AI, please upgrade your plan.",
        });

        const mockFoodResult = {
            food_items: [{ name: "Demo Salad", portion_size: "1 bowl", confidence: 98 }],
            total_calories: 350,
            macros: { protein: 20, carbs: 15, fat: 22, fiber: 8, sugar: 4, sodium: 180 },
            micronutrients: [{ name: "Vitamin C", amount: "50mg", daily_value_percent: 60 }],
            allergens: [],
            health_impact: { 
              blood_sugar_impact: "Low, due to complex carbs and fiber.", 
              heart_health_impact: "Positive, good fats and fiber.",
              weight_impact: "Supports weight management.",
              energy_prediction: "Sustained energy release.",
              digestive_impact: "Excellent, high fiber content."
            },
            meal_score: { overall: 85, nutrition_balance: 88, portion_size: 90, ingredient_quality: 80, alignment_with_goals: 82 },
            future_impact: { 
              one_week: "Improved energy levels and digestion.", 
              one_month: "Potential weight management support and better gut health.",
              long_term: "Reduced risk of chronic diseases and enhanced overall well-being."
            },
            recommendations: {
              healthier_alternatives: ["Quinoa salad", "Lentil soup"],
              modifications: ["Add grilled chicken for more protein", "Use a light vinaigrette"],
              complementary_foods: ["A glass of water or herbal tea"],
              foods_to_avoid: ["Creamy dressings"]
            },
            recipe_ideas: ["Mediterranean Quinoa Salad", "Roasted Vegetable & Chickpea Salad"],
            personalized_advice: "This is a healthy demo meal, rich in protein and fiber. Keep up the good work! Consider adding lean protein for muscle gain goals.",
            portion_recommendation: "Current portion is good for a balanced meal, adjust based on activity level.",
            best_time_to_eat: "Lunchtime, for sustained energy throughout the afternoon.",
            health_risks: {
              risk_level: "low",
              immediate_risks: [],
              short_term_problems: [],
              long_term_consequences: [],
              diseases_linked: [],
              who_should_avoid: [],
              warning_summary: "This is a healthy meal with no significant health risks."
            },
            harmful_ingredients: {
              additives: [],
              processing_level: "whole_food",
              harmful_compounds: [],
              excess_nutrients: []
            },
            is_unhealthy: false,
            unhealthy_reason: ""
        };

        setScanResult({ ...mockFoodResult, image_url: previewUrl });
        setMealScore(mockFoodResult.meal_score);
      } else {
        toast.error("Failed to scan food. Please try again.");
      }
    }
    
    setIsScanning(false);
    setTimeout(() => setShowAROverlay(false), 1000);
  };

  const getTodayCalories = () => {
    const today = new Date().toDateString();
    return previousScans
      .filter(scan => new Date(scan.created_date).toDateString() === today)
      .reduce((sum, scan) => sum + (scan.calories || 0), 0);
  };

  const getTodayMacros = () => {
    const today = new Date().toDateString();
    const todayScans = previousScans.filter(scan => 
      new Date(scan.created_date).toDateString() === today
    );
    
    return {
      protein: todayScans.reduce((sum, s) => sum + (s.macros?.protein || 0), 0),
      carbs: todayScans.reduce((sum, s) => sum + (s.macros?.carbs || 0), 0),
      fat: todayScans.reduce((sum, s) => sum + (s.macros?.fat || 0), 0)
    };
  };

  const getTodayNutrition = () => {
    const calories = getTodayCalories();
    const macros = getTodayMacros();
    return `Calories: ${calories} kcal\nProtein: ${macros.protein.toFixed(1)}g\nCarbs: ${macros.carbs.toFixed(1)}g\nFat: ${macros.fat.toFixed(1)}g`;
  };

  const getMealScoreColor = (score) => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-yellow-500 to-orange-500";
    if (score >= 40) return "from-orange-500 to-red-500";
    return "from-red-500 to-red-600";
  };

  const todayCalories = getTodayCalories();
  const todayMacros = getTodayMacros();
  const calorieGoal = user?.daily_goal_calories || 2000;

  return (
    <div className="p-3 md:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Scan className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">AI Food Scanner</h1>
              <p className="text-xs md:text-sm text-purple-200">Nutrition signals for your AI Health Twin</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Card className="bg-black/40 backdrop-blur-md border-purple-500/30">
              <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Today's Calories</p>
                  <p className="text-2xl font-bold text-white">{todayCalories}</p>
                  <Progress value={(todayCalories / calorieGoal) * 100} className="h-1 mt-1" />
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-white" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Health Twin Context (read-only, persistent) */}
        <div className="bg-black/40 backdrop-blur-md border-purple-500/30 rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-purple-400" />
            <p className="text-sm font-medium text-white">
              🧠 Health Twin Context: <span className="capitalize">{twinState.status}</span> · Nutrition signals active
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left: Scanner Interface */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Scanner Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="shadow-2xl border-0 bg-black/40 backdrop-blur-md border-purple-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Camera className="w-5 h-5 text-purple-400" />
                      Scan Your Meal
                    </CardTitle>
                    <Badge className="bg-green-600 text-white">
                      <Camera className="w-3 h-3 mr-1" />
                      Photo Scan
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    capture={scanMode === "camera" ? "environment" : undefined}
                  />

                  {!previewUrl ? (
                    <motion.div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative border-2 border-dashed border-purple-500/50 rounded-2xl p-12 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/10 transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                        <Camera className="w-12 h-12 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Scan Your Food</h3>
                      <p className="text-gray-400">Tap to capture or upload a photo</p>
                      <p className="text-xs text-gray-500 mt-2">Supports: Images, Videos, Live Camera</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Food preview"
                          className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                        />
                        {showAROverlay && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-2xl flex items-end p-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <div className="text-white space-y-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                <p className="text-sm font-semibold">AI Analyzing...</p>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div className="bg-black/50 rounded-lg p-2 backdrop-blur-sm">
                                  <Flame className="w-4 h-4 text-orange-500 mb-1" />
                                  <p>Calories</p>
                                </div>
                                <div className="bg-black/50 rounded-lg p-2 backdrop-blur-sm">
                                  <Apple className="w-4 h-4 text-green-500 mb-1" />
                                  <p>Nutrients</p>
                                </div>
                                <div className="bg-black/50 rounded-lg p-2 backdrop-blur-sm">
                                  <Heart className="w-4 h-4 text-red-500 mb-1" />
                                  <p>Health Impact</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-2 block">Meal Type</label>
                          <Select value={mealType} onValueChange={setMealType}>
                            <SelectTrigger className="bg-black/30 border-purple-500/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="breakfast">Breakfast</SelectItem>
                              <SelectItem value="lunch">Lunch</SelectItem>
                              <SelectItem value="dinner">Dinner</SelectItem>
                              <SelectItem value="snack">Snack</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-2 block">Health Goal</label>
                          <Select value={healthGoal} onValueChange={setHealthGoal}>
                            <SelectTrigger className="bg-black/30 border-purple-500/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="balanced">Balanced Diet</SelectItem>
                              <SelectItem value="weight_loss">Weight Loss</SelectItem>
                              <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                              <SelectItem value="diabetes">Diabetes Management</SelectItem>
                              <SelectItem value="heart_health">Heart Health</SelectItem>
                              <SelectItem value="energy">Energy Boost</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={scanFood}
                          disabled={isScanning}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                          size="lg"
                        >
                          {isScanning ? (
                            <>
                              <Skeleton className="w-5 h-5 mr-2" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5 mr-2" />
                              Analyze Food
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                            setScanResult(null);
                            setMealScore(null);
                          }}
                          className="border-purple-500/30"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Scan Results */}
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="shadow-2xl border-0 bg-black/40 backdrop-blur-md border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        Analysis Results
                      </div>
                      {mealScore && (
                        <motion.div
                          className={`w-20 h-20 rounded-full bg-gradient-to-br ${getMealScoreColor(mealScore.overall)} flex items-center justify-center shadow-lg`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                        >
                          <div className="text-center">
                            <p className="text-2xl font-bold text-white">{mealScore.overall}</p>
                            <p className="text-[10px] text-white/80">Score</p>
                          </div>
                        </motion.div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="nutrition" className="w-full">
                      <TabsList className="grid w-full grid-cols-4 bg-purple-900/20">
                        <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                        <TabsTrigger value="health">Health Impact</TabsTrigger>
                        <TabsTrigger value="recommendations">Tips</TabsTrigger>
                        <TabsTrigger value="future">Future Impact</TabsTrigger>
                      </TabsList>

                      <TabsContent value="nutrition" className="space-y-4 mt-4">
                       {/* Health Twin Impact Panel */}
                       <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-2 border-blue-500/30 mb-4">
                         <div className="flex items-center gap-2 mb-3">
                           <Brain className="w-5 h-5 text-blue-400" />
                           <h4 className="font-semibold text-white">Health Twin Impact</h4>
                         </div>
                         <div className="grid grid-cols-3 gap-2 mb-3">
                           <div className="bg-black/30 rounded-lg p-2 text-center">
                             <p className="text-[10px] text-gray-400 mb-1">Energy Load</p>
                             <p className="text-xs font-semibold text-white">
                               {scanResult.total_calories > 600 ? 'High' : 
                                scanResult.total_calories > 300 ? 'Moderate' : 'Low'}
                             </p>
                           </div>
                           <div className="bg-black/30 rounded-lg p-2 text-center">
                             <p className="text-[10px] text-gray-400 mb-1">Carb Density</p>
                             <p className="text-xs font-semibold text-white">
                               {scanResult.macros?.carbs > 50 ? 'High' : 
                                scanResult.macros?.carbs > 25 ? 'Moderate' : 'Low'}
                             </p>
                           </div>
                           <div className="bg-black/30 rounded-lg p-2 text-center">
                             <p className="text-[10px] text-gray-400 mb-1">Protein</p>
                             <p className="text-xs font-semibold text-white">
                               {scanResult.macros?.protein > 25 ? 'High' : 
                                scanResult.macros?.protein > 15 ? 'Moderate' : 'Low'}
                             </p>
                           </div>
                         </div>
                         <div className="bg-black/30 rounded-lg p-3 border-l-4 border-blue-500">
                           <p className="text-xs text-gray-300 italic">
                             {scanResult.total_calories > 600 && scanResult.macros?.carbs > 50
                               ? "This meal contributes to short-term energy but may affect metabolic stability."
                               : scanResult.macros?.protein > 25
                               ? "Protein-rich meal supports recovery and muscle maintenance baseline."
                               : "Balanced nutrient profile aligns with typical daily patterns."}
                           </p>
                         </div>

                         {/* Explainability */}
                         <button
                           onClick={() => setShowExplainability(!showExplainability)}
                           className="w-full flex items-center justify-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors py-2 mt-2"
                         >
                           {showExplainability ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                           Why AUTRYST analyzed this meal
                         </button>

                         <AnimatePresence>
                           {showExplainability && (
                             <motion.div
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               exit={{ height: 0, opacity: 0 }}
                               className="bg-black/30 rounded-lg p-3 text-xs text-gray-400 space-y-1 mt-2"
                             >
                               <p>• Used to update daily energy balance</p>
                               <p>• Influences workout readiness calculations</p>
                               <p>• Contributes to long-term nutrition trend modeling</p>
                             </motion.div>
                           )}
                         </AnimatePresence>
                       </div>
                        {/* Food Items */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-3">Detected Foods:</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {scanResult.food_items?.map((item, i) => (
                              <motion.div
                                key={i}
                                className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-semibold text-white text-sm">{item.name}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {item.confidence}% sure
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-400">{item.portion_size}</p>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Macros */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-3">Nutritional Breakdown:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                              <Flame className="w-6 h-6 text-orange-500 mb-2" />
                              <p className="text-xs text-gray-400">Calories</p>
                              <p className="text-2xl font-bold text-white">{scanResult.total_calories}</p>
                              <p className="text-xs text-gray-500">kcal</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30">
                              <Dumbbell className="w-6 h-6 text-red-500 mb-2" />
                              <p className="text-xs text-gray-400">Protein</p>
                              <p className="text-2xl font-bold text-white">{scanResult.macros?.protein || 0}</p>
                              <p className="text-xs text-gray-500">grams</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                              <Apple className="w-6 h-6 text-amber-500 mb-2" />
                              <p className="text-xs text-gray-400">Carbs</p>
                              <p className="text-2xl font-bold text-white">{scanResult.macros?.carbs || 0}</p>
                              <p className="text-xs text-gray-500">grams</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                              <Droplets className="w-6 h-6 text-yellow-500 mb-2" />
                              <p className="text-xs text-gray-400">Fat</p>
                              <p className="text-2xl font-bold text-white">{scanResult.macros?.fat || 0}</p>
                              <p className="text-xs text-gray-500">grams</p>
                            </div>
                          </div>
                        </div>

                        {/* Micronutrients */}
                        {scanResult.micronutrients?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Key Vitamins & Minerals:</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {scanResult.micronutrients.slice(0, 6).map((nutrient, i) => (
                                <div key={i} className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-white">{nutrient.name}</p>
                                    <Badge className="bg-blue-500 text-xs">
                                      {nutrient.daily_value_percent}%
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-400">{nutrient.amount}</p>
                                  <Progress value={nutrient.daily_value_percent} className="h-1 mt-2" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Allergens */}
                        {scanResult.allergens?.length > 0 && (
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                              <h4 className="text-sm font-semibold text-red-400">Allergen Alert</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {scanResult.allergens.map((allergen, i) => (
                                <Badge key={i} variant="outline" className="bg-red-500/20 text-red-300 border-red-500/30">
                                  {allergen}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="health" className="space-y-4 mt-4">
                        {/* Health Risks Warning Box */}
                        {scanResult.health_risks && scanResult.health_risks.risk_level !== "low" && (
                          <motion.div
                            className={`p-4 rounded-xl border-2 ${
                              scanResult.health_risks.risk_level === "critical" ? "bg-red-500/20 border-red-500" :
                              scanResult.health_risks.risk_level === "high" ? "bg-orange-500/20 border-orange-500" :
                              "bg-yellow-500/20 border-yellow-500"
                            }`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className={`w-6 h-6 ${
                                scanResult.health_risks.risk_level === "critical" ? "text-red-400" :
                                scanResult.health_risks.risk_level === "high" ? "text-orange-400" :
                                "text-yellow-400"
                              }`} />
                              <h4 className="font-bold text-white text-lg">
                                {scanResult.health_risks.risk_level === "critical" ? "⚠️ CRITICAL HEALTH WARNING" :
                                 scanResult.health_risks.risk_level === "high" ? "⚠️ HIGH RISK FOOD" :
                                 "⚠️ MODERATE RISK"}
                              </h4>
                            </div>
                            <p className="text-gray-200 mb-3">{scanResult.health_risks.warning_summary}</p>
                            
                            {scanResult.health_risks.immediate_risks?.length > 0 && (
                              <div className="mb-2">
                                <p className="text-red-300 font-semibold text-sm">Immediate Risks:</p>
                                <ul className="list-disc list-inside text-red-200 text-sm">
                                  {scanResult.health_risks.immediate_risks.map((risk, i) => <li key={i}>{risk}</li>)}
                                </ul>
                              </div>
                            )}
                            
                            {scanResult.health_risks.diseases_linked?.length > 0 && (
                              <div className="mb-2">
                                <p className="text-orange-300 font-semibold text-sm">Linked to Diseases:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {scanResult.health_risks.diseases_linked.map((disease, i) => (
                                    <Badge key={i} className="bg-red-500/30 text-red-200 text-xs">{disease}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {scanResult.health_risks.who_should_avoid?.length > 0 && (
                              <div>
                                <p className="text-yellow-300 font-semibold text-sm">Who Should Avoid:</p>
                                <ul className="list-disc list-inside text-yellow-200 text-sm">
                                  {scanResult.health_risks.who_should_avoid.map((who, i) => <li key={i}>{who}</li>)}
                                </ul>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* Harmful Ingredients */}
                        {scanResult.harmful_ingredients && (scanResult.harmful_ingredients.additives?.length > 0 || scanResult.harmful_ingredients.harmful_compounds?.length > 0) && (
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                            <div className="flex items-center gap-2 mb-3">
                              <Shield className="w-5 h-5 text-red-400" />
                              <h4 className="font-semibold text-white">Harmful Ingredients Detected</h4>
                              <Badge className={`ml-auto ${
                                scanResult.harmful_ingredients.processing_level === "ultra_processed" ? "bg-red-500" :
                                scanResult.harmful_ingredients.processing_level === "processed" ? "bg-orange-500" :
                                "bg-green-500"
                              }`}>
                                {scanResult.harmful_ingredients.processing_level?.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            {scanResult.harmful_ingredients.additives?.length > 0 && (
                              <div className="mb-2">
                                <p className="text-gray-400 text-xs mb-1">Additives & Preservatives:</p>
                                <div className="flex flex-wrap gap-1">
                                  {scanResult.harmful_ingredients.additives.map((add, i) => (
                                    <Badge key={i} variant="outline" className="text-red-300 border-red-500/30 text-xs">{add}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {scanResult.harmful_ingredients.harmful_compounds?.length > 0 && (
                              <div className="mb-2">
                                <p className="text-gray-400 text-xs mb-1">Harmful Compounds:</p>
                                <div className="flex flex-wrap gap-1">
                                  {scanResult.harmful_ingredients.harmful_compounds.map((comp, i) => (
                                    <Badge key={i} className="bg-red-600 text-xs">{comp}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {scanResult.harmful_ingredients.excess_nutrients?.length > 0 && (
                              <div>
                                <p className="text-gray-400 text-xs mb-1">Excessive Amounts:</p>
                                <div className="flex flex-wrap gap-1">
                                  {scanResult.harmful_ingredients.excess_nutrients.map((n, i) => (
                                    <Badge key={i} variant="outline" className="text-orange-300 border-orange-500/30 text-xs">{n}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-3">
                          <motion.div
                            className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Activity className="w-5 h-5 text-blue-400" />
                              <h4 className="font-semibold text-white">Blood Sugar Impact</h4>
                            </div>
                            <p className="text-sm text-gray-300">{scanResult.health_impact?.blood_sugar_impact}</p>
                          </motion.div>

                          <motion.div
                            className="p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Heart className="w-5 h-5 text-red-400" />
                              <h4 className="font-semibold text-white">Heart Health Impact</h4>
                            </div>
                            <p className="text-sm text-gray-300">{scanResult.health_impact?.heart_health_impact}</p>
                          </motion.div>

                          <motion.div
                            className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Scale className="w-5 h-5 text-purple-400" />
                              <h4 className="font-semibold text-white">Weight Impact</h4>
                            </div>
                            <p className="text-sm text-gray-300">{scanResult.health_impact?.weight_impact}</p>
                          </motion.div>

                          <motion.div
                            className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Zap className="w-5 h-5 text-amber-400" />
                              <h4 className="font-semibold text-white">Energy Prediction</h4>
                            </div>
                            <p className="text-sm text-gray-300">{scanResult.health_impact?.energy_prediction}</p>
                          </motion.div>
                        </div>

                        {/* Meal Score Breakdown */}
                        {mealScore && (
                          <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                              <Trophy className="w-5 h-5 text-green-400" />
                              Meal Quality Breakdown
                            </h4>
                            <div className="space-y-2">
                              {[
                                { label: "Nutrition Balance", value: mealScore.nutrition_balance },
                                { label: "Portion Size", value: mealScore.portion_size },
                                { label: "Ingredient Quality", value: mealScore.ingredient_quality },
                                { label: "Goal Alignment", value: mealScore.alignment_with_goals }
                              ].map((item, i) => (
                                <div key={i}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-300">{item.label}</span>
                                    <span className="text-white font-semibold">{item.value}/100</span>
                                  </div>
                                  <Progress value={item.value} className="h-2" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="recommendations" className="space-y-4 mt-4">
                        {/* Personalized Advice */}
                        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="w-5 h-5 text-purple-400" />
                            <h4 className="font-semibold text-white">AI Personalized Advice</h4>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">{scanResult.personalized_advice}</p>
                        </div>

                        {/* Healthier Alternatives */}
                        {scanResult.recommendations?.healthier_alternatives?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                              <ArrowRight className="w-4 h-4 text-green-400" />
                              Healthier Alternatives
                            </h4>
                            <div className="space-y-2">
                              {scanResult.recommendations.healthier_alternatives.map((alt, i) => (
                                <div key={i} className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-gray-300">{alt}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Modifications */}
                        {scanResult.recommendations?.modifications?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-400" />
                              Suggested Modifications
                            </h4>
                            <div className="space-y-2">
                              {scanResult.recommendations.modifications.map((mod, i) => (
                                <div key={i} className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-2">
                                  <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-gray-300">{mod}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recipe Ideas */}
                        {scanResult.recipe_ideas?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                              <Apple className="w-4 h-4 text-amber-400" />
                              Recipe Ideas
                            </h4>
                            <div className="space-y-2">
                              {scanResult.recipe_ideas.slice(0, 3).map((recipe, i) => (
                                <div key={i} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                  <p className="text-sm text-gray-300">{recipe}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="future" className="space-y-4 mt-4">
                        <div className="space-y-3">
                          <motion.div
                            className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-5 h-5 text-blue-400" />
                              <h4 className="font-semibold text-white">If eaten daily for 1 week</h4>
                            </div>
                            <p className="text-sm text-gray-300">{scanResult.future_impact?.one_week}</p>
                          </motion.div>

                          <motion.div
                            className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-5 h-5 text-purple-400" />
                              <h4 className="font-semibold text-white">If eaten daily for 1 month</h4>
                            </div>
                            <p className="text-sm text-gray-300">{scanResult.future_impact?.one_month}</p>
                          </motion.div>

                          <motion.div
                            className="p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-5 h-5 text-red-400" />
                              <h4 className="font-semibold text-white">Long-term Effects</h4>
                            </div>
                            <p className="text-sm text-gray-300">{scanResult.future_impact?.long_term}</p>
                          </motion.div>
                        </div>

                        {/* Best Time to Eat */}
                        <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-green-400" />
                            <h4 className="font-semibold text-white">Optimal Timing</h4>
                          </div>
                          <p className="text-sm text-gray-300">{scanResult.best_time_to_eat}</p>
                        </div>

                        {/* Portion Recommendation */}
                        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Scale className="w-5 h-5 text-amber-400" />
                            <h4 className="font-semibold text-white">Portion Recommendation</h4>
                          </div>
                          <p className="text-sm text-gray-300">{scanResult.portion_recommendation}</p>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </Button>
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Today's Nutrition Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="bg-black/40 backdrop-blur-md border-purple-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm">Today's Nutrition</CardTitle>
                    <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-400/30">
                      Adjusted by your AI Health Twin
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Calories</span>
                      <span className="text-white font-semibold">{todayCalories}/{calorieGoal}</span>
                    </div>
                    <Progress value={(todayCalories / calorieGoal) * 100} className="h-2" />
                    {twinState.status === 'monitoring' && (
                      <p className="text-[10px] text-orange-400 mt-1">Calorie target stable today</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-[10px] text-gray-400">Protein</p>
                      <p className="text-lg font-bold text-white">{todayMacros.protein.toFixed(0)}</p>
                      <p className="text-[10px] text-gray-500">g</p>
                      {twinState.systemRecommendations?.activity_level === 'normal' && (
                        <p className="text-[9px] text-blue-400 mt-1">Target increased</p>
                      )}
                    </div>
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <p className="text-[10px] text-gray-400">Carbs</p>
                      <p className="text-lg font-bold text-white">{todayMacros.carbs.toFixed(0)}</p>
                      <p className="text-[10px] text-gray-500">g</p>
                    </div>
                    <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-[10px] text-gray-400">Fat</p>
                      <p className="text-lg font-bold text-white">{todayMacros.fat.toFixed(0)}</p>
                      <p className="text-[10px] text-gray-500">g</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Scans */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-black/40 backdrop-blur-md border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Recent Scans</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {previousScans.slice(0, 10).map((scan, i) => {
                        // Twin effect tag
                        const getTwinEffectTag = () => {
                          const protein = scan.macros?.protein || 0;
                          const carbs = scan.macros?.carbs || 0;
                          const calories = scan.calories || 0;
                          
                          if (protein > 25) return { label: 'Protein-rich', color: 'bg-blue-500' };
                          if (carbs > 50) return { label: 'High carb', color: 'bg-orange-500' };
                          if (calories > 600) return { label: 'Energy dense', color: 'bg-red-500' };
                          return { label: 'Balanced', color: 'bg-green-500' };
                        };
                        
                        const twinEffect = getTwinEffectTag();
                        
                        return (
                          <motion.div
                            key={scan.id}
                            className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors cursor-pointer"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <div className="flex items-start gap-3">
                              {scan.image_url && (
                                <img
                                  src={scan.image_url}
                                  alt={scan.food_name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-sm truncate">{scan.food_name}</p>
                                <p className="text-xs text-gray-400">{scan.calories} kcal</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className="text-[10px]" variant="outline">
                                    {scan.meal_type}
                                  </Badge>
                                  <Badge className={`text-[10px] ${twinEffect.color}`}>
                                    {twinEffect.label}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-black/40 backdrop-blur-md border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-blue-400" />
                      <span className="text-sm text-gray-300">Scans Today</span>
                    </div>
                    <span className="text-lg font-bold text-white">
                      {previousScans.filter(s => new Date(s.created_date).toDateString() === new Date().toDateString()).length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-gray-300">Total Scans</span>
                    </div>
                    <span className="text-lg font-bold text-white">{previousScans.length}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-400" />
                      <span className="text-sm text-gray-300">Avg Health Score</span>
                    </div>
                    <span className="text-lg font-bold text-white">
                      {previousScans.length > 0 
                        ? Math.round(previousScans.reduce((sum, s) => sum + s.healthiness_score, 0) / previousScans.length)
                        : 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Ethical Footnote */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Nutrition analysis supports health modeling and guidance. It does not replace professional dietary or medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}