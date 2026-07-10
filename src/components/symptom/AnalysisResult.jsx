import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Brain, 
  AlertCircle, 
  MessageCircle, 
  Users, 
  Bell, 
  Phone,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const riskConfig = {
  low: {
    icon: Activity,
    color: '#14B8A6',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    label: 'Low concern'
  },
  needs_attention: {
    icon: AlertCircle,
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    label: 'Needs attention'
  },
  potential_risk: {
    icon: AlertCircle,
    color: '#EF4444',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    label: 'Potential risk'
  }
};

export default function AnalysisResult({ analysis, onClose }) {
  if (!analysis) return null;

  const risk = riskConfig[analysis.riskStratification?.level || 'low'];
  const RiskIcon = risk.icon;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Health Signal Interpretation</h2>
              <p className="text-sm text-gray-500">AI-assisted clinical reasoning</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Section 1: Symptom Understanding */}
          <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-[#2563EB] mb-4 tracking-wide uppercase flex items-center gap-2">
              <Zap className="w-4 h-4" />
              What the system is observing
            </h3>
            <p className="text-gray-800 mb-4">{analysis.symptomUnderstanding?.summary}</p>
            
            {analysis.symptomUnderstanding?.bodySystems && (
              <div className="flex flex-wrap gap-2 mb-3">
                {analysis.symptomUnderstanding.bodySystems.map((system, idx) => (
                  <Badge key={idx} className="bg-white text-gray-700 border border-gray-300">
                    {system}
                  </Badge>
                ))}
              </div>
            )}

            {analysis.symptomUnderstanding?.pattern && (
              <p className="text-sm text-gray-600">
                <strong>Pattern:</strong> {analysis.symptomUnderstanding.pattern}
              </p>
            )}
          </div>

          {/* Section 2: Risk Stratification */}
          <div className={`${risk.bgColor} rounded-xl p-6 border-2`} style={{ borderColor: risk.color }}>
            <h3 className="text-sm font-semibold text-[#2563EB] mb-4 tracking-wide uppercase flex items-center gap-2">
              <RiskIcon className="w-4 h-4" />
              Risk Assessment
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: risk.color }}>
                <RiskIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className={`text-lg font-bold ${risk.textColor}`}>{risk.label}</div>
                <p className="text-sm text-gray-700">{analysis.riskStratification?.explanation}</p>
              </div>
            </div>
          </div>

          {/* Section 3: Health Twin Comparison */}
          {analysis.healthTwinComparison?.insights && analysis.healthTwinComparison.insights.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-[#14B8A6]">
              <h3 className="text-sm font-semibold text-[#2563EB] mb-4 tracking-wide uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Compared to your normal health pattern
              </h3>
              <ul className="space-y-2">
                {analysis.healthTwinComparison.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-[#14B8A6] mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 4: Diagnostic Reasoning */}
          {analysis.diagnosticReasoning?.suggestions && analysis.diagnosticReasoning.suggestions.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-[#2563EB] mb-4 tracking-wide uppercase">
                What additional information may help
              </h3>
              <ul className="space-y-2">
                {analysis.diagnosticReasoning.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-gray-400 mt-1">→</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 5: System Recommendation */}
          <div className="bg-[#2563EB] text-white rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4 tracking-wide uppercase opacity-90">
              What AUTRYST recommends now
            </h3>
            <div className="text-lg font-semibold mb-2">{analysis.systemRecommendation?.primaryPath}</div>
          </div>

          {/* Section 6: Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {analysis.actionButtons?.aiDoctor && (
              <Link to={createPageUrl('VideoCall')}>
                <Button className="w-full bg-[#14B8A6] hover:bg-[#0d9488] text-white">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Talk to AI Doctor
                </Button>
              </Link>
            )}
            
            {analysis.actionButtons?.shareFamily && (
              <Link to={createPageUrl('FamilyHealth')}>
                <Button className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
                  <Users className="w-4 h-4 mr-2" />
                  Share with Family
                </Button>
              </Link>
            )}
            
            {analysis.actionButtons?.monitoringAlert && (
              <Link to={createPageUrl('HealthAlerts')}>
                <Button className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
                  <Bell className="w-4 h-4 mr-2" />
                  Set Monitoring Alert
                </Button>
              </Link>
            )}
            
            {analysis.actionButtons?.emergencyHelp && (
              <Link to={createPageUrl('Emergency')}>
                <Button className="w-full bg-[#EF4444] hover:bg-[#dc2626] text-white">
                  <Phone className="w-4 h-4 mr-2" />
                  Request Emergency Help
                </Button>
              </Link>
            )}
          </div>

          {/* Section 7: Ethical Transparency */}
          <Alert className="bg-gray-50 border-gray-200">
            <AlertDescription className="text-xs text-gray-500">
              This is an AI-assisted health assessment, not a medical diagnosis. 
              All recommendations should be evaluated in consultation with qualified healthcare providers.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}