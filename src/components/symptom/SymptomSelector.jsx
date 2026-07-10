import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const commonSymptoms = [
  { id: 'headache', label: 'Headache', region: 'head' },
  { id: 'chest_pain', label: 'Chest Pain', region: 'chest' },
  { id: 'breathing_difficulty', label: 'Breathing Difficulty', region: 'chest' },
  { id: 'abdominal_pain', label: 'Abdominal Pain', region: 'abdomen' },
  { id: 'nausea', label: 'Nausea', region: 'abdomen' },
  { id: 'dizziness', label: 'Dizziness', region: 'head' },
  { id: 'fatigue', label: 'Fatigue', region: 'chest' },
  { id: 'fever', label: 'Fever', region: 'chest' },
  { id: 'cough', label: 'Cough', region: 'chest' },
  { id: 'back_pain', label: 'Back Pain', region: 'abdomen' },
  { id: 'joint_pain', label: 'Joint Pain', region: 'right_leg' },
  { id: 'numbness', label: 'Numbness', region: 'left_arm' }
];

const contextOptions = {
  duration: ['minutes', 'hours', 'days', 'weeks'],
  severity: ['mild', 'moderate', 'severe'],
  pattern: ['constant', 'intermittent'],
  trigger: ['rest', 'movement', 'food', 'stress']
};

