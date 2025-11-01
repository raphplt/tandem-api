import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  // Secret used by Better Auth; must be set in production
  secret: process.env.AUTH_SECRET,
  // Base URL of the API used by Better Auth (used for cookies/urls even if we are Bearer-only)
  baseURL:
    process.env.AUTH_BASE_URL ||
    `http://localhost:${process.env.PORT || '3001'}`,
}));
