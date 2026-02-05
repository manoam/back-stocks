import { Response, NextFunction } from 'express';
import * as jose from 'jose';
import { getJwks, getIssuer, getKeycloakConfig } from '../config/keycloak';
import { AuthenticatedRequest, KeycloakTokenPayload, AuthenticatedUser } from '../types/auth';
import { AppError } from './errorHandler';

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token non fourni', 401);
    }

    const token = authHeader.substring(7);
    const jwks = await getJwks();
    const config = getKeycloakConfig();

    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: getIssuer(),
    });

    const tokenPayload = payload as unknown as KeycloakTokenPayload;

    const realmRoles = tokenPayload.realm_access?.roles || [];
    const clientRoles = tokenPayload.resource_access?.[config.clientId]?.roles || [];

    const user: AuthenticatedUser = {
      id: tokenPayload.sub,
      email: tokenPayload.email || '',
      username: tokenPayload.preferred_username || '',
      firstName: tokenPayload.given_name,
      lastName: tokenPayload.family_name,
      fullName: tokenPayload.name,
      roles: [...realmRoles, ...clientRoles],
    };

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      next(new AppError('Token expiré', 401));
    } else if (error instanceof jose.errors.JWTClaimValidationFailed) {
      next(new AppError('Token invalide', 401));
    } else if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentification échouée', 401));
    }
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const hasRole = roles.some(role => req.user.roles.includes(role));
    if (!hasRole) {
      return next(new AppError('Permissions insuffisantes', 403));
    }

    next();
  };
}