export default function SymptomSelector({ selectedSymptoms, onSymptomsChange, onAnalyze }) {
  const [uploadingReport, setUploadingReport] = useState(false);
  const [uploadedReports, setUploadedReports] = useState([]);

  const handleSymptomToggle = (symptom) => {
    const existing = selectedSymptoms.find(s => s.id === symptom.id);
    if (existing) {
      onSymptomsChange(selectedSymptoms.filter(s => s.id !== symptom.id));
    } else {
      onSymptomsChange([...selectedSymptoms, {
        id: symptom.id,
        label: symptom.label,
        region: symptom.region,
        duration: 'hours',
        severity: 'moderate',
        pattern: 'constant',
        trigger: null
      }]);
    }
  };

  const updateSymptomContext = (symptomId, field, value) => {
    onSymptomsChange(selectedSymptoms.map(s => 
      s.id === symptomId ? { ...s, [field]: value } : s
    ));
  };

  const handleReportUpload = async (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'scan' ? 'image/*,application/pdf' : 'application/pdf,image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploadingReport(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        // First, validate if this is a medical report
        const validationPrompt = `Analyze this document and determine if it is a valid medical report (lab report, scan report, imaging report, blood test, X-ray, MRI, CT scan, etc.).

Return a JSON response indicating:
1. Whether this is a medical report (true/false)
2. If yes, what type of medical report it is
3. If no, what type of document it appears to be

Be strict - only accept actual medical/diagnostic reports.`;

        const validation = await base44.integrations.Core.InvokeLLM({
          prompt: validationPrompt,
          file_urls: [file_url],
          response_json_schema: {
            type: 'object',
            properties: {
              is_medical_report: { type: 'boolean' },
              report_type: { type: 'string' },
              document_type: { type: 'string' }
            }
          }
        });

        if (!validation.is_medical_report) {
          alert(`❌ Invalid File\n\nThis does not appear to be a medical report.\n\nDetected: ${validation.document_type}\n\nPlease upload a valid ${type === 'scan' ? 'scan/imaging report' : 'lab report'} (MRI, CT, X-ray, blood tests, etc.)`);
          setUploadingReport(false);
          return;
        }

        // If valid, extract structured data
        const extractionSchema = {
          type: 'object',
          properties: {
            findings: { type: 'array', items: { type: 'string' } },
            measurements: { type: 'object' },
            impression: { type: 'string' },
            test_name: { type: 'string' },
            date: { type: 'string' }
          }
        };

        const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: extractionSchema
        });

        if (result.status === 'success') {
          setUploadedReports([...uploadedReports, {
            type,
            fileName: file.name,
            data: result.output,
            url: file_url,
            reportType: validation.report_type
          }]);
        } else {
          alert('⚠️ Could not extract data from the report. Please ensure the document is clear and readable.');
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert('❌ Upload failed. Please try again.');
      } finally {
        setUploadingReport(false);
      }
    };
    input.click();
  };

  const isSelected = (symptomId) => selectedSymptoms.some(s => s.id === symptomId);

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      {/* Symptom Selection */}
      <div className="p-6 pb-4">
        <h3 className="text-sm font-semibold text-[#2563EB] mb-3 tracking-wide uppercase">
          Select Symptoms
        </h3>
        <div className="flex flex-wrap gap-2">
          {commonSymptoms.map(symptom => (
            <Badge
              key={symptom.id}
              onClick={() => handleSymptomToggle(symptom)}
              className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${
                isSelected(symptom.id)
                  ? 'bg-[#2563EB] text-white hover:bg-[#1d4ed8]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {symptom.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Context for selected symptoms */}
      {selectedSymptoms.length > 0 && (
        <div className="px-6 pb-4 space-y-4">
          <h3 className="text-sm font-semibold text-[#2563EB] mb-3 tracking-wide uppercase">
            Context (Optional)
          </h3>
          {selectedSymptoms.map(symptom => (
            <div key={symptom.id} className="p-4 bg-[#F7F9FB] rounded-lg border border-gray-200">
              <div className="font-medium text-gray-900 mb-4">{symptom.label}</div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">Duration</div>
                    <div className="flex flex-wrap gap-1.5">
                      {contextOptions.duration.map(opt => (
                        <button
                          key={opt}
                          onClick={() => updateSymptomContext(symptom.id, 'duration', opt)}
                          className={`px-2.5 py-1.5 text-xs rounded transition-colors ${
                            symptom.duration === opt
                              ? 'bg-[#14B8A6] text-white'
                              : 'bg-white text-gray-600 border border-gray-200 hover:border-[#14B8A6]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">Severity</div>
                    <div className="flex flex-wrap gap-1.5">
                      {contextOptions.severity.map(opt => (
                        <button
                          key={opt}
                          onClick={() => updateSymptomContext(symptom.id, 'severity', opt)}
                          className={`px-2.5 py-1.5 text-xs rounded transition-colors ${
                            symptom.severity === opt
                              ? opt === 'severe' ? 'bg-[#EF4444] text-white' :
                                opt === 'moderate' ? 'bg-[#F59E0B] text-white' :
                                'bg-[#14B8A6] text-white'
                              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">Pattern</div>
                    <div className="flex flex-wrap gap-1.5">
                      {contextOptions.pattern.map(opt => (
                        <button
                          key={opt}
                          onClick={() => updateSymptomContext(symptom.id, 'pattern', opt)}
                          className={`px-2.5 py-1.5 text-xs rounded transition-colors ${
                            symptom.pattern === opt
                              ? 'bg-[#14B8A6] text-white'
                              : 'bg-white text-gray-600 border border-gray-200 hover:border-[#14B8A6]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">Trigger</div>
                    <div className="flex flex-wrap gap-1.5">
                      {contextOptions.trigger.map(opt => (
                        <button
                          key={opt}
                          onClick={() => updateSymptomContext(symptom.id, 'trigger', opt)}
                          className={`px-2.5 py-1.5 text-xs rounded transition-colors ${
                            symptom.trigger === opt
                              ? 'bg-[#14B8A6] text-white'
                              : 'bg-white text-gray-600 border border-gray-200 hover:border-[#14B8A6]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diagnostic Context */}
      <div className="px-6 pb-4">
        <h3 className="text-sm font-semibold text-[#2563EB] mb-3 tracking-wide uppercase">
          Diagnostic Context (Optional)
        </h3>
        <div className="space-y-2">
          <Button
            onClick={() => handleReportUpload('scan')}
            variant="outline"
            className="w-full justify-start text-gray-700 border-gray-200 hover:bg-[#F7F9FB]"
            disabled={uploadingReport}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Scan Report
          </Button>
          <Button
            onClick={() => handleReportUpload('lab')}
            variant="outline"
            className="w-full justify-start text-gray-700 border-gray-200 hover:bg-[#F7F9FB]"
            disabled={uploadingReport}
          >
            <FileText className="w-4 h-4 mr-2" />
            Upload Lab Report
          </Button>
        </div>

        {uploadedReports.length > 0 && (
          <div className="mt-3 space-y-2">
            {uploadedReports.map((report, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{report.fileName}</div>
                  <div className="text-xs text-gray-500">{report.reportType}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3">
          Reports are interpreted as structured context, not analyzed as raw images.
        </p>
      </div>

      {/* Analyze Button */}
      <div className="mt-auto p-6 pt-4 border-t border-gray-200 bg-white">
        <Button
          onClick={() => onAnalyze(uploadedReports)}
          disabled={selectedSymptoms.length === 0}
          className="w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white py-6 text-base font-semibold"
        >
          Analyze My Symptoms
        </Button>
      </div>
    </div>
  );
}