import { PartialType } from '@nestjs/mapped-types';
import { AddItemDto } from './add-item.dto';

export class UpdateCartDto extends PartialType(AddItemDto) {}
