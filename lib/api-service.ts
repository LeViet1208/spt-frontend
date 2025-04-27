/**
 * Service để gọi API từ backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

/**
 * Gửi dữ liệu đã upload lên backend
 */
export async function uploadData(data: any[], fileName: string, dataType: string) {
  try {
    const response = await fetch(`${API_URL}/data/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data,
        fileName,
        dataType,
      }),
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error uploading data:", error)
    throw error
  }
}

/**
 * Lấy danh sách các dataset đã upload
 */
export async function getDatasets() {
  try {
    const response = await fetch(`${API_URL}/data/datasets`)

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching datasets:", error)
    throw error
  }
}

/**
 * Lấy dữ liệu của một dataset cụ thể
 */
export async function getDatasetById(datasetId: string) {
  try {
    const response = await fetch(`${API_URL}/data/datasets/${datasetId}`)

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching dataset:", error)
    throw error
  }
}

/**
 * Lấy thống kê từ dataset
 */
export async function getDatasetStats(datasetId: string) {
  try {
    const response = await fetch(`${API_URL}/data/datasets/${datasetId}/stats`)

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching dataset stats:", error)
    throw error
  }
}
