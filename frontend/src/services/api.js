const API_BASE_URL = 'http://localhost/agricultural-rental-system/backend/api';

// Request helper to handle standard options
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('agri_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    throw error;
  }
}

export const api = {
  // Authentication services
  auth: {
    register: (userData) => request('register.php', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    login: (credentials) => request('login.php', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  },

  // Equipment catalog & inventory services
  equipment: {
    getAll: (filters = {}) => {
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.max_price) queryParams.append('max_price', filters.max_price);
      if (filters.available !== undefined && filters.available !== null) {
        queryParams.append('available', filters.available ? '1' : '0');
      }
      
      const queryString = queryParams.toString();
      return request(`equipment.php${queryString ? `?${queryString}` : ''}`);
    },
    
    getOne: (id) => request(`equipment.php?id=${id}`),
    
    getByOwner: (ownerId) => request(`equipment.php?owner_id=${ownerId}`),
    
    create: (equipmentData) => request('equipment.php', {
      method: 'POST',
      body: JSON.stringify(equipmentData),
    }),
    
    update: (id, equipmentData) => request(`equipment.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(equipmentData),
    }),
    
    delete: (id) => request(`equipment.php?id=${id}`, {
      method: 'DELETE',
    }),
  },

  // Bookings / Rentals services
  bookings: {
    getMyBookings: () => request('bookings.php'),
    
    create: (bookingData) => request('bookings.php', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),
    
    updateStatus: (id, status) => request(`bookings.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  },
};
