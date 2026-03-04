import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking DB connection...");
        const count = await prisma.condominio.count();
        console.log("Condominios found:", count);
    } catch (e) {
        console.error("DB Connection ERROR:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
