"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateTimeInputProps {
  id?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
}

export function DateTimeInput({
  id,
  label,
  value,
  onChange,
  placeholder = "YYYY-MM-DDTHH:MM:SS",
  disabled = false,
  error,
  required = false,
  className,
}: DateTimeInputProps) {
  const [inputValue, setInputValue] = React.useState(value || "");

  React.useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Validate and call onChange
    if (newValue) {
      try {
        // Check if it's a valid ISO datetime format
        const date = new Date(newValue);
        if (!isNaN(date.getTime())) {
          onChange?.(date.toISOString());
        } else {
          onChange?.(newValue);
        }
      } catch {
        onChange?.(newValue);
      }
    } else {
      onChange?.("");
    }
  };

  const handleSetNow = () => {
    const now = new Date();
    const isoString = now.toISOString();
    const localString = isoString.slice(0, 19); // Remove timezone and milliseconds
    setInputValue(localString);
    onChange?.(isoString);
  };

  const formatDisplayValue = (value: string) => {
    if (!value) return "";
    
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // Return local datetime string for input
        return date.toISOString().slice(0, 19);
      }
    } catch {
      // Return as-is if not a valid date
    }
    return value;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className={cn(required && "after:content-['*'] after:text-destructive after:ml-0.5")}>
          {label}
        </Label>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          type="datetime-local"
          value={formatDisplayValue(inputValue)}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex-1",
            error && "border-destructive focus-visible:border-destructive"
          )}
          aria-invalid={!!error}
          required={required}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSetNow}
          disabled={disabled}
          className="px-3"
        >
          <CalendarIcon className="h-4 w-4" />
          <span className="sr-only">Set to current time</span>
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}