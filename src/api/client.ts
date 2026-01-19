import axios from "axios";

axios.defaults.withCredentials = true; // Send cookies with every request

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});
