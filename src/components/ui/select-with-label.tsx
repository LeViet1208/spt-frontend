import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SelectWithLabelProps {
  label: string;
  htmlFor?: string;
  containerClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
}

export function SelectWithLabel({
  label,
  htmlFor,
  containerClassName,
  labelClassName,
  selectClassName,
  value,
  onValueChange,
  placeholder,
  children,
}: SelectWithLabelProps) {
  return (
    <div className={cn("flex flex-col gap-3", containerClassName)}>
      <Label htmlFor={htmlFor} className={labelClassName}>
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={selectClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
    </div>
  );
} 