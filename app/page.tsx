import { getCondominios, getFinanceMonths, getFuncionarios, getNotes } from './actions'
import MainContent from '@/components/MainContent'

export const dynamic = 'force-dynamic';

export default async function Page() {
    try {
        const [condominios, financeMonths, funcionarios, notes] = await Promise.all([
            getCondominios(),
            getFinanceMonths(),
            getFuncionarios(),
            getNotes(),
        ]);

        return (
            <MainContent
                initialCondos={condominios}
                initialFinanceMonths={financeMonths}
                initialFuncs={funcionarios}
                initialNotes={notes}
            />
        );

    } catch (error: any) {
        return (
            <div style={{ padding: '40px', color: 'red', fontFamily: 'monospace' }}>
                <h2>Erro Crítico no Servidor da Vercel (Error 500)</h2>
                <p>Ocorreu uma falha ao tentar carregar os dados iniciais do banco de dados (Supabase).</p>
                <hr />
                <h3>Causa Raiz:</h3>
                <pre style={{ background: '#f8d7da', padding: '20px', borderRadius: '8px', overflowX: 'auto' }}>
                    {error?.message || String(error)}
                </pre>
                <br />
                <h3>Próximos Passos:</h3>
                <ul>
                    <li>Verifique na Vercel se a chave <strong>DATABASE_URL</strong> está exatamente igual ao banco de dados e se está no ambiente de "Production".</li>
                    <li>Tire um print (screenshot) desta tela e envie de volta ao Assistente (Antigravity).</li>
                </ul>
            </div>
        )
    }
}
