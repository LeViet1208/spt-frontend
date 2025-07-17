import React from "react";
import { SelectItem } from "./select";

interface SafeSelectItemProps {
    value: string;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
}

export const SafeSelectItem: React.FC<SafeSelectItemProps> = ({
    value,
    children,
    disabled = false,
    className,
}) => {
    // Validate that value is not empty
    if (!value || value.trim() === "") {
        console.warn("SafeSelectItem: Empty value detected, skipping render");
        return null;
    }

    return (
        <SelectItem
            value={value}
            disabled={disabled}
            className={className}
        >
            {children}
        </SelectItem>
    );
}; 