import { registerAs } from '@nestjs/config';

export default registerAs('keycloak', () => ({
  url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.KEYCLOAK_REALM || 'tandem',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'tandem-api',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'your-client-secret',
}));
