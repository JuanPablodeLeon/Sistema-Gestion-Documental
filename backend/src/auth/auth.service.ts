import { BadRequestException, Injectable } from '@nestjs/common';
import { UsuarioService } from 'src/usuario/usuario.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usuarioService: UsuarioService
    ) {}

    async login(loginDto: LoginDto){
        const user = await this.usuarioService.findByUsername(loginDto.username);

        if(!user) throw new BadRequestException('Credenciales Incorrectas');

        return "login endpoint";
    }
}
