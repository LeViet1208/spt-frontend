"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { InputWithLabel } from "@/components/ui/input-with-label";
import { TextareaWithLabel } from "@/components/ui/textarea-with-label";
import { useCampaign } from "@/hooks/useCampaign";
import type { Campaign } from "@/utils/types/campaign";

interface EditCampaignModalProps {
	campaign: Campaign;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

export function EditCampaignModal({
	campaign,
	trigger,
	onSuccess,
}: EditCampaignModalProps) {
	const { updateCampaign, isLoading } = useCampaign();

	const [isOpen, setIsOpen] = useState(false);
	const [formData, setFormData] = useState({
		name: campaign.name,
		description: campaign.description || "",
	});

	// Reset form when modal opens
	useEffect(() => {
		if (isOpen) {
			setFormData({
				name: campaign.name,
				description: campaign.description || "",
			});
		}
	}, [isOpen, campaign]);

	const handleInputChange = (field: keyof typeof formData, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) return;

		try {
			const result = await updateCampaign(campaign.campaign_id, {
				name: formData.name.trim(),
				description: formData.description.trim(),
			});

			if (result) {
				setIsOpen(false);
				onSuccess?.();
			}
		} catch (error) {
			console.error("Submit error:", error);
		}
	};

	const isFormValid = () => {
		return formData.name.trim() !== "";
	};

	const hasChanges = () => {
		return (
			formData.name.trim() !== campaign.name ||
			formData.description.trim() !== (campaign.description || "")
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{trigger || <Button>Edit Campaign</Button>}
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Campaign</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<InputWithLabel
						label="Campaign Name"
						htmlFor="name"
						value={formData.name}
						onChange={(e) => handleInputChange("name", e.target.value)}
						placeholder="Enter campaign name"
						required
					/>

					<TextareaWithLabel
						label="Description"
						htmlFor="description"
						value={formData.description}
						onChange={(e) => handleInputChange("description", e.target.value)}
						placeholder="Enter campaign description (optional)"
						rows={3}
					/>

					<DialogFooter className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isLoading || !isFormValid() || !hasChanges()}
						>
							{isLoading ? "Updating..." : "Update Campaign"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
} 