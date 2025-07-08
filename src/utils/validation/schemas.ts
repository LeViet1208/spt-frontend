import { ValidationSchema } from "./types";

export const transactionSchema: ValidationSchema = {
	fileType: "transaction",
	requiredColumns: [
		{
			name: "upc",
			type: "alphanumeric",
			required: true,
			validation: [
				{
					type: "pattern",
					value: /^[a-zA-Z0-9]+$/,
					message: "UPC must be alphanumeric",
				},
			],
		},
		{
			name: "sale_price",
			type: "number",
			required: true,
			validation: [
				{
					type: "positive",
					message: "Sale price must be a positive number",
				},
			],
		},
		{
			name: "sale_quantity",
			type: "number",
			required: true,
			validation: [
				{
					type: "positive",
					message: "Sale quantity must be a positive number",
				},
			],
		},
		{
			name: "household_id",
			type: "alphanumeric",
			required: true,
			validation: [
				{
					type: "pattern",
					value: /^[a-zA-Z0-9]+$/,
					message: "Household ID must be alphanumeric",
				},
			],
		},
		{
			name: "store_id",
			type: "alphanumeric",
			required: true,
			validation: [
				{
					type: "pattern",
					value: /^[a-zA-Z0-9]+$/,
					message: "Store ID must be alphanumeric",
				},
			],
		},
		{
			name: "trip_id",
			type: "alphanumeric",
			required: true,
			validation: [
				{
					type: "pattern",
					value: /^[a-zA-Z0-9]+$/,
					message: "Trip ID must be alphanumeric",
				},
			],
		},
		{
			name: "time",
			type: "datetime",
			required: true,
			validation: [
				{
					type: "custom",
					message: "Time must be a valid datetime format",
					validator: (value: any) => {
						if (!value) return false;
						const date = new Date(value);
						return !isNaN(date.getTime());
					},
				},
			],
		},
	],
};

export const productLookupSchema: ValidationSchema = {
	fileType: "product_lookup",
	requiredColumns: [
		{
			name: "upc",
			type: "alphanumeric",
			required: true,
			validation: [
				{
					type: "pattern",
					value: /^[a-zA-Z0-9]+$/,
					message: "UPC must be alphanumeric",
				},
			],
		},
		{
			name: "product_description",
			type: "text",
			required: true,
			validation: [
				{
					type: "min",
					value: 1,
					message: "Product description cannot be empty",
				},
			],
		},
		{
			name: "category",
			type: "text",
			required: true,
			validation: [
				{
					type: "min",
					value: 1,
					message: "Category cannot be empty",
				},
			],
		},
		{
			name: "brand",
			type: "text",
			required: true,
			validation: [
				{
					type: "min",
					value: 1,
					message: "Brand cannot be empty",
				},
			],
		},
		{
			name: "product_size",
			type: "number",
			required: true,
			validation: [
				{
					type: "positive",
					message: "Product size must be a positive number",
				},
			],
		},
	],
};

export const causalLookupSchema: ValidationSchema = {
	fileType: "causal_lookup",
	requiredColumns: [
		{
			name: "upc",
			type: "alphanumeric",
			required: true,
			validation: [
				{
					type: "pattern",
					value: /^[a-zA-Z0-9]+$/,
					message: "UPC must be alphanumeric",
				},
			],
		},
		{
			name: "store_id",
			type: "alphanumeric",
			required: true,
			validation: [
				{
					type: "pattern",
					value: /^[a-zA-Z0-9]+$/,
					message: "Store ID must be alphanumeric",
				},
			],
		},
		{
			name: "feature",
			type: "integer",
			required: true,
			validation: [
				{
					type: "enum",
					value: [0, 1, "0", "1"],
					message: "Feature must be 0 or 1",
				},
			],
		},
		{
			name: "display",
			type: "integer",
			required: true,
			validation: [
				{
					type: "enum",
					value: [0, 1, "0", "1"],
					message: "Display must be 0 or 1",
				},
			],
		},
		{
			name: "start_time",
			type: "datetime",
			required: true,
			validation: [
				{
					type: "custom",
					message: "Start time must be a valid datetime format",
					validator: (value: any) => {
						if (!value) return false;
						const date = new Date(value);
						return !isNaN(date.getTime());
					},
				},
			],
		},
		{
			name: "end_time",
			type: "datetime",
			required: true,
			validation: [
				{
					type: "custom",
					message: "End time must be a valid datetime format",
					validator: (value: any) => {
						if (!value) return false;
						const date = new Date(value);
						return !isNaN(date.getTime());
					},
				},
			],
		},
	],
};

export const validationSchemas = {
	transaction: transactionSchema,
	product_lookup: productLookupSchema,
	causal_lookup: causalLookupSchema,
};

export const getSchemaByFileType = (
	fileType: string
): ValidationSchema | null => {
	return validationSchemas[fileType as keyof typeof validationSchemas] || null;
};
