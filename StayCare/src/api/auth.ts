const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  language?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw err;
  }

  return res.json(); // safeUser from backend
}

export async function loginUser(payload: {
  email: string;
  password: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw err;
  }

  return res.json(); // { user: safeUser } (and later maybe token)
}
