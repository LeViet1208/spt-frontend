"use client";

import { useCallback } from "react";

export const useToast = () => {
	const showSuccessToast = useCallback((message: string) => {
		// TODO: Implement with your preferred toast library
		// For now, using console.log as placeholder
		console.log("SUCCESS:", message);

		// Example implementations:
		// toast.success(message); // react-hot-toast
		// toast({ title: "Success", description: message }); // shadcn/ui toast
	}, []);

	const showErrorToast = useCallback((message: string) => {
		// TODO: Implement with your preferred toast library
		// For now, using console.error as placeholder
		console.error("ERROR:", message);

		// Example implementations:
		// toast.error(message); // react-hot-toast
		// toast({ title: "Error", description: message, variant: "destructive" }); // shadcn/ui toast
	}, []);

	const showInfoToast = useCallback((message: string) => {
		// TODO: Implement with your preferred toast library
		console.log("INFO:", message);
	}, []);

	const showWarningToast = useCallback((message: string) => {
		// TODO: Implement with your preferred toast library
		console.warn("WARNING:", message);
	}, []);

	return {
		showSuccessToast,
		showErrorToast,
		showInfoToast,
		showWarningToast,
	};
};
