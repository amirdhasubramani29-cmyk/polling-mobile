import * as SecureStore from "expo-secure-store";
import { getGuestId } from "./guestUser";

export async function isLoggedIn(): Promise<boolean> {
  const token = await SecureStore.getItemAsync("token");
  return !!token;
}

export async function getCurrentUserId(): Promise<string> {
  const userId = await SecureStore.getItemAsync("userId");

  if (userId) {
    return userId;
  }

  return await getGuestId();
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync("token");
}

export async function logout() {
  await SecureStore.deleteItemAsync("token");
  await SecureStore.deleteItemAsync("userId");
  await SecureStore.deleteItemAsync("user");
}
