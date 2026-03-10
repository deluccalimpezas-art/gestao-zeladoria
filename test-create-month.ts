import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Tentando criar condomínio de teste...");
  try {
      const novoCondominio = await prisma.condominio.create({
          data: {
              nome: "Condomínio Edifício Alpha Teste",
              cnpj: "12.345.678/0001-90",
              valorContrato: 5000.00,
              inicio: new Date().toISOString(),
              termino: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          }
      });
      console.log('Condominio de teste criado com sucesso:', novoCondominio);
  } catch (error) {
      console.error("ERRO COMPLETO:", error);
  } finally {
      await prisma.$disconnect();
  }
}

main();
