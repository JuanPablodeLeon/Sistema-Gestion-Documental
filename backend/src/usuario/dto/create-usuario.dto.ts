import { IsBoolean, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateUsuarioDto {
        
    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @IsString()
    name: string;
    
    @IsNotEmpty()
    @IsString()
    lastname: string;
    

    @IsNotEmpty()
    @IsString()
    @MinLength(4)
    password: string;

    }
