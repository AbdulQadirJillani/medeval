import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';

import ws from 'ws';
neonConfig.webSocketConstructor = ws;

// Neon connection
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaNeon({ connectionString });

function prismaClientInit() {
    const client = new PrismaClient({ adapter });
    // Only extend with Accelerate in production
    return process.env.NODE_ENV === 'production'
        ? client.$extends(withAccelerate())
        : client;
}

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
// neonConfig.poolQueryViaFetch = true

declare global {
    var prisma: ReturnType<typeof prismaClientInit> | undefined;
}

const prisma = global.prisma || prismaClientInit();
if (process.env.NODE_ENV === 'development') global.prisma = prisma;

export default prisma;
