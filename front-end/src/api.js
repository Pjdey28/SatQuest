import axios from 'axios';

export const BASE = import.meta.env.VITE_API || 'http://localhost:4000';
export const api = axios.create({ baseURL: BASE });
