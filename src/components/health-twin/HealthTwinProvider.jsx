import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const HealthTwinContext = createContext(null);

export const useHealthTwin = () => {
  const context = useContext(HealthTwinContext);
  if (!context) {
    throw new Error('useHealthTwin must be used within HealthTwinProvider');
  }
  return context;
};

export const HealthTwinProvider = ({ children, user }) => {
  const [twinState, setTwinState] = useState({
    status: 'initializing',
    confidence: 'low',
    dataCoverage: 0,
    lastUpdate: null,
    deviations: [],
    riskFlags: [],
    systemRecommendations: null,
    explainability: [],
    escalationReady: false
  });

  const hasInitialized = React.useRef(false);
  const prevRecentVitals = React.useRef([]);
  const prevActiveSymptoms = React.useRef([]);

  // Core Health Twin intelligence
  const { data: healthTwin, isLoading: twinLoading } = useQuery({
    queryKey: ['healthTwin', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const predictions = await base44.entities.HealthTwinPrediction.filter(
        { created_by: user.email },
        '-created_date',
        1
      );
      return predictions[0] || null;
    },
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  // Recent vitals (feeding the Twin)
  const { data: recentVitals = [] } = useQuery({
    queryKey: ['twinVitals', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.HealthMetric.filter(
        { created_by: user.email },
        '-timestamp',
        50
      );
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  // Active symptoms (feeding the Twin)
  const { data: activeSymptoms = [] } = useQuery({
    queryKey: ['twinSymptoms', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Symptom.filter(
        { created_by: user.email, status: 'active' },
        '-created_date',
        10
      );
    },
    enabled: !!user?.email,
  });

  // Core Reasoning Engine: Update Twin state via LLM
  useEffect(() => {
    if (!user?.email) return;

    // Check if data has actually changed
    const vitalsChanged = JSON.stringify(prevRecentVitals.current) !== JSON.stringify(recentVitals);
    const symptomsChanged = JSON.stringify(prevActiveSymptoms.current) !== JSON.stringify(activeSymptoms);
    
    if (hasInitialized.current && !vitalsChanged && !symptomsChanged) {
      return;
    }

    const handler = setTimeout(() => {
      const updateTwinState = async () => {
        // If no baseline data yet, show initializing state
        if (recentVitals.length < 5 && !healthTwin) {
          setTwinState({
            status: 'initializing',
            confidence: 'low',
            dataCoverage: 0,
            lastUpdate: new Date(),
            deviations: [],
            riskFlags: [],
            systemRecommendations: null,
            explainability: ['Waiting for initial health data to build your baseline.'],
            escalationReady: false
          });
          hasInitialized.current = true;
          prevRecentVitals.current = recentVitals;
          prevActiveSymptoms.current = activeSymptoms;
          return;
        }

        try {
          const input = {
            recent_vitals: recentVitals.slice(0, 10).reduce((acc, v) => {
              acc[v.metric_type] = { value: v.value, unit: v.unit, timestamp: v.timestamp };
              return acc;
            }, {}),
            historical_baseline: {
              vitals_count: recentVitals.length,
              data_range_days: recentVitals.length > 0 ? 
                Math.ceil((new Date() - new Date(recentVitals[recentVitals.length - 1].timestamp)) / (1000 * 60 * 60 * 24)) : 0
            },
            reported_symptoms: activeSymptoms.map(s => ({
              description: s.description,
              severity: s.severity,
              duration: s.duration
            })),
            last_twin_state: twinState.status || 'initializing',
            confidence_level: twinState.confidence || 'low',
            timestamp: new Date().toISOString()
          };

          const reasoning = await base44.integrations.Core.InvokeLLM({
            prompt: `You are the core reasoning engine of AUTRYST, an AI-powered continuous health intelligence system.
You are NOT a chatbot. You are NOT a doctor. You do NOT provide diagnoses.

Your sole responsibility is to interpret structured health signals and update a single, consistent AI Health Twin state.

CRITICAL RULES:
- Output ONLY valid JSON
- Do NOT include explanations outside JSON
- Do NOT include medical diagnoses
- Do NOT invent data
- Be deterministic, calm, conservative
- Prefer monitoring over escalation
- If data is insufficient, explicitly say so in structured form

INPUT DATA:
${JSON.stringify(input, null, 2)}

ANALYZE THE INPUT AND PROVIDE STRUCTURED OUTPUT FOLLOWING THIS EXACT SCHEMA:

{
  "twin_state": "stable | learning | monitoring | escalating",
  "confidence": "high | medium | low",
  "data_coverage": "percentage_estimate as number",
  "deviations": ["short descriptive phrases"],
  "risk_flags": ["high_level_non_diagnostic_flags"],
  "system_recommendations": {
    "activity_level": "normal | light | reduced",
    "meditation": true | false,
    "nutrition_focus": "none | hydration | balanced | light",
    "medical_review_suggested": true | false
  },
  "explainability": ["factual reasons without medical claims"],
  "escalation_ready": true | false
}

ESCALATION RULES:
- Escalation is rare
- Requires multiple deviations + sustained trend + low recovery
- If uncertain → choose monitoring

OUTPUT ONLY THE JSON, NO OTHER TEXT.`,
            response_json_schema: {
              type: "object",
              properties: {
                twin_state: { type: "string", enum: ["stable", "learning", "monitoring", "escalating"] },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                data_coverage: { type: "number" },
                deviations: { type: "array", items: { type: "string" } },
                risk_flags: { type: "array", items: { type: "string" } },
                system_recommendations: {
                  type: "object",
                  properties: {
                    activity_level: { type: "string", enum: ["normal", "light", "reduced"] },
                    meditation: { type: "boolean" },
                    nutrition_focus: { type: "string", enum: ["none", "hydration", "balanced", "light"] },
                    medical_review_suggested: { type: "boolean" }
                  }
                },
                explainability: { type: "array", items: { type: "string" } },
                escalation_ready: { type: "boolean" }
              }
            }
          });

          if (reasoning && reasoning.twin_state) {
            setTwinState({
              status: reasoning.twin_state,
              confidence: reasoning.confidence,
              dataCoverage: reasoning.data_coverage || 0,
              lastUpdate: new Date(),
              deviations: reasoning.deviations || [],
              riskFlags: reasoning.risk_flags || [],
              systemRecommendations: reasoning.system_recommendations || null,
              explainability: reasoning.explainability || [],
              escalationReady: reasoning.escalation_ready || false
            });
            hasInitialized.current = true;
            prevRecentVitals.current = recentVitals;
            prevActiveSymptoms.current = activeSymptoms;
          }
        } catch (error) {
          console.error('Twin reasoning engine error:', error);
          
          if (twinState.lastUpdate) {
            return;
          }

          const vitalsCoverage = Math.min((recentVitals.length / 50) * 100, 100);
          const symptomsCount = activeSymptoms.length;
          
          let status = 'stable';
          if (vitalsCoverage < 30) {
            status = 'learning';
          } else if (symptomsCount > 2) {
            status = 'monitoring';
          }

          setTwinState({
            status,
            confidence: 'low',
            dataCoverage: vitalsCoverage,
            lastUpdate: new Date(),
            deviations: ['Using fallback reasoning'],
            riskFlags: [],
            systemRecommendations: null,
            explainability: ['Core reasoning engine unavailable, using heuristics'],
            escalationReady: false
          });
          hasInitialized.current = true;
          prevRecentVitals.current = recentVitals;
          prevActiveSymptoms.current = activeSymptoms;
        }
      };

      updateTwinState();
    }, 1000);

    return () => clearTimeout(handler);
  }, [user?.email, recentVitals, activeSymptoms, healthTwin]);

  // Twin intelligence methods
  const interpretVital = (vital) => {
    if (!healthTwin) {
      return { interpretation: 'Learning baseline...', status: 'neutral' };
    }

    const baseline = getBaselineForMetric(vital.metric_type);
    if (!baseline) {
      return { interpretation: 'Within learning range', status: 'neutral' };
    }

    const deviation = Math.abs(vital.value - baseline.mean) / baseline.stdDev;
    
    if (deviation > 2) {
      return { 
        interpretation: `Significant deviation from your baseline (${baseline.mean} ${vital.unit})`,
        status: 'alert',
        baselineValue: baseline.mean
      };
    } else if (deviation > 1) {
      return { 
        interpretation: `Drifting from your baseline (${baseline.mean} ${vital.unit})`,
        status: 'caution',
        baselineValue: baseline.mean
      };
    }

    return { 
      interpretation: `Within your learned baseline (${baseline.mean} ${vital.unit})`,
      status: 'normal',
      baselineValue: baseline.mean
    };
  };

  const getBaselineForMetric = (metricType) => {
    if (!recentVitals.length) return null;
    
    const relevantMetrics = recentVitals.filter(v => v.metric_type === metricType);
    if (relevantMetrics.length < 5) return null;

    const values = relevantMetrics.map(v => v.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean: Math.round(mean * 10) / 10, stdDev };
  };

  const getRiskAssessment = () => {
    if (!healthTwin) {
      return {
        level: 'unknown',
        score: 0,
        explanation: 'Health Twin is initializing and learning your baseline.'
      };
    }

    const score = healthTwin.risk_score || 0;
    let level = 'low';
    let explanation = 'Your health signals are within normal parameters.';

    if (score > 70) {
      level = 'high';
      explanation = 'Multiple health signals suggest elevated risk. Immediate attention recommended.';
    } else if (score > 50) {
      level = 'moderate';
      explanation = 'Some health signals warrant monitoring. Consider proactive measures.';
    } else if (score > 30) {
      level = 'low-moderate';
      explanation = 'Minor signals detected. Continue regular monitoring.';
    }

    return {
      level,
      score,
      explanation,
      factors: healthTwin.contributing_factors || [],
      recommendations: healthTwin.recommendations || []
    };
  };

  const getActionRecommendation = () => {
    const risk = getRiskAssessment();
    const { status } = twinState;

    if (status === 'escalating' || risk.level === 'high') {
      return {
        primary: 'urgent_consultation',
        secondary: ['emergency', 'share_family'],
        tone: 'immediate'
      };
    }

    if (status === 'monitoring' || risk.level === 'moderate') {
      return {
        primary: 'ai_consultation',
        secondary: ['monitor', 'ai_coach'],
        tone: 'proactive'
      };
    }

    if (status === 'learning') {
      return {
        primary: 'sync_devices',
        secondary: ['log_vitals', 'ai_coach'],
        tone: 'educational'
      };
    }

    return {
      primary: 'maintain',
      secondary: ['ai_coach', 'challenges'],
      tone: 'supportive'
    };
  };

  const value = {
    healthTwin,
    twinState,
    recentVitals,
    activeSymptoms,
    interpretVital,
    getRiskAssessment,
    getActionRecommendation,
    getBaselineForMetric,
    isReady: !!healthTwin && twinState.status !== 'initializing',
    isLoading: twinLoading
  };

  return (
    <HealthTwinContext.Provider value={value}>
      {children}
    </HealthTwinContext.Provider>
  );
};