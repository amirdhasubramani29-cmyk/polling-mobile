import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const BASE_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:4000";

export async function apiFetch(url: string, options: RequestInit = {}) {
  try {
    const token = await SecureStore.getItemAsync("token");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

    const response = await fetch(fullUrl, { ...options, headers });

    if (response.status === 401) {
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("userId");
      await SecureStore.deleteItemAsync("user");
    }

    return response;
  } catch (error) {
    throw new Error("BACKEND_UNAVAILABLE");
  }
}
