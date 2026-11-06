import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface ScanProgress {
  scanId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ScanGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ScanGateway.name);
  private progressMap: Map<number, ScanProgress> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinScan')
  handleJoinScan(@MessageBody() scanId: number, @ConnectedSocket() client: Socket) {
    client.join(`scan-${scanId}`);
    const progress = this.progressMap.get(scanId) || {
      scanId,
      status: 'pending',
      progress: 0,
    };
    client.emit('scansione:progress', progress);
  }

  emitProgress(scanId: number, status: 'pending' | 'processing' | 'completed' | 'failed', progress: number) {
    const progressData: ScanProgress = { scanId, status, progress };
    this.progressMap.set(scanId, progressData);
    this.server.to(`scan-${scanId}`).emit('scansione:progress', progressData);
  }

  emitCompleted(scanId: number, data: any) {
    this.progressMap.set(scanId, { scanId, status: 'completed', progress: 100 });
    this.server.to(`scan-${scanId}`).emit('scansione:completed', data);
  }

  emitFailed(scanId: number, error: string) {
    this.progressMap.set(scanId, { scanId, status: 'failed', progress: 0 });
    this.server.to(`scan-${scanId}`).emit('scansione:failed', { scanId, error });
  }
}