import { getCondominios, getFinanceMonths } from './actions'
import MainContent from './components/MainContent'

export default async function Page() {
    const [condominios, financeMonths] = await Promise.all([
        getCondominios(),
        getFinanceMonths(),
    ]);

    return (
        <MainContent
            initialCondos={condominios}
            initialFinanceMonths={financeMonths}
        />
    );
}
