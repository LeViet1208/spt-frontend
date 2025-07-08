import Papa from "papaparse";
import { ParsedFile, FileParserOptions } from "../validation/types";

export const parseCSVFile = (
	file: File,
	options: FileParserOptions = { maxPreviewRows: 5, encoding: "utf-8" }
): Promise<ParsedFile> => {
	return new Promise((resolve, reject) => {
		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			encoding: options.encoding,
			delimiter: options.delimiter || "", // Empty string for auto-detection
			delimitersToGuess: [",", "\t", "|", ";"],
			complete: (results) => {
				try {
					if (results.errors.length > 0) {
						const criticalErrors = results.errors.filter(
							(error) => error.type === "Delimiter" || error.type === "Quotes"
						);
						if (criticalErrors.length > 0) {
							reject(
								new Error(`CSV parsing error: ${criticalErrors[0].message}`)
							);
							return;
						}
					}

					const data = results.data as Record<string, any>[];
					let headers = results.meta.fields || [];

					// Check if delimiter detection failed (single header containing commas)
					if (headers.length === 1 && headers[0].includes(",")) {
						// Manual fallback - split the single header by comma
						headers = headers[0].split(",").map((h) => h.trim());

						// Re-parse the data manually
						const manualData: Record<string, any>[] = [];
						data.forEach((row, index) => {
							const singleValueKey = Object.keys(row)[0];
							const singleValue = row[singleValueKey];
							if (
								typeof singleValue === "string" &&
								singleValue.includes(",")
							) {
								const values = singleValue.split(",").map((v) => v.trim());
								const newRow: Record<string, any> = {};
								headers.forEach((header, i) => {
									newRow[header] = values[i] || null;
								});
								manualData.push(newRow);
							} else {
								manualData.push(row);
							}
						});

						// Update the data array
						data.length = 0;
						data.push(...manualData);
					}

					// Clean up headers (remove extra spaces, handle empty headers)
					const cleanHeaders = headers.map((header, index) => {
						const cleanHeader =
							header?.toString().trim() || `Column_${index + 1}`;
						return cleanHeader;
					});

					// Clean up data
					const cleanData = data.map((row, rowIndex) => {
						const cleanRow: Record<string, any> = {};
						cleanHeaders.forEach((header, colIndex) => {
							const originalHeader = headers[colIndex];
							let value = row[originalHeader];

							// Handle null, undefined, and empty string values
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
					});

					const parsedFile: ParsedFile = {
						headers: cleanHeaders,
						data: cleanData,
						rowCount: cleanData.length,
						preview: cleanData.slice(0, options.maxPreviewRows),
						fileName: file.name,
					};

					resolve(parsedFile);
				} catch (error) {
					reject(
						new Error(
							`Failed to process CSV file: ${
								error instanceof Error ? error.message : "Unknown error"
							}`
						)
					);
				}
			},
			error: (error) => {
				reject(new Error(`CSV parsing failed: ${error.message}`));
			},
		});
	});
};
