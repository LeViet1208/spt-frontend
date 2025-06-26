import * as React from "react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends React.ComponentPropsWithoutRef<"div"> {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "destructive" | "chart-3";
  shimmer?: boolean;
}

function Spinner({
  className,
  size = "md",
  color = "primary",
  shimmer = false,
  ...props
}: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
  };

  const colorClasses = {
    primary: "border-primary-foreground/50 border-t-primary",
    secondary: "border-secondary-foreground/50 border-t-secondary",
    destructive: "border-destructive/50 border-t-destructive",
    "chart-3": "border-chart-3/50 border-t-chart-3",
  };

  return (
    <div
      role="status"
      className={cn(
        "inline-block animate-spin rounded-full",
        sizeClasses[size],
        colorClasses[color],
        shimmer && "animate-shimmer-spinner", // Custom shimmer animation for spinner
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export { Spinner }
