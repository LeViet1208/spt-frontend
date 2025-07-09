"use client"

import React, { useState, useEffect, useCallback } from "react"
import { AlertCircle, Check, X, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { InputWithLabel } from "@/components/ui/input-with-label"
import { SelectWithLabel } from "@/components/ui/select-with-label"
import { SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCampaign } from "@/hooks/useCampaign"
import { 
  RuleType, 
  TargetType, 
  PromotionRuleFormData,
  CreatePromotionRuleRequest,
  PromotionRuleValidationResult,
  DatasetValidationOptions,
  RuleTypeDisplayNames
} from "@/utils/types/campaign"

interface PromotionRuleFormProps {
  campaignId: number
  datasetId: number // Required: Used to load validation options (categories, brands, UPCs, date range)
  trigger?: React.ReactNode
  onSuccess?: () => void
  editMode?: boolean
  ruleId?: number // Rule ID when editing
  initialData?: any // PromotionRule data when editing
  showTrigger?: boolean
}

const ruleTypeOptions: { value: RuleType; label: string; description: string }[] = [
  {
    value: "discount",
    label: "Discount",
    description: "Reduce the price of target products"
  },
  {
    value: "upsizing",
    label: "Upsizing", 
    description: "Increase the size of target products"
  },
  {
    value: "to_be_featured",
    label: "To Be Featured",
    description: "Enable product features"
  },
  {
    value: "to_be_displayed",
    label: "To Be Displayed",
    description: "Enable product display"
  }
]

const targetTypeOptions: { value: TargetType; label: string; description: string }[] = [
  {
    value: "category",
    label: "Category",
    description: "Target products by category"
  },
  {
    value: "brand",
    label: "Brand",
    description: "Target products by brand"
  },
  {
    value: "upc",
    label: "UPC",
    description: "Target specific UPCs"
  }
]

export function PromotionRuleForm({ 
  campaignId, 
  datasetId, 
  trigger, 
  onSuccess, 
  editMode = false, 
  ruleId,
  initialData, 
  showTrigger = true 
}: PromotionRuleFormProps) {
  const { createPromotionRule, updatePromotionRule, validatePromotionRule, getDatasetValidationOptions, isLoading } = useCampaign()
  
  const [isOpen, setIsOpen] = useState(editMode)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<PromotionRuleValidationResult | null>(null)
  const [validationOptions, setValidationOptions] = useState<DatasetValidationOptions | null>(null)
  const [dateWarning, setDateWarning] = useState<string | null>(null)
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage")
  const [upsizingType, setUpsizingType] = useState<"percentage" | "amount">("percentage")
  
  // Target selection state
  const [targetSearchTerm, setTargetSearchTerm] = useState("")
  const [showTargetDropdown, setShowTargetDropdown] = useState(false)
  const [selectedTargets, setSelectedTargets] = useState<string[]>([])
  
  const [formData, setFormData] = useState<PromotionRuleFormData>({
    name: "",
    rule_type: "discount",
    target_type: "category",
    start_date: new Date(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    target_categories: [],
    target_brands: [],
    target_upcs: [],
    price_reduction_percentage: 0,
    price_reduction_amount: 0,
    size_increase_percentage: 0,
    feature_enabled: true, // Default to true for "To Be Featured"
    display_enabled: true, // Default to true for "To Be Displayed"
  })

  // Load validation options when form opens
  useEffect(() => {
    if (isOpen && !validationOptions && datasetId && datasetId > 0) {
      loadValidationOptions()
    }
  }, [isOpen, datasetId])

  // Initialize form with existing data in edit mode
  useEffect(() => {
    if (editMode && initialData) {
      setFormData({
        name: initialData.name || "",
        rule_type: initialData.rule_type || "discount",
        target_type: initialData.target_type || "category",
        start_date: initialData.start_date ? new Date(initialData.start_date * 1000) : new Date(),
        end_date: initialData.end_date ? new Date(initialData.end_date * 1000) : new Date(),
        target_categories: initialData.target_categories || [],
        target_brands: initialData.target_brands || [],
        target_upcs: initialData.target_upcs || [],
        price_reduction_percentage: initialData.price_reduction_percentage || 0,
        price_reduction_amount: initialData.price_reduction_amount || 0,
        size_increase_percentage: initialData.size_increase_percentage || 0,
        feature_enabled: initialData.feature_enabled ?? true,
        display_enabled: initialData.display_enabled ?? true,
      })
      
      // Set selected targets based on target type
      if (initialData.target_type === "category") {
        setSelectedTargets(initialData.target_categories || [])
      } else if (initialData.target_type === "brand") {
        setSelectedTargets(initialData.target_brands || [])
      } else if (initialData.target_type === "upc") {
        setSelectedTargets(initialData.target_upcs || [])
      }

      // Set discount/upsizing types based on existing values
      if (initialData.price_reduction_percentage > 0) {
        setDiscountType("percentage")
      } else if (initialData.price_reduction_amount > 0) {
        setDiscountType("amount")
      }
    }
  }, [editMode, initialData])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        rule_type: "discount",
        target_type: "category",
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        target_categories: [],
        target_brands: [],
        target_upcs: [],
        price_reduction_percentage: 0,
        price_reduction_amount: 0,
        size_increase_percentage: 0,
        feature_enabled: true,
        display_enabled: true,
      })
      setSelectedTargets([])
      setTargetSearchTerm("")
      setValidationResult(null)
      setDateWarning(null)
      setDiscountType("percentage")
      setUpsizingType("percentage")
    }
  }, [isOpen])

  // Update target arrays when rule type changes
  useEffect(() => {
    if (formData.rule_type === "to_be_featured") {
      setFormData(prev => ({ ...prev, feature_enabled: true }))
    } else if (formData.rule_type === "to_be_displayed") {
      setFormData(prev => ({ ...prev, display_enabled: true }))
    }
  }, [formData.rule_type])

  // Reset targets when target type changes
  useEffect(() => {
    setSelectedTargets([])
    setTargetSearchTerm("")
    setFormData(prev => ({
      ...prev,
      target_categories: [],
      target_brands: [],
      target_upcs: []
    }))
  }, [formData.target_type])

  // Validate dates when they change
  useEffect(() => {
    validateDates()
  }, [formData.start_date, formData.end_date, validationOptions])

  const loadValidationOptions = async () => {
    if (!datasetId || datasetId <= 0) {
      console.error("Invalid dataset ID:", datasetId)
      return
    }
    
    try {
      const response = await getDatasetValidationOptions(datasetId)
      if (response.success && response.data) {
        setValidationOptions(response.data)
      }
    } catch (error) {
      console.error("Error loading validation options:", error)
    }
  }

  const validateDates = () => {
    if (!validationOptions?.date_range.min_date || !validationOptions?.date_range.max_date) {
      return
    }

    const minDate = new Date(validationOptions.date_range.min_date)
    const maxDate = new Date(validationOptions.date_range.max_date)

    if (formData.start_date < minDate || formData.start_date > maxDate ||
        formData.end_date < minDate || formData.end_date > maxDate) {
      setDateWarning(
        `Dates must be between ${minDate.toLocaleDateString()} and ${maxDate.toLocaleDateString()}`
      )
    } else {
      setDateWarning(null)
    }
  }

  const getAvailableTargets = useCallback(() => {
    if (!validationOptions) return []
    
    let options: string[] = []
    if (formData.target_type === "category") {
      options = validationOptions.categories
    } else if (formData.target_type === "brand") {
      options = validationOptions.brands
    } else if (formData.target_type === "upc") {
      options = validationOptions.upcs
    }

    if (targetSearchTerm) {
      options = options.filter(option => 
        option.toLowerCase().includes(targetSearchTerm.toLowerCase())
      )
    }

    // Filter out already selected targets
    return options.filter(option => !selectedTargets.includes(option))
  }, [validationOptions, formData.target_type, targetSearchTerm, selectedTargets])

  const handleInputChange = (field: keyof PromotionRuleFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear validation when form changes
    if (validationResult) {
      setValidationResult(null)
    }
  }

  const handleTargetSelect = (target: string) => {
    const newTargets = [...selectedTargets, target]
    setSelectedTargets(newTargets)
    
    // Update form data
    if (formData.target_type === "category") {
      setFormData(prev => ({ ...prev, target_categories: newTargets }))
    } else if (formData.target_type === "brand") {
      setFormData(prev => ({ ...prev, target_brands: newTargets }))
    } else if (formData.target_type === "upc") {
      setFormData(prev => ({ ...prev, target_upcs: newTargets }))
    }
    
    setTargetSearchTerm("")
    setShowTargetDropdown(false)
  }

  const handleTargetRemove = (index: number) => {
    const newTargets = selectedTargets.filter((_, i) => i !== index)
    setSelectedTargets(newTargets)
    
    // Update form data
    if (formData.target_type === "category") {
      setFormData(prev => ({ ...prev, target_categories: newTargets }))
    } else if (formData.target_type === "brand") {
      setFormData(prev => ({ ...prev, target_brands: newTargets }))
    } else if (formData.target_type === "upc") {
      setFormData(prev => ({ ...prev, target_upcs: newTargets }))
    }
  }

  const handleDiscountValueChange = (value: number) => {
    if (discountType === "percentage") {
      handleInputChange('price_reduction_percentage', value)
      handleInputChange('price_reduction_amount', 0)
    } else {
      handleInputChange('price_reduction_amount', value)
      handleInputChange('price_reduction_percentage', 0)
    }
  }

  const handleUpsizingValueChange = (value: number) => {
    if (upsizingType === "percentage") {
      handleInputChange('size_increase_percentage', value)
    }
    // Note: We don't have size_increase_amount field, only percentage
  }

  const handleValidate = async () => {
    if (!formData.name.trim()) return

    setIsValidating(true)
    try {
      const request: Omit<CreatePromotionRuleRequest, 'name'> = {
        rule_type: formData.rule_type,
        target_type: formData.target_type,
        start_date: Math.floor(formData.start_date.getTime() / 1000),
        end_date: Math.floor(formData.end_date.getTime() / 1000),
        target_categories: formData.target_categories,
        target_brands: formData.target_brands,
        target_upcs: formData.target_upcs,
        price_reduction_percentage: formData.price_reduction_percentage,
        price_reduction_amount: formData.price_reduction_amount,
        size_increase_percentage: formData.size_increase_percentage,
        feature_enabled: formData.feature_enabled,
        display_enabled: formData.display_enabled,
      }

      const result = await validatePromotionRule(campaignId, request)
      setValidationResult(result)
    } catch (error) {
      console.error("Validation error:", error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) return

    try {
      const request: CreatePromotionRuleRequest = {
        name: formData.name,
        rule_type: formData.rule_type,
        target_type: formData.target_type,
        start_date: Math.floor(formData.start_date.getTime() / 1000),
        end_date: Math.floor(formData.end_date.getTime() / 1000),
        target_categories: formData.target_categories,
        target_brands: formData.target_brands,
        target_upcs: formData.target_upcs,
        price_reduction_percentage: formData.price_reduction_percentage,
        price_reduction_amount: formData.price_reduction_amount,
        size_increase_percentage: formData.size_increase_percentage,
        feature_enabled: formData.feature_enabled,
        display_enabled: formData.display_enabled,
      }

      if (editMode && ruleId) {
        // Use update handler for edit mode
        const result = await updatePromotionRule(campaignId, ruleId, request)
        if (result) {
          setIsOpen(false)
          onSuccess?.()
        }
      } else {
        // Use default create handler
        const result = await createPromotionRule(campaignId, request)
        if (result) {
          setIsOpen(false)
          onSuccess?.()
        }
      }
    } catch (error) {
      console.error("Submit error:", error)
    }
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const getCurrentTargets = () => {
    return selectedTargets
  }

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      getCurrentTargets().length > 0 &&
      formData.start_date < formData.end_date &&
      !dateWarning &&
      (
        // Discount rules need either percentage or amount
        (formData.rule_type === "discount" && 
         (formData.price_reduction_percentage! > 0 || formData.price_reduction_amount! > 0)) ||
        // Upsizing rules need percentage
        (formData.rule_type === "upsizing" && 
         formData.size_increase_percentage! > 0) ||
        // Featured/display rules are always valid (boolean values)
        formData.rule_type === "to_be_featured" ||
        formData.rule_type === "to_be_displayed"
      )
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          {trigger || <Button>Create Promotion Rule</Button>}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? "Edit Promotion Rule" : "Create Promotion Rule"}</DialogTitle>
        </DialogHeader>
        
        {(!datasetId || datasetId <= 0) && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Dataset ID is missing or invalid. Cannot load validation options.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <InputWithLabel
              label="Rule Name"
              htmlFor="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter promotion rule name"
            />

            <div className="grid grid-cols-2 gap-4">
              <SelectWithLabel
                label="Rule Type"
                htmlFor="rule_type"
                value={formData.rule_type}
                onValueChange={(value) => handleInputChange('rule_type', value as RuleType)}
              >
                {ruleTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>{option.label}</div>
                  </SelectItem>
                ))}
              </SelectWithLabel>

              <SelectWithLabel
                label="Target Type"
                htmlFor="target_type"
                value={formData.target_type}
                onValueChange={(value) => handleInputChange('target_type', value as TargetType)}
              >
                {targetTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>{option.label}</div>
                  </SelectItem>
                ))}
              </SelectWithLabel>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-4">
            <Label>Date Range</Label>
            {dateWarning && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-700">
                  {dateWarning}
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-4">
              <InputWithLabel
                label="Start Date"
                htmlFor="start_date"
                type="date"
                value={formatDate(formData.start_date)}
                onChange={(e) => handleInputChange('start_date', new Date(e.target.value))}
              />
              <InputWithLabel
                label="End Date"
                htmlFor="end_date"
                type="date"
                value={formatDate(formData.end_date)}
                onChange={(e) => handleInputChange('end_date', new Date(e.target.value))}
              />
            </div>
          </div>

          {/* Targets */}
          <div className="space-y-4">
            <Label>Targets</Label>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder={`Search ${formData.target_type}...`}
                    value={targetSearchTerm}
                    onChange={(e) => setTargetSearchTerm(e.target.value)}
                    onFocus={() => setShowTargetDropdown(true)}
                    className="pr-8"
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowTargetDropdown(!showTargetDropdown)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Dropdown */}
              {showTargetDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {getAvailableTargets().map((target) => (
                    <div
                      key={target}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleTargetSelect(target)}
                    >
                      {target}
                    </div>
                  ))}
                  {getAvailableTargets().length === 0 && (
                    <div className="px-3 py-2 text-gray-500">
                      No options available
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {getCurrentTargets().length > 0 && (
              <div className="flex flex-wrap gap-2">
                {getCurrentTargets().map((target, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {target}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => handleTargetRemove(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Rule Parameters */}
          {formData.rule_type === "discount" && (
            <div className="space-y-4">
              <Label>Discount</Label>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="discount_type"
                      value="percentage"
                      checked={discountType === "percentage"}
                      onChange={(e) => setDiscountType(e.target.value as "percentage" | "amount")}
                    />
                    Discount by percentage
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="discount_type"
                      value="amount"
                      checked={discountType === "amount"}
                      onChange={(e) => setDiscountType(e.target.value as "percentage" | "amount")}
                    />
                    Discount by exact amount
                  </label>
                </div>
                <InputWithLabel
                  label={discountType === "percentage" ? "Percentage (%)" : "Amount ($)"}
                  htmlFor="discount_value"
                  type="number"
                  min="0"
                  max={discountType === "percentage" ? "100" : undefined}
                  step={discountType === "percentage" ? "0.1" : "0.01"}
                  value={discountType === "percentage" ? 
                    (formData.price_reduction_percentage || '') : 
                    (formData.price_reduction_amount || '')
                  }
                  onChange={(e) => handleDiscountValueChange(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {formData.rule_type === "upsizing" && (
            <div className="space-y-4">
              <Label>Upsizing</Label>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="upsizing_type"
                      value="percentage"
                      checked={upsizingType === "percentage"}
                      onChange={(e) => setUpsizingType(e.target.value as "percentage" | "amount")}
                    />
                    Upsize by percentage
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="upsizing_type"
                      value="amount"
                      checked={upsizingType === "amount"}
                      onChange={(e) => setUpsizingType(e.target.value as "percentage" | "amount")}
                    />
                    Upsize by exact amount
                  </label>
                </div>
                <InputWithLabel
                  label={upsizingType === "percentage" ? "Percentage (%)" : "Amount"}
                  htmlFor="upsizing_value"
                  type="number"
                  min="0"
                  step={upsizingType === "percentage" ? "0.1" : "0.01"}
                  value={formData.size_increase_percentage || ''}
                  onChange={(e) => handleUpsizingValueChange(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {formData.rule_type === "to_be_featured" && (
            <div className="space-y-2">
              <Label>Feature Setting</Label>
              <p className="text-sm text-gray-600">Products will be featured when this rule is applied.</p>
            </div>
          )}

          {formData.rule_type === "to_be_displayed" && (
            <div className="space-y-2">
              <Label>Display Setting</Label>
              <p className="text-sm text-gray-600">Products will be displayed when this rule is applied.</p>
            </div>
          )}

          {/* Validation Results */}
          {validationResult && (
            <Alert className={validationResult.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {validationResult.valid ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={validationResult.valid ? "text-green-700" : "text-red-700"}>
                {validationResult.message}
                {validationResult.error && (
                  <div className="mt-1 text-sm">{validationResult.error}</div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex gap-2">
            <Button type="submit" disabled={isLoading || !isFormValid()}>
              {isLoading ? (editMode ? "Updating..." : "Creating...") : (editMode ? "Update Rule" : "Create Rule")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 