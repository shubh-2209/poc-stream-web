import { api } from "../../api/apiHelper";
 
export const registerApi = async (userData) => {
  return await api.post("/auth/register", userData);
};
 
export const loginApi = async (credentials) => {
  return await api.post("/auth/login", credentials);
};
 
export const logoutApi = async () => {
  return await api.post("/auth/logout");
};