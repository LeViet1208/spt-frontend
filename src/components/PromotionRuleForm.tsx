"use client"

import React, { useState, useEffect } from "react"
import { Calendar, AlertCircle, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCampaign } from "@/hooks/useCampaign"
import { 
  RuleType, 
  TargetType, 
  PromotionRuleFormData,
  CreatePromotionRuleRequest,
  PromotionRuleValidationResult
} from "@/utils/types/campaign"

interface PromotionRuleFormProps {
  campaignId: number
  trigger?: React.ReactNode
  onSuccess?: () => void
}

const ruleTypeOptions: { value: RuleType; label: string; description: string }[] = [
  {
    value: "price_reduction",
    label: "Price Reduction",
    description: "Reduce the price of target products"
  },
  {
    value: "product_size_increase",
    label: "Product Size Increase",
    description: "Increase the size of target products"
  },
  {
    value: "feature_yes_no",
    label: "Feature Yes/No",
    description: "Enable or disable product features"
  },
  {
    value: "display_yes_no",
    label: "Display Yes/No",
    description: "Enable or disable product display"
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

export function PromotionRuleForm({ campaignId, trigger, onSuccess }: PromotionRuleFormProps) {
  const { createPromotionRule, validatePromotionRule, isLoading } = useCampaign()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<PromotionRuleValidationResult | null>(null)
  const [formData, setFormData] = useState<PromotionRuleFormData>({
    name: "",
    rule_type: "price_reduction",
    target_type: "category",
    start_date: new Date(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    target_categories: [],
    target_brands: [],
    target_upcs: [],
    price_reduction_percentage: 0,
    price_reduction_amount: 0,
    size_increase_percentage: 0,
    feature_enabled: false,
    display_enabled: false,
  })

  // Target input state
  const [targetInput, setTargetInput] = useState("")

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        rule_type: "price_reduction",
        target_type: "category",
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        target_categories: [],
        target_brands: [],
        target_upcs: [],
        price_reduction_percentage: 0,
        price_reduction_amount: 0,
        size_increase_percentage: 0,
        feature_enabled: false,
        display_enabled: false,
      })
      setTargetInput("")
      setValidationResult(null)
    }
  }, [isOpen])

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

  const handleAddTarget = () => {
    if (!targetInput.trim()) return

    const targets = targetInput.split(',').map(t => t.trim()).filter(Boolean)
    
    if (formData.target_type === "category") {
      setFormData(prev => ({
        ...prev,
        target_categories: [...(prev.target_categories || []), ...targets]
      }))
    } else if (formData.target_type === "brand") {
      setFormData(prev => ({
        ...prev,
        target_brands: [...(prev.target_brands || []), ...targets]
      }))
    } else if (formData.target_type === "upc") {
      setFormData(prev => ({
        ...prev,
        target_upcs: [...(prev.target_upcs || []), ...targets]
      }))
    }
    
    setTargetInput("")
  }

  const handleRemoveTarget = (index: number) => {
    if (formData.target_type === "category") {
      setFormData(prev => ({
        ...prev,
        target_categories: prev.target_categories?.filter((_, i) => i !== index)
      }))
    } else if (formData.target_type === "brand") {
      setFormData(prev => ({
        ...prev,
        target_brands: prev.target_brands?.filter((_, i) => i !== index)
      }))
    } else if (formData.target_type === "upc") {
      setFormData(prev => ({
        ...prev,
        target_upcs: prev.target_upcs?.filter((_, i) => i !== index)
      }))
    }
  }

  const getCurrentTargets = () => {
    if (formData.target_type === "category") return formData.target_categories || []
    if (formData.target_type === "brand") return formData.target_brands || []
    if (formData.target_type === "upc") return formData.target_upcs || []
    return []
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

      const result = await createPromotionRule(campaignId, request)
      if (result) {
        setIsOpen(false)
        onSuccess?.()
      }
    } catch (error) {
      console.error("Submit error:", error)
    }
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      getCurrentTargets().length > 0 &&
      formData.start_date < formData.end_date &&
      (
        // Price reduction rules need either percentage or amount
        (formData.rule_type === "price_reduction" && 
         (formData.price_reduction_percentage! > 0 || formData.price_reduction_amount! > 0)) ||
        // Size increase rules need percentage
        (formData.rule_type === "product_size_increase" && 
         formData.size_increase_percentage! > 0) ||
        // Feature/display rules are always valid (boolean values)
        formData.rule_type === "feature_yes_no" ||
        formData.rule_type === "display_yes_no"
      )
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Create Promotion Rule</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Promotion Rule</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter promotion rule name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule_type">Rule Type</Label>
                <Select value={formData.rule_type} onValueChange={(value) => handleInputChange('rule_type', value as RuleType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ruleTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="target_type">Target Type</Label>
                <Select value={formData.target_type} onValueChange={(value) => handleInputChange('target_type', value as TargetType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {targetTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-4">
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formatDate(formData.start_date)}
                  onChange={(e) => handleInputChange('start_date', new Date(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formatDate(formData.end_date)}
                  onChange={(e) => handleInputChange('end_date', new Date(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Targets */}
          <div className="space-y-4">
            <Label>Targets</Label>
            <div className="flex gap-2">
              <Input
                placeholder={`Enter ${formData.target_type} (comma-separated)`}
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTarget())}
              />
              <Button type="button" onClick={handleAddTarget} variant="outline">
                Add
              </Button>
            </div>
            
            {getCurrentTargets().length > 0 && (
              <div className="flex flex-wrap gap-2">
                {getCurrentTargets().map((target, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {target}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => handleRemoveTarget(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Rule Parameters */}
          {formData.rule_type === "price_reduction" && (
            <div className="space-y-4">
              <Label>Price Reduction</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_reduction_percentage">Percentage (%)</Label>
                  <Input
                    id="price_reduction_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.price_reduction_percentage || ''}
                    onChange={(e) => handleInputChange('price_reduction_percentage', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="price_reduction_amount">Amount ($)</Label>
                  <Input
                    id="price_reduction_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_reduction_amount || ''}
                    onChange={(e) => handleInputChange('price_reduction_amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          )}

          {formData.rule_type === "product_size_increase" && (
            <div className="space-y-4">
              <Label>Size Increase</Label>
              <div>
                <Label htmlFor="size_increase_percentage">Percentage (%)</Label>
                <Input
                  id="size_increase_percentage"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.size_increase_percentage || ''}
                  onChange={(e) => handleInputChange('size_increase_percentage', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {formData.rule_type === "feature_yes_no" && (
            <div className="space-y-4">
              <Label>Feature Setting</Label>
              <Select 
                value={formData.feature_enabled ? "true" : "false"} 
                onValueChange={(value) => handleInputChange('feature_enabled', value === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enable Feature</SelectItem>
                  <SelectItem value="false">Disable Feature</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.rule_type === "display_yes_no" && (
            <div className="space-y-4">
              <Label>Display Setting</Label>
              <Select 
                value={formData.display_enabled ? "true" : "false"} 
                onValueChange={(value) => handleInputChange('display_enabled', value === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enable Display</SelectItem>
                  <SelectItem value="false">Disable Display</SelectItem>
                </SelectContent>
              </Select>
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
            <Button type="button" variant="outline" onClick={handleValidate} disabled={isValidating || !isFormValid()}>
              {isValidating ? "Validating..." : "Validate"}
            </Button>
            <Button type="submit" disabled={isLoading || !isFormValid()}>
              {isLoading ? "Creating..." : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 