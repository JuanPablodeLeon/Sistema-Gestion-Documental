import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuarioModule } from './usuario/usuario.module';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost:27018/backend'), UsuarioModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
