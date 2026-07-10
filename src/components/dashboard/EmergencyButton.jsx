import React from 'react';
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function EmergencyButton() {
  const navigate = useNavigate();

  const handleEmergency = () => {
    navigate(createPageUrl("Emergency"));
  };

  return (
    <motion.div
      className="fixed bottom-8 right-8 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.7, type: "spring", stiffness: 200 }}
    >
      <motion.button
        onClick={handleEmergency}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-2xl cursor-pointer relative"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: ['0 0 20px rgba(239, 68, 68, 0.5)', '0 0 40px rgba(239, 68, 68, 0.9)', '0 0 20px rgba(239, 68, 68, 0.5)'],
        }}
        transition={{
          boxShadow: {
            duration: 1.5,
            repeat: Infinity,
          }
        }}
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          <AlertTriangle className="w-7 h-7 text-white" fill="currentColor" />
        </motion.div>
        
        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-red-500"
          animate={{
            scale: [1, 1.5, 1.5],
            opacity: [1, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      </motion.button>
      
      <motion.div
        className="absolute -top-12 right-0 bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        Emergency SOS
      </motion.div>
    </motion.div>
  );
}