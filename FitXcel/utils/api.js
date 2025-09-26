import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fitxcel.onrender.com';

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

// GET request
export async function apiGet(path) {
  const url = path.startsWith('/') ? `${BASE_URL}${path}` : `${BASE_URL}/${path}`;
  const res = await fetch(url, { headers: await authHeaders() });
  // If response is not JSON, throw error with status text
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || res.statusText || 'Invalid server response');
  }
  if (!res.ok) throw new Error(extractErrorMessage(data));
  return data;
}


// POST request
export async function apiPost(path, body) {
  const url = path.startsWith('/') ? `${BASE_URL}${path}` : `${BASE_URL}/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body || {}),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || res.statusText || 'Invalid server response');
  }
  if (!res.ok) throw new Error(extractErrorMessage(data));
  return data;
}

// DELETE request
export async function apiDel(path) {
  const url = path.startsWith('/') ? `${BASE_URL}${path}` : `${BASE_URL}/${path}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || res.statusText || 'Invalid server response');
  }
  if (!res.ok) throw new Error(extractErrorMessage(data));
  return data;
}