// services/apiClient.ts
const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

// Get token function (avoid circular import)
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

interface ApiClientOptions<T = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: T;
  headers?: HeadersInit;
}

async function apiClient<T, B = unknown>(
    endpoint: string,
        { method = 'GET', body, headers = {} }: ApiClientOptions<B> = {}
): Promise<T> {
    const token = getToken();
    
    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...headers,
        },
        // Remove credentials since we're using JWT tokens instead of cookies
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${baseURL}${endpoint}`, config);
    if (!response.ok) {
        const errorBody = await response.json();
        console.log(errorBody)
        throw new Error(errorBody.message || 'Something went wrong');
    }

    return response.json() as Promise<T>;
}

export default apiClient;
