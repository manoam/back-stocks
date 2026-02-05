import { Request } from 'express';

export interface KeycloakTokenPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [clientId: string]: {
      roles: string[];
    };
  };
  azp: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  roles: string[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
