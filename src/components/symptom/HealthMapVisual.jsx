import React from 'react';
import { motion } from 'framer-motion';

const bodyRegions = {
  head: { 
    label: 'Head', 
    symptoms: ['headache', 'migraine', 'dizziness', 'vision_issues'],
    // Perfect rounded head shape
    shape: <ellipse cx="150" cy="55" rx="32" ry="38" />
  },
  chest: { 
    label: 'Chest', 
    symptoms: ['chest_pain', 'breathing_difficulty', 'palpitations', 'cough'],
    // Perfect rectangular chest
    shape: <rect x="118" y="95" width="64" height="50" rx="2" />
  },
  abdomen: { 
    label: 'Abdomen', 
    symptoms: ['abdominal_pain', 'nausea', 'bloating', 'digestive_issues'],
    // Perfect rectangular abdomen
    shape: <rect x="122" y="148" width="56" height="48" rx="2" />
  },
  left_arm: { 
    label: 'Left Arm', 
    symptoms: ['arm_pain', 'numbness', 'weakness'],
    // Perfect left arm trapezoid
    shape: <path d="M 185 98 L 206 103 L 214 178 L 193 173 Z" />
  },
  right_arm: { 
    label: 'Right Arm', 
    symptoms: ['arm_pain', 'numbness', 'weakness'],
    // Perfect right arm trapezoid
    shape: <path d="M 115 98 L 94 103 L 86 178 L 107 173 Z" />
  },
  left_leg: { 
    label: 'Left Leg', 
    symptoms: ['leg_pain', 'joint_pain', 'swelling'],
    // Perfect left leg
    shape: <path d="M 157 199 L 172 199 L 178 318 L 163 318 Z" />
  },
  right_leg: { 
    label: 'Right Leg', 
    symptoms: ['leg_pain', 'joint_pain', 'swelling'],
    // Perfect right leg
    shape: <path d="M 143 199 L 128 199 L 122 318 L 137 318 Z" />
  }
};

export default function HealthMapVisual({ selectedSymptoms, onRegionClick }) {
  const getRegionState = (regionKey) => {
    const region = bodyRegions[regionKey];
    const matchingSymptoms = selectedSymptoms.filter(s => 
      region.symptoms.includes(s.id)
    );
    
    if (matchingSymptoms.length === 0) return { active: false, severity: 0 };
    
    const maxSeverity = Math.max(...matchingSymptoms.map(s => {
      if (s.severity === 'severe') return 3;
      if (s.severity === 'moderate') return 2;
      return 1;
    }));
    
    return { active: true, severity: maxSeverity };
  };

  const getRegionColor = (severity) => {
    if (severity === 3) return '#EF4444'; // High risk red
    if (severity === 2) return '#F59E0B'; // Warning amber
    return '#14B8A6'; // Teal
  };

  return (
    <div className="w-full h-full flex items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-md aspect-[3/4]">
        <svg 
          viewBox="0 0 300 400" 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.06))'
          }}
        >
          {/* Static body outline - precise borders */}
          <g stroke="#93C5FD" strokeWidth="2.5" fill="none" opacity="0.4">
            {/* Head outline */}
            <ellipse cx="150" cy="55" rx="32" ry="38" />
            {/* Neck */}
            <line x1="150" y1="93" x2="150" y2="98" />
            {/* Chest outline */}
            <rect x="118" y="95" width="64" height="50" rx="2" />
            {/* Abdomen outline */}
            <rect x="122" y="148" width="56" height="48" rx="2" />
            {/* Arms outline */}
            <path d="M 185 98 L 206 103 L 214 178 L 193 173 Z" />
            <path d="M 115 98 L 94 103 L 86 178 L 107 173 Z" />
            {/* Legs outline */}
            <path d="M 157 199 L 172 199 L 178 318 L 163 318 Z" />
            <path d="M 143 199 L 128 199 L 122 318 L 137 318 Z" />
          </g>
          
          {/* Interactive body regions with perfect shapes */}
          {Object.entries(bodyRegions).map(([key, region]) => {
            const state = getRegionState(key);
            const color = state.active ? getRegionColor(state.severity) : '#E5E7EB';
            const fillOpacity = state.active ? 0.5 : 0.2;
            const strokeColor = state.active ? color : '#9CA3AF';
            
            return (
              <motion.g 
                key={key}
                style={{ cursor: 'pointer' }}
                whileHover={{ opacity: 0.8 }}
                onClick={() => onRegionClick && onRegionClick(key)}
              >
                {/* Glow effect for active regions */}
                {state.active && (
                  <motion.g
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {React.cloneElement(region.shape, {
                      fill: color,
                      opacity: 0.3,
                      stroke: 'none',
                      filter: 'blur(6px)'
                    })}
                  </motion.g>
                )}
                
                {/* Main clickable shape with perfect borders */}
                {React.cloneElement(region.shape, {
                  fill: color,
                  fillOpacity: fillOpacity,
                  stroke: strokeColor,
                  strokeWidth: '2.5',
                  className: 'transition-all duration-300'
                })}
                
                {/* Hover highlight overlay */}
                <motion.g
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 0.15 }}
                  transition={{ duration: 0.2 }}
                >
                  {React.cloneElement(region.shape, {
                    fill: '#ffffff',
                    stroke: 'none'
                  })}
                </motion.g>
              </motion.g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}