import { registerAs } from '@nestjs/config';

export default registerAs('r2', () => ({
  accountId: process.env.R2_ACCOUNT_ID || '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  bucket: process.env.R2_BUCKET || '',
  publicBase: process.env.R2_PUBLIC_BASE || '',
  endpoint: process.env.R2_ENDPOINT || '',
  region: process.env.R2_REGION || 'auto',
  presignTtlSeconds: parseInt(process.env.R2_PRESIGN_TTL || '300', 10),
}));
