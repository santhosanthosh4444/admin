import axios from "axios"

/**
 * Uploads a file to ImageKit and returns the URL.
 * @param {File} file - The file to upload.
 * @param {string} fileName - The desired name of the file.
 * @returns {Promise<string>} - The URL of the uploaded file.
 * @throws {Error} - Throws an error if the upload fails.
 */
export async function uploadToImageKit(file: File, fileName: string): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("fileName", fileName)

  const API_URL = "https://upload.imagekit.io/api/v1/files/upload"

  try {
    const { data } = await axios.post(API_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: "Basic cHJpdmF0ZV9FcXhYYVk5dXpXdVZwVnlzS0Jhb3R6eG1ZRmc9Og==",
      },
    })

    return data.url
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to upload the file")
  }
}
