import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WebSocketEvent, getCustomerRoom, getProfessionalRoom, getJobRoom } from '@depan-express/types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Connection rejected: No token provided');
        client.disconnect();
        return;
      }

      // Verify token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.userId = payload.sub;
      client.userRole = payload.role;

      // Join user-specific room
      if (payload.role === 'CUSTOMER') {
        client.join(getCustomerRoom(payload.sub));
      } else if (payload.role === 'PROFESSIONAL') {
        client.join(getProfessionalRoom(payload.sub));
      } else if (payload.role === 'ADMIN' || payload.role === 'SUPPORT') {
        client.join('admin:dashboard');
        client.join('admin:disputes');
      }

      this.logger.log(`Client connected: ${client.id} (User: ${payload.sub}, Role: ${payload.role})`);
    } catch (error) {
      this.logger.warn('Connection rejected: Invalid token');
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ============================================================
  // JOB ROOM MANAGEMENT
  // ============================================================

  @SubscribeMessage('job:join')
  handleJoinJob(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { jobId: string },
  ) {
    client.join(getJobRoom(data.jobId));
    this.logger.log(`Client ${client.id} joined job room: ${data.jobId}`);
    return { success: true };
  }

  @SubscribeMessage('job:leave')
  handleLeaveJob(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { jobId: string },
  ) {
    client.leave(getJobRoom(data.jobId));
    this.logger.log(`Client ${client.id} left job room: ${data.jobId}`);
    return { success: true };
  }

  // ============================================================
  // LOCATION UPDATES
  // ============================================================

  @SubscribeMessage('pro:location:update')
  handleLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { jobId: string; latitude: number; longitude: number; heading?: number },
  ) {
    if (client.userRole !== 'PROFESSIONAL') {
      return { error: 'Unauthorized' };
    }

    // Broadcast to job room
    this.server.to(getJobRoom(data.jobId)).emit(WebSocketEvent.PRO_LOCATION_UPDATED, {
      jobId: data.jobId,
      professionalId: client.userId,
      latitude: data.latitude,
      longitude: data.longitude,
      heading: data.heading,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  // ============================================================
  // CHAT MESSAGES
  // ============================================================

  @SubscribeMessage('chat:message')
  handleChatMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { jobId: string; content: string; mediaUrl?: string },
  ) {
    const message = {
      messageId: `msg_${Date.now()}`,
      jobId: data.jobId,
      senderId: client.userId,
      senderRole: client.userRole,
      content: data.content,
      mediaUrl: data.mediaUrl,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to job room
    this.server.to(getJobRoom(data.jobId)).emit(WebSocketEvent.CHAT_MESSAGE, message);

    return { success: true, messageId: message.messageId };
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { jobId: string; isTyping: boolean },
  ) {
    client.to(getJobRoom(data.jobId)).emit('chat.typing', {
      userId: client.userId,
      userRole: client.userRole,
      isTyping: data.isTyping,
    });

    return { success: true };
  }

  // ============================================================
  // EMIT HELPERS (Called from services)
  // ============================================================

  emitToUser(userId: string, role: string, event: string, payload: unknown) {
    const room = role === 'CUSTOMER' ? getCustomerRoom(userId) : getProfessionalRoom(userId);
    this.server.to(room).emit(event, payload);
  }

  emitToJob(jobId: string, event: string, payload: unknown) {
    this.server.to(getJobRoom(jobId)).emit(event, payload);
  }

  emitToAdmins(event: string, payload: unknown) {
    this.server.to('admin:dashboard').emit(event, payload);
  }

  // Request events
  emitRequestCreated(customerId: string, requestData: unknown) {
    this.emitToUser(customerId, 'CUSTOMER', WebSocketEvent.REQUEST_CREATED, requestData);
    this.emitToAdmins(WebSocketEvent.REQUEST_CREATED, requestData);
  }

  emitRequestAssigned(customerId: string, professionalId: string, data: unknown) {
    this.emitToUser(customerId, 'CUSTOMER', WebSocketEvent.REQUEST_ASSIGNED, data);
    this.emitToUser(professionalId, 'PROFESSIONAL', WebSocketEvent.REQUEST_ASSIGNED, data);
  }

  // Job events
  emitJobStatusUpdated(jobId: string, customerId: string, professionalId: string, data: unknown) {
    this.emitToJob(jobId, WebSocketEvent.JOB_STATUS_UPDATED, data);
    this.emitToUser(customerId, 'CUSTOMER', WebSocketEvent.JOB_STATUS_UPDATED, data);
    this.emitToUser(professionalId, 'PROFESSIONAL', WebSocketEvent.JOB_STATUS_UPDATED, data);
  }

  // Quote events
  emitQuoteSent(customerId: string, data: unknown) {
    this.emitToUser(customerId, 'CUSTOMER', WebSocketEvent.QUOTE_SENT, data);
  }

  emitQuoteAccepted(professionalId: string, data: unknown) {
    this.emitToUser(professionalId, 'PROFESSIONAL', WebSocketEvent.QUOTE_ACCEPTED, data);
  }

  // Payment events
  emitPaymentCaptured(customerId: string, professionalId: string, data: unknown) {
    this.emitToUser(customerId, 'CUSTOMER', WebSocketEvent.PAYMENT_CAPTURED, data);
    this.emitToUser(professionalId, 'PROFESSIONAL', WebSocketEvent.PAYMENT_CAPTURED, data);
  }
}
