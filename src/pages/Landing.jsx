import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Brain, Zap, Shield, Users, FileText, Utensils, Heart } from "lucide-react";
import ContextGateModal from "@/components/landing/ContextGateModal";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Landing() {
  const [showContextModal, setShowContextModal] = useState(false);
  const navigate = useNavigate();

  const handleCTAClick = () => {
    setShowContextModal(true);
  };

  const handleAcknowledge = () => {
    sessionStorage.setItem("auryst_orientation_completed", "true");
    navigate(createPageUrl("Dashboard"));
  };

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      {/* 1. System Identity */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20 min-h-screen flex flex-col justify-center">
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span className="text-xs md:text-sm font-medium text-slate-600 tracking-wider uppercase">AUTRYST</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 md:mb-6 leading-tight tracking-tight">
            Healthcare shouldn't start when you're already sick.
          </h1>
          
          <p className="text-base md:text-xl lg:text-2xl text-slate-700 mb-3 md:mb-4 leading-relaxed">
            AUTRYST is a continuous health intelligence system that understands your body in real time and acts before emergencies happen.
          </p>
          
          <p className="text-xs md:text-sm text-slate-400 mb-8 md:mb-12">
            This is not a dashboard — it is a system that watches, thinks, and acts.
          </p>
        </div>

        <Button
          onClick={handleCTAClick}
          size="lg"
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 md:px-8 py-5 md:py-6 text-base md:text-lg w-full md:w-fit"
        >
          See how the system works
          <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
        </Button>
      </div>

      {/* 2. The Core Failure */}
      <div className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 md:mb-12">
            The failure of modern healthcare
          </h2>
          
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-900 rounded-full mt-2 flex-shrink-0" />
              <p className="text-base md:text-xl text-slate-700">Healthcare reacts after damage</p>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-900 rounded-full mt-2 flex-shrink-0" />
              <p className="text-base md:text-xl text-slate-700">Health is invisible between visits</p>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-900 rounded-full mt-2 flex-shrink-0" />
              <p className="text-base md:text-xl text-slate-700">Emergencies escalate too late</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. System Overview */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-10 md:mb-16">
          What AUTRYST actually does
        </h2>
        
        <div className="space-y-12">
          <div className="flex items-start gap-6">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Activity className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Continuous Signals</h3>
              <p className="text-slate-600">Vitals, behavior, food, sleep, history</p>
            </div>
          </div>

          <div className="flex items-start gap-6">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">AI Health Twin</h3>
              <p className="text-slate-600">A living digital model of the user's normal state</p>
            </div>
          </div>

          <div className="flex items-start gap-6">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Deviation Detection</h3>
              <p className="text-slate-600">Early risks identified before symptoms escalate</p>
            </div>
          </div>

          <div className="flex items-start gap-6">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Action Intelligence</h3>
              <p className="text-slate-600">Alerts → family → emergency → doctor</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Feature Understanding */}
      <div className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-16">
            How the system expresses itself
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Brain className="w-5 h-5 text-slate-900" />
                <h3 className="text-lg font-semibold text-slate-900">Intelligence Layer</h3>
              </div>
              <ul className="space-y-3 text-slate-600">
                <li>Health Twin</li>
                <li>Symptom reasoning</li>
                <li>Predictive alerts</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-slate-900" />
                <h3 className="text-lg font-semibold text-slate-900">Action Layer</h3>
              </div>
              <ul className="space-y-3 text-slate-600">
                <li>AI consultation</li>
                <li>Emergency escalation</li>
                <li>Doctor access</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-slate-900" />
                <h3 className="text-lg font-semibold text-slate-900">Support Layer</h3>
              </div>
              <ul className="space-y-3 text-slate-600">
                <li>Medical OCR</li>
                <li>Food analysis</li>
                <li>Family health view</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Real-World Scenario */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-12">
          What this looks like in reality
        </h2>
        
        <div className="bg-slate-50 rounded-2xl p-10 border border-slate-200">
          <p className="text-base md:text-xl text-slate-700 leading-relaxed">
            A gradual heart-rate anomaly goes unnoticed. AUTRYST detects deviation, alerts family, and recommends intervention — before a crisis occurs.
          </p>
        </div>
      </div>

      {/* 6. Differentiation */}
      <div className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 md:mb-12">
            Why this is different
          </h2>
          
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Traditional Systems</h3>
                <ul className="space-y-4 text-slate-600">
                  <li>Snapshot-based</li>
                  <li>User-driven</li>
                  <li>Reactive</li>
                  <li>Individual</li>
                  <li>Data storage</li>
                </ul>
              </div>
              
              <div className="p-6 md:p-8 bg-slate-900">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">AUTRYST</h3>
                <ul className="space-y-4 text-white">
                  <li>Continuous</li>
                  <li>AI-initiated</li>
                  <li>Preventive</li>
                  <li>Family-aware</li>
                  <li>Intelligence system</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Trust & Responsibility */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="space-y-4 md:space-y-6 text-slate-600">
          <p className="text-base md:text-lg">Built as an AI-native healthcare intelligence system</p>
          <p className="text-base md:text-lg">Designed for prevention, not dashboards</p>
          <p className="text-base md:text-lg">Oriented toward real-world deployment</p>
        </div>
      </div>

      {/* 8. Final CTA */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20 text-center">
          <Button
            onClick={handleCTAClick}
            size="lg"
            className="bg-white hover:bg-slate-100 text-slate-900 px-8 md:px-10 py-6 md:py-7 text-base md:text-lg font-semibold w-full md:w-auto"
          >
            Enter the Health Intelligence System
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
          </Button>
        </div>
      </div>

      <ContextGateModal 
        open={showContextModal}
        onAcknowledge={handleAcknowledge}
      />
    </div>
  );
}