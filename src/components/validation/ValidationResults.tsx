"use client"

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ValidationResult } from '@/utils/validation/types';

interface ValidationResultsProps {
  validationResult: ValidationResult;
}

export const ValidationResults: React.FC<ValidationResultsProps> = ({ validationResult }) => {
  const { errors, warnings, summary, isValid } = validationResult;

  const getStatusIcon = () => {
    if (isValid && warnings.length === 0) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (isValid && warnings.length > 0) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (isValid && warnings.length === 0) return 'Valid';
    if (isValid && warnings.length > 0) return 'Valid with warnings';
    return 'Invalid';
  };

  const getStatusColor = () => {
    if (isValid && warnings.length === 0) return 'text-green-600';
    if (isValid && warnings.length > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Group errors by type for better organization
  const errorsByType = errors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = [];
    }
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, typeof errors>);

  const getErrorTypeTitle = (type: string) => {
    switch (type) {
      case 'missing_column':
        return 'Missing Required Columns';
      case 'invalid_data_type':
        return 'Invalid Data Types';
      case 'empty_required_field':
        return 'Empty Required Fields';
      case 'invalid_format':
        return 'Format Validation Errors';
      default:
        return 'Other Errors';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className={`border-2 ${isValid ? 'border-green-200' : 'border-red-200'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className={`text-lg ${getStatusColor()}`}>
              {getStatusText()}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Rows:</span> {summary.totalRows}
            </div>
            <div>
              <span className="font-medium">Valid Rows:</span> {summary.validRows}
            </div>
            <div>
              <span className="font-medium">Errors:</span> 
              <Badge variant={errors.length > 0 ? 'destructive' : 'secondary'} className="ml-2">
                {summary.errorCount}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Warnings:</span>
              <Badge variant={warnings.length > 0 ? 'secondary' : 'outline'} className="ml-2">
                {summary.warningCount}
              </Badge>
            </div>
          </div>
          
          {summary.columnCoverage < 100 && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center gap-2 text-yellow-800">
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Column Coverage: {summary.columnCoverage.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Missing Columns */}
      {summary.missingColumns.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Missing Required Columns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.missingColumns.map((column) => (
                <Badge key={column} variant="destructive">
                  {column}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extra Columns */}
      {summary.extraColumns.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Unexpected Columns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.extraColumns.map((column) => (
                <Badge key={column} variant="secondary">
                  {column}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              These columns are not expected for this file type but won't prevent processing.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Errors by Type */}
      {Object.entries(errorsByType).map(([type, typeErrors]) => (
        <Card key={type} className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {getErrorTypeTitle(type)} ({typeErrors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {typeErrors.slice(0, 10).map((error, index) => (
                <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                  <div className="font-medium text-red-800">
                    Column: {error.column}
                    {error.row && ` (Row ${error.row})`}
                  </div>
                  <div className="text-red-600">{error.message}</div>
                  {error.value !== undefined && (
                    <div className="text-xs text-red-500 mt-1">
                      Value: "{String(error.value)}"
                    </div>
                  )}
                </div>
              ))}
              {typeErrors.length > 10 && (
                <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-center">
                  ... and {typeErrors.length - 10} more errors
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Warnings ({warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {warnings.slice(0, 10).map((warning, index) => (
                <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <div className="font-medium text-yellow-800">
                    Column: {warning.column}
                    {warning.row && ` (Row ${warning.row})`}
                  </div>
                  <div className="text-yellow-600">{warning.message}</div>
                </div>
              ))}
              {warnings.length > 10 && (
                <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-center">
                  ... and {warnings.length - 10} more warnings
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};