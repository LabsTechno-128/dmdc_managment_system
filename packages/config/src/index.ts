import dotenv from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';

const resolveEnvPath = (): string | undefined => {
    const candidates = ['.env', '.env.local', '.env.development'];
    let dir = process.cwd();
    const visited = new Set<string>();
    for (let depth = 0; depth < 8; depth++) {
        if (visited.has(dir)) break;
        visited.add(dir);
        for (const name of candidates) {
            const p = path.join(dir, name);
            if (existsSync(p)) return p;
        }
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    // Try monorepo root relative to compiled files
    const monorepoEnv = path.resolve(__dirname, '../../../.env');
    if (existsSync(monorepoEnv)) return monorepoEnv;
    return undefined;
};

const envPath = resolveEnvPath();
if (envPath) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

export interface AppConfig {
    port: number;
    nodeEnv: 'development' | 'test' | 'production';
    databaseUrl: string;
    // redisHost: string;
    // redisPort: number;
    // jwtSecret: string;
    // jwtExpiresIn: string;
    // jwtRefreshSecret: string;
    // jwtRefreshExpiresIn: string;
    // allowedOrigins: string[];
}

export const loadConfig = (): AppConfig => {
    const port = Number(process.env.PORT ?? 8000);
    const nodeEnv = (process.env.NODE_ENV ?? 'development') as AppConfig['nodeEnv'];
    const databaseUrl = process.env.DATABASE_URL ?? '';
    // const redisHost = process.env.REDIS_HOST ?? 'localhost';
    // const redisPort = Number(process.env.REDIS_PORT ?? 6379);
    // const jwtSecret = process.env.JWT_SECRET ?? '';
    // const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '15d';
    // const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET ?? '';
    // const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
    // const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '*').split(',').filter(Boolean);

    if (!databaseUrl) {
        console.warn('[config] DATABASE_URL is not set');
    }
    // if (!jwtSecret || !jwtRefreshSecret) {
    //     console.warn('[config] JWT secrets are missing');
    // }

    return {
        port,
        databaseUrl,
        nodeEnv,
        // redisHost,
        // redisPort,
        // jwtSecret,
        // jwtExpiresIn,
        // jwtRefreshSecret,
        // jwtRefreshExpiresIn,
        // allowedOrigins,
    };
};
