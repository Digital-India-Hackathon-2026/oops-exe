import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function ContextGateModal({ open, onAcknowledge }) {
  return (
    <Dialog open={open} modal>
      <DialogContent 
        className="max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideClose
      >
        <DialogTitle className="sr-only">About this demonstration</DialogTitle>
        <div className="py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              About this demonstration
            </h2>
          </div>

          <div className="space-y-4 mb-8">
            <p className="text-gray-700 leading-relaxed">
              This experience presents the <strong>conceptual intelligence and decision-making behavior</strong> of AUTRYST.
            </p>

            <p className="text-gray-700 leading-relaxed">
              The health metrics, alerts, and scenarios shown are <strong>simulated for demonstration purposes</strong> and 
              do not represent live or clinical medical data.
            </p>

            <p className="text-gray-700 leading-relaxed">
              The focus is on <strong>how the system continuously understands health, detects risk, and decides actions</strong> — 
              not on raw data precision.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                Real-world deployment would involve certified devices, regulatory compliance, and clinical validation.
              </p>
            </div>
          </div>

          <Button
            onClick={onAcknowledge}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-base rounded-xl"
          >
            I understand — show me the system
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}