import { auth } from "@/lib/firebase";

// API service for dataset operations
export interface Dataset {
  id: number;
  name: string;
  importStatus:
    | "importing_transaction"
    | "importing_product_lookup"
    | "importing_causal_lookup"
    | "import_completed";
  analysisStatus: "not_started" | "analyzing" | "analyzed";
  createdAt: string;
  updatedAt: string;
  description?: string;
}

// Helper function to get auth headers
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    // First try to get access token from localStorage
    let accessToken = localStorage.getItem("access_token");
    console.log(
      "🔍 [Dataset Auth Debug] Access token from localStorage:",
      accessToken ? `${accessToken.substring(0, 20)}...` : "null"
    );

    // If no access token, exchange Firebase ID token for access token
    if (!accessToken) {
      console.log(
        "🔍 [Dataset Auth Debug] No access token found, exchanging Firebase ID token"
      );

      // Get Firebase ID token
      let firebaseIdToken = sessionStorage.getItem("firebaseIdToken");

      // If no Firebase token in session, get fresh one
      if (!firebaseIdToken && auth.currentUser) {
        console.log("🔍 [Dataset Auth Debug] Getting fresh Firebase ID token");
        firebaseIdToken = await auth.currentUser.getIdToken();
        sessionStorage.setItem("firebaseIdToken", firebaseIdToken);
      }

      if (!firebaseIdToken) {
        console.error("❌ [Dataset Auth Debug] No Firebase ID token available");
        return { "Content-Type": "application/json" };
      }

      console.log(
        "🔍 [Dataset Auth Debug] Exchanging Firebase token for access token"
      );

      // Exchange Firebase ID token for access token
      const authResponse = await fetch("http://localhost:8000/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebase_id_token: firebaseIdToken,
        }),
      });

      if (!authResponse.ok) {
        console.error(
          "❌ [Dataset Auth Debug] Failed to exchange token:",
          authResponse.status
        );
        return { "Content-Type": "application/json" };
      }

      const authData = await authResponse.json();
      accessToken = authData.access_token;

      // Store access token for future use
      if (accessToken) {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("user_id", authData.user_id);
        console.log("✅ [Dataset Auth Debug] Access token obtained and stored");
      }
    }

    if (!accessToken) {
      console.error("❌ [Dataset Auth Debug] No access token available");
      return { "Content-Type": "application/json" };
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Token ${accessToken}`,
    };

    console.log("🔍 [Dataset Auth Debug] Final headers:", {
      ...headers,
      Authorization: `Token ${accessToken.substring(0, 20)}...`,
    });

    return headers;
  } catch (error) {
    console.error("❌ [Dataset Auth Debug] Error in getAuthHeaders:", error);
    return { "Content-Type": "application/json" };
  }
};

export interface CreateDatasetMasterRequest {
  name: string;
  description?: string;
}

export interface CreateDatasetMasterResponse {
  success: boolean;
  data?: {
    datasetId: number;
    dataset: Dataset;
  };
  error?: string;
}

export interface UploadFileRequest {
  datasetId: number;
  file: File;
  fileType: "transaction" | "product_lookup" | "causal_lookup";
}

export interface UploadFileResponse {
  success: boolean;
  data?: {
    datasetId: number;
    fileType: string;
    status: string;
  };
  error?: string;
}

export interface DatasetResponse {
  success: boolean;
  data?: Dataset[];
  error?: string;
}

// Real API functions - Replace these with your actual backend endpoints
export const datasetAPI = {
  // Get all datasets for the current user
  async getDatasets(): Promise<DatasetResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      const headers = await getAuthHeaders();
      const url = `http://localhost:8000/users/${user.uid}/datasets`;
      console.log("🔍 [Dataset Request] Making request to:", url);
      console.log("🔍 [Dataset Request] User UID:", user.uid);

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      console.log("🔍 [Dataset Response] Status:", response.status);
      console.log("🔍 [Dataset Response] Status Text:", response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform backend response to match our Dataset interface
      const transformedDatasets: Dataset[] =
        data.datasets?.map((dataset: any) => ({
          id: dataset.dataset_id,
          name: dataset.name || `Dataset ${dataset.dataset_id}`,
          description: dataset.description,
          createdAt: new Date(dataset.created_at * 1000).toISOString(),
          updatedAt: new Date(dataset.created_at * 1000).toISOString(),
          // Map file upload status to import status
          importStatus: datasetAPI.mapFileUploadsToImportStatus(
            dataset.file_uploads
          ),
          // Map latest training status to analysis status
          analysisStatus: datasetAPI.mapTrainingToAnalysisStatus(
            dataset.latest_training
          ),
        })) || [];

      return {
        success: true,
        data: transformedDatasets,
      };
    } catch (error) {
      console.error("Error fetching datasets:", error);
      return {
        success: false,
        error:
          "Failed to fetch datasets. Please check your connection and try again.",
      };
    }
  },

  // Helper function to map file uploads to import status
  mapFileUploadsToImportStatus(fileUploads: any): Dataset["importStatus"] {
    if (!fileUploads) return "importing_transaction";

    const { transactions, product_lookup, causal_lookup } = fileUploads;

    if (!transactions || transactions.status !== "completed") {
      return "importing_transaction";
    }
    if (!product_lookup || product_lookup.status !== "completed") {
      return "importing_product_lookup";
    }
    if (!causal_lookup || causal_lookup.status !== "completed") {
      return "importing_causal_lookup";
    }

    return "import_completed";
  },

  // Helper function to map training status to analysis status
  mapTrainingToAnalysisStatus(latestTraining: any): Dataset["analysisStatus"] {
    if (!latestTraining) return "not_started";

    if (latestTraining.status === "completed") {
      return "analyzed";
    } else if (
      latestTraining.status === "running" ||
      latestTraining.status === "pending"
    ) {
      return "analyzing";
    }

    return "not_started";
  },

  // Step 1: Create dataset master record
  async createDatasetMaster(
    request: CreateDatasetMasterRequest
  ): Promise<CreateDatasetMasterResponse> {
    try {
      // TODO: Replace with your actual API endpoint
      const response = await fetch("/api/datasets/master", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers here
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating dataset master:", error);
      return {
        success: false,
        error: "Failed to create dataset. Please try again.",
      };
    }
  },

  // Step 2: Upload transaction file
  async uploadTransactionFile(
    request: UploadFileRequest
  ): Promise<UploadFileResponse> {
    try {
      // TODO: Replace with your actual API endpoint
      const formData = new FormData();
      formData.append("file", request.file);
      formData.append("datasetId", request.datasetId.toString());

      const response = await fetch("/api/datasets/upload/transaction", {
        method: "POST",
        headers: {
          // Don't set Content-Type for FormData, let browser set it
          // Add authentication headers here
          // 'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error uploading transaction file:", error);
      return {
        success: false,
        error: "Failed to upload transaction file. Please try again.",
      };
    }
  },

  // Step 3: Upload product lookup file
  async uploadProductLookupFile(
    request: UploadFileRequest
  ): Promise<UploadFileResponse> {
    try {
      // TODO: Replace with your actual API endpoint
      const formData = new FormData();
      formData.append("file", request.file);
      formData.append("datasetId", request.datasetId.toString());

      const response = await fetch("/api/datasets/upload/product-lookup", {
        method: "POST",
        headers: {
          // Don't set Content-Type for FormData, let browser set it
          // Add authentication headers here
          // 'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error uploading product lookup file:", error);
      return {
        success: false,
        error: "Failed to upload product lookup file. Please try again.",
      };
    }
  },

  // Step 4: Upload causal lookup file
  async uploadCausalLookupFile(
    request: UploadFileRequest
  ): Promise<UploadFileResponse> {
    try {
      // TODO: Replace with your actual API endpoint
      const formData = new FormData();
      formData.append("file", request.file);
      formData.append("datasetId", request.datasetId.toString());

      const response = await fetch("/api/datasets/upload/causal-lookup", {
        method: "POST",
        headers: {
          // Don't set Content-Type for FormData, let browser set it
          // Add authentication headers here
          // 'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error uploading causal lookup file:", error);
      return {
        success: false,
        error: "Failed to upload causal lookup file. Please try again.",
      };
    }
  },

  // Get dataset by ID
  async getDatasetById(
    id: number
  ): Promise<{ success: boolean; data?: Dataset; error?: string }> {
    try {
      // TODO: Replace with your actual API endpoint
      const response = await fetch(`/api/datasets/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers here
          // 'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching dataset:", error);
      return {
        success: false,
        error: "Failed to fetch dataset. Please try again.",
      };
    }
  },

  // Delete dataset
  async deleteDataset(
    id: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Replace with your actual API endpoint
      const response = await fetch(`/api/datasets/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers here
          // 'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error deleting dataset:", error);
      return {
        success: false,
        error: "Failed to delete dataset. Please try again.",
      };
    }
  },
};
