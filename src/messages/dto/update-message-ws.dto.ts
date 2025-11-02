import { IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateMessageDto } from './update-message.dto';

export class UpdateMessageWsDto {
  @IsUUID()
  messageId: string;

  @ValidateNested()
  @Type(() => UpdateMessageDto)
  update: UpdateMessageDto;
}
