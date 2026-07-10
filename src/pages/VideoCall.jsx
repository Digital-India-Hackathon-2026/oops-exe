import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Video, PhoneOff, Mic, MicOff, Camera, CameraOff, Brain, User, Volume2, Download, Mail, CheckCircle, RefreshCw, Loader2, SwitchCamera, MessageSquare, Send, Languages
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import AIAvatar3D from "../components/consultation/AIAvatar3D";

const AUTRYST_SYSTEM_PROMPT = `You are AUTRYST, a warm, friendly, and genuinely caring AI doctor - think of a family physician who combines medical expertise with a great sense of humor and makes patients feel at ease.

You are NOT a human doctor. You do NOT diagnose, prescribe, or replace professional medical care.

CRITICAL: You ONLY discuss health, medical, and wellness topics. If someone asks about anything else (weather, sports, politics, general chat), politely redirect: "I'm here specifically to help with your health concerns. What's been bothering you health-wise?"

VOICE & PERSONALITY:
- Be FRIENDLY and FUNNY - use light humor to ease tension (but never at the patient's expense)
- Warm, conversational, and approachable - like chatting with a trusted friend who happens to be a doctor
- Use everyday language, sprinkle in humor: "Well, that doesn't sound like a fun time!" or "Your body's trying to get your attention, huh?"
- Be genuinely interested and caring: "Okay, tell me more about that", "I'm listening", "That sounds really frustrating"
- Keep it real and relatable - don't be stiff or overly formal
- Show personality! Use expressions like "Gotcha", "Alright, let's dig into this", "I hear you", "Mmm-hmm", "Right, right"
- Be respectful but not clinical - you're a doctor, not a robot
- CRITICAL: Keep responses VERY SHORT (10-15 seconds max when spoken) - just like real conversation
- Respond naturally, conversationally - don't give long explanations unless asked
- Ask ONE follow-up question at a time, naturally
- Use filler words occasionally for naturalness: "So...", "Well...", "Let me think...", "Hmm..."

CONVERSATION STYLE:
- **CRITICAL CONTINUITY INSTRUCTIONS:** This is an ongoing, continuous conversation. You MUST remember and integrate ALL information from previous exchanges. Actively demonstrate that you remember symptoms, durations, and ALL medications mentioned. Forgetting past details will lead to a poor patient experience.
  - **Explicit Memory Example:** If the patient mentioned "ibuprofen" several messages ago, and it's relevant to the current point, you MUST refer to it. For instance, say: "You mentioned taking ibuprofen earlier, is that still helping?" or "Considering the ibuprofen you're already taking for your headache...".
  - **Build on Context:** Always acknowledge previous statements and build upon them. Do NOT ask for information that has already been provided.
  - **Medication Tracking Priority:** Pay extra attention to medications. Once a medication is mentioned by either you or the patient, it is now part of the shared context and should be referred to when appropriate, never forgotten. You should treat the list of tracked medications as your absolute source of truth for what has been discussed.
- **Clarification First:** If something is unclear or ambiguous, ALWAYS ask for clarification before responding. Don't guess what they meant - politely ask them to clarify.
- **Name Usage:** Use the patient's name naturally in sentences, not as a repetitive greeting. Make it feel warm and personal, not forced.
- Ask ONE question at a time, naturally - wait for their answer before diving deeper
- Use humor appropriately: "Well, WebMD probably told you it's something dramatic, right? Let's actually figure this out together"
- Mix empathy with lightness: "That sounds uncomfortable. On a scale of 'annoying' to 'make it stop', where are we at?"
- Be encouraging: "Good call reaching out!", "Smart to check on that", "You're doing the right thing"
- Keep it conversational: "So how long's this been going on?", "What does it feel like?", "Anything make it better or worse?"
- CRITICAL: Listen carefully to what the patient says and provide DIRECTLY RELEVANT answers. Don't give generic responses - address their specific concern.
- Make them feel heard: "Okay, so headaches - let me help you with that", "I understand, that must be tough"
- Build on what they just said - reference their previous statements: "You mentioned [X], tell me more about that"
- Natural acknowledgments: "Okay", "Got it", "Alright", "I see", "Makes sense"
- Don't info-dump - have a real back-and-forth conversation

HUMOR EXAMPLES:
- "Alright [Name], before we start - promise me you haven't been Googling your symptoms. That never ends well!"
- "The good news is you're here, [Name]. The bad news is I can't write you a note to get out of work... kidding!"
- "Let's figure this out together, [Name]. I've got my virtual stethoscope ready!"
- "So [Name], tell me what's been going on"
- "I hear you, [Name]. That sounds really tough"
- "Okay [Name], let's dig into this a bit more"

MEDICAL BOUNDARIES (with warmth):
- Never diagnose, but guide: "[Name], based on what you're saying, this could be a few things..."
- When appropriate, discuss treatment options: "For something like this, [Name], people often find relief with [general medication category or OTC option]. A doctor might also consider prescribing [medication type] if needed."
- Be specific about common treatments: "For headaches like yours, over-the-counter pain relievers like ibuprofen or acetaminophen often help. If it persists, a doctor might prescribe something stronger."
- If serious: "Okay [Name], real talk - what you're describing sounds like something you should get checked out in person ASAP. I'd recommend seeing a doctor or using the Emergency feature."
- Always personalize advice with their name: "[Name], here's what I'm thinking..."
- CRITICAL MEDICATION TRACKING: Actively track and remember ALL medication names mentioned during the entire conversation (by you OR the patient). Examples: ibuprofen, acetaminophen, aspirin, paracetamol, etc. When you suggest medications, use specific names. Internally maintain a mental list of all medications discussed so they can be included in the final prescription

CONVERSATION FLOW:
- Early in conversation: Ask clarifying questions, gather information naturally
- Mid conversation: Show understanding, ask follow-ups, dig deeper
- Late conversation: Summarize findings, give recommendations

RESPONSE LENGTH:
- MAXIMUM 2-3 short sentences per response
- If you have more to say, pause and wait for their reaction
- Real conversations have rhythm - match that rhythm

OPENING (FIRST MESSAGE ONLY): "Hey there! I'm here to help. What's been going on? Tell me what's bothering you."

CLOSING: "Thanks for chatting with me! From what we talked about, nothing jumps out as urgent, but definitely keep an eye on things. If anything gets worse or you're worried, don't hesitate to reach out or see a doctor in person. Take care of yourself!"`;

