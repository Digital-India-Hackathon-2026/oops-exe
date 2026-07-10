import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function VoiceAssistant({ isDemoMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleVoiceClick = () => {
    setIsOpen(!isOpen);
  };

  const startListening = () => {
    setIsListening(true);
    // Simulate listening
    setTimeout(() => {
      setIsListening(false);
      alert(isDemoMode ? 
        "Demo Mode: Voice assistant would respond here with health insights based on your data." :
        "Voice assistant feature coming soon! Connect your AI health coach for personalized voice interactions."
      );
    }, 2000);
  };

  return (
    <>
      {/* Floating Voice Button */}
      <motion.div
        className="fixed bottom-24 right-8 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
      >
        <motion.button
          onClick={handleVoiceClick}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-2xl cursor-pointer relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            boxShadow: ['0 0 20px rgba(168, 85, 247, 0.5)', '0 0 40px rgba(168, 85, 247, 0.8)', '0 0 20px rgba(168, 85, 247, 0.5)'],
          }}
          transition={{
            boxShadow: {
              duration: 2,
              repeat: Infinity,
            }
          }}
        >
          <Mic className="w-7 h-7 text-white" />
          {isDemoMode && (
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Voice Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-44 right-8 z-50 w-80"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                      animate={isListening ? {
                        scale: [1, 1.2, 1],
                      } : {}}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                      }}
                    >
                      {isListening ? <Volume2 className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-white">AI Voice Coach</h3>
                      <p className="text-xs text-white/80">Ask me anything</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                {isListening ? (
                  <motion.div
                    className="flex flex-col items-center justify-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4"
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      <Volume2 className="w-10 h-10 text-white" />
                    </motion.div>
                    <p className="text-gray-600 text-center">Listening...</p>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 text-center">
                      Press and hold to ask about your health
                    </p>
                    
                    <motion.button
                      onMouseDown={startListening}
                      onTouchStart={startListening}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Mic className="w-5 h-5" />
                        Press to Talk
                      </div>
                    </motion.button>

                    {isDemoMode && (
                      <Badge className="w-full bg-blue-50 text-blue-700 border-blue-200 justify-center">
                        Demo Mode: Simulated Responses
                      </Badge>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Try asking:</p>
                      <div className="space-y-2">
                        {[
                          "How's my health today?",
                          "What are my vitals?",
                          "Show my progress"
                        ].map((suggestion, index) => (
                          <motion.button
                            key={index}
                            onClick={() => {
                              setIsListening(true);
                              setTimeout(() => {
                                setIsListening(false);
                                alert(`Demo Response: Your health is looking great! Your ${suggestion.toLowerCase()} shows positive trends.`);
                              }, 2000);
                            }}
                            className="w-full text-left text-xs text-gray-600 hover:text-purple-600 hover:bg-purple-50 p-2 rounded-lg transition-colors"
                            whileHover={{ x: 5 }}
                          >
                            "  {suggestion}"
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}