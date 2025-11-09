import { API_CONFIG, APP_CONFIG } from '../constants/config';

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface LoginResponse {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  token: string;
  assignedCenter: {
    _id: string;
    name: string;
    location: string;
    coordinates: [number, number]; // [latitude, longitude] - as stored in backend
  } | null;
}

export interface AttendanceResponse {
  message: string;
  attendance: any;
}

export type RecentAttendanceItem = any; // Adjust to your backend schema if needed

export interface VersionCheckResponse {
  message: string;
  currentVersion?: string;
  updateRequired?: boolean;
}

export interface ButtonStatusResponse {
  status: boolean;
}

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);

  // More tolerant timeout for mobile networks
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout - API call took too long'));
    }, 20000); // 20 seconds
  });

  try {
    const fetchPromise = fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

    console.log(`📡 API Response: ${response.status} ${response.statusText}`);

    // Handle 426 status code (Upgrade Required) as a special case for version check
    if (response.status === 426) {
      const data = await response.json();
      console.log('🔄 Update required response:', data);
      return data; // Return the response data instead of throwing an error
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url: response.url
      });
      throw new Error(`${response.status}: ${errorData.message || response.statusText || `HTTP error! status: ${response.status}`}`);
    }

    const data = await response.json();
    console.log('✅ API Success:', data);
    return data;
  } catch (error) {
    console.error('❌ API Call failed:', error);

    // Handle network errors more specifically
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network request failed. Please check your internet connection and ensure the server is running.');
    }
    throw error;
  }
};

export const loginTutor = async (payload: LoginPayload): Promise<LoginResponse> => {
  return apiCall(API_CONFIG.ENDPOINTS.TUTOR_LOGIN, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getButtonStatus = async (token: string): Promise<ButtonStatusResponse> => {
  return apiCall(API_CONFIG.ENDPOINTS.BUTTONSTATUS, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const markAttendance = async (currentLocation: [number, number], token: string): Promise<AttendanceResponse> => {
  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ATTENDANCE}`;

  const requestBody = {
    currentLocation: [currentLocation[0], currentLocation[1]] // [lat, lng]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try { errorData = JSON.parse(errorText); } catch { errorData = { message: errorText }; }
      throw new Error(`${response.status}: ${errorData.message || response.statusText}`);
    }

    // Wait for server JSON response with message and attendance, then return
    const data = await response.json();
    return data as AttendanceResponse;
  } catch (error) {
    throw error;
  }
};

export const getStudent=async (id: string, token: string): Promise<any> => {
  const path = API_CONFIG.ENDPOINTS.STUDENT.replace(':id', id);
  return apiCall(path, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
  });
};

export const putStudent=async (id: string, token: string, payload: any): Promise<any> => {
  const path = API_CONFIG.ENDPOINTS.STUDENT.replace(':id', id);
  return apiCall(path, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
  });
}

export const checkAppVersion = async (): Promise<VersionCheckResponse> => {
  // Directly call backend; avoid external connectivity pre-checks which fail on unstable networks
  return apiCall(API_CONFIG.ENDPOINTS.VERSION_CHECK, {
    method: 'POST',
    body: JSON.stringify({
      userVersion: APP_CONFIG.APP_VERSION,
    }),
  });
};

// Fetch today's recent attendance for the logged-in tutor
export const getRecentAttendance = async (token: string): Promise<RecentAttendanceItem[]> => {
  return apiCall(API_CONFIG.ENDPOINTS.ATTENDANCE_RECENT, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export interface Announcement {
  _id: string;
  title?: string;
  body: string;
  createdAt?: string;
}

export const getAnnouncements = async (token: string): Promise<Announcement[]> => {
  return apiCall(API_CONFIG.ENDPOINTS.ANNOUNCEMENTS, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};