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
      console.log('Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Re-emit all registered events when reconnecting
    this.socket.on('connect', () => {
      this.listeners.forEach((_, event) => {
        if (event.startsWith('subscribe:')) {
          const room = event.replace('subscribe:', '');
          this.socket?.emit('join', { room });
        }
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  joinRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('join', { room });
    }
  }

  leaveRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave', { room });
    }
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
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  // Job tracking specific methods
  subscribeToJob(jobId: string) {
    this.joinRoom(`job:${jobId}`);
  }

  unsubscribeFromJob(jobId: string) {
    this.leaveRoom(`job:${jobId}`);
  }

  onProfessionalLocation(
    callback: (data: { jobId: string; latitude: number; longitude: number }) => void
  ) {
    return this.on('professional:location', callback);
  }

  onJobStatusUpdate(
    callback: (data: { jobId: string; status: string; updatedAt: string }) => void
  ) {
    return this.on('job:status_update', callback);
  }

  onQuoteReceived(
    callback: (data: { requestId: string; quote: any }) => void
  ) {
    return this.on('quote:received', callback);
  }

  onNewNotification(callback: (data: any) => void) {
    return this.on('notification:new', callback);
  }
}

export const socketService = new SocketService();
export default socketService;
