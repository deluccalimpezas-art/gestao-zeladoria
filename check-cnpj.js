
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log("--- Condomínios no Banco ---");
  const condos = await prisma.condominio.findMany();
  condos.forEach(c => {
    console.log(`ID: ${c.id} | Nome: ${c.nome} | CNPJ: [${c.cnpj}]`);
  });
  
  const duplicates = [];
  const cnpjMap = {};
  condos.forEach(c => {
    if (c.cnpj) {
      if (cnpjMap[c.cnpj]) {
        duplicates.push(c.cnpj);
      }
      cnpjMap[c.cnpj] = true;
    }
  });
  
  if (duplicates.length > 0) {
    console.log("\n!!! DUPLICATAS ENCONTRADAS NO BANCO:", duplicates);
  } else {
    console.log("\nNenhuma duplicata de CNPJ encontrada no banco (Prisma considerou único).");
  }
}

check();
