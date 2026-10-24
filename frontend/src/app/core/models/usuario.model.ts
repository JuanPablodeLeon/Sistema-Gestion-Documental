export type Role = 'admin' | 'user';

export interface Usuario {
  _id: string;
  username: string;
  name: string;
  lastname: string;
  role: Role;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  token: string;
  id: string;
  userName: string;
  role: Role;
}

export interface SessionUser {
  id: string;
  userName: string;
  role: Role;
}

export interface CreateUsuarioDto {
  username: string;
  name: string;
  lastname: string;
  password: string;
  role?: Role;
  status?: boolean;
}

export interface UpdateUsuarioDto {
  name?: string;
  lastname?: string;
  password?: string;
  role?: Role;
  status?: boolean;
}
