import { Logger, UseGuards, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import type { Server } from 'socket.io';
import { MessageStatus } from './entities/message.entity';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { UpdateMessageWsDto } from './dto/update-message-ws.dto';
import { DeleteMessageWsDto } from './dto/delete-message-ws.dto';
import {
  MESSAGE_CREATED_EVENT,
  MESSAGE_DELETED_EVENT,
  MESSAGE_READ_EVENT,
  MESSAGE_UPDATED_EVENT,
  MessageCreatedEvent,
  MessageDeletedEvent,
  MessageReadEvent,
  MessageUpdatedEvent,
} from './events/message.events';
import { WsAuthGuard, AuthenticatedSocket } from '../auth/ws-auth.guard';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: true,
    credentials: true,
  },
})
@UseGuards(WsAuthGuard)
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private readonly allowedOrigins: string[];

  constructor(
    private readonly messagesService: MessagesService,
    private readonly configService: ConfigService,
  ) {
    const origin = this.configService.get<string | string[]>('app.corsOrigin');
    if (Array.isArray(origin)) {
      this.allowedOrigins = origin;
    } else if (typeof origin === 'string' && origin.length > 0) {
      this.allowedOrigins = origin
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    } else {
      this.allowedOrigins = ['http://localhost:3000'];
    }
  }

  handleConnection(client: AuthenticatedSocket): void {
    if (!this.isOriginAllowed(client)) {
      this.logger.warn('Blocked websocket connection due to invalid origin');
      client.disconnect(true);
      return;
    }

    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('conversation.join')
  async handleConversationJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody('conversationId') conversationId: string,
  ): Promise<{ status: 'ok'; conversationId: string }> {
    const user = client.data.user;
    if (!user) {
      throw new WsException('Unauthorized');
    }

    if (!conversationId) {
      throw new WsException('conversationId is required');
    }

    try {
      await this.messagesService.validateConversationAccess(
        conversationId,
        user.id,
      );

      await client.join(conversationId);
    } catch (error) {
      throw this.toWsException(error, 'Unable to join conversation');
    }
    this.logger.debug(
      `User ${user.id} joined conversation ${conversationId} on socket ${client.id}`,
    );

    return { status: 'ok', conversationId };
  }

  @SubscribeMessage('conversation.leave')
  async handleConversationLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody('conversationId') conversationId: string,
  ): Promise<{ status: 'ok'; conversationId: string }> {
    const user = client.data.user;
    if (!user) {
      throw new WsException('Unauthorized');
    }

    if (!conversationId) {
      throw new WsException('conversationId is required');
    }

    try {
      await client.leave(conversationId);
    } catch (error) {
      throw this.toWsException(error, 'Unable to leave conversation');
    }
    this.logger.debug(
      `User ${user.id} left conversation ${conversationId} on socket ${client.id}`,
    );

    return { status: 'ok', conversationId };
  }

  @SubscribeMessage('message.send')
  async handleMessageSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody(new ValidationPipe({ transform: true, whitelist: true }))
    createMessageDto: CreateMessageDto,
  ): Promise<{ status: 'ok'; message: MessageResponseDto }> {
    const user = client.data.user;
    if (!user) {
      throw new WsException('Unauthorized');
    }

    try {
      const message = await this.messagesService.create(
        createMessageDto,
        user.id,
      );

      await client.join(message.conversationId);

      return { status: 'ok', message };
    } catch (error) {
      throw this.toWsException(error, 'Unable to send message');
    }
  }

  @SubscribeMessage('message.update')
  async handleMessageUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody(new ValidationPipe({ transform: true, whitelist: true }))
    payload: UpdateMessageWsDto,
  ): Promise<{ status: 'ok'; message: MessageResponseDto }> {
    const user = client.data.user;
    if (!user) {
      throw new WsException('Unauthorized');
    }

    try {
      const updatedMessage = await this.messagesService.update(
        payload.messageId,
        payload.update,
        user.id,
      );

      await client.join(updatedMessage.conversationId);

      return { status: 'ok', message: updatedMessage };
    } catch (error) {
      throw this.toWsException(error, 'Unable to update message');
    }
  }

  @SubscribeMessage('message.delete')
  async handleMessageDelete(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody(new ValidationPipe({ transform: true, whitelist: true }))
    payload: DeleteMessageWsDto,
  ): Promise<{ status: 'ok'; message: MessageResponseDto }> {
    const user = client.data.user;
    if (!user) {
      throw new WsException('Unauthorized');
    }

    try {
      const deletedMessage = await this.messagesService.delete(
        payload.messageId,
        user.id,
      );

      await client.join(deletedMessage.conversationId);

      return { status: 'ok', message: deletedMessage };
    } catch (error) {
      throw this.toWsException(error, 'Unable to delete message');
    }
  }

  @SubscribeMessage('message.read')
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody('conversationId') conversationId: string,
  ): Promise<{ status: 'ok'; conversationId: string }> {
    const user = client.data.user;
    if (!user) {
      throw new WsException('Unauthorized');
    }

    if (!conversationId) {
      throw new WsException('conversationId is required');
    }

    try {
      await this.messagesService.markConversationAsRead(
        conversationId,
        user.id,
      );

      return { status: 'ok', conversationId };
    } catch (error) {
      throw this.toWsException(error, 'Unable to mark messages as read');
    }
  }

  @OnEvent(MESSAGE_CREATED_EVENT, { async: true })
  async handleMessageCreated(event: MessageCreatedEvent): Promise<void> {
    if (!this.server) {
      return;
    }

    try {
      if (event.recipients.some((id) => id !== event.message.authorId)) {
        await this.messagesService.markAsDelivered(event.message.id);
      }

      const messageToEmit: MessageResponseDto = {
        ...event.message,
        status: MessageStatus.DELIVERED,
      };

      this.server.to(event.conversationId).emit('message.new', messageToEmit);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to broadcast message ${event.message.id}: ${err.message}`,
        err.stack,
      );
    }
  }

  @OnEvent(MESSAGE_UPDATED_EVENT)
  handleMessageUpdated(event: MessageUpdatedEvent): void {
    if (!this.server) {
      return;
    }

    this.server
      .to(event.message.conversationId)
      .emit('message.updated', event.message);
  }

  @OnEvent(MESSAGE_DELETED_EVENT)
  handleMessageDeleted(event: MessageDeletedEvent): void {
    if (!this.server) {
      return;
    }

    this.server
      .to(event.message.conversationId)
      .emit('message.deleted', event.message);
  }

  @OnEvent(MESSAGE_READ_EVENT)
  handleMessageReadEvent(event: MessageReadEvent): void {
    if (!this.server) {
      return;
    }

    this.server.to(event.conversationId).emit('message.read', event);
  }

  private isOriginAllowed(client: AuthenticatedSocket): boolean {
    const origin = client.handshake.headers.origin;

    if (typeof origin !== 'string') {
      return true;
    }

    if (this.allowedOrigins.includes('*')) {
      return true;
    }

    return this.allowedOrigins.includes(origin);
  }

  private toWsException(error: unknown, fallback: string): WsException {
    if (error instanceof WsException) {
      return error;
    }

    if (error instanceof Error) {
      this.logger.warn(`${fallback}: ${error.message}`);
      return new WsException(error.message);
    }

    this.logger.warn(fallback);
    return new WsException(fallback);
  }
}
