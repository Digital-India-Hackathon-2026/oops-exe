import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import HealthMapVisual from '@/components/symptom/HealthMapVisual';
import SymptomSelector from '@/components/symptom/SymptomSelector';
import AnalysisResult from '@/components/symptom/AnalysisResult';
import { Loader2, Send, Bot, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AIDoctor() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: recentVitals = [] } = useQuery({
    queryKey: ['recentVitals', user?.email],
    queryFn: () => base44.entities.HealthMetric.filter(
      { created_by: user.email },
      '-timestamp',
      10
    ),
    enabled: !!user?.email,
  });

  const { data: healthTwin } = useQuery({
    queryKey: ['healthTwin', user?.email],
    queryFn: async () => {
      const predictions = await base44.entities.HealthTwinPrediction.filter(
        { created_by: user.email },
        '-created_date',
        1
      );
      return predictions[0] || null;
    },
    enabled: !!user?.email,
  });

  const startConversation = async () => {
    setHasStarted(true);
    setIsProcessing(true);
    
    try {
      const vitalsContext = recentVitals.map(v => 
        `${v.metric_type}: ${v.value} ${v.unit}`
      ).join(', ');
      
      const prompt = `You are an AI symptom checker starting a conversation.

Recent vitals: ${vitalsContext}

CRITICAL INSTRUCTIONS:
1. Greet the patient warmly
2. Ask ONE focused question about what's bothering them or their main symptom
3. Keep it SHORT (1-2 sentences)

Example: "Hi! I'm here to help. What's been bothering you lately?"`;
      
      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      
      const aiMessage = { role: 'assistant', content: response };
      setConversation([aiMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextInput = async (text) => {
    if (!text.trim() || isProcessing) return;
    
    setIsProcessing(true);
    const userMessage = { role: 'user', content: text };
    setConversation(prev => [...prev, userMessage]);
    setUserInput('');
    
    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);
    
    try {
      const vitalsContext = recentVitals.map(v => 
        `${v.metric_type}: ${v.value} ${v.unit}`
      ).join(', ');
      
      const conversationHistory = conversation.map(m => 
        `${m.role === 'user' ? 'Patient' : 'AI'}: ${m.content}`
      ).join('\n');
      
      let prompt;
      
      if (newQuestionCount >= 2) {
        // After 2 answers, ask about other symptoms and guide to analyze
        prompt = `You are an AI symptom checker. The patient has responded: "${text}"

Recent vitals: ${vitalsContext}
Conversation history:
${conversationHistory}

CRITICAL: You have asked 2 questions already. Now:
1. FIRST: Acknowledge their response briefly
2. THEN: Ask "Do you have any other symptoms I should know about?"
3. FINALLY: Tell them "When you're ready, press the 'Analyze My Symptoms' button below"

Keep your response SHORT and clear (2-3 sentences total).`;
      } else {
        // Ask follow-up question
        prompt = `You are an AI symptom checker. The patient has responded: "${text}"

Recent vitals: ${vitalsContext}
Conversation history:
${conversationHistory}

CRITICAL INSTRUCTIONS:
1. FIRST: Briefly acknowledge what they said (1 sentence)
2. THEN: Ask ONE focused follow-up question to understand better

Keep your response SHORT (2 sentences total). Be specific and medically relevant.`;
      }
      
      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      
      const aiMessage = { role: 'assistant', content: response };
      setConversation(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyze = async (uploadedReports) => {
    setAnalyzing(true);
    
    try {
      // Extract all symptoms from conversation
      const conversationSymptoms = conversation
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('. ');

      // Construct comprehensive AI prompt
      const vitalsContext = recentVitals.map(v => 
        `${v.metric_type}: ${v.value} ${v.unit}`
      ).join(', ');

      const symptomsText = selectedSymptoms.length > 0 
        ? selectedSymptoms.map(s => 
            `${s.label} (${s.severity}, ${s.duration}, ${s.pattern}${s.trigger ? `, triggered by ${s.trigger}` : ''})`
          ).join('; ')
        : conversationSymptoms;

      const reportsText = uploadedReports.length > 0 ? uploadedReports.map(r => {
        const findings = r.data?.findings ? `Findings: ${r.data.findings.join(', ')}` : '';
        const measurements = r.data?.measurements ? `Measurements: ${JSON.stringify(r.data.measurements)}` : '';
        const impression = r.data?.impression ? `Impression: ${r.data.impression}` : '';
        return `${r.type.toUpperCase()} REPORT (${r.fileName}):\n${findings}\n${measurements}\n${impression}`;
      }).join('\n\n') : '';

      const healthTwinContext = healthTwin ? 
        `Baseline risk score: ${healthTwin.risk_score}, Contributing factors: ${healthTwin.contributing_factors?.join(', ')}` : 
        'No baseline available';

      const prompt = `You are an AI health signal interpreter for AUTRYST, a continuous health intelligence system.

CRITICAL RULES:
- NO diagnosis names
- NO disease probabilities
- Use "may help", "could provide clarity" language
- Focus on health signal patterns, not diseases
- Guide decision-making, not disease naming
- When diagnostic reports are provided, use them as CONTEXTUAL intelligence to understand the health state better
- Reports provide structured findings that should inform risk assessment and recommendations

USER SYMPTOMS:
${symptomsText}

RECENT VITALS:
${vitalsContext}

HEALTH TWIN BASELINE:
${healthTwinContext}

${reportsText ? `UPLOADED DIAGNOSTIC REPORTS:\n${reportsText}\n\nIMPORTANT: Use these report findings to provide more accurate health signal interpretation. Cross-reference symptoms with report findings.` : 'No diagnostic reports uploaded.'}

Provide a structured health signal interpretation with the following sections:

1. Symptom Understanding: Summarize what body systems and patterns are observed
2. Risk Stratification: Assess as "low", "needs_attention", or "potential_risk" with calm explanation
3. Health Twin Comparison: Compare current signals to baseline (if available)
4. Diagnostic Reasoning: Suggest what additional tests "may help" or "could provide clarity"
5. System Recommendation: ONE primary action path (monitor, talk to AI doctor, specialist, emergency)
6. Action Buttons: Which buttons to show (aiDoctor, shareFamily, monitoringAlert, emergencyHelp)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            symptomUnderstanding: {
              type: 'object',
              properties: {
                summary: { type: 'string' },
                bodySystems: { type: 'array', items: { type: 'string' } },
                pattern: { type: 'string' }
              }
            },
            riskStratification: {
              type: 'object',
              properties: {
                level: { type: 'string', enum: ['low', 'needs_attention', 'potential_risk'] },
                explanation: { type: 'string' }
              }
            },
            healthTwinComparison: {
              type: 'object',
              properties: {
                insights: { type: 'array', items: { type: 'string' } }
              }
            },
            diagnosticReasoning: {
              type: 'object',
              properties: {
                suggestions: { type: 'array', items: { type: 'string' } }
              }
            },
            systemRecommendation: {
              type: 'object',
              properties: {
                primaryPath: { type: 'string' }
              }
            },
            actionButtons: {
              type: 'object',
              properties: {
                aiDoctor: { type: 'boolean' },
                shareFamily: { type: 'boolean' },
                monitoringAlert: { type: 'boolean' },
                emergencyHelp: { type: 'boolean' }
              }
            }
          }
        }
      });

      setAnalysis(response);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#F7F9FB]">
      {/* Left Panel - Visual Health Map (60%) */}
      <div className="hidden md:flex md:w-[60%] items-center justify-center p-4 md:p-8">
        <HealthMapVisual 
          selectedSymptoms={selectedSymptoms}
          onRegionClick={(region) => {
            // Could implement region-click to suggest relevant symptoms
            console.log('Region clicked:', region);
          }}
        />
      </div>

      {/* Right Panel - Symptom Input (40%) */}
      <div className="w-full md:w-[40%] border-t md:border-t-0 md:border-l border-gray-200 flex flex-col">
        {/* Conversation Section */}
        <div className="flex-1 flex flex-col p-3 md:p-4 bg-white overflow-hidden">
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex-shrink-0">Describe Your Symptoms</h2>
          
          {!hasStarted ? (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <Bot className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">I'll ask you 2-3 questions to understand your symptoms better</p>
                <Button 
                  onClick={startConversation}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  size="lg"
                >
                  Start Consultation
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-4 pr-4">
                {conversation.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    <div className={`max-w-[80%] p-3 rounded-xl ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 p-3 rounded-xl">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          
          {hasStarted && (
            <div className="flex-shrink-0 space-y-2">
              <div className="flex gap-2">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTextInput(userInput);
                    }
                  }}
                  placeholder="Answer the question..."
                  className="flex-1 resize-none"
                  rows={3}
                  disabled={isProcessing}
                />
                <Button
                  onClick={() => handleTextInput(userInput)}
                  disabled={!userInput.trim() || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {questionCount >= 2 && (
                <Button
                  onClick={() => handleAnalyze([])}
                  disabled={analyzing}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  size="lg"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 mr-2" />
                      Analyze My Symptoms
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="border-t p-4 bg-gray-50">
          <SymptomSelector
            selectedSymptoms={selectedSymptoms}
            onSymptomsChange={setSelectedSymptoms}
            onAnalyze={handleAnalyze}
          />
        </div>
      </div>

      {/* Analysis Loading Overlay */}
      {analyzing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin" />
            <div className="text-lg font-semibold text-gray-900">Analyzing health signals...</div>
            <p className="text-sm text-gray-500">Correlating with Health Twin baseline</p>
          </div>
        </div>
      )}

      {/* Analysis Result */}
      {analysis && !analyzing && (
        <AnalysisResult 
          analysis={analysis}
          onClose={() => setAnalysis(null)}
        />
      )}
    </div>
  );
}