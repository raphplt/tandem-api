import { registerAs } from '@nestjs/config';

function toBoolean(value?: string | number | boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  const normalized = (value ?? '').toString().trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

export default registerAs('features', () => ({
  testAccountsEnabled: toBoolean(process.env.FEATURE_TEST_ACCOUNTS),
}));
