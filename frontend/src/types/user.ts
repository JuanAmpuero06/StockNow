export interface User {
  id: number;
  email: string;
  role: 'admin' | 'manager' | 'operator' | 'user';
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}
