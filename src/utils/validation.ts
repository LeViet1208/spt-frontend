import { MergedVariable } from "./types/dataset";

/**
 * Validates if a variable name is valid and non-empty
 */
export const validateVariableName = (name: string): boolean => {
    return typeof name === 'string' && name.trim().length > 0;
};

/**
 * Validates if a MergedVariable object is valid
 */
export const validateMergedVariable = (variable: MergedVariable): boolean => {
    return (
        variable &&
        typeof variable === 'object' &&
        validateVariableName(variable.name) &&
        ['numerical', 'categorical', 'datetime'].includes(variable.type) &&
        typeof variable.description === 'string' &&
        typeof variable.source_table === 'string' &&
        typeof variable.high_cardinality === 'boolean' &&
        typeof variable.join_key === 'boolean'
    );
};

/**
 * Filters out invalid variables from an array
 */
export const filterValidVariables = (variables: MergedVariable[]): MergedVariable[] => {
    return variables.filter(validateMergedVariable);
};

/**
 * Validates if a value is suitable for SelectItem
 */
export const validateSelectValue = (value: string): boolean => {
    return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Creates safe select options with validation
 */
export const createSafeSelectOptions = (options: Array<{ value: string; label: string; type?: string; description?: string }>) => {
    return options.filter(option => 
        validateSelectValue(option.value) && 
        validateSelectValue(option.label)
    );
};

/**
 * Creates safe select items for rendering
 */
export const createSafeSelectItems = (options: Array<{ value: string; label: string; type?: string; description?: string }>) => {
    return createSafeSelectOptions(options).map((option, index) => ({
        key: option.value || `option-${index}`,
        value: option.value,
        label: option.label,
        type: option.type,
        description: option.description
    }));
};

/**
 * Type guard for MergedVariable
 */
export const isMergedVariable = (variable: any): variable is MergedVariable => {
    return validateMergedVariable(variable);
};

/**
 * Creates variable info object
 */
export const createVariableInfo = (name: string, variableInfo: any): MergedVariable | null => {
    if (!validateVariableName(name) || !variableInfo) return null;
    
    return {
        name: variableInfo.name || name,
        type: variableInfo.type,
        description: variableInfo.description || "",
        source_table: variableInfo.source_table || "",
        high_cardinality: variableInfo.high_cardinality || false,
        join_key: variableInfo.join_key || false,
        unique_count: variableInfo.unique_count,
        min: variableInfo.min,
        max: variableInfo.max,
        mean: variableInfo.mean,
        median: variableInfo.median,
        std: variableInfo.std
    };
}; 