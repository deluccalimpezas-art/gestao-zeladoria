import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const funcionarias = await prisma.funcionario.findMany({
    where: { deleted: false },
    select: {
      nome: true,
      statusClt: true
    }
  })
  
  const counts: Record<string, number> = {}
  funcionarias.forEach(f => {
    const s = f.statusClt || 'null'
    counts[s] = (counts[s] || 0) + 1
  })
  
  console.log("Status Counts:")
  console.log(JSON.stringify(counts, null, 2))
  
  // Also show a few examples of 'null' statuses if any
  const nulls = funcionarias.filter(f => !f.statusClt).slice(0, 5).map(f => f.nome)
  if (nulls.length > 0) {
    console.log("Examples of null/empty status:", nulls)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
