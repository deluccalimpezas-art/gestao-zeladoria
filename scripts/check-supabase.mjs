import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('--- Checking Supabase Data ---')
    const condos = await prisma.condominio.count()
    const funcs = await prisma.funcionario.count()
    const months = await prisma.financeMonth.count()

    console.log(`Condominios: ${condos}`)
    console.log(`Funcionarios: ${funcs}`)
    console.log(`Finance Months: ${months}`)

    if (condos > 0) {
        const sample = await prisma.condominio.findFirst()
        console.log('Sample Condo:', sample)
    }
}

main().catch(err => {
    console.error('FULL ERROR:', err)
}).finally(() => prisma.$disconnect())
