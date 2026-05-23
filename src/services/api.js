import { API_BASE_URL } from "../config/runtime";

export function getApiUrl(path) {
  if (!API_BASE_URL) {
    throw new Error("Frontend is missing VITE_API_BASE_URL. Set it to the backend FastAPI URL and redeploy.");
  }

  return `${API_BASE_URL}${path}`;
}
