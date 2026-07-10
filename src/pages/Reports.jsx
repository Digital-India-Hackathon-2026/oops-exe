import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Scan,
  Upload,
  FileText,
  Brain,
  Camera,
  FileUp,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  Pill,
  Calendar,
  AlertTriangle,
  Info,
  Download,
  Mail,
  Video,
  ChevronRight,
  Send,
  Volume2,
  RefreshCw,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { useHealthTwin } from "@/components/health-twin/HealthTwinProvider";

// Mock component for 3D pill animation
const PillAnimation = () => (
  <div className="w-24 h-24 flex items-center justify-center">
    <div className="w-16 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse shadow-lg shadow-cyan-500/50"></div>
  </div>
);

export default function AIPrescriptionScanner() {
  const [activeTab, setActiveTab] = useState("scan");
  const [scanStatus, setScanStatus] = useState({ step: "idle", message: "" }); // idle, uploading, enhancing, analyzing, generating, done
  const [ocrResult, setOcrResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showExplainer, setShowExplainer] = useState(false);
  const [twinIngestionStatus, setTwinIngestionStatus] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Health Twin integration (read-only)
  const { twinState } = useHealthTwin();

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["prescriptionHistory", user?.email],
    queryFn: () => base44.entities.HealthReport.filter({ report_type: "prescription", created_by: user.email }, "-created_date", 50),
    initialData: [],
    enabled: !!user?.email,
  });

  const createReportMutation = useMutation({
    mutationFn: (data) => base44.entities.HealthReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptionHistory"] });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id) => base44.entities.HealthReport.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptionHistory"] });
      toast.success("Prescription deleted from history.");
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      startScan(file);
    }
  };

  const startScan = async (file) => {
    setOcrResult(null);
    setScanStatus({ step: "uploading", message: "Uploading your prescription..." });

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setScanStatus({ step: "enhancing", message: "Enhancing clarity & detecting text..." });

      // Schema for Gemini 1.5 Pro to extract structured data
      const prescriptionSchema = {
        type: "object",
        properties: {
          doctor_details: {
            type: "object",
            properties: {
              name: { type: "string" },
              specialization: { type: "string" },
              clinic_info: { type: "string" }
            }
          },
          patient_details: {
            type: "object",
            properties: {
              name: { type: "string" },
              age: { type: "number" },
              date: { type: "string", format: "date" }
            }
          },
          diagnosis: { type: "string" },
          medicines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                dosage: { type: "string" },
                frequency: { type: "string" },
                duration: { type: "string" },
                route: { type: "string", default: "Oral" },
                notes: { type: "string" },
                composition: { type: "string", description: "Active chemical ingredients." },
                purpose: { type: "string", description: "What this medicine is for." },
                side_effects: {
                  type: "object",
                  properties: {
                    common: { type: "array", items: { type: "string" } },
                    severe: { type: "array", items: { type: "string" } }
                  }
                },
                interactions: { type: "array", items: { type: "string" }, description: "Known drug interactions." },
                advice: { type: "string", description: "Important advice like 'take with food'." }
              },
              required: ["name", "dosage", "frequency", "duration"]
            }
          },
          pharmacy_notes: { type: "string" },
          unrecognized_text: { type: "array", items: { type: "string" }, description: "Any text that couldn't be categorized." }
        }
      };

      setScanStatus({ step: "analyzing", message: "AI is analyzing medical entities..." });
      const extractionResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: prescriptionSchema
      });

      if (extractionResult.status !== 'success') {
        throw new Error(extractionResult.details || "Failed to extract prescription data.");
      }

      setScanStatus({ step: "generating", message: "Generating health insights..." });
      const aiSummary = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this extracted prescription data, generate a simple summary and key health insights for the patient.
        Prescription: ${JSON.stringify(extractionResult.output)}
        User's known allergies: ${user?.allergies?.join(', ') || 'none'}`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_purpose: { type: "string", description: "What is this prescription generally for?" },
            key_insights: { type: "array", items: { type: "string" } },
            potential_warnings: { type: "array", items: { type: "string" }, description: "Any warnings based on common knowledge or user allergies." }
          }
        }
      });

      const finalResult = { ...extractionResult.output, ai_summary: aiSummary };
      setOcrResult(finalResult);

      await createReportMutation.mutateAsync({
        title: `Prescription from ${finalResult.doctor_details?.name || 'Scan'} on ${format(new Date(), "MMM d, yyyy")}`,
        report_type: "prescription",
        file_url,
        extracted_data: finalResult,
        ai_summary: aiSummary,
        date_of_report: finalResult.patient_details?.date || new Date().toISOString().split('T')[0],
        provider_name: finalResult.doctor_details?.name,
        created_by: user.email // Ensure the report is linked to the current user
      });

      // Health Twin ingestion status
      setTwinIngestionStatus({
        documentType: "Prescription",
        keyData: `${finalResult.medicines?.length || 0} medications`,
        status: "ingested"
      });

      setScanStatus({ step: "done", message: "Scan Complete!" });
      toast.success("Document ingested successfully!");
    } catch (error) {
      console.error("Scan failed:", error);

      if (error.message && error.message.includes("limit of integrations")) {
        toast.warning("Integration limit reached. Displaying demo results.", {
          description: "To use the live AI, please upgrade your plan.",
        });

        const mockResult = {
            doctor_details: { name: "Dr. Demo", specialization: "General Practice" },
            patient_details: { name: user?.full_name || "Demo User", date: new Date().toISOString() },
            diagnosis: "Common Cold (Demo Data)",
            medicines: [
                { name: "Paracetamol", dosage: "500mg", frequency: "Twice a day", duration: "3 days", purpose: "For fever and pain.", advice: "Take with food." },
                { name: "Cetirizine", dosage: "10mg", frequency: "Once daily", duration: "5 days", purpose: "For allergy symptoms.", advice: "May cause drowsiness." }
            ],
            ai_summary: {
                overall_purpose: "This is a mock prescription for managing common cold symptoms.",
                key_insights: ["This is sample data because the integration limit was reached.", "Consult a doctor if symptoms persist."],
                potential_warnings: ["Avoid alcohol when taking Paracetamol and Cetirizine.", "Cetirizine may cause drowsiness, avoid driving or operating heavy machinery."]
            }
        };
        
        setOcrResult(mockResult);
        setScanStatus({ step: "done", message: "Demo Scan Complete!" });

      } else {
        setScanStatus({ step: "error", message: error.message || "An unexpected error occurred." });
        toast.error("Scan failed. Please try a clearer image.");
      }
    } finally {
      setSelectedFile(null);
    }
  };
  
  const resetScanner = () => {
    setScanStatus({ step: "idle", message: "" });
    setOcrResult(null);
    setSelectedFile(null);
    setTwinIngestionStatus(null);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Text-to-speech is not supported on your browser.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Scan className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">OCR Scanner</h1>
              <p className="text-xs md:text-sm text-slate-400">Medical document ingestion for your AI Health Twin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700 hidden md:flex">
                  <Brain className="w-4 h-4 mr-2" /> Ask AUTRYST AI
                </Button>
              </DialogTrigger>
              <AIQueryDialog extractedData={ocrResult} user={user} />
            </Dialog>
          </div>
        </header>

        {/* Health Twin Context Indicator (read-only, persistent) */}
        <div className="mb-6 bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border-2 border-blue-500/50">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-blue-400" />
            <p className="text-sm font-medium text-slate-100">
              🧠 Health Twin Context: Document ingestion active
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 p-1">
            <TabsTrigger value="scan" onClick={resetScanner}>
              <RefreshCw className="w-4 h-4 mr-2" /> New Scan
            </TabsTrigger>
            <TabsTrigger value="history">
              <FileText className="w-4 h-4 mr-2" /> View History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan">
            <AnimatePresence mode="wait">
              {scanStatus.step === "idle" && <UploadSelection onFileSelect={handleFileSelect} fileInputRef={fileInputRef} />}
              {scanStatus.step !== "idle" && scanStatus.step !== "done" && <ProcessingView status={scanStatus} />}
              {scanStatus.step === "done" && ocrResult && (
                <>
                  {twinIngestionStatus && (
                    <HealthTwinUpdate 
                      status={twinIngestionStatus} 
                      showExplainer={showExplainer}
                      setShowExplainer={setShowExplainer}
                    />
                  )}
                  <ResultsView result={ocrResult} speakFn={speakText} user={user} />
                </>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="history">
            <HistoryView history={history} isLoading={historyLoading} onDelete={deleteReportMutation.mutate} />
          </TabsContent>
        </Tabs>

        {/* Safety & Ethics Footnote */}
        <div className="mt-8 text-center text-xs text-slate-500 max-w-2xl mx-auto">
          <p>Documents are processed to support health modeling and continuity of care.</p>
          <p>AUTRYST does not replace professional medical review.</p>
        </div>
      </div>
    </div>
  );
}

// Health Twin Update Panel
const HealthTwinUpdate = ({ status, showExplainer, setShowExplainer }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-6 mb-6"
  >
    <Card className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 border-blue-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-200">
          <Database className="w-5 h-5" />
          Health Twin Update
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-slate-800/60">
            <p className="text-slate-400 text-xs mb-1">Document Type</p>
            <p className="font-semibold text-white">{status.documentType}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60">
            <p className="text-slate-400 text-xs mb-1">Key Data</p>
            <p className="font-semibold text-white">{status.keyData}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60">
            <p className="text-slate-400 text-xs mb-1">Status</p>
            <Badge className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ingested
            </Badge>
          </div>
        </div>
        
        <p className="text-sm text-blue-100 italic">
          This document has been added to your health history for longitudinal analysis.
        </p>

        {/* Explainability */}
        <div>
          <button
            onClick={() => setShowExplainer(!showExplainer)}
            className="w-full text-left text-sm text-slate-300 hover:text-white flex items-center gap-2 py-2"
          >
            <Info className="w-4 h-4" />
            How AUTRYST uses this document
            {showExplainer ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
          </button>
          <AnimatePresence>
            {showExplainer && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-3 rounded-lg bg-slate-800/60 space-y-2 text-sm text-slate-300">
                  <p>• Updates medication history</p>
                  <p>• Tracks lab trends over time</p>
                  <p>• Supports AI Coach guidance</p>
                  <p>• Improves emergency readiness</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// Sub-components for better organization

const UploadSelection = ({ onFileSelect, fileInputRef }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
  >
    <Card
      onClick={() => toast.info("Camera scanning coming soon!")}
      className="bg-slate-800/50 border-slate-700 hover:border-cyan-500 transition-all duration-300 cursor-pointer p-6 flex flex-col items-center justify-center text-center"
    >
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Camera className="w-16 h-16 mb-4 text-cyan-400" />
        <h3 className="text-xl font-semibold">Scan with Camera</h3>
        <p className="text-slate-400 mt-2">Use your device's camera for a live scan. (Coming Soon)</p>
      </motion.div>
    </Card>
    <Card
      onClick={() => fileInputRef.current?.click()}
      className="bg-slate-800/50 border-slate-700 hover:border-blue-500 transition-all duration-300 cursor-pointer p-6 flex flex-col items-center justify-center text-center"
    >
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={onFileSelect} className="hidden" />
        <FileUp className="w-16 h-16 mb-4 text-blue-400" />
        <h3 className="text-xl font-semibold">Upload from Files</h3>
        <p className="text-slate-400 mt-2">Supports PDF, JPG, PNG formats.</p>
      </motion.div>
    </Card>
  </motion.div>
);

const ProcessingView = ({ status }) => {
  const steps = ["uploading", "enhancing", "analyzing", "generating"];
  const currentIndex = steps.indexOf(status.step);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-6 flex flex-col items-center justify-center text-center py-16 bg-slate-800/50 border border-slate-700 rounded-2xl"
    >
      <div className="relative w-32 h-32">
        <Loader2 className="w-32 h-32 text-cyan-500 animate-spin-slow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <PillAnimation />
        </div>
      </div>
      <h2 className="text-2xl font-bold mt-6 text-slate-200">
        {status.step === "error" ? "Scan Failed" : "AI Is Working Its Magic..."}
      </h2>
      <p className={`mt-2 ${status.step === 'error' ? 'text-red-400' : 'text-slate-400'}`}>{status.message}</p>
      
      {status.step !== 'error' && (
        <div className="w-full max-w-md mt-8">
          <div className="flex justify-between mb-1">
            {steps.map((s, i) => (
              <span key={s} className={`text-xs capitalize ${i <= currentIndex ? 'text-cyan-400' : 'text-slate-500'}`}>{s}</span>
            ))}
          </div>
          <Progress value={(currentIndex + 1) * 25} className="w-full [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-blue-500" />
        </div>
      )}
    </motion.div>
  );
};

const ResultsView = ({ result, speakFn, user }) => {
  if (!result) return null;
  const { doctor_details, patient_details, diagnosis, medicines, ai_summary } = result;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-6 space-y-6"
    >
      {/* Summary Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-cyan-400">Prescription Summary</CardTitle>
            <p className="text-slate-400">Extracted and Analyzed by AUTRYST AI</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => speakFn(ai_summary.overall_purpose)}>
            <Volume2 className="w-4 h-4 mr-2" /> Explain
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-sm">
            <div className="p-3 bg-slate-700/50 rounded-lg">
              <p className="text-slate-400">Doctor</p>
              <p className="font-semibold">{doctor_details?.name || "N/A"}</p>
            </div>
            <div className="p-3 bg-slate-700/50 rounded-lg">
              <p className="text-slate-400">Patient</p>
              <p className="font-semibold">{patient_details?.name || user?.full_name || "N/A"}</p>
            </div>
            <div className="p-3 bg-slate-700/50 rounded-lg">
              <p className="text-slate-400">Date</p>
              <p className="font-semibold">{patient_details?.date ? format(new Date(patient_details.date), "PPP") : "N/A"}</p>
            </div>
          </div>
          {diagnosis && (
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <h4 className="font-semibold text-slate-300 mb-1">Primary Diagnosis</h4>
              <p className="text-slate-200">{diagnosis}</p>
            </div>
          )}
          
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-400/30">
            <h4 className="font-semibold text-cyan-300 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4"/>AI Health Insights</h4>
            <ul className="space-y-2 text-sm list-disc list-inside">
              {ai_summary?.key_insights?.map((insight, i) => <li key={i}>{insight}</li>)}
              {ai_summary?.potential_warnings?.map((warning, i) => <li key={i} className="text-amber-400">{warning}</li>)}
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline" onClick={() => toast.info("PDF Download Coming Soon")}>
              <Download className="w-4 h-4 mr-2"/> Download PDF
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => toast.info("Email Feature Coming Soon")}>
              <Mail className="w-4 h-4 mr-2"/> Email Summary
            </Button>
            <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700">
              <Video className="w-4 h-4 mr-2"/> Consult AI Doctor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Medicines View */}
      <h3 className="text-xl font-bold text-slate-300 mt-8">Extracted Medicines ({medicines?.length || 0})</h3>
      <div className="space-y-4">
        {medicines?.map((med, i) => <MedicineCard key={i} medicine={med} />)}
      </div>
    </motion.div>
  );
};

const MedicineCard = ({ medicine }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
  >
    <Card className="bg-slate-800 border-slate-700 overflow-hidden">
      <CardHeader className="p-4 bg-slate-700/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-3">
            <Pill className="text-cyan-400"/> {medicine.name}
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300">More Info <ChevronRight className="w-4 h-4 ml-1"/></Button>
            </DialogTrigger>
            <MedicineDetailDialog medicine={medicine} />
          </Dialog>
        </div>
        <div className="flex gap-2 text-xs text-slate-400 pt-2">
          <span>{medicine.dosage}</span> •
          <span>{medicine.frequency}</span> •
          <span>for {medicine.duration}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3 text-sm">
        <div>
          <h4 className="font-semibold text-slate-400">Purpose</h4>
          <p>{medicine.purpose || "Not specified"}</p>
        </div>
        {medicine.advice && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0"/>
            <p>{medicine.advice}</p>
          </div>
        )}
        <Button variant="outline" className="w-full" onClick={() => toast.success(`Reminder set for ${medicine.name}`)}>
          <Calendar className="w-4 h-4 mr-2"/> Add Reminder
        </Button>
      </CardContent>
    </Card>
  </motion.div>
);

const MedicineDetailDialog = ({ medicine }) => (
  <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
    <DialogHeader>
      <DialogTitle className="text-2xl text-cyan-400">{medicine.name}</DialogTitle>
      <p className="text-slate-400">{medicine.purpose}</p>
    </DialogHeader>
    <ScrollArea className="max-h-[70vh] pr-4">
      <div className="space-y-4">
        <DetailSection title="Composition" content={medicine.composition} />
        <DetailSection title="Common Side Effects" items={medicine.side_effects?.common} />
        <DetailSection title="⚠️ Severe Side Effects (Seek medical help)" items={medicine.side_effects?.severe} warning />
        <DetailSection title="Drug Interactions" items={medicine.interactions} />
        {medicine.notes && <DetailSection title="Doctor's Notes" content={medicine.notes} />}
      </div>
    </ScrollArea>
  </DialogContent>
);

const DetailSection = ({ title, content, items, warning = false }) => {
  if (!content && (!items || items.length === 0)) return null;
  return (
    <div>
      <h4 className={`font-semibold mb-2 ${warning ? 'text-red-400' : 'text-slate-300'}`}>{title}</h4>
      <div className={`p-4 rounded-lg text-sm ${warning ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-800 border border-slate-700'}`}>
        {content && <p>{content}</p>}
        {items && <ul className="list-disc list-inside space-y-1">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>}
      </div>
    </div>
  );
};

const AIQueryDialog = ({ extractedData, user }) => {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuery = async () => {
    if (!query.trim()) return;
    const userQuery = query;
    const newHistory = [...history, { role: "user", content: userQuery }];
    setHistory(newHistory);
    setQuery("");
    setIsLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AUTRYST AI, a helpful medical assistant. Answer the user's question based on the following context.
        
        Prescription Context: ${JSON.stringify(extractedData)}
        
        User's Question: "${userQuery}"
        
        Your Answer:`
      });
      setHistory([...newHistory, { role: "assistant", content: response }]);
    } catch (error) {
      let fallbackResponse = "Sorry, I encountered an error. Please try again.";
      if (error.message && error.message.includes("limit")) {
        const lowerQuery = userQuery.toLowerCase();
        if (lowerQuery.includes("food") || lowerQuery.includes("eat") || lowerQuery.includes("milk")) {
          fallbackResponse = "Generally, it's best to take medications with water unless your doctor specifically advises otherwise. Some medicines should be taken with food to avoid stomach upset, while others work best on an empty stomach. Always check your prescription label or consult your pharmacist for specific guidance.";
        } else if (lowerQuery.includes("side effect") || lowerQuery.includes("reaction")) {
          fallbackResponse = "Side effects vary by medication. Common ones may include drowsiness, nausea, or headache. If you experience severe symptoms like difficulty breathing, swelling, or a rash, seek immediate medical attention. For specific concerns about your medications, please consult your doctor or pharmacist.";
        } else if (lowerQuery.includes("miss") || lowerQuery.includes("forgot") || lowerQuery.includes("skip")) {
          fallbackResponse = "If you miss a dose, take it as soon as you remember unless it's almost time for your next dose. Never double up on doses. If you're unsure, contact your pharmacist or healthcare provider for guidance specific to your medication.";
        } else {
          fallbackResponse = `Thank you for your question about "${userQuery}". While I'm in demo mode due to integration limits, I recommend consulting your pharmacist or healthcare provider for specific medical advice regarding your prescription.`;
        }
      }
      setHistory([...newHistory, { role: "assistant", content: fallbackResponse }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-2xl text-cyan-400 flex items-center gap-2">
          <Brain /> Ask AUTRYST AI About Your Prescription
        </DialogTitle>
      </DialogHeader>
      <div className="h-[60vh] flex flex-col">
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {history.map((msg, i) => (
              <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && <Avatar className="w-8 h-8"><AvatarFallback className="bg-cyan-500/20 text-cyan-400">A</AvatarFallback></Avatar>}
                <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800'}`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && <Avatar className="w-8 h-8"><AvatarFallback className="bg-slate-700">{user?.full_name?.charAt(0)}</AvatarFallback></Avatar>}
              </div>
            ))}
            {isLoading && <div className="flex justify-start"><Loader2 className="animate-spin text-cyan-400"/></div>}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="e.g., Can I take this with milk?"
            className="flex-1 bg-slate-800 border-slate-700 rounded-lg px-4"
            disabled={!extractedData}
          />
          <Button onClick={handleQuery} disabled={!query.trim() || isLoading || !extractedData}>
            <Send className="w-4 h-4"/>
          </Button>
        </div>
        {!extractedData && <p className="text-xs text-amber-400 mt-2">Scan a prescription first to enable the chat.</p>}
      </div>
    </DialogContent>
  );
};

const HistoryView = ({ history, isLoading, onDelete }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
    {isLoading ? (
      <div className="text-center p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto"/></div>
    ) : history.length === 0 ? (
      <div className="text-center py-16 bg-slate-800/50 rounded-2xl">
        <FileText className="w-16 h-16 mx-auto text-slate-500 mb-4"/>
        <h3 className="text-xl font-semibold">No History Found</h3>
        <p className="text-slate-400">Your scanned documents will appear here.</p>
      </div>
    ) : (
      <ScrollArea className="h-[75vh]">
        <div className="space-y-4 pr-4">
          {history.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold">{item.title}</h4>
                      <Badge className="bg-green-600 text-xs">
                        Ingested
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{item.report_type || 'Prescription'}</p>
                    <p className="text-sm text-slate-400">{format(new Date(item.created_date), "PPP p")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(item.file_url, '_blank')}><Eye className="w-4 h-4"/></Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}><Trash2 className="w-4 h-4"/></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    )}
  </motion.div>
);