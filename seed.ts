import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando injeção de dados robusta...");
  try {
      // 1. Condomínio 1
      let condo1 = await prisma.condominio.findFirst({ where: { nome: "Condomínio Residencial Alpha Teste" } });
      if (!condo1) {
        condo1 = await prisma.condominio.findFirst({ where: { nome: "Condomínio Edifício Alpha Teste" }});
      }
      
      if (!condo1) {
          condo1 = await prisma.condominio.create({
              data: {
                  nome: "Condomínio Edifício Alpha Teste",
                  cnpj: "12.345.678/0001-90",
                  valorContrato: 5000.00,
                  inicio: new Date().toISOString(),
                  termino: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
              }
          });
      }
      console.log('Condominio 1 OK:', condo1.nome);

      let condo2 = await prisma.condominio.findFirst({ where: { nome: "Residencial Bela Vista" } });
      if (!condo2) {
          condo2 = await prisma.condominio.create({
              data: {
                  nome: "Residencial Bela Vista",
                  cnpj: "98.765.432/0001-10",
                  valorContrato: 3200.00,
                  inicio: new Date().toISOString(),
                  termino: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
              }
          });
      }
      console.log('Condominio 2 OK:', condo2.nome);

      // 2. Criar Funcionários
      let func1 = await prisma.funcionario.findFirst({ where: { nome: "João Silva (Zelador)" }});
      if (!func1) {
          func1 = await prisma.funcionario.create({
              data: {
                  nome: "João Silva (Zelador)",
                  statusClt: "registrada",
                  salarioBase: 2500.00,
                  condominioId: condo1.id
              }
          });
      }
      console.log('Funcionário 1 OK:', func1.nome);

      let func2 = await prisma.funcionario.findFirst({ where: { nome: "Maria Oliveira (Aux. Limpeza)" }});
      if (!func2) {
          func2 = await prisma.funcionario.create({
              data: {
                  nome: "Maria Oliveira (Aux. Limpeza)",
                  statusClt: "registrada",
                  salarioBase: 1800.00,
                  condominioId: condo2.id
              }
          });
      }
      console.log('Funcionário 2 OK:', func2.nome);

      console.log('Sucesso! Base populada com verificação de duplicatas.');
  } catch (error) {
      console.error("ERRO na injeção de dados:", error);
  } finally {
      await prisma.$disconnect();
  }
}

main();
