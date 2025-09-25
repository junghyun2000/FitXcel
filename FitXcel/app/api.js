import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function authHeaders() {
  const token = await AsyncStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function extractErrorMessage(data) {
  if (!data) return 'Request failed';
  if (typeof data === 'string') return data;
  if (data.error) return data.error;
  return JSON.stringify(data);
}

export async function apiGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: await authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(extractErrorMessage(data));
  return data;
}

export async function apiPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(extractErrorMessage(data));
  return data;
}

export async function apiDel(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(extractErrorMessage(data));
  return data;
}