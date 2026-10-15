import { Transform } from "class-transformer";
import {IsString } from "class-validator";

export class LoginDto{
    @IsString()
    username: string;

    @Transform(({ value }) => value.trim())
    @IsString()
    password: string;
}