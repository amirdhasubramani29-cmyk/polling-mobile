import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

const GUEST_ID_KEY = "guestId";

export async function getGuestId() {
  let guestId = await AsyncStorage.getItem(GUEST_ID_KEY);

  if (!guestId) {
    guestId = uuidv4();
    await AsyncStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}
