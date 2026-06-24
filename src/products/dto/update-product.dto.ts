import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  version!: number;
}