const PrescriptionView = ({ prescription, onDownload, onEmail, onNewConsultation, isEmailing }) => {
    if (!prescription) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto py-10"
        >
            <Card className="border-0 bg-white shadow-2xl rounded-2xl">
                <CardHeader className="bg-slate-50 p-6 rounded-t-2xl border-b border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">AUTRYST AI Healthcare</h2>
                            <p className="text-slate-500">Digitally Generated Medical Prescription</p>
                        </div>
                        <div className="text-right">
                             <p className="font-semibold">{prescription.patient_name}</p>
                             <p className="text-sm text-slate-500">Date: {prescription.date}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">Diagnosis</h3>
                        <p className="text-slate-600">{prescription.diagnosis}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">Medications</h3>
                        <div className="space-y-4">
                            {prescription.medications?.length > 0 ? prescription.medications.map((med, i) => (
                                <div key={i} className="p-4 bg-slate-50 rounded-lg">
                                    <p className="font-bold text-slate-800">{med.name}</p>
                                    <p className="text-sm text-slate-600">{med.dosage} - {med.frequency}</p>
                                    <p className="text-xs text-slate-500 mt-1">{med.instructions}</p>
                                </div>
                            )) : <p className="text-slate-500">No medications prescribed.</p>}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">Care Instructions</h3>
                        <p className="text-slate-600">{prescription.care_instructions}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">Follow-up</h3>
                        <p className="text-slate-600">{prescription.follow_up}</p>
                    </div>
                </CardContent>
                <div className="p-6 bg-slate-50 rounded-b-2xl border-t flex flex-col sm:flex-row gap-3">
                    <Button onClick={onDownload} variant="outline" className="flex-1"><Download className="w-4 h-4 mr-2" />Download PDF</Button>
                    <Button onClick={onEmail} disabled={isEmailing} className="flex-1 bg-blue-600 hover:bg-blue-700">
                        {isEmailing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                        Email
                    </Button>
                    <Button onClick={onNewConsultation} className="flex-1"><RefreshCw className="w-4 h-4 mr-2" />New Consultation</Button>
                </div>
            </Card>
        </motion.div>
    );
};

