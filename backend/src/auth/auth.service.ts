import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuarioService } from 'src/usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
    constructor(
        private readonly usuarioService: UsuarioService,
        private readonly jwtService: JwtService
    ) {}

    async login(loginDto: LoginDto){
        const user = await this.usuarioService.findByUsername(loginDto.username);

        if(!user) throw new UnauthorizedException('Credenciales Incorrectas');

        const pass = await bcryptjs.compare(loginDto.password, user.password);

        if(!pass) throw new UnauthorizedException('Credenciales Incorrectas');

        return user;
        //return "login endpoint";
    }
}
