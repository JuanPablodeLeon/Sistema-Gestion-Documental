import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateComentarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  texto: string;
}
