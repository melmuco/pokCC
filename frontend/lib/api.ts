import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import type { Scansione, CardValuation, CollectionValuation } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadScanImage = (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post<{ data: Scansione }>('/scansioni', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getScanStatus = (id: number) => {
  return api.get<{ data: Scansione }>(`/scansioni/${id}`);
};

export const searchCards = (params: { name?: string; setName?: string; cardNumber?: string }) => {
  return api.get('/cards', { params });
};

export const getCardById = (id: number) => {
  return api.get(`/cards/${id}`);
};

export const getCardValuation = (id: number) => {
  return api.get<CardValuation>(`/pricing/card/${id}`);
};

export const syncCardPrice = (id: number) => {
  return api.post<{ snapshotId: number; price: number }>(`/pricing/card/${id}/snapshot`);
};

export const getUserValuation = () => {
  return api.get<CollectionValuation>('/valuation/user/total');
};

export const getCollectionValuation = (id: number) => {
  return api.get<CollectionValuation>(`/valuation/collection/${id}`);
};

export const exportCollectionCSV = (id: number) => {
  const token = localStorage.getItem('token');
  return api.get(`/collections/${id}/export`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });
};

export interface ScanProgress {
  scanId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}

export { useScanSocket } from '../hooks/use-scan-socket';

let socket: Socket | null = null;

export const connectScanSocket = (scanId: number, onProgress: (progress: ScanProgress) => void, onComplete: (data: any) => void, onError: (error: string) => void) => {
  if (socket) {
    socket.disconnect();
  }

  const token = localStorage.getItem('token');
  socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
    auth: { token },
  });

  socket.emit('joinScan', scanId);

  socket.on('scansione:progress', onProgress);
  socket.on('scansione:completed', onComplete);
  socket.on('scansione:failed', (data: { scanId: number; error: string }) => onError(data.error));

  return socket;
};

export const disconnectScanSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export type { Scansione, CardValuation, CollectionValuation };
export default api;