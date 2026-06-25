import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const tokens = localStorage.getItem("auth-storage");
    if (tokens) {
      const parsed = JSON.parse(tokens);
      const access = parsed?.state?.accessToken;
      if (access) {
        config.headers.Authorization = `Bearer ${access}`;
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const tokens = localStorage.getItem("auth-storage");
        if (tokens) {
          const parsed = JSON.parse(tokens);
          const refresh = parsed?.state?.refreshToken;
          if (refresh) {
            const { data } = await axios.post("http://localhost:8000/api/token/refresh/", {
              refresh,
            });
            const current = JSON.parse(localStorage.getItem("auth-storage")!);
            current.state.accessToken = data.access;
            localStorage.setItem("auth-storage", JSON.stringify(current));
            originalRequest.headers.Authorization = `Bearer ${data.access}`;
            return api(originalRequest);
          }
        }
      } catch {
        localStorage.removeItem("auth-storage");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
