type Env = {
    NODE_ENV?: string;
    PORT?: string;
  };
  
  export function validateEnv(config: Record<string, unknown>): Env {
    const env = config as Env;
  
    const nodeEnv = String(env.NODE_ENV ?? 'development');
    if (!['development', 'test', 'production'].includes(nodeEnv)) {
      throw new Error('NODE_ENV must be development | test | production');
    }
  
    const portNum = env.PORT ? Number(env.PORT) : 3000;
    if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
      throw new Error('PORT must be a valid number (1-65535)');
    }
  
    return { NODE_ENV: nodeEnv, PORT: String(portNum) };
  }