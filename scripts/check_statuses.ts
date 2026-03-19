import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const statuses = await prisma.funcionario.findMany({
    select: {
      statusClt: true
    }
  })
  const uniqueStatuses = Array.from(new Set(statuses.map(s => s.statusClt)))
  console.log(JSON.stringify(uniqueStatuses, null, 2))
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
