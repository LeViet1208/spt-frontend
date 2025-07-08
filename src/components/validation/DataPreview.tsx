"use client"

import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ValidationResult } from '@/utils/validation/types';

interface DataPreviewProps {
  validationResult: ValidationResult;
  maxRows?: number;
}

export const DataPreview: React.FC<DataPreviewProps> = ({ 
  validationResult, 
  maxRows = 5 
}) => {
  const { parsedData, errors } = validationResult;
  const { headers, preview } = parsedData;

  // Create a map of errors by row and column for quick lookup
  const errorMap = new Map<string, string[]>();
  errors.forEach(error => {
    if (error.row && error.column) {
      const key = `${error.row}-${error.column}`;
      if (!errorMap.has(key)) {
        errorMap.set(key, []);
      }
      errorMap.get(key)?.push(error.message);
    }
  });

  // Check if a cell has errors
  const getCellErrors = (rowIndex: number, columnName: string): string[] => {
    const actualRowNumber = rowIndex + 2; // +2 because preview is 0-indexed and we skip header
    const key = `${actualRowNumber}-${columnName}`;
    return errorMap.get(key) || [];
  };

  // Get cell styling based on validation status
  const getCellClassName = (rowIndex: number, columnName: string): string => {
    const cellErrors = getCellErrors(rowIndex, columnName);
    const baseClasses = "p-2 text-sm border-r border-gray-200 last:border-r-0";
    
    if (cellErrors.length > 0) {
      return `${baseClasses} bg-red-50 border-red-200 text-red-900`;
    }
    
    return `${baseClasses} bg-white`;
  };

  // Format cell value for display
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  };

  // Check if column has any errors
  const columnHasErrors = (columnName: string): boolean => {
    return errors.some(error => error.column === columnName);
  };

  const displayData = preview.slice(0, maxRows);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Data Preview
          <Badge variant="outline">
            Showing {displayData.length} of {parsedData.rowCount} rows
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {headers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No data to preview
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
              {/* Header Row */}
              <thead>
                <tr className="bg-gray-50">
                  {headers.map((header, index) => (
                    <th 
                      key={index}
                      className={`p-2 text-left text-sm font-medium border-r border-gray-200 last:border-r-0 ${
                        columnHasErrors(header) ? 'bg-red-100 text-red-800' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-32" title={header}>
                          {header}
                        </span>
                        {columnHasErrors(header) ? (
                          <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              {/* Data Rows */}
              <tbody>
                {displayData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-gray-200 last:border-b-0">
                    {headers.map((header, colIndex) => {
                      const cellValue = row[header];
                      const cellErrors = getCellErrors(rowIndex, header);
                      
                      return (
                        <td 
                          key={colIndex}
                          className={getCellClassName(rowIndex, header)}
                          title={cellErrors.length > 0 ? cellErrors.join('; ') : undefined}
                        >
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-32">
                              {formatCellValue(cellValue)}
                            </span>
                            {cellErrors.length > 0 && (
                              <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Show indication if there are more rows */}
            {parsedData.rowCount > maxRows && (
              <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-center text-sm text-muted-foreground">
                ... and {parsedData.rowCount - maxRows} more rows
              </div>
            )}
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
            <span>Cells with errors</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Valid columns</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <span>Columns with errors</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};