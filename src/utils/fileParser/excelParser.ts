import * as XLSX from "xlsx";
import { ParsedFile, FileParserOptions } from "../validation/types";

export const parseExcelFile = (
	file: File,
	options: FileParserOptions = { maxPreviewRows: 5, encoding: "utf-8" }
): Promise<ParsedFile> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const data = new Uint8Array(e.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: "array" });

				// Get the first worksheet
				const firstSheetName = workbook.SheetNames[0];
				if (!firstSheetName) {
					reject(new Error("Excel file contains no worksheets"));
					return;
				}

				const worksheet = workbook.Sheets[firstSheetName];

				// Convert to JSON with header row
				const jsonData = XLSX.utils.sheet_to_json(worksheet, {
					header: 1,
					defval: null,
					raw: false, // This ensures dates and numbers are converted to strings
				}) as any[][];

				if (jsonData.length === 0) {
					reject(new Error("Excel file is empty"));
					return;
				}

				// Extract headers from first row
				const headerRow = jsonData[0];
				const headers = headerRow.map((header, index) => {
					const cleanHeader =
						header?.toString().trim() || `Column_${index + 1}`;
					return cleanHeader;
				});

				// Process data rows (skip header row)
				const dataRows = jsonData.slice(1);
				const cleanData = dataRows
					.map((row, rowIndex) => {
						const cleanRow: Record<string, any> = {};

						headers.forEach((header, colIndex) => {
							let value = row[colIndex];

							// Handle null, undefined, and empty values
							if (value === null || value === undefined || value === "") {
								value = null;
							} else if (typeof value === "string") {
								value = value.trim();
								// Convert empty strings to null after trimming
								if (value === "") {
									value = null;
								}
							}

							cleanRow[header] = value;
						});

						return cleanRow;
					})
					.filter((row) => {
						// Remove completely empty rows
						return Object.values(row).some(
							(value) => value !== null && value !== ""
						);
					});

				const parsedFile: ParsedFile = {
					headers,
					data: cleanData,
					rowCount: cleanData.length,
					preview: cleanData.slice(0, options.maxPreviewRows),
					fileName: file.name,
				};

				resolve(parsedFile);
			} catch (error) {
				reject(
					new Error(
						`Failed to parse Excel file: ${
							error instanceof Error ? error.message : "Unknown error"
						}`
					)
				);
			}
		};

		reader.onerror = () => {
			reject(new Error("Failed to read Excel file"));
		};

		reader.readAsArrayBuffer(file);
	});
};
