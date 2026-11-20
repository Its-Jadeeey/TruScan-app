import axios from 'axios';
import Constants from 'expo-constants';

// Live backend (Render). Used by installed builds.
const LIVE_API_URL = 'https://truscan-backend.onrender.com';

// While developing with Expo Go, talk to the backend on your laptop.
// To test the live server from Expo Go instead, set EXPO_PUBLIC_API_URL.
const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ && devHost ? `http://${devHost}:8001` : LIVE_API_URL);

export const client = axios.create({
  baseURL: API_BASE_URL,
  // The free Render backend can take ~50 s to wake up after being idle.
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

export async function analyzeText(text) {
  if (!text || text.trim().length < 5) {
    throw new Error('Text too short to analyze.');
  }

  const payload = { text: text.trim(), user_id: 'anonymous' };

  try {
    const response = await client.post('/analyze/', payload);
    return response.data;
  } catch (err) {
    // One retry for network errors / timeouts (e.g. server still waking up)
    if (!err.response) {
      const response = await client.post('/analyze/', payload);
      return response.data;
    }
    throw err;
  }
}