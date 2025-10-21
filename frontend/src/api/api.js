import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);

export const createScenario = (data, token) => {
  return API.post('/scenario/create', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getScenarios = (token) => {
  return API.get('/scenario', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const deleteScenario = (id, token) => {
  return API.delete(`/scenario/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};