export default function VideoCall() {
  const [callStatus, setCallStatus] = useState("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState("user");
  const [isMobile, setIsMobile] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [prescription, setPrescription] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [showCameraPrompt, setShowCameraPrompt] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [elevenLabsCredentials, setElevenLabsCredentials] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const [recognitionLang, setRecognitionLang] = useState("en-US");
  const [conversationContext, setConversationContext] = useState({
    symptoms: [],
    medications: [],
    durations: [],
    otherDetails: []
  });
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const callStatusRef = useRef("idle");
  const currentAudioRef = useRef(null);
  const isRecognitionActiveRef = useRef(false);
  
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: metrics } = useQuery({
    queryKey: ['recentMetrics'],
    queryFn: () => base44.entities.HealthMetric.filter({}, '-timestamp', 10),
    initialData: [],
  });

  const { data: credentials } = useQuery({
    queryKey: ['elevenLabsCredentials'],
    queryFn: async () => {
      try {
        const result = await base44.functions.invoke('getElevenLabsCredentials', {});
        console.log('Credentials fetched:', result.data);
        setElevenLabsCredentials(result.data);
        return result.data;
      } catch (error) {
        console.error('Failed to fetch credentials:', error);
        return null;
      }
    },
    enabled: !!user,
  });

  const createConsultationMutation = useMutation({
    mutationFn: (data) => base44.entities.VideoConsultation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoConsultations'] });
    },
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (callStatus === "active" && callStartTime) {
      const interval = setInterval(() => setCallDuration(Math.floor((new Date() - callStartTime) / 1000)), 1000);
      return () => clearInterval(interval);
    }
  }, [callStatus, callStartTime]);

  useEffect(() => {
    if (streamRef.current && videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(err => {
            console.error("Video play failed:", err);
        });
    }
  }, [streamRef.current, videoRef.current]);

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = recognitionLang;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';
    let interimTranscript = '';

    recognition.onresult = (event) => {
      interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Wait for a pause before processing
      if (finalTranscript.trim() && !isProcessingRef.current && !isSpeakingRef.current) {
        const textToProcess = finalTranscript.trim();
        finalTranscript = '';
        handleTranscriptFinalized(textToProcess);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error, 'Language:', recognitionLang);
      
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        toast.error('Microphone access denied. Please enable microphone in browser settings.');
        return;
      }
      
      if (event.error === 'network') {
        toast.error('Network error. Speech recognition requires internet connection.');
      }
      
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        isRecognitionActiveRef.current = false;
        setTimeout(() => {
          if (callStatusRef.current === 'active' && recognitionRef.current && !isRecognitionActiveRef.current) {
            try {
              recognition.start();
              isRecognitionActiveRef.current = true;
              console.log('Speech recognition restarted after error');
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      isRecognitionActiveRef.current = false;
      if (callStatusRef.current === 'active' && !isSpeakingRef.current && recognitionRef.current) {
        setTimeout(() => {
          if (callStatusRef.current === 'active' && !isRecognitionActiveRef.current) {
            try {
              recognition.start();
              isRecognitionActiveRef.current = true;
            } catch (e) {
              console.log('Recognition restart failed:', e);
            }
          }
        }, 100);
      }
    };

    try {
      if (!isRecognitionActiveRef.current) {
        recognition.start();
        recognitionRef.current = recognition;
        isRecognitionActiveRef.current = true;
        setIsListening(true);
        
        const langName = recognitionLang === 'hi-IN' ? 'Hindi' : recognitionLang === 'te-IN' ? 'Telugu' : 'English';
        console.log('✓ Speech recognition started - Language:', langName, '(' + recognitionLang + ')');
        toast.success(`🎤 Listening in ${langName}`);
      }
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      isRecognitionActiveRef.current = false;
      toast.error('Unable to start speech recognition. Please check microphone permissions.');
    }
  };



  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        isRecognitionActiveRef.current = false;
      } catch (e) {
        console.log('Recognition already stopped');
      }
    }
    setIsListening(false);
  };

  const handleTranscriptFinalized = async (transcript) => {
    if (!transcript.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);

    addToConversation("You", transcript, true);

    try {
      const aiResponse = await getAIResponse(transcript);
      addToConversation("Dr. AUTRYST", aiResponse, true);
      await speakWithElevenLabs(aiResponse);
    } catch (error) {
      console.error('Error:', error);
      const fallback = "I'm having trouble processing that. Could you please repeat?";
      addToConversation("Dr. AUTRYST", fallback, true);
      await speakWithElevenLabs(fallback);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  const speakWithElevenLabs = async (text) => {
    return new Promise((resolve) => {
      if (!text || isSpeakingRef.current) {
        resolve();
        return;
      }

      isSpeakingRef.current = true;
      setAiSpeaking(true);
      
      // Pause speech recognition while AI is speaking to avoid feedback
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition already stopped');
        }
      }

      const voiceId = elevenLabsCredentials?.voiceId;
      const apiKey = elevenLabsCredentials?.apiKey;

      console.log('TTS: Voice ID:', voiceId, 'API Key Present:', !!apiKey);

      if (!apiKey || !voiceId) {
        console.log('TTS: No credentials, using fallback Web Speech API');
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.95;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          utterance.onend = () => {
            isSpeakingRef.current = false;
            setAiSpeaking(false);
            resolve();
          };
          utterance.onerror = () => {
            isSpeakingRef.current = false;
            setAiSpeaking(false);
            resolve();
          };
          window.speechSynthesis.speak(utterance);
          return;
        }
        isSpeakingRef.current = false;
        setAiSpeaking(false);
        resolve();
        return;
      }

      console.log('TTS: Using ElevenLabs API');
      fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=4`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          },
          output_format: 'mp3_44100_128'
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then(arrayBuffer => {
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        currentAudioRef.current = audio;

        audio.oncanplaythrough = () => {
          audio.play().catch((err) => {
            console.error('TTS: Play failed:', err);
            isSpeakingRef.current = false;
            setAiSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            currentAudioRef.current = null;
            resolve();
          });
        };

        audio.onended = () => {
          isSpeakingRef.current = false;
          setAiSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          
          // Resume speech recognition after AI finishes speaking
          if (callStatusRef.current === 'active') {
            setTimeout(() => {
              if (recognitionRef.current && callStatusRef.current === 'active' && !isRecognitionActiveRef.current) {
                try {
                  recognitionRef.current.start();
                  isRecognitionActiveRef.current = true;
                } catch (e) {
                  console.log('Recognition restart failed:', e);
                }
              }
            }, 500);
          }
          resolve();
        };

        audio.onerror = (err) => {
          console.error('TTS: Audio error:', err);
          isSpeakingRef.current = false;
          setAiSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          
          // Resume speech recognition on error too
          if (callStatusRef.current === 'active' && recognitionRef.current && !isRecognitionActiveRef.current) {
            setTimeout(() => {
              try {
                recognitionRef.current.start();
                isRecognitionActiveRef.current = true;
              } catch (e) {
                console.log('Recognition restart failed:', e);
              }
            }, 500);
          }
          resolve();
        };

        audio.load();
      })
      .catch(error => {
        console.error('TTS: Fetch error:', error);
        isSpeakingRef.current = false;
        setAiSpeaking(false);
        resolve();
      });
    });
  };

  const updateConversationContext = async (userMessage, aiResponse) => {
    try {
      // Extract key information comprehensively
      const extractionPrompt = `Analyze this conversation exchange and extract ALL health-related information mentioned.

User said: "${userMessage}"
AI responded: "${aiResponse}"

Extract and return ALL relevant items:
- ALL symptoms mentioned or discussed (e.g., headache, fever, pain)
- ALL medication names mentioned by either party (e.g., ibuprofen, acetaminophen, aspirin, paracetamol)
- ALL timeframes/durations mentioned (e.g., "one week", "3 days", "since yesterday")
- ALL important health details (severity, triggers, intensity, anything medically relevant)

Return empty arrays if no relevant information was mentioned.`;

      const extracted = await base44.integrations.Core.InvokeLLM({
        prompt: extractionPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            symptoms: { type: "array", items: { type: "string" } },
            medications: { type: "array", items: { type: "string" } },
            durations: { type: "array", items: { type: "string" } },
            otherDetails: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Append new items to existing context (avoid duplicates)
      setConversationContext(prev => ({
        symptoms: [...new Set([...prev.symptoms, ...(extracted.symptoms || [])])],
        medications: [...new Set([...prev.medications, ...(extracted.medications || [])])],
        durations: [...new Set([...prev.durations, ...(extracted.durations || [])])],
        otherDetails: [...new Set([...prev.otherDetails, ...(extracted.otherDetails || [])])]
      }));
    } catch (error) {
      console.error('Error updating conversation context:', error);
    }
  };

  const buildHealthContext = () => {
    const healthContext = metrics.length > 0 
      ? metrics.map(m => `${m.metric_type}: ${m.value} ${m.unit}`).join(', ')
      : 'No recent vitals recorded yet';
    
    const userFirstName = user?.full_name?.split(' ')[0] || 'Patient';
    return `Patient Name: ${userFirstName}, Full Name: ${user?.full_name}, Age: ${user?.age || 'N/A'}. Recent Vitals: ${healthContext}`;
  };

  const captureVideoFrame = () => {
    if (!videoRef.current || !isCameraOn) {
      return null;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      return canvas.toDataURL('image/jpeg');
    } catch (error) {
      console.error('Failed to capture frame:', error);
      return null;
    }
  };

  const uploadCapturedFrame = async (frameData) => {
    try {
      const response = await fetch(frameData);
      const blob = await response.blob();
      const file = new File([blob], 'camera_frame.jpg', { type: 'image/jpeg' });
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      return uploadResult.file_url;
    } catch (error) {
      console.error('Failed to upload frame:', error);
      return null;
    }
  };

  const getAIResponse = async (prompt) => {
    try {
      let imageUrl = null;
      const lowerPrompt = prompt.toLowerCase();

      // Check if user is asking vision-related questions
      const isVisionQuestion = lowerPrompt.includes('see') || 
                               lowerPrompt.includes('look') || 
                               lowerPrompt.includes('visible') ||
                               lowerPrompt.includes('can you see') ||
                               lowerPrompt.includes('what do you see') ||
                               lowerPrompt.includes('do i look') ||
                               lowerPrompt.includes('how do i look') ||
                               lowerPrompt.includes('what am i') ||
                               lowerPrompt.includes('here') ||
                               lowerPrompt.includes('this') ||
                               lowerPrompt.includes('show you');

      // Always capture frame if camera is on, especially for vision questions
      if (isCameraOn && (isVisionQuestion || Math.random() > 0.3)) {
        const frameData = captureVideoFrame();
        if (frameData) {
          imageUrl = await uploadCapturedFrame(frameData);
          console.log('Camera frame captured and sent to AI:', imageUrl);
        }
      }

      // Handle camera off scenarios
      if (isVisionQuestion && !isCameraOn) {
        return "I'm unable to see you right now because your camera is off. Would you like to turn it on so I can better assist you?";
      }

      // Build the LLM prompt with health context
      const userFirstName = user?.full_name?.split(' ')[0] || 'there';
      const conversationHistory = conversation.map(c => `${c.speaker}: ${c.message}`).join('\n');
      
      // Build comprehensive context summary with emphasis on medications
      const contextSummary = `
TRACKED CONVERSATION CONTEXT (everything discussed so far - CRITICAL for continuity):
- Symptoms discussed: ${conversationContext.symptoms.length > 0 ? conversationContext.symptoms.join(', ') : 'None yet'}
- Medications mentioned: ${conversationContext.medications.length > 0 ? conversationContext.medications.join(', ') : 'None yet'}
- Durations/timeframes: ${conversationContext.durations.length > 0 ? conversationContext.durations.join(', ') : 'None yet'}
- Other key details: ${conversationContext.otherDetails.length > 0 ? conversationContext.otherDetails.join(', ') : 'None yet'}

CRITICAL: You MUST use the information from the 'TRACKED CONVERSATION CONTEXT' above to maintain continuity. Explicitly refer to past symptoms, durations, and especially medications (e.g., "So, we've been talking about your headache for a week, and you're taking ibuprofen... What else?"). Do NOT ask for information already present in this context. This is the SINGLE SOURCE OF TRUTH for previously discussed details.`;

      const llmPayload = {
        prompt: `${AUTRYST_SYSTEM_PROMPT}

IMPORTANT: The patient's first name is "${userFirstName}". Use their name naturally in your responses.

${buildHealthContext()}

${contextSummary}

FULL CONVERSATION HISTORY (for detailed reference, use this to understand the flow and specific wording, but rely on TRACKED CONVERSATION CONTEXT for consolidated facts):
${conversationHistory}

Patient's MOST RECENT message: "${prompt}"

CRITICAL INSTRUCTIONS FOR THIS SPECIFIC RESPONSE:
1. MAINTAIN ABSOLUTE CONTINUITY: This is a single, ongoing conversation. Your response MUST acknowledge and build upon previous exchanges, utilizing the 'TRACKED CONVERSATION CONTEXT' and 'FULL CONVERSATION HISTORY' extensively.
2. MEDICATION TRACKING: Explicitly demonstrate that you remember and are tracking ALL medications mentioned previously (either by you or the patient). If a medication was mentioned, refer to it if relevant. If a new medication is mentioned, acknowledge it. Do NOT forget any medication once it's in the 'TRACKED CONVERSATION CONTEXT'. The tracked list is exhaustive and accurate.
3. ACKNOWLEDGE AND BUILD: If the patient just provided information that directly answers a previous question or clarifies a point, acknowledge it clearly and use it to advance the conversation. Example: If you asked "how long" and they said "one week", respond: "Okay, one week with the headache - got it. [Then ask your next question]"
4. NO REPETITION: NEVER ask questions you've already asked or ignore information they've already given you. Verify against the 'TRACKED CONVERSATION CONTEXT'.
5. INTEGRATE DETAILS: Seamlessly connect fragmented information (e.g., combine symptom + duration + severity from different messages into a coherent understanding).
6. KEEP IT CONCISE: Your responses should be 2-3 SHORT sentences maximum. Aim for a natural, back-and-forth rhythm.
7. FOCUS ON NEXT STEP: After acknowledging, ask ONE focused follow-up question or provide ONE piece of relevant information to guide the conversation naturally.`
      };

      // Include visual context if available
      if (imageUrl) {
        llmPayload.file_urls = [imageUrl];
        if (isVisionQuestion) {
          llmPayload.prompt += `\n\n[IMPORTANT: The patient is asking you to look at them or something visual. Their current camera view is attached as an image. Analyze what you see and respond naturally as a doctor would - comment on what's visible, their appearance, surroundings, or what they're showing you. Be specific about what you observe.]`;
        } else {
          llmPayload.prompt += `\n\n[Visual context: Patient's camera view is attached. Consider any relevant visual cues when responding, but focus primarily on their question.]`;
        }
      }

      // Get response from LLM
      const response = await base44.integrations.Core.InvokeLLM(llmPayload);

      // Update conversation context by extracting key information
      await updateConversationContext(prompt, response);

      // Ensure we always return a valid response
      if (!response || response.trim().length === 0) {
        return "I'm listening. Could you tell me more about what's going on?";
      }

      return response;
    } catch (error) {
      console.error("LLM error:", error);
      return "I apologize, I'm having a bit of trouble processing that. Could you please tell me again what's bothering you?";
    }
  };

  const requestPermissions = async (mode = "user", withVideo = true) => {
    console.log('🎤 Requesting permissions - Video:', withVideo, 'Mode:', mode);
    setCallStatus("requesting_permissions");
    callStatusRef.current = "requesting_permissions";
    setShowCameraPrompt(false);
    
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = { 
        video: withVideo ? { facingMode: mode } : false, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      };

      console.log('📱 Requesting getUserMedia with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ getUserMedia successful!');

      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      console.log('🎙️ Audio tracks:', audioTracks.length);
      console.log('📹 Video tracks:', videoTracks.length);

      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available');
      }

      streamRef.current = stream;
      setIsCameraOn(withVideo);
      toast.success('Microphone access granted!');
      startConsultation();
    } catch (error) {
      console.error("❌ Permission error:", error);
      if (error.name === 'NotAllowedError') {
        toast.error("Microphone permission denied. Please allow microphone access in your browser settings.");
        if (withVideo) {
          setShowCameraPrompt(true);
        }
        setCallStatus("idle");
        callStatusRef.current = "idle";
      } else if (error.name === 'NotFoundError') {
        toast.error("No microphone found. Please connect a microphone and try again.");
        setCallStatus("idle");
        callStatusRef.current = "idle";
      } else {
        toast.error(`Unable to access media devices: ${error.message}`);
        setCallStatus("idle");
        callStatusRef.current = "idle";
      }
    }
  };

  const startWithoutCamera = async () => {
    await requestPermissions("user", false);
  };
  
  const toggleCamera = () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    requestPermissions(newFacingMode);
  };

  const startConsultation = async () => {
    console.log('🏥 Starting consultation...');
    setCallStatus("active");
    callStatusRef.current = "active";
    setCallStartTime(new Date());
    
    if (!hasGreeted) {
      const userFirstName = user?.full_name?.split(' ')[0] || 'there';
      const greeting = `Hey ${userFirstName}! I'm Dr. AUTRYST, your AI health companion. It's great to see you today! How are you feeling? What's been going on? Tell me what's bothering you.`;
      addToConversation("Dr. AUTRYST", greeting, true);
      setHasGreeted(true);
      await speakWithElevenLabs(greeting);
    }
    
    console.log('🎤 Starting speech recognition...');
    startSpeechRecognition();
  };

  const handleTextInput = async (text) => {
    if (!text.trim() || isProcessing) return;
    
    addToConversation("You", text, false);
    setIsProcessing(true);
    isProcessingRef.current = true;
    
    try {
      const aiResponse = await getAIResponse(text);
      addToConversation("Dr. AUTRYST", aiResponse, false);
      await speakWithElevenLabs(aiResponse);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  const handleManualSend = async () => {
    if (!manualInput.trim() || isProcessing) return;
    
    const text = manualInput.trim();
    setManualInput("");
    await handleTextInput(text);
  };

  const addToConversation = (speaker, message, isVoiceInput) => {
    setConversation(prev => [...prev, { 
      speaker, 
      message, 
      timestamp: new Date().toISOString(),
      isVoiceInput 
    }]);
  };

  const endCall = async () => {
    setCallStatus("generating_prescription");
    callStatusRef.current = "generating_prescription";
    stopSpeechRecognition();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    
    const userFirstName = user?.full_name?.split(' ')[0] || 'there';
    await speakWithElevenLabs(`Thank you so much for sharing all of this with me, ${userFirstName}. From what we've discussed today, I don't see anything that needs urgent attention right now, but I'll be continuously monitoring your health through your vitals. Please keep an eye on things and don't hesitate to reach out if anything changes. Take care, ${userFirstName}! Hope for the best, and let's meet again soon if you need me. Stay healthy!`);

    try {
      const prescriptionData = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this consultation transcript, generate a comprehensive medical summary and prescription.

    CRITICAL MEDICATION EXTRACTION INSTRUCTIONS:
    1. Read through EVERY SINGLE message in the conversation transcript below
    2. Look for ANY medication names mentioned by EITHER the doctor OR the patient - examples: ibuprofen, acetaminophen, aspirin, paracetamol, any medication name
    3. Include medications even if casually mentioned: "you could try ibuprofen" = INCLUDE ibuprofen
    4. Include medications the patient said they're taking or considering
    5. Extract dosage info if mentioned, otherwise use standard recommended dosages
    6. If you find ZERO medications anywhere in the conversation, return empty array []
    7. NEVER invent medications - only extract what was ACTUALLY discussed

    FULL CONVERSATION TRANSCRIPT:
    ${JSON.stringify(conversation.map(c => `${c.speaker}: ${c.message}`), null, 2)}

    Analyze this conversation and extract:
    - What symptoms were discussed
    - What medications or treatments were suggested (even if casually mentioned)
    - Dosages and frequencies if mentioned
    - Care instructions given
    - Follow-up recommendations

    Generate a realistic summary based on what was ACTUALLY discussed.`,
        response_json_schema: {
          type: "object",
          properties: {
            diagnosis: { type: "string" },
            medications: {
              type: "array", items: {
                type: "object", properties: {
                  name: { type: "string" },
                  dosage: { type: "string" },
                  frequency: { type: "string" },
                  instructions: { type: "string" }
                }
              }
            },
            care_instructions: { type: "string" },
            follow_up: { type: "string" }
          }
        }
      });

      setPrescription({
        ...prescriptionData,
        patient_name: user?.full_name,
        date: new Date().toLocaleDateString(),
      });

      await createConsultationMutation.mutateAsync({
        session_id: `session_${Date.now()}`,
        status: "completed",
        start_time: callStartTime.toISOString(),
        end_time: new Date().toISOString(),
        duration_minutes: Math.round(callDuration / 60),
        conversation_transcript: conversation,
        session_summary: prescriptionData.diagnosis
      });
      
      setCallStatus("ended");
      callStatusRef.current = "ended";
      toast.success("Consultation complete!");
    } catch (error) {
      console.error('Error:', error);
      setCallStatus("ended");
      callStatusRef.current = "ended";
    }
  };

  const sendPrescriptionViaEmail = async () => {
    if (!user?.email) return toast.error("Email not available.");
    setIsEmailSending(true);
    try {
      // Generate PDF
      const pdfResult = await base44.functions.invoke('generatePrescriptionPDF', { prescription });
      
      // Send email with attachment info
      const htmlTemplate = `<div style="font-family: Arial, sans-serif; padding: 30px;">
        <h1>AUTRYST AI Healthcare</h1>
        <p><strong>Patient:</strong> ${prescription.patient_name}</p>
        <p><strong>Date:</strong> ${prescription.date}</p>
        <h3>Diagnosis</h3><p>${prescription.diagnosis}</p>
        <h3>Medications</h3>
        ${prescription.medications?.length > 0 ? prescription.medications.map(med => `
          <div style="margin: 10px 0; padding: 10px; background: #f8fafc; border-radius: 5px;">
            <strong>${med.name}</strong><br/>
            ${med.dosage} - ${med.frequency}<br/>
            <small>${med.instructions}</small>
          </div>
        `).join('') : '<p>No medications prescribed.</p>'}
        <h3>Care Instructions</h3><p>${prescription.care_instructions}</p>
        <h3>Follow-up</h3><p>${prescription.follow_up}</p>
        <p style="margin-top: 20px; padding: 15px; background: #e0f2fe; border-radius: 5px;">
          📄 A detailed PDF prescription is attached to this email or you can download it from the consultation page.
        </p>
      </div>`;
      
      await base44.integrations.Core.SendEmail({ 
        to: user.email, 
        subject: "Your AUTRYST Consultation - Prescription", 
        body: htmlTemplate 
      });
      toast.success("Prescription sent to your email!");
    } catch (error) {
      console.error('Email error:', error);
      toast.error("Failed to send email.");
    } finally {
      setIsEmailSending(false);
    }
  };

  const downloadPrescription = async () => {
    try {
      toast.info("Generating PDF...");
      const result = await base44.functions.invoke('generatePrescriptionPDF', { prescription });
      
      // Convert base64 to blob and download
      const byteCharacters = atob(result.data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.data.filename || 'prescription.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to generate PDF.");
    }
  };

  const handleLanguageChange = (newLang) => {
    const langName = newLang === 'hi-IN' ? 'Hindi' : newLang === 'te-IN' ? 'Telugu' : 'English';
    console.log('Switching speech language to:', langName);
    
    setRecognitionLang(newLang);
    
    if (callStatus === "active" && recognitionRef.current) {
      stopSpeechRecognition();
      toast.info(`Switching to ${langName}...`);
      setTimeout(() => {
        startSpeechRecognition();
      }, 500);
    } else {
      toast.success(`Language set to ${langName}`);
    }
  };

  const resetState = () => {
    setCallStatus("idle");
    callStatusRef.current = "idle";
    setConversation([]);
    setPrescription(null);
    setCallDuration(0);
    setCallStartTime(null);
    setHasGreeted(false);
    setConversationContext({
      symptoms: [],
      medications: [],
      durations: [],
      otherDetails: []
    });
  };

  const formatDuration = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
      stopSpeechRecognition();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      isSpeakingRef.current = false;
      isProcessingRef.current = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <AnimatePresence mode="wait">
        {callStatus === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-screen text-center p-4 md:p-6">
              <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 md:mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                  <Brain className="w-12 h-12 md:w-16 md:h-16 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">AI Doctor Consultation</h2>
              <p className="text-sm md:text-base text-slate-600 mb-6 md:mb-8 max-w-xl mx-auto px-4">Talk naturally with Dr. AUTRYST for a compassionate, real-time health consultation.</p>
              
              {showCameraPrompt ? (
                <Card className="p-6 max-w-md border-slate-200 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <CameraOff className="w-8 h-8 text-orange-500" />
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">Camera Access Denied</h3>
                      <p className="text-sm text-slate-500">Continue without camera?</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => requestPermissions("user", true)} variant="outline" className="flex-1">
                      Try Again
                    </Button>
                    <Button onClick={startWithoutCamera} className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600">
                      Continue
                    </Button>
                  </div>
                </Card>
              ) : (
                <Button onClick={() => requestPermissions("user", true)} size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600">
                  <Video className="w-6 h-6 mr-3" />Start Consultation
                </Button>
              )}
          </motion.div>
        )}
        
        {(callStatus === "requesting_permissions" || callStatus === "generating_prescription") && (
             <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-screen text-center p-6">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <h3 className="text-2xl font-bold">{callStatus === 'requesting_permissions' ? 'Starting...' : 'Generating Prescription...'}</h3>
             </motion.div>
        )}
        
        {callStatus === "active" && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-2 md:p-4 lg:p-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
              <div className="lg:col-span-2 space-y-3 md:space-y-4">
                <Card className="border-slate-200 bg-black overflow-hidden shadow-xl aspect-video relative">
                  <AIAvatar3D isActive={true} isSpeaking={aiSpeaking} />
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 flex items-center gap-2 text-white">
                    {aiSpeaking ? <Volume2 className="w-4 h-4 text-green-400 animate-pulse" /> : <Brain className="w-4 h-4 text-blue-400" />}
                    <span className="text-sm font-medium">AUTRYST</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg font-mono text-sm">{formatDuration(callDuration)}</div>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <Card className="border-slate-200 bg-black overflow-hidden shadow-xl aspect-video relative">
                      <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover rounded-lg ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} />
                      {!isCameraOn && <div className="absolute inset-0 bg-slate-900 flex items-center justify-center"><CameraOff className="w-12 h-12 text-slate-500" /></div>}
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded-lg px-3 py-1 border border-white/10 flex items-center gap-2 text-white text-sm"><User className="w-4 h-4" /> You</div>
                      {isListening && <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-red-500/80 px-2 py-1 rounded"><div className="w-2 h-2 bg-white rounded-full animate-pulse" /><span className="text-xs text-white">Listening</span></div>}
                    </Card>
                    <Card className="border-slate-200 shadow-xl">
                        <CardHeader><CardTitle className="text-base">Controls</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-center gap-3">
                             <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" onClick={() => setIsMuted(!isMuted)}>{isMuted ? <MicOff /> : <Mic />}</Button>
                             <Button size="icon" className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700" onClick={endCall}><PhoneOff /></Button>
                             <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" onClick={() => setIsCameraOn(!isCameraOn)}>{isCameraOn ? <Camera /> : <CameraOff />}</Button>
                             {isMobile && (
                                <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" onClick={toggleCamera}>
                                  <SwitchCamera />
                                </Button>
                              )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Languages className="w-4 h-4 text-slate-600" />
                            <Select value={recognitionLang} onValueChange={handleLanguageChange}>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en-US">🇺🇸 English</SelectItem>
                                <SelectItem value="hi-IN">🇮🇳 हिंदी (Hindi)</SelectItem>
                                <SelectItem value="te-IN">🇮🇳 తెలుగు (Telugu)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                    </Card>
                </div>
              </div>
              <Card className="lg:col-span-1 border-slate-200 shadow-xl flex flex-col h-full max-h-[600px] lg:max-h-[calc(100vh-2rem)]">
                <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
                <CardContent className="flex-grow p-0 overflow-hidden">
                    <ScrollArea className="h-full p-4"><div className="space-y-4">
                      {conversation.map((msg, index) => (
                        <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-3 rounded-lg text-sm ${msg.speaker === "You" ? "bg-blue-100 ml-8" : "bg-slate-100 mr-8"}`}>
                          <div className="font-semibold mb-1 flex items-center gap-2">
                            {msg.speaker}
                            {msg.isVoiceInput && <Volume2 className="w-3 h-3" />}
                          </div>
                          <p className="text-slate-800">{msg.message}</p>
                        </motion.div>
                      ))}
                      {isProcessing && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg text-sm bg-slate-100">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-slate-500">Dr. AUTRYST is thinking...</span>
                          </div>
                        </motion.div>
                      )}
                    </div></ScrollArea>
                </CardContent>
                <div className="p-4 border-t space-y-2">
                    <div className="text-xs text-center text-slate-500 mb-2">
                      {isProcessing ? "Processing..." : isListening ? `🎤 Listening in ${recognitionLang === 'hi-IN' ? 'Hindi' : recognitionLang === 'te-IN' ? 'Telugu' : 'English'}...` : "Ready to listen"}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Or type your message..." 
                        className="flex-1 bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !isProcessing) {
                            handleManualSend();
                          }
                        }}
                        disabled={isProcessing}
                      />
                      <Button 
                        size="sm" 
                        onClick={handleManualSend}
                        disabled={isProcessing || !manualInput.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
        
        {callStatus === "ended" && (
            <motion.div key="ended">
                <div className="p-4 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold">Consultation Complete</h2>
                </div>
                <PrescriptionView 
                    prescription={prescription}
                    onDownload={downloadPrescription}
                    onEmail={sendPrescriptionViaEmail}
                    isEmailing={isEmailSending}
                    onNewConsultation={resetState}
                />
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}