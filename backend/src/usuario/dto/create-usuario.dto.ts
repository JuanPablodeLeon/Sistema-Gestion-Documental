import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

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
    password: string;

    @IsNotEmpty()
    @IsString()
    rol: string;

    @IsNotEmpty()
    @IsBoolean()
    status: boolean;
    }
