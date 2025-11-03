import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/board',
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('BoardGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinBoard')
  handleJoinBoard(client: Socket, boardId: string) {
    client.join(`board:${boardId}`);
    this.logger.log(`Client ${client.id} joined board ${boardId}`);
    return { success: true };
  }

  @SubscribeMessage('leaveBoard')
  handleLeaveBoard(client: Socket, boardId: string) {
    client.leave(`board:${boardId}`);
    this.logger.log(`Client ${client.id} left board ${boardId}`);
    return { success: true };
  }

  // Emit card created event to all clients in the board
  emitCardCreated(boardId: string, card: any) {
    this.server.to(`board:${boardId}`).emit('cardCreated', card);
  }

  // Emit card updated event
  emitCardUpdated(boardId: string, card: any) {
    this.server.to(`board:${boardId}`).emit('cardUpdated', card);
  }

  // Emit card deleted event
  emitCardDeleted(boardId: string, cardId: string) {
    this.server.to(`board:${boardId}`).emit('cardDeleted', { cardId });
  }

  // Emit card moved event (드래그앤드롭)
  emitCardMoved(boardId: string, data: any) {
    this.server.to(`board:${boardId}`).emit('cardMoved', data);
  }

  // Emit column created event
  emitColumnCreated(boardId: string, column: any) {
    this.server.to(`board:${boardId}`).emit('columnCreated', column);
  }

  // Emit column updated event
  emitColumnUpdated(boardId: string, column: any) {
    this.server.to(`board:${boardId}`).emit('columnUpdated', column);
  }

  // Emit column deleted event
  emitColumnDeleted(boardId: string, columnId: string) {
    this.server.to(`board:${boardId}`).emit('columnDeleted', { columnId });
  }
}
