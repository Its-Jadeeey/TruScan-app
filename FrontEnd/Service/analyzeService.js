import axios from 'axios';
import Constants from 'expo-constants';

// Point directly to your active FastAPI server
const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
const API_BASE_URL = `http://${devHost ?? '127.0.0.1'}:8001`;

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export async function analyzeText(text) {
  if (!text || text.trim().length < 5) {
    throw new Error('Text too short to analyze.');
  }

  const response = await client.post('/analyze/', {
    text: text.trim(),
    user_id: 'anonymous',
  });

  return response.data;
}