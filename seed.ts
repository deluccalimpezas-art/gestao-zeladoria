import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Injetando Condomínios Reais...")

    await prisma.condominio.create({
        data: {
            nome: 'Solar das Palmeiras',
            cnpj: '11.111.111/0001-11',
            endereco: 'Rua Principal, Centro',
            valorContrato: 5000,
            inicio: '01/01/2026'
        },
    }).catch(() => console.log("Solar das Palmeiras já existe. Ignorando."))

    await prisma.condominio.create({
        data: {
            nome: 'Residencial Vista Mar',
            cnpj: '22.222.222/0001-22',
            endereco: 'Avenida da Praia',
            valorContrato: 12500,
            inicio: '10/02/2026'
        },
    }).catch(() => console.log("Residencial Vista Mar já existe. Ignorando."))

    console.log('Seed finalizado com sucesso no Supabase!')
}

main()
    .catch((e) => {
        console.error("Erro Crítico no Seed", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
