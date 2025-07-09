import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InputWithLabelProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  htmlFor?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export function InputWithLabel({
  label,
  htmlFor,
  containerClassName,
  labelClassName,
  inputClassName,
  className,
  ...inputProps
}: InputWithLabelProps) {
  return (
    <div className={cn("flex flex-col gap-3", containerClassName)}>
      <Label htmlFor={htmlFor} className={labelClassName}>
        {label}
      </Label>
      <Input
        id={htmlFor}
        className={cn(inputClassName, className)}
        {...inputProps}
      />
    </div>
  );
} 