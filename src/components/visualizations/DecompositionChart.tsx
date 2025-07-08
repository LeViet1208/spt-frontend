"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DecompositionResult } from "@/utils/types/decomposition";

// Dynamically import Plot to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface DecompositionChartProps {
  data: { [key: string]: DecompositionResult };
  title?: string;
  description?: string;
  chartType?: 'bar' | 'waterfall' | 'pie' | 'heatmap';
  onChartTypeChange?: (type: 'bar' | 'waterfall' | 'pie' | 'heatmap') => void;
  onExport?: () => void;
  className?: string;
}

export const DecompositionChart: React.FC<DecompositionChartProps> = ({
  data,
  title = "Demand Change Decomposition",
  description = "Breakdown of demand changes across 18 categories",
  chartType = 'bar',
  onChartTypeChange,
  onExport,
  className,
}) => {
  const processedData = useMemo(() => {
    const entries = Object.entries(data);
    return entries.map(([key, result]) => ({
      key,
      name: result.name,
      description: result.description,
      percentage: result.percentage_change,
      absolute: result.absolute_change,
      confidence: result.confidence_level,
    }));
  }, [data]);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeIcon = (percentage: number) => {
    if (percentage > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (percentage < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getPlotData = () => {
    switch (chartType) {
      case 'bar':
        return [
          {
            x: processedData.map(d => d.name),
            y: processedData.map(d => d.percentage),
            type: 'bar' as const,
            name: 'Percentage Change',
            marker: {
              color: processedData.map(d => 
                d.percentage > 0 ? '#10b981' : d.percentage < 0 ? '#ef4444' : '#6b7280'
              ),
              opacity: processedData.map(d => 
                d.confidence === 'high' ? 0.9 : d.confidence === 'medium' ? 0.7 : 0.5
              ),
            },
            hovertemplate: 
              '<b>%{x}</b><br>' +
              'Change: %{y:.2f}%<br>' +
              '<extra></extra>',
          },
        ];

      case 'waterfall':
        const cumulativeData: Array<{ x: string; y: number; cumulative: number }> = [];
        let cumulative = 0;
        processedData.forEach(d => {
          cumulativeData.push({
            x: d.name,
            y: d.percentage,
            cumulative: cumulative + d.percentage,
          });
          cumulative += d.percentage;
        });

        return [
          {
            x: cumulativeData.map(d => d.x),
            y: cumulativeData.map(d => d.y),
            type: 'waterfall' as const,
            name: 'Cumulative Change',
            connector: { line: { color: '#6b7280' } },
            increasing: { marker: { color: '#10b981' } },
            decreasing: { marker: { color: '#ef4444' } },
            totals: { marker: { color: '#3b82f6' } },
          },
        ];

      case 'pie':
        const positiveData = processedData.filter(d => d.percentage > 0);
        return [
          {
            labels: positiveData.map(d => d.name),
            values: positiveData.map(d => Math.abs(d.percentage)),
            type: 'pie' as const,
            name: 'Positive Changes',
            hovertemplate: 
              '<b>%{label}</b><br>' +
              'Change: %{value:.2f}%<br>' +
              'Percentage: %{percent}<br>' +
              '<extra></extra>',
          },
        ];

      case 'heatmap':
        // Group by characteristics for heatmap
        const timeMap = new Map<string, Map<string, number>>();
        
        processedData.forEach(d => {
          // Extract time period from description (simplified)
          const timePeriod = d.description.includes('current') ? 'Current' :
                           d.description.includes('pre') ? 'Pre' :
                           d.description.includes('post') ? 'Post' : 'Other';
          
          const category = d.name.split(' ')[0]; // First word as category
          
          if (!timeMap.has(timePeriod)) {
            timeMap.set(timePeriod, new Map());
          }
          timeMap.get(timePeriod)!.set(category, d.percentage);
        });

        const timePeriods = Array.from(timeMap.keys());
        const categories = Array.from(new Set(
          Array.from(timeMap.values()).flatMap(m => Array.from(m.keys()))
        ));

        const zData = timePeriods.map(time =>
          categories.map(cat => timeMap.get(time)?.get(cat) || 0)
        );

        return [
          {
            z: zData,
            x: categories,
            y: timePeriods,
            type: 'heatmap' as const,
            colorscale: 'RdYlGn',
            hoverongaps: false,
            hovertemplate: 
              '<b>%{y} - %{x}</b><br>' +
              'Change: %{z:.2f}%<br>' +
              '<extra></extra>',
          },
        ];

      default:
        return [];
    }
  };

  const getPlotLayout = (): any => {
    const baseLayout = {
      title: {
        text: title,
        x: 0.5,
        xanchor: 'center' as const,
      },
      height: 500,
      margin: { t: 60, r: 50, b: 100, l: 60 },
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
    };

    switch (chartType) {
      case 'bar':
        return {
          ...baseLayout,
          xaxis: {
            title: { text: 'Decomposition Categories' },
            tickangle: -45,
            automargin: true,
          },
          yaxis: {
            title: { text: 'Percentage Change (%)' },
            zeroline: true,
            zerolinecolor: '#6b7280',
            zerolinewidth: 1,
          },
        };

      case 'waterfall':
        return {
          ...baseLayout,
          xaxis: {
            title: { text: 'Decomposition Categories' },
            tickangle: -45,
            automargin: true,
          },
          yaxis: {
            title: { text: 'Cumulative Change (%)' },
          },
        };

      case 'pie':
        return {
          ...baseLayout,
          showlegend: true,
          legend: {
            orientation: 'v' as const,
            x: 1.02,
            y: 0.5,
          },
        };

      case 'heatmap':
        return {
          ...baseLayout,
          xaxis: {
            title: { text: 'Categories' },
            side: 'bottom' as const,
          },
          yaxis: {
            title: { text: 'Time Periods' },
            autorange: 'reversed' as const,
          },
        };

      default:
        return baseLayout;
    }
  };

  const totalChange = processedData.reduce((sum, d) => sum + d.percentage, 0);
  const positiveChanges = processedData.filter(d => d.percentage > 0).length;
  const negativeChanges = processedData.filter(d => d.percentage < 0).length;
  const highConfidence = processedData.filter(d => d.confidence === 'high').length;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={chartType} onValueChange={onChartTypeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="waterfall">Waterfall</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
                <SelectItem value="heatmap">Heatmap</SelectItem>
              </SelectContent>
            </Select>
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Total Change</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {positiveChanges}
            </div>
            <div className="text-sm text-muted-foreground">Positive</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {negativeChanges}
            </div>
            <div className="text-sm text-muted-foreground">Negative</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {highConfidence}
            </div>
            <div className="text-sm text-muted-foreground">High Confidence</div>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full overflow-hidden rounded-lg border">
          <Plot
            data={getPlotData()}
            layout={getPlotLayout()}
            config={{
              responsive: true,
              displayModeBar: true,
              displaylogo: false,
              modeBarButtonsToRemove: [
                'pan2d',
                'lasso2d',
                'select2d',
                'autoScale2d',
                'hoverClosestCartesian',
                'hoverCompareCartesian',
              ],
            }}
            style={{ width: '100%' }}
          />
        </div>

        {/* Data Table */}
        <div className="space-y-2">
          <h4 className="font-medium">Decomposition Details</h4>
          <div className="rounded-lg border">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="text-left p-2 border-b">Category</th>
                    <th className="text-right p-2 border-b">Change %</th>
                    <th className="text-right p-2 border-b">Absolute</th>
                    <th className="text-center p-2 border-b">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {processedData
                    .sort((a, b) => Math.abs(b.percentage) - Math.abs(a.percentage))
                    .map((item, index) => (
                      <tr key={item.key} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                        <td className="p-2 border-b">
                          <div className="flex items-center gap-2">
                            {getChangeIcon(item.percentage)}
                            <span className="truncate" title={item.description}>
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="text-right p-2 border-b font-mono">
                          <span className={cn(
                            "font-medium",
                            item.percentage > 0 ? "text-green-600" : 
                            item.percentage < 0 ? "text-red-600" : "text-gray-600"
                          )}>
                            {item.percentage > 0 ? '+' : ''}{item.percentage.toFixed(2)}%
                          </span>
                        </td>
                        <td className="text-right p-2 border-b font-mono">
                          {item.absolute > 0 ? '+' : ''}{item.absolute.toFixed(0)}
                        </td>
                        <td className="text-center p-2 border-b">
                          <Badge variant="secondary" className={getConfidenceColor(item.confidence)}>
                            {item.confidence}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};