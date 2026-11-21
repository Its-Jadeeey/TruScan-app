// A random ID created once per app install and kept on the phone.
// It is sent with reports so the server can rate-limit per device (not per Wi-Fi).
// It contains no personal information and is not linked to the user.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'truscan_device_id';
let cached = null;

export async function getDeviceId() {
  if (cached) return cached;
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (saved) { cached = saved; return saved; }
  } catch {}
  const id = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
  try { await AsyncStorage.setItem(KEY, id); } catch {}
  cached = id;
  return id;
}