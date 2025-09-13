import axios from "axios";

export const token = async () => {
  const res = await axios.get("https://dramabox-token.vercel.app/token");
  return res.data; // { token, deviceid }
};
