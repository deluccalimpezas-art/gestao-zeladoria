import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("CRITICAL: DATABASE_URL is missing in the environment variables!");
    } else if (!url.startsWith('postgres')) {
        console.error("CRITICAL: DATABASE_URL does not start with postgres:// or postgresql://", url.substring(0, 10) + '...');
    }

    return new PrismaClient()
}

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
