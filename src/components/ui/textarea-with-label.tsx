import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TextareaWithLabelProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  htmlFor?: string;
  containerClassName?: string;
  labelClassName?: string;
  textareaClassName?: string;
}

export function TextareaWithLabel({
  label,
  htmlFor,
  containerClassName,
  labelClassName,
  textareaClassName,
  className,
  ...textareaProps
}: TextareaWithLabelProps) {
  return (
    <div className={cn("flex flex-col gap-3", containerClassName)}>
      <Label htmlFor={htmlFor} className={labelClassName}>
        {label}
      </Label>
      <Textarea
        id={htmlFor}
        className={cn(textareaClassName, className)}
        {...textareaProps}
      />
    </div>
  );
} 