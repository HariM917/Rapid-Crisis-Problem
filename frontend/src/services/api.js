import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export const incidentService = {
  getAll: () => api.get('/incident/all'),
  create: (data) => api.post('/incident/create', data),
  update: (id, data) => api.patch(`/incident/${id}`, data),
};

export const mapService = {
  getData: () => api.get('/map/data'),
};

export const userService = {
  login: (credentials) => api.post('/user/login', credentials),
  getStaff: () => api.get('/user/all'),
  register: (data) => api.post('/user/register', data),
};


export const guestService = {
  getAll: () => api.get('/guest/all'),
  register: (data) => api.post('/guest/register', data),
  delete: (id) => api.delete(`/guest/${id}`),
};

export default api;
