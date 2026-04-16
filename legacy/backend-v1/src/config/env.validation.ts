import * as Joi from 'joi';

interface EnvVars {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  DATABASE_URL_UNPOOLED: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  SEED_ADMIN_EMAIL?: string;
  SEED_ADMIN_PASSWORD?: string;
  SEED_OPERATIONS_EMAIL?: string;
  SEED_OPERATIONS_PASSWORD?: string;
}

const envSchema = Joi.object<EnvVars>({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  DATABASE_URL_UNPOOLED: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  SEED_ADMIN_EMAIL: Joi.string().email().optional(),
  SEED_ADMIN_PASSWORD: Joi.string().min(8).optional(),
  SEED_OPERATIONS_EMAIL: Joi.string().email().optional(),
  SEED_OPERATIONS_PASSWORD: Joi.string().min(8).optional(),
});

export function validateEnv(config: Record<string, unknown>): EnvVars {
  const { error, value } = envSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: false,
  });

  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  return value;
}
