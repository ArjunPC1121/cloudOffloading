import * as dotenv from 'dotenv';

// Load .env first (shared defaults)
dotenv.config();
// Then override with local (per-dev)
dotenv.config({ path: '.env.local' });


if (!process.env.API_BASE_URL) {
    throw new Error('❌ Missing API_BASE_URL in your .env or .env.local file');
}

export default ({ config }) => {
    const isProd = process.env.APP_ENV === 'production';

    return {
        ...config,
        extra: {
            apiBaseUrl: process.env.API_BASE_URL,
        },
    };
};