import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { useAuthStore } from '@store/auth.store';

const SOCKET_URL = Constants.expoConfig?.extra?.socketUrl || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect() {
    if (this.socket?.connected) return;

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Pro socket connected');
      this.joinProfessionalRoom();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Pro socket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Pro socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  private joinProfessionalRoom() {
    const professional = useAuthStore.getState().professional;
    if (professional?.id) {
      this.socket?.emit('join', { room: `professional:${professional.id}` });
    }
  }

  joinRoom(room: string) {
    this.socket?.emit('join', { room });
  }

  leaveRoom(room: string) {
    this.socket?.emit('leave', { room });
  }

  on<T = any>(event: string, callback: (data: T) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    };
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }

  // Professional specific events
  onNewRequest(callback: (data: { request: any }) => void) {
    return this.on('request:new', callback);
  }

  onQuoteAccepted(callback: (data: { jobId: string; requestId: string }) => void) {
    return this.on('quote:accepted', callback);
  }

  onQuoteDeclined(callback: (data: { requestId: string }) => void) {
    return this.on('quote:declined', callback);
  }

  onJobCancelled(callback: (data: { jobId: string; reason?: string }) => void) {
    return this.on('job:cancelled', callback);
  }

  onNewMessage(callback: (data: { jobId: string; message: any }) => void) {
    return this.on('message:new', callback);
  }

  // Send location updates
  sendLocationUpdate(latitude: number, longitude: number) {
    this.emit('professional:location_update', { latitude, longitude });
  }

  // Subscribe to job updates
  subscribeToJob(jobId: string) {
    this.joinRoom(`job:${jobId}`);
  }

  unsubscribeFromJob(jobId: string) {
    this.leaveRoom(`job:${jobId}`);
  }
}

export const socketService = new SocketService();
export default socketService;
