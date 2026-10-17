import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuarioModule } from './usuario/usuario.module';
import { AuthModule } from './auth/auth.module';
import { ComentariosModule } from './comentarios/comentarios.module';
import { ArchivoModule } from './archivo/archivo.module';
import { CarpetaModule } from './carpeta/carpeta.module';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost:27018/backend'), UsuarioModule, AuthModule, ComentariosModule, ArchivoModule, CarpetaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
