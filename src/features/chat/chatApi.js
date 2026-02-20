
import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/v1`,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

export const fetchChatsBySession = async (sessionId) => {
  const res = await API.get(`/live-chats/session/${sessionId}`);
 // console.log("FULL API RESPONSE:", res.data);
  return res.data?.chats || [];
};
