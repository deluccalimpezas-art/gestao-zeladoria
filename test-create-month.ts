import { PrismaClient } from '@prisma/client';
import { createFinanceMonth } from './app/actions';

const prisma = new PrismaClient()

async function main() {
  console.log("Tentando criar mes 3 de 2026...");
  try {
      console.log('Testing createFinanceMonth com nome...');
      const newMonth = await createFinanceMonth("Mês Sandbox Debug");
      console.log('Result:', newMonth);

      const condominios = await prisma.condominio.findMany();
      console.log(`Encontrados ${condominios.length} condominios`);

      const funcionarios = await prisma.funcionario.findMany();
      console.log(`Encontrados ${funcionarios.length} funcionarios`);

      if (condominios.length > 0) {
          await prisma.monthlyCondominio.createMany({
              data: condominios.map(c => ({
                  monthId: newMonth.id,
                  condominioId: c.id,
                  valorCobrado: c.valorContrato || 0,
                  pago: false
              }))
          });
          console.log("Condominios mensais gerados.");
      }

      if (funcionarios.length > 0) {
          await prisma.monthlyFuncionario.createMany({
              data: funcionarios.map(f => ({
                  monthId: newMonth.id,
                  funcionarioId: f.id,
                  valorPago: f.salarioBase || 0,
                  horasExtras: 0
              }))
          });
          console.log("Funcionarios mensais gerados.");
      }
      console.log("SUCESSO!");
  } catch (error) {
      console.error("ERRO COMPLETO:", error);
  } finally {
      await prisma.$disconnect();
  }
}

main();
