import { MessageResponseDto } from '../dto/message-response.dto';

export const MESSAGE_CREATED_EVENT = 'message.created';
export const MESSAGE_UPDATED_EVENT = 'message.updated';
export const MESSAGE_DELETED_EVENT = 'message.deleted';
export const MESSAGE_READ_EVENT = 'message.read';

export interface MessageCreatedEvent {
  message: MessageResponseDto;
  conversationId: string;
  recipients: string[];
}

export interface MessageUpdatedEvent {
  message: MessageResponseDto;
}

export interface MessageDeletedEvent {
  message: MessageResponseDto;
}

export interface MessageReadEvent {
  conversationId: string;
  userId: string;
  unreadCount: number;
}
