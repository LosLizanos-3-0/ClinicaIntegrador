import axios from "axios";
import { getUsuarioActualId } from "./sesionActual";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const idUsuario = getUsuarioActualId();
  if (idUsuario) {
    config.headers = config.headers ?? {};
    config.headers["x-usuario-id"] = String(idUsuario);
  }
  return config;
});

export default api;