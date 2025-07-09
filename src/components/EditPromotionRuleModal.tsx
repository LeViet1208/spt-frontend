"use client"

import React, { useState, ReactNode } from "react"
import { PromotionRuleForm } from "@/components/PromotionRuleForm"
import type { PromotionRule } from "@/utils/types/campaign"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface EditPromotionRuleModalProps {
  trigger: ReactNode
  promotionRule: PromotionRule
  campaignId: number
  datasetId: number
  onSuccess?: () => void
}

export function EditPromotionRuleModal({
  trigger,
  promotionRule,
  campaignId,
  datasetId,
  onSuccess,
}: EditPromotionRuleModalProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Promotion Rule</DialogTitle>
          <DialogDescription>
            Update the promotion rule details for your campaign.
          </DialogDescription>
        </DialogHeader>
        <PromotionRuleForm
          campaignId={campaignId}
          datasetId={datasetId}
          onSuccess={handleSuccess}
          editMode={true}
          ruleId={promotionRule.promotion_rule_id}
          initialData={promotionRule}
          showTrigger={false}
        />
      </DialogContent>
    </Dialog>
  )
} 