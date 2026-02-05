import * as jose from 'jose';

interface KeycloakConfig {
  realm: string;
  authServerUrl: string;
  clientId: string;
}

const config: KeycloakConfig = {
  realm: process.env.KEYCLOAK_REALM || 'stock-management',
  authServerUrl: process.env.KEYCLOAK_AUTH_SERVER_URL || 'https://keycloak-production-9856.up.railway.app',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'stock-management-api',
};

let jwks: jose.JWTVerifyGetKey | null = null;

export async function getJwks(): Promise<jose.JWTVerifyGetKey> {
  if (!jwks) {
    const jwksUrl = `${config.authServerUrl}/realms/${config.realm}/protocol/openid-connect/certs`;
    jwks = jose.createRemoteJWKSet(new URL(jwksUrl));
  }
  return jwks;
}

export function getKeycloakConfig(): KeycloakConfig {
  return config;
}

export function getIssuer(): string {
  return `${config.authServerUrl}/realms/${config.realm}`;
}
