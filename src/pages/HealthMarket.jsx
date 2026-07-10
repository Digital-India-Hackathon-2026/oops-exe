import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ShoppingCart, 
  Search, 
  Package, 
  Pill, 
  Heart,
  Leaf,
  Dumbbell,
  Star,
  Truck,
  Sparkles,
  TrendingUp,
  Award,
  Brain,
  Activity,
  Moon,
  Flame,
  Shield,
  Zap,
  Target,
  Calendar,
  Video,
  Users,
  Droplets,
  Wind,
  Apple,
  Scale,
  Plus,
  Minus,
  X,
  Check,
  ArrowRight,
  Filter,
  Telescope,
  Layers,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthTwin } from "@/components/health-twin/HealthTwinProvider";

export default function HealthMarket() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [healthImpact, setHealthImpact] = useState(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(2847);
  const [expandedExplainers, setExpandedExplainers] = useState({});
  
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Health Twin governance (read-only)
  const { twinState, recentVitals, getRiskAssessment } = useHealthTwin();

  const { data: recentMetrics } = useQuery({
    queryKey: ['recentMetrics'],
    queryFn: () => base44.entities.HealthMetric.filter({}, '-timestamp', 50),
    initialData: [],
  });

  const { data: foodScans } = useQuery({
    queryKey: ['recentFoodScans'],
    queryFn: () => base44.entities.FoodScan.filter({}, '-created_date', 20),
    initialData: [],
  });

  // Product Categories
  const categories = [
    { id: "all", name: "All Products", icon: Package, color: "from-purple-500 to-pink-600" },
    { id: "supplements", name: "Supplements", icon: Pill, color: "from-blue-500 to-cyan-600" },
    { id: "fitness", name: "Fitness Equipment", icon: Dumbbell, color: "from-red-500 to-orange-600" },
    { id: "nutrition", name: "Nutrition Plans", icon: Apple, color: "from-green-500 to-emerald-600" },
    { id: "wellness", name: "Wellness Programs", icon: Leaf, color: "from-teal-500 to-green-600" },
    { id: "devices", name: "Health Devices", icon: Activity, color: "from-indigo-500 to-purple-600" },
    { id: "services", name: "Professional Services", icon: Users, color: "from-pink-500 to-rose-600" }
  ];

  // Smart Product Recommendations (AI-powered)
  const products = {
    supplements: [
      {
        id: "sup1",
        name: "Vitamin D3 5000 IU",
        category: "supplements",
        price: 24.99,
        rating: 4.8,
        reviews: 2847,
        image: "💊",
        description: "High-potency vitamin D for immune support and bone health",
        benefits: ["Immune System", "Bone Health", "Mood Support"],
        dosage: "1 capsule daily",
        aiScore: 95,
        healthImpact: {
          immune_boost: 85,
          bone_health: 92,
          energy_level: 78,
          predicted_benefit: "Significant improvement in vitamin D levels within 2 weeks"
        },
        inStock: true,
        fastDelivery: true,
        loyaltyPoints: 25
      },
      {
        id: "sup2",
        name: "Omega-3 Fish Oil 2000mg",
        category: "supplements",
        price: 34.99,
        rating: 4.9,
        reviews: 3421,
        image: "🐟",
        description: "Premium omega-3 for heart and brain health",
        benefits: ["Heart Health", "Brain Function", "Joint Support"],
        dosage: "2 capsules daily",
        aiScore: 93,
        healthImpact: {
          heart_health: 90,
          brain_function: 88,
          inflammation: -75,
          predicted_benefit: "Reduced inflammation and improved cardiovascular health in 4 weeks"
        },
        inStock: true,
        fastDelivery: true,
        loyaltyPoints: 35
      },
      {
        id: "sup3",
        name: "Probiotic Complex 50B CFU",
        category: "supplements",
        price: 39.99,
        rating: 4.7,
        reviews: 1829,
        image: "🦠",
        description: "Advanced probiotic blend for gut health",
        benefits: ["Digestive Health", "Immune Support", "Gut Microbiome"],
        dosage: "1 capsule daily",
        aiScore: 89,
        healthImpact: {
          digestive_health: 94,
          immune_system: 82,
          energy_level: 76,
          predicted_benefit: "Improved gut health and digestion within 2-3 weeks"
        },
        inStock: true,
        fastDelivery: false,
        loyaltyPoints: 40
      },
      {
        id: "sup4",
        name: "Magnesium Glycinate 400mg",
        category: "supplements",
        price: 19.99,
        rating: 4.8,
        reviews: 2156,
        image: "💎",
        description: "Highly absorbable magnesium for sleep and relaxation",
        benefits: ["Sleep Quality", "Muscle Recovery", "Stress Relief"],
        dosage: "2 capsules before bed",
        aiScore: 91,
        healthImpact: {
          sleep_quality: 89,
          stress_reduction: 85,
          muscle_recovery: 80,
          predicted_benefit: "Better sleep quality and reduced muscle tension in 1 week"
        },
        inStock: true,
        fastDelivery: true,
        loyaltyPoints: 20
      }
    ],
    fitness: [
      {
        id: "fit1",
        name: "Smart Resistance Bands Set",
        category: "fitness",
        price: 49.99,
        rating: 4.7,
        reviews: 1543,
        image: "🏋️",
        description: "5-level resistance bands with workout guide",
        benefits: ["Muscle Building", "Flexibility", "Home Workouts"],
        aiScore: 87,
        healthImpact: {
          muscle_strength: 85,
          flexibility: 80,
          calorie_burn: 75,
          predicted_benefit: "Increased muscle tone and flexibility in 4-6 weeks"
        },
        inStock: true,
        fastDelivery: true,
        loyaltyPoints: 50
      },
      {
        id: "fit2",
        name: "Premium Yoga Mat + Blocks",
        category: "fitness",
        price: 59.99,
        rating: 4.9,
        reviews: 3287,
        image: "🧘",
        description: "Eco-friendly non-slip yoga mat with alignment guides",
        benefits: ["Flexibility", "Mindfulness", "Posture"],
        aiScore: 92,
        healthImpact: {
          flexibility: 88,
          stress_reduction: 82,
          balance: 85,
          predicted_benefit: "Improved flexibility and stress management in 3 weeks"
        },
        inStock: true,
        fastDelivery: true,
        loyaltyPoints: 60
      },
      {
        id: "fit3",
        name: "Smart Jump Rope with Counter",
        category: "fitness",
        price: 39.99,
        rating: 4.6,
        reviews: 987,
        image: "🪢",
        description: "Digital jump rope tracks calories and reps",
        benefits: ["Cardio Health", "Weight Loss", "Coordination"],
        aiScore: 84,
        healthImpact: {
          cardiovascular: 90,
          calorie_burn: 88,
          coordination: 75,
          predicted_benefit: "Enhanced cardiovascular fitness in 2-3 weeks"
        },
        inStock: true,
        fastDelivery: true,
        loyaltyPoints: 40
      }
    ],
    nutrition: [
      {
        id: "nut1",
        name: "AI Personalized Meal Plan (30 Days)",
        category: "nutrition",
        price: 99.99,
        rating: 4.9,
        reviews: 2341,
        image: "🍽️",
        description: "Custom meal plan based on your health data and goals",
        benefits: ["Weight Management", "Nutrition Balance", "Energy Boost"],
        aiScore: 96,
        healthImpact: {
          weight_management: 92,
          energy_level: 88,
          nutrition_balance: 95,
          predicted_benefit: "Optimized nutrition and noticeable energy improvement in 2 weeks"
        },
        inStock: true,
        fastDelivery: false,
        loyaltyPoints: 100,
        subscription: true
      },
      {
        id: "nut2",
        name: "Keto Diet Starter Kit",
        category: "nutrition",
        price: 149.99,
        rating: 4.7,
        reviews: 1678,
        image: "🥑",
        description: "Complete keto guide + supplement bundle",
        benefits: ["Weight Loss", "Mental Clarity", "Energy"],
        aiScore: 88,
        healthImpact: {
          weight_loss: 90,
          mental_clarity: 85,
          energy_level: 82,
          predicted_benefit: "Potential 5-8 lbs weight loss in first month"
        },
        inStock: true,
        fastDelivery: true,
        loyaltyPoints: 150
      }
    ],
    wellness: [
      {
        id: "wel1",
        name: "8-Week Mindfulness Program",
        category: "wellness",
        price: 199.99,
        rating: 4.9,
        reviews: 3567,
        image: "🧠",
        description: "Guided meditation and mindfulness training",
        benefits: ["Stress Reduction", "Mental Health", "Focus"],
        aiScore: 94,
        healthImpact: {
          stress_reduction: 92,
          mental_health: 90,
          sleep_quality: 85,
          predicted_benefit: "Significant stress reduction and improved sleep within 2 weeks"
        },
        inStock: true,
        fastDelivery: false,
        loyaltyPoints: 200,
        subscription: true
      },
      {
        id: "wel2",
        name: "Sleep Optimization Program",
        category: "wellness",
        price: 149.99,
        rating: 4.8,
        reviews: 2198,
        image: "😴",
        description: "AI-powered sleep improvement program",
        benefits: ["Sleep Quality", "Energy", "Recovery"],
        aiScore: 91,
        healthImpact: {
          sleep_quality: 93,
          energy_level: 87,
          stress_reduction: 82,
          predicted_benefit: "Improved sleep quality and energy levels in 1 week"
        },
        inStock: true,
        fastDelivery: false,
        loyaltyPoints: 150,
        subscription: true
      }
    ],
    devices: [
      {
        id: "dev1",
        name: "Smart Blood Pressure Monitor",
        category: "devices",
        price: 79.99,
        rating: 4.8,
        reviews: 1843,
        image: "🩺",
        description: "Bluetooth-connected BP monitor with app integration",
        benefits: ["Heart Health Monitoring", "Data Tracking", "AI Insights"],
        aiScore: 90,
        healthImpact: {
          heart_health_monitoring: 95,
          data_accuracy: 92,
          early_detection: 88,
          predicted_benefit: "Better cardiovascular monitoring and early risk detection"
        },
        inStock: true,
        fastDelivery: true,
        loyaltyPoints: 80
      },
      {
        id: "dev2",
        name: "Smart Scale with Body Composition",
        category: "devices",
        price: 99.99,
        rating: 4.7,
        reviews: 2567,
        image: "⚖️",
        description: "Measures weight, BMI, muscle mass, body fat %",
        benefits: ["Body Tracking", "Progress Monitoring", "Health Insights"],
        aiScore: 89,
        healthImpact: {
          progress_tracking: 94,
          motivation: 85,
          goal_achievement: 88,
          predicted_benefit: "Detailed body composition tracking for better goal tracking"
        },
        inStock: true,
        fastDelivery: true,
        loyaltyPoints: 100
      }
    ],
    services: [
      {
        id: "ser1",
        name: "Virtual Nutritionist Consultation",
        category: "services",
        price: 79.99,
        rating: 4.9,
        reviews: 1234,
        image: "👨‍⚕️",
        description: "1-hour video consultation with certified nutritionist",
        benefits: ["Personalized Advice", "Meal Planning", "Health Goals"],
        aiScore: 95,
        healthImpact: {
          personalized_guidance: 96,
          goal_achievement: 90,
          nutrition_knowledge: 88,
          predicted_benefit: "Tailored nutrition plan based on your specific needs"
        },
        inStock: true,
        fastDelivery: false,
        loyaltyPoints: 80
      },
      {
        id: "ser2",
        name: "Personal Training Package (10 Sessions)",
        category: "services",
        price: 499.99,
        rating: 4.8,
        reviews: 876,
        image: "🏃",
        description: "10 one-on-one virtual training sessions",
        benefits: ["Custom Workouts", "Form Correction", "Motivation"],
        aiScore: 93,
        healthImpact: {
          fitness_improvement: 94,
          motivation: 92,
          injury_prevention: 88,
          predicted_benefit: "Significant fitness gains and proper form development"
        },
        inStock: true,
        fastDelivery: false,
        loyaltyPoints: 500
      }
    ]
  };

  // Flatten all products
  const allProducts = Object.values(products).flat();

  // Health Twin–governed product surfacing
  const getPersonalizedRecommendations = () => {
    const recommendations = [];
    
    // Based on Health Twin state and vitals
    const stressMetric = recentVitals.find(m => m.metric_type === "stress_level");
    if (stressMetric && stressMetric.value > 60) {
      const product = allProducts.find(p => p.id === "wel1");
      if (product) {
        recommendations.push({
          ...product,
          twinReason: "Supports stress regulation focus",
          twinRelevance: "Aligns with elevated stress signals"
        });
      }
      const magnesium = allProducts.find(p => p.id === "sup4");
      if (magnesium) {
        recommendations.push({
          ...magnesium,
          twinReason: "Complements stress management signals",
          twinRelevance: "Supports relaxation patterns"
        });
      }
    }
    
    // Based on sleep adequacy
    const sleepMetric = recentVitals.find(m => m.metric_type === "sleep");
    if (sleepMetric && sleepMetric.value < 7) {
      const product = allProducts.find(p => p.id === "wel2");
      if (product) {
        recommendations.push({
          ...product,
          twinReason: "Relevant to sleep optimization trends",
          twinRelevance: "Aligns with recovery focus"
        });
      }
    }
    
    // Based on activity balance
    const stepsMetric = recentVitals.find(m => m.metric_type === "steps");
    if (stepsMetric && stepsMetric.value < 8000) {
      const product = allProducts.find(p => p.id === "fit3");
      if (product) {
        recommendations.push({
          ...product,
          twinReason: "Suggested due to low activity recovery",
          twinRelevance: "Supports cardiovascular balance"
        });
      }
    }
    
    // Cardiovascular support (always relevant if monitoring)
    if (twinState.status === 'monitoring' || twinState.status === 'stable') {
      const omega = allProducts.find(p => p.id === "sup2");
      if (omega) {
        recommendations.push({
          ...omega,
          twinReason: "Supports cardiovascular balance",
          twinRelevance: "Complements current vitals trends"
        });
      }
    }
    
    // Remove duplicates
    const seen = new Set();
    return recommendations.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).slice(0, 6);
  };

  const personalizedProducts = getPersonalizedRecommendations();

  // Check if product is Health Twin aligned
  const getProductAlignment = (product) => {
    const isPersonalized = personalizedProducts.find(p => p.id === product.id);
    if (isPersonalized) return { aligned: true, reason: isPersonalized.twinReason };
    
    // Not currently prioritized
    return { 
      aligned: false, 
      note: "This product is not currently prioritized by your Health Twin." 
    };
  };

  // Filter products
  const getFilteredProducts = () => {
    let filtered = selectedCategory === "all" ? allProducts : products[selectedCategory] || [];
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  // Cart functions
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`Added ${product.name} to cart!`);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const getTotalPoints = () => {
    return cart.reduce((sum, item) => sum + (item.loyaltyPoints * item.quantity), 0);
  };

  // Analyze Health Impact
  const analyzeHealthImpact = async (product) => {
    setSelectedProduct(product);
    setIsAnalyzing(true);
    
    try {
      const healthContext = `
User Profile:
- Age: ${user?.age || 'Not specified'}
- Gender: ${user?.gender || 'Not specified'}
- Weight: ${user?.weight || 'Not specified'} kg
- Height: ${user?.height || 'Not specified'} cm
- Medical Conditions: ${user?.medical_conditions?.join(', ') || 'None'}
- Current Medications: ${user?.medications?.join(', ') || 'None'}

Recent Health Data:
${recentMetrics.slice(0, 10).map(m => `${m.metric_type}: ${m.value} ${m.unit}`).join('\n')}

Recent Nutrition:
${foodScans.slice(0, 5).map(s => `${s.food_name}: ${s.calories} kcal`).join('\n')}
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI health advisor for AUTRYST Health Market. Analyze how this product will specifically benefit the user based on their health data.

${healthContext}

Product: ${product.name}
Description: ${product.description}
Benefits: ${product.benefits.join(', ')}

Provide detailed, personalized analysis in JSON format:
1. Compatibility score (0-100)
2. Expected timeline for results
3. Predicted health improvements
4. Potential side effects or concerns
5. Optimal usage recommendations
6. Synergies with user's current routine
7. Contraindications if any
8. Before/after predictions

Be specific, personalized, and evidence-based.`,
        response_json_schema: {
          type: "object",
          properties: {
            compatibility_score: { type: "number" },
            expected_timeline: { type: "string" },
            predicted_improvements: {
              type: "array",
              items: { type: "string" }
            },
            potential_concerns: {
              type: "array",
              items: { type: "string" }
            },
            optimal_usage: { type: "string" },
            synergies: {
              type: "array",
              items: { type: "string" }
            },
            contraindications: {
              type: "array",
              items: { type: "string" }
            },
            before_after: {
              type: "object",
              properties: {
                current_state: { type: "string" },
                predicted_state: { type: "string" }
              }
            },
            personalized_recommendation: { type: "string" }
          }
        }
      });

      setHealthImpact(result);
    } catch (error) {
      console.error("Error analyzing health impact:", error);
      toast.error("Failed to analyze health impact");
    }
    
    setIsAnalyzing(false);
  };

  // Product Card Component
  const ProductCard = ({ product, isPersonalized = false }) => {
    const alignment = getProductAlignment(product);
    const expanderId = `explainer-${product.id}`;
    const isExpanded = expandedExplainers[expanderId];

    return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col">
        <div className="relative">
          <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-7xl">
            {product.image}
          </div>
          {product.fastDelivery && (
            <Badge className="absolute top-2 right-2 bg-green-500">
              <Truck className="w-3 h-3 mr-1" />
              Fast
            </Badge>
          )}
          <div className="absolute top-2 left-2">
            <Badge className={`bg-gradient-to-r ${
              product.aiScore >= 90 ? 'from-green-500 to-emerald-600' :
              product.aiScore >= 80 ? 'from-blue-500 to-cyan-600' :
              'from-yellow-500 to-orange-600'
            }`}>
              <Sparkles className="w-3 h-3 mr-1" />
              AI: {product.aiScore}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-6 flex-1 flex flex-col">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">{product.rating}</span>
              <span className="text-xs text-gray-500">({product.reviews.toLocaleString()})</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {product.benefits.slice(0, 3).map((benefit, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {benefit}
                </Badge>
              ))}
            </div>

            {/* Health Twin relevance tag */}
            {isPersonalized && product.twinRelevance && (
              <div className="mb-3">
                <Badge className="bg-blue-100 text-blue-700 border border-blue-300 text-xs">
                  <Brain className="w-3 h-3 mr-1" />
                  {product.twinRelevance}
                </Badge>
              </div>
            )}

            {/* Twin-aligned indicator */}
            {alignment.aligned && (
              <div className="mb-3 text-xs text-gray-600 flex items-center gap-1">
                <Shield className="w-3 h-3 text-teal-600" />
                <span className="text-teal-700 font-medium">Health-Twin aligned</span>
              </div>
            )}

            {/* Safety filter for non-aligned products */}
            {!alignment.aligned && (
              <div className="mb-3 p-2 rounded bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-600">{alignment.note}</p>
              </div>
            )}

            {/* "Why AUTRYST suggested this" explainer */}
            {isPersonalized && product.twinReason && (
              <div className="mb-3">
                <button
                  onClick={() => setExpandedExplainers(prev => ({ ...prev, [expanderId]: !prev[expanderId] }))}
                  className="w-full text-left text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                >
                  <Info className="w-3 h-3" />
                  Why AUTRYST suggested this
                  {isExpanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 p-2 rounded bg-blue-50 border border-blue-100">
                        <p className="text-xs text-slate-700">{product.twinReason}</p>
                        <p className="text-xs text-slate-500 mt-1">Based on recent vitals and Health Twin state</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-600">+{product.loyaltyPoints} points</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <span className="text-2xl font-bold text-gray-900">${product.price}</span>
              {product.subscription && (
                <span className="text-xs text-gray-500 ml-1">/month</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => analyzeHealthImpact(product)}
                className="border-purple-500 text-purple-600 hover:bg-purple-50"
              >
                <Telescope className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => addToCart(product)}
                disabled={!product.inStock}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 w-full">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Health Market</h1>
              <p className="text-xs md:text-sm text-gray-500">Health-Twin–guided products, programs, and services</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 w-full md:w-auto">
            {/* Loyalty Points */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Loyalty Points</p>
                  <p className="text-lg font-bold text-gray-900">{loyaltyPoints.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Cart */}
            <Button
              onClick={() => setShowCart(!showCart)}
              className="relative bg-gradient-to-r from-purple-500 to-pink-600"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Cart ({cart.length})
              {cart.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500">
                  ${getTotalPrice()}
                </Badge>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Health Twin Context Indicator (read-only, persistent) */}
        <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-gray-900">
              🧠 Health Twin Context: Active · Personalization enabled
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="shadow-lg border-0 bg-gradient-to-r from-teal-500 to-blue-600">
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-white text-center">
                <div className="flex flex-col items-center">
                  <Shield className="w-8 h-8 mb-2" />
                  <p className="text-sm font-semibold">100% Authentic</p>
                  <p className="text-xs opacity-80">Verified Products</p>
                </div>
                <div className="flex flex-col items-center">
                  <Truck className="w-8 h-8 mb-2" />
                  <p className="text-sm font-semibold">Fast Delivery</p>
                  <p className="text-xs opacity-80">24-48 Hours</p>
                </div>
                <div className="flex flex-col items-center">
                  <Sparkles className="w-8 h-8 mb-2" />
                  <p className="text-sm font-semibold">AI Personalized</p>
                  <p className="text-xs opacity-80">Smart Recommendations</p>
                </div>
                <div className="flex flex-col items-center">
                  <Award className="w-8 h-8 mb-2" />
                  <p className="text-sm font-semibold">Earn Rewards</p>
                  <p className="text-xs opacity-80">Loyalty Points</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search */}
        <div className="flex gap-2 md:gap-4 w-full">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 md:pl-10 h-10 md:h-12 w-full"
            />
          </div>
          <Button 
            onClick={() => toast.info("Advanced filters coming soon!")}
            size="lg" 
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 flex-shrink-0"
          >
            <Filter className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>

        {/* Categories */}
        <div className="w-full overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
          <div className="flex gap-2 md:gap-3 pb-2 min-w-max">
            {categories.map(cat => (
              <motion.button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 rounded-xl transition-all flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                    : 'bg-white text-gray-700 hover:shadow-md'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <cat.icon className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-medium text-xs md:text-sm whitespace-nowrap">{cat.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* AI Personalized Recommendations */}
        {selectedCategory === "all" && personalizedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-500 to-pink-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-6 h-6" />
                  AI-Personalized for You
                </CardTitle>
                <p className="text-purple-100 text-sm">Surfaced by your Health Twin based on vitals trends and recovery patterns</p>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                  {personalizedProducts.map(product => (
                    <ProductCard key={product.id} product={product} isPersonalized={true} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Products Grid - General Health Products */}
        {selectedCategory === "all" && personalizedProducts.length > 0 && (
          <div className="mt-4 md:mt-8">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-4">General Health Products</h2>
            <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">Browse all products without Health Twin filtering</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} isPersonalized={false} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
            <motion.div
              className="absolute right-0 top-0 h-full w-full max-w-md sm:w-96 bg-white shadow-2xl overflow-hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Your Cart</h2>
                    <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-6">
                  {cart.length === 0 ? (
                    <div className="text-center py-16">
                      <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">Your cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div key={item.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                          <div className="flex items-start gap-3">
                            <div className="text-4xl">{item.image}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                              <p className="text-sm text-gray-600 mb-2">${item.price}</p>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.id, -1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.id, 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 ml-auto text-red-600"
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {cart.length > 0 && (
                  <div className="p-6 border-t border-gray-200 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold text-gray-900">${getTotalPrice()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="text-green-600">FREE</span>
                      </div>
                      <div className="flex justify-between text-sm text-purple-600">
                        <span>You'll earn:</span>
                        <span className="font-semibold">+{getTotalPoints()} points</span>
                      </div>
                    </div>
                    <div className="flex justify-between pt-4 border-t border-gray-200">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-gray-900">${getTotalPrice()}</span>
                    </div>
                    <Button
                      onClick={() => {
                        toast.success("Checkout feature coming soon! Your cart has been saved.");
                      }}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                      size="lg"
                    >
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Health Impact Analysis Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => { setSelectedProduct(null); setHealthImpact(null); }} />
            <motion.div
              className="relative w-[95%] max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto mx-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{selectedProduct.image}</div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h2>
                    <p className="text-sm text-gray-600">AI Health Impact Analysis</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(null); setHealthImpact(null); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {isAnalyzing ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : healthImpact ? (
                  <>
                    {/* Compatibility Score */}
                    <div className="text-center p-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600">
                      <p className="text-white text-sm mb-2">Compatibility Score</p>
                      <div className="text-6xl font-bold text-white">{healthImpact.compatibility_score}</div>
                      <p className="text-white/80 text-sm mt-2">Perfect match for your health profile!</p>
                    </div>

                    {/* Expected Timeline */}
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Expected Timeline</h3>
                      </div>
                      <p className="text-gray-700">{healthImpact.expected_timeline}</p>
                    </div>

                    {/* Predicted Improvements */}
                    {healthImpact.predicted_improvements?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          Predicted Benefits
                        </h3>
                        <div className="space-y-2">
                          {healthImpact.predicted_improvements.map((improvement, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                              <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <p className="text-gray-700 text-sm">{improvement}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Synergies */}
                    {healthImpact.synergies?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Layers className="w-5 h-5 text-purple-600" />
                          Works Great With
                        </h3>
                        <div className="space-y-2">
                          {healthImpact.synergies.map((synergy, i) => (
                            <div key={i} className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                              <p className="text-gray-700 text-sm">{synergy}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Before/After */}
                    {healthImpact.before_after && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                          <p className="text-xs font-semibold text-red-600 mb-2">CURRENT STATE</p>
                          <p className="text-gray-700 text-sm">{healthImpact.before_after.current_state}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                          <p className="text-xs font-semibold text-green-600 mb-2">PREDICTED STATE</p>
                          <p className="text-gray-700 text-sm">{healthImpact.before_after.predicted_state}</p>
                        </div>
                      </div>
                    )}

                    {/* Personalized Recommendation */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-gray-900">AI Recommendation</h3>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{healthImpact.personalized_recommendation}</p>
                    </div>

                    {/* Concerns */}
                    {healthImpact.potential_concerns?.length > 0 && (
                      <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          <h3 className="font-semibold text-gray-900">Things to Note</h3>
                        </div>
                        <ul className="space-y-1">
                          {healthImpact.potential_concerns.map((concern, i) => (
                            <li key={i} className="text-sm text-gray-700">• {concern}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        addToCart(selectedProduct);
                        setSelectedProduct(null);
                        setHealthImpact(null);
                      }}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                      size="lg"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart - ${selectedProduct.price}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Button
                      onClick={() => analyzeHealthImpact(selectedProduct)}
                      className="bg-gradient-to-r from-purple-500 to-pink-600"
                      size="lg"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Analyze Health Impact
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}