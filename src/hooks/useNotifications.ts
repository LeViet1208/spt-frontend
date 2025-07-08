"use client";

import { useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { errorHandler, ProcessedError } from "@/utils/errorHandler";

export interface NotificationOptions {
	autoClose?: number | false;
	hideProgressBar?: boolean;
	closeOnClick?: boolean;
	pauseOnHover?: boolean;
	position?:
		| "top-right"
		| "top-left"
		| "bottom-right"
		| "bottom-left"
		| "top-center"
		| "bottom-center";
}

export const useNotifications = () => {
	// Initialize error listener on mount
	useEffect(() => {
		const unsubscribe = errorHandler.addErrorListener(
			(error: ProcessedError) => {
				if (error.shouldDisplay) {
					// Show error notifications automatically
					showErrorNotification(error.userMessage);
				}
			}
		);

		return unsubscribe;
	}, []);

	const showSuccessNotification = useCallback(
		(message: string, options?: NotificationOptions) => {
			toast.success(message, {
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				position: "top-right",
				...options,
			});
		},
		[]
	);

	const showErrorNotification = useCallback(
		(message: string, options?: NotificationOptions) => {
			toast.error(message, {
				autoClose: 8000, // Longer duration for errors
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				position: "top-right",
				...options,
			});
		},
		[]
	);

	const showWarningNotification = useCallback(
		(message: string, options?: NotificationOptions) => {
			toast.warning(message, {
				autoClose: 6000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				position: "top-right",
				...options,
			});
		},
		[]
	);

	const showInfoNotification = useCallback(
		(message: string, options?: NotificationOptions) => {
			console.log("INFO:", message);
			toast.info(message, {
				autoClose: 4000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				position: "top-right",
				...options,
			});
		},
		[]
	);

	return {
		showSuccessNotification,
		showErrorNotification,
		showWarningNotification,
		showInfoNotification,
	};
};
