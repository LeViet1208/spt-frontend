import { parseCSVFile } from "./csvParser";
import { parseExcelFile } from "./excelParser";
import { ParsedFile, FileParserOptions } from "../validation/types";

export const parseFile = async (
	file: File,
	options: FileParserOptions = { maxPreviewRows: 5, encoding: "utf-8" }
): Promise<ParsedFile> => {
	const fileExtension = file.name.split(".").pop()?.toLowerCase();

	if (!fileExtension) {
		throw new Error("File has no extension");
	}

	switch (fileExtension) {
		case "csv":
			return parseCSVFile(file, options);
		case "xlsx":
		case "xls":
			return parseExcelFile(file, options);
		default:
			throw new Error(
				`Unsupported file format: ${fileExtension}. Please use CSV or Excel files.`
			);
	}
};

export const isValidFileType = (file: File): boolean => {
	const fileExtension = file.name.split(".").pop()?.toLowerCase();
	return ["csv", "xlsx", "xls"].includes(fileExtension || "");
};

export const getFileTypeFromExtension = (fileName: string): string | null => {
	const extension = fileName.split(".").pop()?.toLowerCase();
	switch (extension) {
		case "csv":
			return "CSV";
		case "xlsx":
		case "xls":
			return "Excel";
		default:
			return null;
	}
};

export * from "./csvParser";
export * from "./excelParser";
