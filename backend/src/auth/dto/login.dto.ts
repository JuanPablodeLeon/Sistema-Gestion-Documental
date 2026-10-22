import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string;

  @Transform((params: TransformFnParams) => {
    const value: unknown = params.value;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  password: string;
}
