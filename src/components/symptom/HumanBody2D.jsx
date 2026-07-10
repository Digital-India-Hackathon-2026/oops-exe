import React from 'react';
import { motion } from 'framer-motion';

const bodyPartPaths = {
  Head: "M100 15 C 110 5, 140 5, 150 15 C 160 25, 160 55, 150 65 C 140 75, 110 75, 100 65 C 90 55, 90 25, 100 15 Z",
  Chest: "M105 85 L 145 85 L 140 125 L 110 125 Z",
  Abdomen: "M108 130 L 142 130 L 138 165 L 112 165 Z",
  'Left Arm': "M105 90 L 85 90 L 80 145 L 100 145 Z",
  'Right Arm': "M145 90 L 165 90 L 170 145 L 150 145 Z",
  'Left Leg': "M115 170 L 125 170 L 120 235 L 110 235 Z",
  'Right Leg': "M135 170 L 125 170 L 130 235 L 140 235 Z",
};

export default function HumanBody2D({ highlightedParts, onPartClick }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg viewBox="0 0 250 250" className="w-full max-w-xs h-auto">
        {/* Head fill background */}
        <ellipse cx="125" cy="40" rx="25" ry="30" fill="#93c5fd" opacity="0.8" />
        <g stroke="#cbd5e1" strokeWidth="2.5" fill="none">
          {/* Head outline */}
          <ellipse cx="125" cy="40" rx="25" ry="30" />
          {/* Body outline */}
          <rect x="107" y="85" width="36" height="40" />
          <rect x="110" y="130" width="30" height="35" />
          {/* Arms */}
          <path d="M107 90 L85 95" />
          <path d="M143 90 L165 95" />
          {/* Legs */}
          <path d="M118 170 L113 235" />
          <path d="M132 170 L137 235" />
        </g>
        {Object.entries(bodyPartPaths).map(([name, d]) => {
          const isHighlighted = highlightedParts.includes(name);
          return (
            <motion.path
              key={name}
              d={d}
              onClick={() => onPartClick(name)}
              fill={isHighlighted ? 'rgba(239, 68, 68, 0.8)' : name === 'Head' ? '#93c5fd' : '#d1d5db'}
              stroke={isHighlighted ? '#ef4444' : '#cbd5e1'}
              strokeWidth="2"
              className="cursor-pointer transition-all duration-300"
              whileHover={{ fill: isHighlighted ? 'rgba(239, 68, 68, 0.95)' : name === 'Head' ? '#60a5fa' : '#9ca3af' }}
              animate={{
                scale: isHighlighted ? [1, 1.05, 1] : 1,
                opacity: 1,
              }}
              transition={{
                scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <title>{name}</title>
            </motion.path>
          );
        })}
      </svg>
    </div>
  );
}