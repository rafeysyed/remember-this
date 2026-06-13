const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let message = "Something went wrong.";
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // Keep the generic fallback for non-JSON error responses.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function createMemory(message) {
  return request("/memories", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function getMemories({ search = "", page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  if (search.trim()) {
    params.set("search", search.trim());
  }
  const query = params.toString();
  return request(`/memories${query ? `?${query}` : ""}`);
}

export function getMemory(id) {
  return request(`/memories/${id}`);
}

export function deleteMemory(id) {
  return request(`/memories/${id}`, {
    method: "DELETE",
  });
}
