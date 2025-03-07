import dotenv from 'dotenv';
dotenv.config();
export const SESSION__ID = process.env.SESSION__ID ?? '';
export const HTTP_PORT = process.env.HTTP_PORT ?? 8000;
export const SESSION_SERVER_URL = process.env.SESSION_SERVER_URL ?? `https://xstrosession.koyeb.app/session?session=`;
export const DATABASE_URL = process.env.DATABASE_URL ?? undefined;
