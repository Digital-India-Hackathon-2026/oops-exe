import React, { useState, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { 
  Shield, 
  FileText, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Heart,
  Activity,
  Brain,
  Zap,
  Target,
  Bell,
  Send,
  Upload,
  Scan,
  Eye,
  Download,
  Share2,
  AlertTriangle,
  Plus,
  Award,
  Sparkles,
  TrendingDown,
  Clock,
  Phone,
  Mail,
  X,
  Star,
  ArrowRight,
  Info,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import HumanBody2D from "../components/symptom/HumanBody2D";

export default function InsuranceSummary() {
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [simulationInputs, setSimulationInputs] = useState({
    exercise_frequency: 3,
    diet_quality: 7,
    stress_level: 5,
    sleep_quality: 7
  });
  const [filterType, setFilterType] = useState("all");
  const fileInputRef = useRef(null);
  
  const queryClient = useQueryClient();

  const highlightedBodyParts = useMemo(() => {
    if (!riskAnalysis?.risk_categories) return [];
    
    const parts = new Set();
    const categories = riskAnalysis.risk_categories;

    if (categories.cardiovascular > 50) parts.add('Chest');
    if (categories.respiratory > 50) parts.add('Chest');
    if (categories.mental_health > 50) parts.add('Head');
    if (categories.chronic_disease > 50) parts.add('Abdomen');
    if (categories.accident_injury > 50) {
      parts.add('Left Arm');
      parts.add('Right Arm');
      parts.add('Left Leg');
      parts.add('Right Leg');
    }

    return Array.from(parts);
  }, [riskAnalysis]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: metrics } = useQuery({
    queryKey: ['allMetrics'],
    queryFn: () => base44.entities.HealthMetric.filter({}, '-timestamp', 200),
    initialData: [],
  });

  const { data: symptoms } = useQuery({
    queryKey: ['symptoms'],
    queryFn: () => base44.entities.Symptom.filter({}, '-created_date', 20),
    initialData: [],
  });

  const { data: emergencyContacts } = useQuery({
    queryKey: ['emergencyContacts'],
    queryFn: () => base44.entities.EmergencyContact.list(),
    initialData: [],
  });

  const { data: foodScans } = useQuery({
    queryKey: ['foodScans'],
    queryFn: () => base44.entities.FoodScan.filter({}, '-created_date', 50),
    initialData: [],
  });

  // Available Insurance Plans (Informational)
  const insurancePlans = [
    {
      id: "basic_health",
      name: "Basic Health Coverage",
      type: "Individual Health Insurance",
      provider: "Multiple Providers Available",
      coverageAmount: "₹5,00,000 - ₹10,00,000",
      premiumRange: "₹5,000 - ₹12,000/year",
      eligibility: "Age 18-65, No pre-existing conditions",
      benefits: [
        "Hospitalization expenses",
        "Pre & post hospitalization care",
        "Day care procedures",
        "Ambulance charges",
        "Annual health checkup"
      ],
      idealFor: ["Young professionals", "Individuals with good health"],
      color: "from-blue-500 to-blue-600",
      recommended: false,
      aiScore: 72,
      riskAlignment: "Low to moderate risk profiles"
    },
    {
      id: "comprehensive_health",
      name: "Comprehensive Health Plan",
      type: "Individual/Family Health Insurance",
      provider: "Multiple Providers Available",
      coverageAmount: "₹10,00,000 - ₹25,00,000",
      premiumRange: "₹15,000 - ₹30,000/year",
      eligibility: "Age 18-70, Some pre-existing conditions covered",
      benefits: [
        "All basic benefits",
        "Critical illness coverage",
        "Maternity benefits",
        "Dental & optical care",
        "Mental health support",
        "Alternative treatments (Ayurveda, Homeopathy)",
        "No claim bonus",
        "Worldwide emergency coverage"
      ],
      idealFor: ["Families", "Individuals with moderate health concerns", "Age 30-50"],
      color: "from-teal-500 to-teal-600",
      recommended: true,
      aiScore: 94,
      riskAlignment: "Moderate to high risk profiles with comprehensive needs"
    },
    {
      id: "senior_citizen",
      name: "Senior Citizen Health Plan",
      type: "Senior Citizen Insurance",
      provider: "Multiple Providers Available",
      coverageAmount: "₹5,00,000 - ₹15,00,000",
      premiumRange: "₹20,000 - ₹50,000/year",
      eligibility: "Age 60+, Pre-existing conditions covered",
      benefits: [
        "Pre-existing disease coverage",
        "Domiciliary hospitalization",
        "AYUSH treatment",
        "Health checkups",
        "No medical tests required (up to certain age)",
        "Lifelong renewability",
        "Restoration benefits"
      ],
      idealFor: ["Senior citizens", "Individuals with chronic conditions"],
      color: "from-purple-500 to-purple-600",
      recommended: false,
      aiScore: 85,
      riskAlignment: "High risk profiles, age-related health concerns"
    },
    {
      id: "critical_illness",
      name: "Critical Illness Coverage",
      type: "Critical Illness Insurance",
      provider: "Multiple Providers Available",
      coverageAmount: "₹10,00,000 - ₹50,00,000",
      premiumRange: "₹8,000 - ₹25,000/year",
      eligibility: "Age 18-65, Medical screening required",
      benefits: [
        "Lump sum payout on diagnosis",
        "Covers major critical illnesses (cancer, heart attack, stroke, etc.)",
        "No restrictions on fund usage",
        "Premium waiver on claim",
        "Survival period: 30 days"
      ],
      idealFor: ["High-risk individuals", "Family history of critical illness", "Income protection"],
      color: "from-red-500 to-orange-600",
      recommended: false,
      aiScore: 78,
      riskAlignment: "High genetic or lifestyle risk factors"
    },
    {
      id: "personal_accident",
      name: "Personal Accident Insurance",
      type: "Accident Coverage",
      provider: "Multiple Providers Available",
      coverageAmount: "₹5,00,000 - ₹1,00,00,000",
      premiumRange: "₹300 - ₹5,000/year",
      eligibility: "Age 5-70, No medical tests required",
      benefits: [
        "Accidental death coverage",
        "Permanent total/partial disability",
        "Temporary total disability",
        "Medical expenses due to accident",
        "Child education benefit",
        "Worldwide coverage"
      ],
      idealFor: ["All age groups", "Active lifestyle", "Travel frequently"],
      color: "from-orange-500 to-yellow-600",
      recommended: false,
      aiScore: 68,
      riskAlignment: "Active individuals, accident-prone lifestyles"
    }
  ];

  // Analyze Health Risks
  const analyzeHealthRisks = async () => {
    setIsAnalyzing(true);
    
    try {
      const healthContext = `
User Profile:
- Age: ${user?.age || 'Not specified'}
- Gender: ${user?.gender || 'Not specified'}
- Weight: ${user?.weight || 'Not specified'} kg
- Height: ${user?.height || 'Not specified'} cm
- BMI: ${user?.weight && user?.height ? (user.weight / ((user.height/100) ** 2)).toFixed(1) : 'N/A'}
- Medical Conditions: ${user?.medical_conditions?.join(', ') || 'None'}
- Allergies: ${user?.allergies?.join(', ') || 'None'}
- Current Medications: ${user?.medications?.join(', ') || 'None'}

Recent Health Metrics (Last 30 days):
${metrics.slice(0, 100).map(m => `${m.metric_type}: ${m.value} ${m.unit} (${new Date(m.timestamp).toLocaleDateString()})`).join('\n')}

Recent Symptoms:
${symptoms.map(s => `${s.description} (${s.severity}, duration: ${s.duration})`).join('\n')}

Nutrition History:
Total food scans: ${foodScans.length}
Average daily calories: ${foodScans.length > 0 ? (foodScans.reduce((sum, s) => sum + s.calories, 0) / foodScans.length).toFixed(0) : 'N/A'} kcal
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI Insurance Risk Analyst for AUTRYST. Analyze this comprehensive health data and provide detailed risk assessment in JSON format for insurance purposes.

${healthContext}

Provide complete risk analysis with:

1. Overall Health Risk Score (0-100, where 0 is lowest risk)
2. Individual Risk Categories with percentages:
   - Cardiovascular disease risk
   - Diabetes risk
   - Respiratory issues risk
   - Mental health risk
   - Accident/injury risk
   - Chronic disease risk
3. Risk Factors Contributing to High Risk (if any)
4. Protective Factors Reducing Risk
5. Recommended Insurance Coverage Amount (in INR)
6. Premium Adjustment Factors (lifestyle, preventive care, etc.)
7. Personalized Insurance Recommendations with specific plan types
8. Preventive Measures to Reduce Risk
9. Future Risk Projections (1 year, 5 years)
10. Emergency Preparedness Score

Be specific, data-driven, and insurance-focused. Consider Indian insurance market standards.`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_risk_score: { type: "number" },
            risk_level: { type: "string" },
            risk_categories: {
              type: "object",
              properties: {
                cardiovascular: { type: "number" },
                diabetes: { type: "number" },
                respiratory: { type: "number" },
                mental_health: { type: "number" },
                accident_injury: { type: "number" },
                chronic_disease: { type: "number" }
              }
            },
            risk_factors: {
              type: "array",
              items: { type: "string" }
            },
            protective_factors: {
              type: "array",
              items: { type: "string" }
            },
            recommended_coverage: { type: "number" },
            premium_factors: {
              type: "object",
              properties: {
                lifestyle_score: { type: "number" },
                preventive_care_score: { type: "number" },
                age_factor: { type: "string" },
                health_maintenance: { type: "string" }
              }
            },
            insurance_recommendations: {
              type: "array",
              items: { type: "string" }
            },
            preventive_measures: {
              type: "array",
              items: { type: "string" }
            },
            future_projections: {
              type: "object",
              properties: {
                one_year: { type: "string" },
                five_years: { type: "string" }
              }
            },
            emergency_preparedness: { type: "number" },
            personalized_summary: { type: "string" }
          }
        }
      });

      setRiskAnalysis(result);
      toast.success("Risk analysis complete!");

    } catch (error) {
      console.error("Error analyzing health risks:", error);
      toast.error("Failed to analyze health risks. Please try again.");
    }
    
    setIsAnalyzing(false);
  };

  // Simulate Lifestyle Changes
  const simulateLifestyleImpact = async () => {
    setIsAnalyzing(true);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI Risk Analyst. The user wants to see how their insurance risk would change with these lifestyle improvements:

Current Risk Score: ${riskAnalysis?.overall_risk_score || 50}

Simulated Changes:
- Exercise: ${simulationInputs.exercise_frequency} days/week
- Diet Quality: ${simulationInputs.diet_quality}/10
- Stress Management: ${10 - simulationInputs.stress_level}/10
- Sleep Quality: ${simulationInputs.sleep_quality}/10

Predict the new risk score and potential savings on insurance premiums in JSON format.`,
        response_json_schema: {
          type: "object",
          properties: {
            new_risk_score: { type: "number" },
            risk_reduction: { type: "number" },
            estimated_premium_savings: { type: "number" },
            timeframe: { type: "string" },
            key_improvements: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      toast.success(`Potential risk reduction: ${result.risk_reduction}%! Estimated premium savings: ₹${result.estimated_premium_savings}/year`);

    } catch (error) {
      console.error("Error simulating lifestyle impact:", error);
    }
    
    setIsAnalyzing(false);
  };

  // Send Emergency Alerts via SMS APIs
  const sendEmergencyAlert = async () => {
    if (emergencyContacts.length === 0) {
      toast.error("No emergency contacts found. Please add contacts first.");
      return;
    }

    setIsSendingAlert(true);
    
    try {
      const userLocation = "Location tracking not enabled"; // In production, use geolocation API
      
      const alertMessage = `ALERT: ${user?.full_name || 'User'} has a health risk of ${riskAnalysis?.overall_risk_score || 'N/A'}% based on latest data. Immediate attention may be required. Check their Health Twin for details. ${userLocation}`;

      // Send via email (base44 built-in)
      let successCount = 0;
      for (const contact of emergencyContacts.sort((a, b) => a.priority - b.priority)) {
        if (contact.email) {
          try {
            await base44.integrations.Core.SendEmail({
              to: contact.email,
              subject: `🚨 Health Alert - ${user?.full_name || 'User'}`,
              body: alertMessage
            });
            successCount++;
          } catch (err) {
            console.error(`Failed to send to ${contact.email}:`, err);
          }
        }
        
        // Note: SMS APIs (Fast2SMS, MSG91) would require backend integration with API keys
        // For now, using email as the primary alert method
      }

      if (successCount > 0) {
        toast.success(`Emergency alerts sent to ${successCount} contact(s)!`);
      } else {
        toast.error("Failed to send emergency alerts.");
      }

    } catch (error) {
      console.error("Error sending emergency alerts:", error);
      toast.error("Failed to send emergency alerts.");
    }
    
    setIsSendingAlert(false);
    setShowEmergencyAlert(false);
  };

  // OCR Document Scanning with New API
  const handleDocumentSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedDocument(file);
      setOcrResult(null);
    }
  };

  const scanInsuranceDocument = async () => {
    if (!selectedDocument) return;

    setIsScanning(true);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedDocument });
      
      // Using base44's OCR integration with new API key
      const ocrData = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            policy_number: { type: "string" },
            policy_holder: { type: "string" },
            insurance_provider: { type: "string" },
            coverage_amount: { type: "number" },
            premium_amount: { type: "number" },
            start_date: { type: "string" },
            end_date: { type: "string" },
            covered_benefits: { type: "array", items: { type: "string" } },
            exclusions: { type: "array", items: { type: "string" } }
          }
        }
      });

      if (ocrData.status === "success") {
        setOcrResult(ocrData.output);
        toast.success("Document scanned successfully!");
      } else {
        toast.error("Failed to extract data from document.");
      }

    } catch (error) {
      console.error("Error scanning document:", error);
      toast.error("Failed to scan document. Please try again.");
    }
    
    setIsScanning(false);
  };

  // Get risk color
  const getRiskColor = (score) => {
    if (score < 30) return { bg: "from-green-500 to-green-600", text: "text-green-700", badge: "bg-green-50 text-green-700 border-green-200", label: "Low Risk" };
    if (score < 60) return { bg: "from-yellow-500 to-yellow-600", text: "text-yellow-700", badge: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "Moderate Risk" };
    return { bg: "from-red-500 to-red-600", text: "text-red-700", badge: "bg-red-50 text-red-700 border-red-200", label: "High Risk" };
  };

  // Filter plans based on selection
  const filteredPlans = insurancePlans.filter(plan => {
    if (filterType === "all") return true;
    if (filterType === "recommended") return plan.recommended;
    return plan.type.toLowerCase().includes(filterType.toLowerCase());
  });

  return (
    <div className="p-3 md:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-teal-500/50">
              <Shield className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Insurance Summary</h1>
              <p className="text-xs md:text-sm text-gray-600">AI-powered risk assessment & coverage insights</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={analyzeHealthRisks}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Skeleton className="w-5 h-5 mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze Health Risks
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-900 font-medium">
                    <strong>Informational Dashboard:</strong> This page provides AI-powered insights on insurance options suitable for your health profile. 
                    For actual insurance purchase or policy management, please contact insurance providers directly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left: Risk Analysis & Health Twin */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Health Risk Assessment */}
            {riskAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-6 h-6 text-teal-600" />
                        <span>Health Risk Assessment</span>
                      </div>
                      <Badge className={`${getRiskColor(riskAnalysis.overall_risk_score).badge} border`}>
                        {getRiskColor(riskAnalysis.overall_risk_score).label}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Overall Risk Score */}
                    <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100">
                      <p className="text-sm text-gray-600 mb-3">Overall Health Risk Score</p>
                      <div className="relative inline-block">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke={riskAnalysis.overall_risk_score < 30 ? '#10b981' : riskAnalysis.overall_risk_score < 60 ? '#f59e0b' : '#ef4444'}
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${(riskAnalysis.overall_risk_score / 100) * 351.86} 351.86`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div>
                            <p className="text-4xl font-bold text-gray-900">{riskAnalysis.overall_risk_score}</p>
                            <p className="text-xs text-gray-500">/ 100</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 mt-4 max-w-md mx-auto">{riskAnalysis.personalized_summary}</p>
                    </div>

                    {/* Risk Categories */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Risk Categories</h4>
                      <div className="space-y-3">
                        {Object.entries(riskAnalysis.risk_categories || {}).map(([category, value]) => {
                          const colors = getRiskColor(value);
                          return (
                            <div key={category} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {category.replace(/_/g, ' ')}
                                </span>
                                <Badge className={colors.badge}>
                                  {value}%
                                </Badge>
                              </div>
                              <Progress value={value} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Risk & Protective Factors */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <h4 className="font-semibold text-red-900">Risk Factors</h4>
                        </div>
                        <ul className="space-y-2">
                          {riskAnalysis.risk_factors?.slice(0, 4).map((factor, i) => (
                            <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-green-900">Protective Factors</h4>
                        </div>
                        <ul className="space-y-2">
                          {riskAnalysis.protective_factors?.slice(0, 4).map((factor, i) => (
                            <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Insurance Recommendations */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-100">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-teal-600" />
                        <h4 className="font-semibold text-gray-900">AI Insurance Recommendations</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-white/80">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-teal-600" />
                            <p className="text-sm font-semibold text-gray-900">Recommended Coverage Amount</p>
                          </div>
                          <p className="text-3xl font-bold text-teal-600">
                            ₹{(riskAnalysis.recommended_coverage / 100000).toFixed(1)}L
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Based on your health profile and risk assessment</p>
                        </div>
                        <div className="space-y-2">
                          {riskAnalysis.insurance_recommendations?.slice(0, 3).map((rec, i) => (
                            <div key={i} className="p-3 rounded-lg bg-white/60">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-gray-700">{rec}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Health Twin Visualization */}
            {riskAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="shadow-xl border-0 bg-black/40 backdrop-blur-md border-blue-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-400" />
                      Health Twin - Risk Visualization
                    </CardTitle>
                    <p className="text-blue-200 text-sm">Interactive 2D body showing risk areas</p>
                  </CardHeader>
                  <CardContent className="h-[450px] flex items-center justify-center">
                    <HumanBody2D 
                      highlightedParts={highlightedBodyParts}
                      onPartClick={(part) => toast.info(`Risk analysis for: ${part}`)}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Available Insurance Plans */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <CardTitle>Available Insurance Plans</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setFilterType("all")}
                        className={filterType === "all" ? "bg-teal-600 hover:bg-teal-700 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}
                      >
                        All Plans
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setFilterType("recommended")}
                        className={filterType === "recommended" ? "bg-teal-600 hover:bg-teal-700 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Recommended
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">AI-matched plans based on your risk profile (Informational only)</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredPlans.map((plan) => (
                      <motion.div
                        key={plan.id}
                        whileHover={{ y: -2 }}
                        className={`p-6 rounded-2xl border-2 ${
                          plan.recommended 
                            ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-blue-50 shadow-lg' 
                            : 'border-gray-200 bg-white hover:shadow-md'
                        } transition-all duration-300 cursor-pointer`}
                        onClick={() => setSelectedPlan(plan)}
                      >
                        {plan.recommended && (
                          <Badge className="mb-3 bg-teal-500">
                            <Star className="w-3 h-3 mr-1" />
                            Best Match for Your Profile
                          </Badge>
                        )}
                        
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-3 shadow-lg`}>
                              <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{plan.type}</p>
                            <Badge variant="outline" className="text-xs">
                              {plan.provider}
                            </Badge>
                          </div>
                          
                          {riskAnalysis && (
                            <div className="text-right">
                              <p className="text-xs text-gray-600 mb-1">AI Match Score</p>
                              <div className="flex items-center gap-2">
                                <Progress value={plan.aiScore} className="h-2 w-20" />
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                  {plan.aiScore}%
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                            <p className="text-xs text-blue-600 mb-1">Coverage Amount</p>
                            <p className="font-bold text-blue-900">{plan.coverageAmount}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                            <p className="text-xs text-green-600 mb-1">Premium Range</p>
                            <p className="font-bold text-green-900">{plan.premiumRange}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Eligibility:</p>
                          <p className="text-sm text-gray-600">{plan.eligibility}</p>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Key Benefits:</p>
                          <ScrollArea className="h-32">
                            <ul className="space-y-1 pr-2">
                              {plan.benefits.map((benefit, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </ScrollArea>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Ideal For:</p>
                          <div className="flex flex-wrap gap-2">
                            {plan.idealFor.map((group, i) => (
                              <Badge key={i} variant="outline" className="bg-gray-50">
                                {group}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 italic">{plan.riskAlignment}</p>
                            <Button variant="outline" size="sm">
                              View Details
                              <ExternalLink className="w-3 h-3 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Lifestyle Impact Simulator */}
            {riskAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      Lifestyle Impact Simulator
                    </CardTitle>
                    <p className="text-sm text-gray-600">See how lifestyle changes affect your risk & insurance premiums</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Exercise Frequency (days/week)</Label>
                        <Slider
                          value={[simulationInputs.exercise_frequency]}
                          onValueChange={(v) => setSimulationInputs({...simulationInputs, exercise_frequency: v[0]})}
                          min={0}
                          max={7}
                          step={1}
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">{simulationInputs.exercise_frequency} days</p>
                      </div>
                      <div>
                        <Label>Diet Quality (1-10)</Label>
                        <Slider
                          value={[simulationInputs.diet_quality]}
                          onValueChange={(v) => setSimulationInputs({...simulationInputs, diet_quality: v[0]})}
                          min={1}
                          max={10}
                          step={1}
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">{simulationInputs.diet_quality}/10</p>
                      </div>
                      <div>
                        <Label>Stress Level (1-10)</Label>
                        <Slider
                          value={[simulationInputs.stress_level]}
                          onValueChange={(v) => setSimulationInputs({...simulationInputs, stress_level: v[0]})}
                          min={1}
                          max={10}
                          step={1}
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">{simulationInputs.stress_level}/10</p>
                      </div>
                      <div>
                        <Label>Sleep Quality (1-10)</Label>
                        <Slider
                          value={[simulationInputs.sleep_quality]}
                          onValueChange={(v) => setSimulationInputs({...simulationInputs, sleep_quality: v[0]})}
                          min={1}
                          max={10}
                          step={1}
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">{simulationInputs.sleep_quality}/10</p>
                      </div>
                    </div>
                    <Button
                      onClick={simulateLifestyleImpact}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Simulate Impact on Premiums
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Document Scanner */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="w-5 h-5 text-blue-600" />
                    Scan Insurance Document
                  </CardTitle>
                  <p className="text-xs text-gray-500">OCR-powered document analysis</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleDocumentSelect}
                    className="hidden"
                  />
                  
                  {!selectedDocument ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">Upload policy document</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, PNG, or JPEG</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <p className="text-sm font-medium text-gray-900 flex-1 truncate">
                            {selectedDocument.name}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDocument(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <Button
                        onClick={scanInsuranceDocument}
                        disabled={isScanning}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                      >
                        {isScanning ? (
                          <>
                            <Skeleton className="w-4 h-4 mr-2" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Scan className="w-4 h-4 mr-2" />
                            Scan Document
                          </>
                        )}
                      </Button>

                      {ocrResult && (
                        <div className="p-4 rounded-lg bg-green-50 border border-green-100 space-y-2">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="font-semibold text-green-900">Document Scanned</p>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Policy:</span> {ocrResult.policy_number}</p>
                            <p><span className="font-medium">Provider:</span> {ocrResult.insurance_provider}</p>
                            <p><span className="font-medium">Coverage:</span> ₹{ocrResult.coverage_amount?.toLocaleString()}</p>
                            <p><span className="font-medium">Premium:</span> ₹{ocrResult.premium_amount?.toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Emergency Alert Button */}
            {riskAnalysis && riskAnalysis.overall_risk_score >= 60 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="shadow-xl border-0 bg-gradient-to-br from-red-50 to-orange-50">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-xl">
                        <Bell className="w-8 h-8 text-white animate-pulse" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">High Risk Detected</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Your risk score indicates you should notify your emergency contacts
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowEmergencyAlert(true)}
                      disabled={emergencyContacts.length === 0}
                      className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Emergency Alert
                    </Button>
                    {emergencyContacts.length === 0 && (
                      <p className="text-xs text-red-600 mt-2 text-center">
                        No emergency contacts found. Add contacts in Emergency page.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Preventive Measures */}
            {riskAnalysis && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="shadow-xl border-0 bg-gradient-to-br from-green-50 to-teal-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-green-600" />
                      Preventive Measures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2 pr-4">
                        {riskAnalysis.preventive_measures?.map((measure, i) => (
                          <div key={i} className="p-3 rounded-lg bg-white/80 border border-green-100">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-700">{measure}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button size="sm" className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Download Risk Report
                  </Button>
                  <Button size="sm" className="w-full justify-start bg-green-600 hover:bg-green-700 text-white">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share with Doctor
                  </Button>
                  <Button size="sm" className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white">
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Insurance Agent
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Emergency Alert Modal */}
      <AnimatePresence>
        {showEmergencyAlert && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-xl">
                  <Bell className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Send Emergency Alert?</h3>
                <p className="text-sm text-gray-600">
                  This will notify all emergency contacts about your health risk status
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm font-medium text-red-900 mb-2">Alert will be sent to:</p>
                  <ul className="space-y-1">
                    {emergencyContacts.slice(0, 3).map((contact) => (
                      <li key={contact.id} className="text-sm text-red-700 flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {contact.name} ({contact.email})
                      </li>
                    ))}
                    {emergencyContacts.length > 3 && (
                      <li className="text-xs text-red-600">
                        +{emergencyContacts.length - 3} more contacts
                      </li>
                    )}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Message will include:</p>
                  <ul className="space-y-1 text-xs text-gray-700">
                    <li>• Your health risk score: {riskAnalysis?.overall_risk_score}/100</li>
                    <li>• Key risk factors</li>
                    <li>• Emergency contact information</li>
                    <li>• Health Twin access (if authorized)</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEmergencyAlert(false)}
                  className="flex-1"
                  disabled={isSendingAlert}
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendEmergencyAlert}
                  disabled={isSendingAlert}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                >
                  {isSendingAlert ? (
                    <>
                      <Skeleton className="w-4 h-4 mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Alert
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}