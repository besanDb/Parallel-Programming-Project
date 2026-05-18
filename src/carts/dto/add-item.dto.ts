import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AddItemDto {
  @Type(() => Number)
  @IsInt()
  productId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;
}
