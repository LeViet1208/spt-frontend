"use client"

import React, { useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, FileText, Download } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ValidationResult } from '@/utils/validation/types';
import { ValidationResults } from './ValidationResults';
import { DataPreview } from './DataPreview';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationResult: ValidationResult | null;
  onProceed: () => void;
  onReject: () => void;
  fileType: string;
  isProcessing?: boolean;
}

type TabType = 'summary' | 'preview' | 'details';

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  validationResult,
  onProceed,
  onReject,
  fileType,
  isProcessing = false
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  if (!validationResult) return null;

  const { isValid, errors, warnings, parsedData, summary } = validationResult;

  const getStatusInfo = () => {
    if (isValid && warnings.length === 0) {
      return {
        icon: <CheckCircle className="h-6 w-6 text-green-500" />,
        title: 'File Validation Successful',
        description: 'Your file passed all validation checks and is ready to be uploaded.',
        color: 'text-green-600'
      };
    }
    if (isValid && warnings.length > 0) {
      return {
        icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
        title: 'File Validation Passed with Warnings',
        description: 'Your file is valid but has some minor issues. You can proceed with the upload.',
        color: 'text-yellow-600'
      };
    }
    return {
      icon: <AlertCircle className="h-6 w-6 text-red-500" />,
      title: 'File Validation Failed',
      description: 'Your file has validation errors that must be fixed before upload.',
      color: 'text-red-600'
    };
  };

  const statusInfo = getStatusInfo();

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'Transaction File';
      case 'product_lookup':
        return 'Product Lookup File';
      case 'causal_lookup':
        return 'Causal Lookup File';
      default:
        return 'File';
    }
  };

  const handleDownloadReport = () => {
    const report = generateValidationReport(validationResult, fileType);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-report-${fileType}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'summary' as TabType, label: 'Summary', icon: FileText },
    { id: 'preview' as TabType, label: 'Data Preview', icon: FileText },
    { id: 'details' as TabType, label: 'Detailed Results', icon: AlertCircle }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {statusInfo.icon}
            <div>
              <DialogTitle className={statusInfo.color}>
                {statusInfo.title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {statusInfo.description}
              </DialogDescription>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {getFileTypeLabel(fileType)}
              </Badge>
              <Badge variant="secondary">
                {parsedData.fileName}
              </Badge>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadReport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </div>
        </DialogHeader>

        <Separator />

        {/* Tabs */}
        <div className="flex border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.id === 'details' && (errors.length > 0 || warnings.length > 0) && (
                  <Badge variant="secondary" className="ml-1">
                    {errors.length + warnings.length}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-1">
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{summary.totalRows}</div>
                  <div className="text-sm text-gray-600">Total Rows</div>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{summary.validRows}</div>
                  <div className="text-sm text-green-600">Valid Rows</div>
                </div>
                <div className="p-3 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">{summary.errorCount}</div>
                  <div className="text-sm text-red-600">Errors</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded">
                  <div className="text-2xl font-bold text-yellow-600">{summary.warningCount}</div>
                  <div className="text-sm text-yellow-600">Warnings</div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-medium text-blue-900 mb-2">File Information</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>File: {parsedData.fileName}</div>
                  <div>Columns: {parsedData.headers.length}</div>
                  <div>Column Coverage: {summary.columnCoverage.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <DataPreview validationResult={validationResult} maxRows={10} />
          )}

          {activeTab === 'details' && (
            <ValidationResults validationResult={validationResult} />
          )}
        </div>

        <Separator />

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onReject}>
            Choose Different File
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={onProceed}
              disabled={!isValid || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  {isValid ? 'Proceed with Upload' : 'Fix Errors First'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to generate validation report
const generateValidationReport = (validationResult: ValidationResult, fileType: string): string => {
  const { isValid, errors, warnings, parsedData, summary } = validationResult;
  
  let report = `Validation Report\n`;
  report += `================\n\n`;
  report += `File: ${parsedData.fileName}\n`;
  report += `File Type: ${fileType}\n`;
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  report += `Summary\n`;
  report += `-------\n`;
  report += `Status: ${isValid ? 'VALID' : 'INVALID'}\n`;
  report += `Total Rows: ${summary.totalRows}\n`;
  report += `Valid Rows: ${summary.validRows}\n`;
  report += `Error Count: ${summary.errorCount}\n`;
  report += `Warning Count: ${summary.warningCount}\n`;
  report += `Column Coverage: ${summary.columnCoverage.toFixed(1)}%\n\n`;
  
  if (errors.length > 0) {
    report += `Errors\n`;
    report += `------\n`;
    errors.forEach((error, index) => {
      report += `${index + 1}. ${error.message}\n`;
      if (error.row) report += `   Row: ${error.row}\n`;
      if (error.column) report += `   Column: ${error.column}\n`;
      if (error.value !== undefined) report += `   Value: "${error.value}"\n`;
      report += `\n`;
    });
  }
  
  if (warnings.length > 0) {
    report += `Warnings\n`;
    report += `--------\n`;
    warnings.forEach((warning, index) => {
      report += `${index + 1}. ${warning.message}\n`;
      if (warning.row) report += `   Row: ${warning.row}\n`;
      if (warning.column) report += `   Column: ${warning.column}\n`;
      report += `\n`;
    });
  }
  
  return report;
};