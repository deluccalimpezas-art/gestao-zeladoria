import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const funcs = await prisma.funcionario.findMany({
        select: {
            id: true,
            nome: true,
            condominioId: true,
            condominioNome: true,
            cargo: true
        }
    });
    console.log(JSON.stringify(funcs, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
