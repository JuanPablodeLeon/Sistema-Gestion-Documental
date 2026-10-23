import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateArchivoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsIn(['txt', 'md'])
  type?: string;

  @IsOptional()
  @IsMongoId()
  parentFolder?: string;

  @IsString()
  content: string;
}
