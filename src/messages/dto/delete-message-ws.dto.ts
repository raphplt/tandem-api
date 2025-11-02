import { IsUUID } from 'class-validator';

export class DeleteMessageWsDto {
  @IsUUID()
  messageId: string;
}
