'use client'

import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Printer, Building2, Calendar, MapPin, Hash, Package, Edit3, RotateCcw } from 'lucide-react';

export function ContractGeneratorView() {
    const [contractorName, setContractorName] = useState('NOME DO CLIENTE');
    const [contractorCNPJ, setContractorCNPJ] = useState('00.000.000/0000-00');
    const [contractorAddress, setContractorAddress] = useState('Rua X, S/N, Bairro, CEP 00.000-000');
    const [contractorCity, setContractorCity] = useState('Itapema/SC');

    // Service options
    const [serviceType, setServiceType] = useState<'22h' | '44h' | 'manual'>('22h');
    const [manualServiceText, setManualServiceText] = useState('A) Detalhes do serviço manual...');
    const [manualPrice, setManualPrice] = useState('0,00');
    const [manualPriceExtenso, setManualPriceExtenso] = useState('Zero reais');

    // Optional price override for 22h/44h modes
    const [usePriceOverride, setUsePriceOverride] = useState(false);
    const [overridePrice, setOverridePrice] = useState('');
    const [overridePriceExtenso, setOverridePriceExtenso] = useState('');

    // Dates
    const today = new Date().toISOString().substring(0, 10);
    const [startDateRaw, setStartDateRaw] = useState(today);
    const [signatureDateRaw, setSignatureDateRaw] = useState(today);
    
    // Manual Edit Mode
    const [isManualMode, setIsManualMode] = useState(false);
    const [manualHtml, setManualHtml] = useState('');
    const editableRef = useRef<HTMLDivElement>(null);

    const toggleManualMode = () => {
        if (!isManualMode) {
            // Entering manual mode: capture current HTML
            const el = document.getElementById('contract-content-area');
            if (el) {
                setManualHtml(el.innerHTML);
                setIsManualMode(true);
            }
        } else {
            // Exiting manual mode: confirm loss of changes
            if (window.confirm("Sair do modo de edição manual irá descartar suas alterações personalizadas e voltar ao modelo automático. Deseja continuar?")) {
                setIsManualMode(false);
            }
        }
    };

    const handleManualChange = () => {
        if (editableRef.current) {
            setManualHtml(editableRef.current.innerHTML);
        }
    };

    // Helpers
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val).replace(/\s/g, '');

    const startDateObj = new Date(startDateRaw + "T12:00:00");
    const signatureDateObj = new Date(signatureDateRaw + "T12:00:00");
    const endDateObj = new Date(startDateObj.getFullYear() + 1, startDateObj.getMonth(), startDateObj.getDate(), 12, 0, 0);

    const startFormatted = !isNaN(startDateObj.getTime()) ? startDateObj.toLocaleDateString('pt-BR') : '__/__/____';
    const endFormatted = !isNaN(endDateObj.getTime()) ? endDateObj.toLocaleDateString('pt-BR') : '__/__/____';

    const getDateExtenso = (d: Date) => {
        if (isNaN(d.getTime())) return "___________ de ___________ de ____";
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
    };

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = ""; // Hide title from browser print header
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 100);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl flex items-center justify-between no-print">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <PenTool className="w-8 h-8 text-rose-400" />
                        Gerador de Contratos
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Preencha os dados do cliente para gerar o contrato em PDF.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleManualMode}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all border ${
                            isManualMode 
                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 hover:bg-amber-500/20' 
                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                    >
                        {isManualMode ? <RotateCcw className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        {isManualMode ? 'Voltar p/ Automático' : 'Habilitar Edição Livre'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
                    >
                        <Printer className="w-4 h-4" /> Imprimir / PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Col - Follows default site scroll */}
                <div className="lg:col-span-4 space-y-6 no-print">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-slate-700 pb-3">Dados da Contratante</h3>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Nome / Razão Social</label>
                            <input
                                value={contractorName}
                                onChange={e => setContractorName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> CNPJ / CPF</label>
                            <input
                                value={contractorCNPJ}
                                onChange={e => setContractorCNPJ(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Endereço Completo</label>
                            <textarea
                                value={contractorAddress}
                                onChange={e => setContractorAddress(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm h-20 resize-none focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Cidade p/ Assinatura</label>
                            <input
                                value={contractorCity}
                                onChange={e => setContractorCity(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                            />
                        </div>

                        <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-slate-700 pb-3 pt-4">Termos do Serviço</h3>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Carga Horária (Zeladoria)</label>
                            <select
                                value={serviceType}
                                onChange={e => setServiceType(e.target.value as any)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all appearance-none"
                            >
                                <option value="22h">22 Horas Semanais</option>
                                <option value="44h">44 Horas Semanais</option>
                                <option value="manual">Manual / Customizado</option>
                            </select>
                        </div>

                        {serviceType === 'manual' && (
                            <>
                                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5">Texto da Carga Horária (item 2.24)</label>
                                    <textarea
                                        value={manualServiceText}
                                        onChange={e => setManualServiceText(e.target.value)}
                                        placeholder="Ex: A) Uma Aux. Limpeza: 30 horas semanais..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm h-32 focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 ml-1">Valor (R$)</label>
                                        <input
                                            value={manualPrice}
                                            onChange={e => setManualPrice(e.target.value)}
                                            placeholder="5.000,00"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 ml-1">Valor p/ Extenso</label>
                                        <input
                                            value={manualPriceExtenso}
                                            onChange={e => setManualPriceExtenso(e.target.value)}
                                            placeholder="Cinco mil reais"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Price override for 22h/44h (optional) */}
                        {serviceType !== 'manual' && (
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={usePriceOverride}
                                        onChange={e => setUsePriceOverride(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-600 text-rose-500 focus:ring-rose-500/50"
                                    />
                                    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-300 transition-colors">Usar preço personalizado</span>
                                </label>
                                {usePriceOverride && (
                                    <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 ml-1">Valor (R$)</label>
                                            <input
                                                value={overridePrice}
                                                onChange={e => setOverridePrice(e.target.value)}
                                                placeholder="4.500,00"
                                                className="w-full bg-slate-900 border border-rose-500/50 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 ml-1">Valor p/ Extenso</label>
                                            <input
                                                value={overridePriceExtenso}
                                                onChange={e => setOverridePriceExtenso(e.target.value)}
                                                placeholder="Quatro mil e quinhentos reais"
                                                className="w-full bg-slate-900 border border-rose-500/50 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Data de Início do Serviço</label>
                            <input
                                type="date"
                                value={startDateRaw}
                                onChange={e => setStartDateRaw(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Data da Assinatura no Papel</label>
                            <input
                                type="date"
                                value={signatureDateRaw}
                                onChange={e => setSignatureDateRaw(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Print Col (A4 format) - Independent scrolling system */}
                <div className="lg:col-span-8 lg:sticky lg:top-8 h-[calc(100vh-180px)] overflow-y-auto pr-2 custom-scrollbar no-print-scroll pb-10">
                    <div id="printable-contract" className="bg-white text-black mx-auto shadow-2xl printable-area">
                        {/* Table trick for consistent margins and hiding browser header/footer */}
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <td style={{ height: '2.5cm' }}></td>
                                </tr>
                            </thead>
                            <tfoot>
                                <tr>
                                    <td style={{ height: '2.5cm' }}></td>
                                </tr>
                            </tfoot>
                            <tbody>
                                <tr>
                                    <td style={{ paddingLeft: '3cm', paddingRight: '2cm', paddingBottom: '0' }}>
                                        {/* A4 Page Content */}
                                        <div className="flex flex-col items-center pt-0 mb-8">
                                            <div className="flex items-baseline gap-0">
                                                <span className="text-6xl font-black text-[#FFD700] tracking-tighter font-serif">De</span>
                                                <span className="text-6xl font-black text-[#00CEE4] tracking-tighter font-sans">Lucca</span>
                                            </div>
                                            <div className="text-[28px] text-[#00CEE4] -mt-3 italic" style={{ fontFamily: "'Dancing Script', cursive", textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.1)' }}>
                                                Gestão em Limpeza
                                            </div>
                                        </div>

                                        {isManualMode ? (
                                            <div 
                                                ref={editableRef}
                                                contentEditable={true}
                                                onBlur={handleManualChange}
                                                dangerouslySetInnerHTML={{ __html: manualHtml }}
                                                className="outline-none min-h-[500px] cursor-text"
                                                suppressContentEditableWarning={true}
                                            />
                                        ) : (
                                            <div id="contract-content-area">
                                                <div className="contract-header uppercase mb-8 text-center text-xl font-bold">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>
                                                <div className="contract-body space-y-4 px-0 pb-10">
                                                    <p><strong>CONTRATANTE:</strong> <span className="font-bold uppercase underline-offset-2">{contractorName || '___________'}</span>, inscrita no CNPJ sob o n° <span className="font-bold">{contractorCNPJ || '___________'}</span>, situado na {contractorAddress || '___________'}.</p>

                                                    <p><strong>CONTRATADA:</strong> <span className="font-bold">DELUCCA SERVIÇOS PREDIAIS LTDA</span>, pessoa jurídica de direito privado, inscrita no CNPJ sob o n° <span className="font-bold">49.909.068/0001-87</span>, localizada na rua 414, Nº 823, Apto. 402, Morretes, Itapema/SC, 88.220-000, neste ato representada por seu sócio administrador Eduardo Gabriel Lucca, portador do CPF sob o n° 143.364.479-77.</p>

                                                    <h4 className="font-bold text-center mt-14 uppercase underline decoration-1 underline-offset-4 avoid-break">Cláusula 1ª – DO OBJETO</h4>
                                                    <p>1.1 – O objeto do presente contrato é a prestação de serviços de Faxina (limpeza e conservação) nas instalações da CONTRATANTE, incluindo, mas não se limitando a:</p>
                                                    <p className="ml-4">a) Manutenção de Ambientes: Organização e conservação de áreas comuns, incluindo salas, corredores, banheiros, áreas externas, academias, salões de festa, elevadores, escadarias, garagens, halls internos, hall de entrada, sauna, salão de jogos, espaço gourmet, área de funcionários, depósitos, calçadas, cozinhas e a reposição de suprimentos (como papel toalha, sabonete, etc.).</p>
                                                    <p className="ml-4">b) Limpeza de Equipamentos: Higienização e limpeza dos móveis das áreas de lazer, do hall de entrada e dos equipamentos instalados nas áreas comuns.</p>
                                                    <p className="ml-4">c) Limpeza de Eletrodomésticos: Limpeza interna e externa de eletrodomésticos, incluindo geladeiras, micro-ondas, fogões, e demais equipamentos, garantindo a manutenção da higiene e funcionamento adequado.</p>
                                                    <p className="ml-4">d) Coleta de Lixo: Recolhimento, separação e destinação adequada de resíduos.</p>

                                                    <h4 className="font-bold text-center mt-14 uppercase underline decoration-1 underline-offset-4 avoid-break">Cláusula 2ª – DAS CONDIÇÕES DA PRESTAÇÃO DE SERVIÇOS</h4>
                                                    <p className="font-bold text-center mt-10">ITEM I – OBRIGAÇÕES DA CONTRATANTE</p>
                                                    <p>2.1 – Fornecer à CONTRATADA as condições necessárias à execução dos serviços, inclusive a disponibilização de materiais de limpeza, produtos e outros que forem necessários, sendo que a eventual ausência ou insuficiência desses materiais poderá impactar a execução dos serviços, sem que haja aplicação de penalidade à CONTRATADA.</p>
                                                    <p>2.2 – Permitir livre acesso dos funcionários ao ambiente que se trata do objeto deste contrato, desde quando devidamente identificados.</p>
                                                    <p>2.3 – Deverá efetuar o pagamento na forma e condições estabelecidas na Cláusula 3ª.</p>

                                                    <p className="font-bold text-center mt-10">ITEM II – OBRIGAÇÕES DA CONTRATADA</p>
                                                    <p>2.4 – A CONTRATADA, diante deste contrato, se compromete a executar a prestação de serviços referentes a limpeza e conservação das instalações da CONTRATANTE de acordo com as condições estabelecidas entre as partes.</p>
                                                    <p>2.5 – Executar todos os serviços com observância das normas técnicas e legislação vigente, com pessoal qualificado e utilizando os equipamentos de proteção individual (EPIs) obrigatórios.</p>
                                                    <p>2.6 – A CONTRATADA será exclusivamente responsável por eventuais danos corporais e/ou materiais ou pecuniários, causados ao CONTRATANTE e/ou a terceiros decorrentes da falha da prestação de serviços ou atos praticados por seus funcionários na execução do objeto deste contrato. No caso de danos a terceiros, caso a CONTRATANTE venha ser acionada judicialmente, a CONTRATADA, desde já, admite e concorda com a sua responsabilidade.</p>
                                                    <p>2.7 – Qualquer serviço a ser executado, que não se trate do objeto deste contrato, deverá ser, previamente autorizado pelo CONTRATANTE.</p>
                                                    <p>2.8 – A CONTRATADA se responsabiliza por guardar, zelar e manter em segurança todos os materiais e equipamentos utilizados até a conclusão da prestação de serviços.</p>
                                                    <p>2.9 – Designar um representante para representar a CONTRATADA, nos assuntos referentes aos serviços pactuados.</p>
                                                    <p>2.10 – Não poderá, em hipótese alguma, transferir ou delegar as atribuições e responsabilidades que assume por força deste contrato, sem que haja autorização expressa da CONTRATANTE.</p>
                                                    <p>2.11 – Deverá comunicar-se com a CONTRATANTE sempre que ocorrer alguma anormalidade que possa prejudicar o atendimento das cláusulas deste contrato, ou a prestação dos serviços de acordo com o estabelecido.</p>
                                                    <p>2.12 – No caso dos serviços apresentarem imperfeições/incorreções, efetuar as devidas correções, sem ônus ao CONTRATANTE.</p>
                                                    <p>2.13 – A CONTRATADA fiscalizará, permanentemente, com pessoal próprio, a qualidade e a execução dos serviços</p>
                                                    <p>2.14 – Instruir o (a) Encarregado(a) que será responsável pelos serviços e terá a missão de garantir o seu bom andamento, permanecendo no local de sua execução, ministrando a orientação necessária aos demais funcionários e efetuando a sua fiscalização.</p>
                                                    <p>2.15 – Instruir o Preposto para supervisão dos serviços contratados, permanecendo no local, sendo este o elo entre a CONTRATADA e a CONTRATANTE, devendo possuir poderes para solucionar problemas oriundos da relação contratual, sobretudo substituição de funcionários, regularização de pendências relacionadas a vales-alimentação, salários e demais benefícios, bem como para fiscalizar as condições de apresentação dos empregados (uniformes e crachás), nos locais de trabalho.</p>
                                                    <p>2.16 – O Preposto terá a obrigação de se reportar, quando necessário, ao responsável pelo acompanhamento dos serviços da CONTRATANTE e de tomar as providências pertinentes para que sejam corrigidas todas as falhas detectadas.</p>
                                                    <p>2.17 – No caso de férias, realizar uma lista contendo a relação dos substitutos e substituídos nos moldes do parágrafo anterior que deverá ser apresentada ao CONTRATANTE, com antecedência mínima de 05 (cinco) dias úteis.</p>
                                                    <p>2.18 – Em quaisquer casos de afastamentos (faltas, licenças, etc.), a substituição, no posto de trabalho, deverá ser realizada em, no máximo, 01 (um) período, por outro empregado de igual qualificação e capacidade técnica, devendo a CONTRATADA apresentar, até o momento da efetiva substituição, documento contendo os dados exigidos neste instrumento. Caso a devida substituição não seja realizada dentro do prazo especificado, o afastamento ensejará a realização de desconto na fatura do mês correspondente, com base nos custos apresentados pela CONTRATADA.</p>
                                                    <p>2.19 – Executar os serviços objeto deste contrato garantindo que não haja interrupções e/ou paralisações em caso de faltas, folgas e férias de seus empregados.</p>
                                                    <p>2.20 – Correrão por conta e responsabilidade exclusiva da CONTRATADA todas as obrigações trabalhistas, previdenciárias, acidentais e fiscais decorrentes da relação empregatícia entre a CONTRATADA e seus prepostos ou colaboradores que forem designados para a execução dos serviços, nos termos deste contrato.</p>
                                                    <p>2.21 – Cumprir, durante a prestação dos serviços com todas as Leis Federais, Estaduais e Municipais, bem como normas técnicas, vigentes ou que venham a viger, sendo a única responsável por infrações cometidas.</p>
                                                    <p>2.22 – A CONTRATADA, única e exclusivamente, se responsabiliza por quaisquer acidentes ou danos que seus funcionários e/ou prepostos venham a sofrer, durante a prestação de serviços, arcando com todas as despesas decorrentes do fato, sem prejuízo da contratação de seguro coletivo contra danos e acidentes pessoais, cuja apólice será apresentada ao CONTRATANTE no início da prestação dos serviços e em todas as renovações de vigência.</p>
                                                    <p>2.23 – Substituir o funcionário ou qualquer pessoa, sob sua responsabilidade, no prazo de 24 horas ou imediatamente, a contar da reclamação formal, que venha a se comportar de modo inconveniente perante a CONTRATANTE e/ou seus condôminos, devendo, todavia, a CONTRATADA ser imediatamente comunicada sobre o fato para que possa tomar as medidas aqui ajustadas.</p>

                                                    <p>2.24 – A Contratada prestará o serviço de forma regular com o seguinte quadro de pessoal qualificado:</p>
                                                    {serviceType === '22h' ? (
                                                        <div className="ml-4 whitespace-pre-wrap leading-relaxed">
                                                            <p className="font-bold">A) Uma Auxiliar de limpeza - 22h semanais</p>
                                                            <p>   -Segunda à sexta-feira. </p>
                                                            <p>     Período matutino (08:00 às 12:00)</p>
                                                            <br />
                                                            <p>   -Sábado. </p>
                                                            <p>     Período matutino  (08:00 às 10:00)</p>
                                                        </div>
                                                    ) : serviceType === '44h' ? (
                                                        <div className="ml-4 whitespace-pre-wrap leading-relaxed">
                                                            <p className="font-bold">A) Uma zeladora - 44h semanais</p>
                                                            <p>   -Segunda à sexta-feira. </p>
                                                            <p>     Período Integral (08:00 às 12:00, 13:00 às 17:00)</p>
                                                            <br />
                                                            <p>   -Sábado. </p>
                                                            <p>     Período matutino  (08:00 às 12:00)</p>
                                                        </div>
                                                    ) : (
                                                        <div className="ml-4 whitespace-pre-wrap leading-relaxed">
                                                            {manualServiceText.split('\n').map((line, i) => (
                                                                <p key={i} className={i === 0 ? "font-bold" : ""}>{line}</p>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <p className="page-break-container font-bold text-center mt-14 uppercase underline decoration-1 underline-offset-4 avoid-break">ITEM III – SERVIÇOS E SUAS EXECUÇÕES</p>
                                                    <p>2.27 – Os serviços serão prestados de forma pessoal à CONTRATANTE, sendo incluídos, também, aqueles que indiretamente se vinculam ao presente contrato.</p>
                                                    <p>2.28 – A CONTRATADA atuará nos serviços contratados de acordo com as especificações descritas na Cláusula 1ª.</p>
                                                    <p>2.29 – Os serviços terão início imediatamente após a assinatura deste contrato.</p>
                                                    <p>2.30 – Obriga-se a CONTRATADA a manter o estrito sigilo de todos os dados pessoais tratados, decorrentes do presente contrato, não podendo divulgá-los sem a devida autorização, por escrito, da CONTRATANTE</p>

                                                    <h4 className="font-bold text-center mt-14 uppercase underline decoration-1 underline-offset-4 avoid-break">Cláusula 3ª – DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO</h4>
                                                    {(serviceType === '22h' && !usePriceOverride) ? (
                                                        <p>3.1 – As atividades objeto deste contrato serão remuneradas pela quantia de <span className="font-bold">R$ 3.600,00 (Três mil e seiscentos reais)</span> por mês.</p>
                                                    ) : (serviceType === '44h' && !usePriceOverride) ? (
                                                        <p>3.1 – As atividades objeto deste contrato serão remuneradas pela quantia de <span className="font-bold">R$ 9.400,00 (Nove mil e quatrocentos reais)</span> por mês.</p>
                                                    ) : serviceType === 'manual' ? (
                                                        <p>3.1 – As atividades objeto deste contrato serão remuneradas pela quantia de <span className="font-bold">R$ {manualPrice} ({manualPriceExtenso})</span> por mês.</p>
                                                    ) : (
                                                        <p>3.1 – As atividades objeto deste contrato serão remuneradas pela quantia de <span className="font-bold">R$ {overridePrice || '___'} ({overridePriceExtenso || '___'})</span> por mês.</p>
                                                    )}
                                                    <p>3.2 – O pagamento deverá ser realizado mensalmente, com emissão da respectiva Nota Fiscal, por meio de Pix, TED ou dinheiro físico, com vencimento para todo dia 05 de cada mês.</p>
                                                    <p>3.3 – Caso o contrato seja extinto pela CONTRATANTE, não haverá a devolução de nenhum dos valores já pagos à empresa CONTRATADA dos serviços efetivamente realizados.</p>
                                                    <p>3.4 – Poderá ser realizado o pagamento de valores adicionais à CONTRATADA, desde que haja a concordância expressa de ambas as partes, se houver necessidade de serviços pontuais ou um aumento de demanda não previsto no anexo deste contrato.</p>
                                                    <p>3.5 – O valor pactuado no contrato contempla, custos, despesas e tributos, não sendo cabível a cobrança de nenhum valor adicional, a que título for.</p>
                                                    <p>3.6 – No caso de descumprimento dos prazos dos cronogramas, sem justo motivo, a CONTRATANTE poderá suspender ou reter o pagamento, desde que previamente notifique a CONTRATADA por escrito, concedendo prazo de 5 (cinco) dias úteis para regularização.</p>
                                                    <p>3.7 – A CONTRATADA não poderá, em nenhuma hipótese e com base nos valores a receber, descontar títulos perante Instituições Bancárias ou emitir duplicata contra a CONTRATANTE, devendo sempre receber os valores conforme essa previsão, sob pena de rescisão contratual, não reconhecer o crédito cedido ao terceiro e pagamento das cominações previstas contratualmente sem prejuízo de perdas e danos.</p>
                                                    <p>3.8 – A CONTRATANTE não autoriza que a empresa CONTRATADA, seus sócios ou diretores, negociem ou descontem em empresa de factoring ou transações congêneres, total ou parcialmente os valores objeto deste contrato.</p>
                                                    <p>3.9 – O CONTRATANTE poderá reter o pagamento da fatura a ser paga, nas hipóteses de ausência na prestação de serviços; falta de recolhimento de encargos, tributos e contribuições; atraso no pagamento de salários dos funcionários alocados nas suas dependências, cujos comprovantes / folhas de pagamento de funcionários / holerites deverão ser encaminhados mensalmente à CONTRATANTE antes do envio da(s) fatura(s) de pagamento; sem aplicação de multa e juros, até efetiva regularização da questão, que deverá ocorrer no prazo de 5 (CINCO) dias úteis, sob pena de rescisão imediata do contrato.</p>
                                                    <p>3.10 – Dos Serviços de Limpeza Eventuais:</p>
                                                    <p className="ml-4">3.10.1 – Os serviços de limpeza de salão de festas serão remunerados pelo valor de R$150,00 (cento e cinquenta reais) por cada limpeza realizada, exclusivamente de segunda-feira a sábado.</p>
                                                    <p className="ml-4">3.10.2 – Os serviços de limpeza de pub serão remunerados pelo valor de R$81,50 (oitenta e um reais e cinquenta centavos) por cada limpeza realizada, exclusivamente de segunda-feira a sábado.</p>
                                                    <p className="ml-4">3.10.3 – Os valores previstos nesta cláusula referem-se a serviços pontuais e não estão incluídos no valor mensal estabelecido na cláusula 3.1.</p>
                                                    <p className="ml-4">3.10.4 – Os valores previstos nesta cláusula poderão sofrer alteração caso os serviços sejam realizados aos domingos ou feriados, devendo, nesses casos, os novos valores serem previamente ajustados entre as partes.</p>

                                                    <h4 className="font-bold text-center mt-14 uppercase underline decoration-1 underline-offset-4 avoid-break">Cláusula 4ª – DA RESCISÃO</h4>
                                                    <p>4.1 – O presente contrato poderá ser rescindido imotivadamente a qualquer tempo pelas partes, mediante comunicação escrita à outra parte, com antecedência mínima de 30 (trinta) dias, observadas as disposições quanto à aplicação de multa previstas nesta cláusula.</p>
                                                    <p>4.2 – O presente instrumento será considerado rescindido de pleno direito, independentemente de notificação judicial ou extrajudicial, nas seguintes hipóteses:</p>
                                                    <p className="ml-4">a) Descumprimento das obrigações ajustadas por quaisquer das PARTES, se não sanado o inadimplemento dentro de 5 (cinco) dias, a contar da data do recebimento de notificação escrita pela parte prejudicada;</p>
                                                    <p className="ml-4">b) Na hipótese de insolvência, falência, recuperação judicial ou extrajudicial ou ação semelhante, ou de resolução para dissolução ou liquidação judicial, de qualquer das PARTES;</p>
                                                    <p className="ml-4">c) Encerramento da atividade, venda, cessão de direitos, alteração societária, não aprovação do plano de recuperação e deferimento de falência da CONTRATADA; e</p>
                                                    <p className="ml-4">d) Condenação trabalhista da CONTRATADA em primeira instância decorrente de reclamação trabalhista proposta por seus funcionários e que prestem ou prestaram serviços nas dependências do CONTRATANTE, sendo que, neste caso, é facultado a este último reter o pagamento das faturas, limitada a três, até que haja a satisfação da obrigação.</p>
                                                    <p>4.3 – Na ocorrência de resolução contratual motivada, a CONTRATADA apresentará, no prazo de 07 (sete) dias, um relatório completo dos trabalhos executados até a data della resolução e entregará ao CONTRATANTE os documentos de propriedade desta. Após a aprovação deste relatório em igual período pelo CONTRATANTE, este pagará em até 10 (dez) dias úteis, os valores devidos pelos serviços executados até o momento, nos termos do contrato.</p>
                                                    <p>4.4 – Na hipótese de rescisão imotivada (sem justa causa) por qualquer das partes antes do término da vigência contratual, a parte que der causa à rescisão deverá pagar à outra multa compensatória equivalente a 01 (uma) mensalidade do valor vigente à época da rescisao.</p>
                                                    <p>4.5 – A multa prevista na cláusula anterior não será aplicável nos casos de rescisão motivada por descumprimento contratual, nem quando houver manifestação de qualquer das partes, pela não renovação do contrato ao término do período vigente.</p>

                                                    <h4 className="font-bold text-center mt-14 uppercase underline decoration-1 underline-offset-4 avoid-break">Cláusula 5ª – DO PRAZO E DA VALIDADE</h4>
                                                    <p>5.1 – O prazo do presente contrato será de 12 (doze) meses, com início em <span className="font-bold">{startFormatted}</span> e término em <span className="font-bold">{endFormatted}</span>, sendo automaticamente renovado por iguais e sucessivos períodos, salvo manifestação contrária de qualquer das partes, mediante comunicação por escrito com antecedência mínima de 30 (trinta) dias.</p>

                                                    <h4 className="font-bold text-center mt-14 uppercase underline decoration-1 underline-offset-4 avoid-break">Cláusula 6ª – DO REAJUSTE</h4>
                                                    <p>6.1 – Os preços do presente contrato serão reajustados anualmente, sempre na data-base da categoria (1º de fevereiro), com base nos percentuais estabelecidos em Acordo ou Convenção Coletiva de Trabalho, devidamente registrados no Tribunal Regional do Trabalho (TRT) da respectiva região, ou, na sua ausência, por Dissídio Coletivo devidamente homologado.</p>
                                                    <p>6.2 – Caso não haja instrumento coletivo aplicável na data do reajuste, as partes poderão ajustar, de comum acordo, a aplicação de índice oficial de inflação, como o IPCA ou IGPM, até a definição do índice da categoria.</p>

                                                    <h4 className="font-bold text-center mt-14 uppercase underline decoration-1 underline-offset-4 avoid-break">Cláusula 7ª – DA AUSÊNCIA DE VÍNCULO TRABALHISTA</h4>
                                                    <p>7.1. Os serviços objeto do presente contrato serão realizados exclusivamente por empregados da Contratada, razão pela qual nenhuma relação empregatícia ou jurídica existirá entre os mesmos e a Contratante, ficando a Contratante isenta de qualquer encargos trabalhistas, sociais ou previdenciários que possam decorrer dos serviços que serão prestados pelos referidos empregados, pois tais ônus serão de exclusiva responsabilidade da Contratada.</p>

                                                    <h4 className="font-bold text-center mt-14 uppercase underline decoration-1 underline-offset-4 avoid-break">Cláusula 8ª – DISPOSIÇÕES GERAIS</h4>
                                                    <p>8.1 – Os tributos e contribuições, que incidam ou venham a incidir sobre as importâncias pagas em decorrência direta ou indireta deste Contrato ou de sua execução, serão suportados pelo seu contribuinte, assim definido na legislação que instituir e/ou regular esses tributos e contribuições</p>
                                                    <p>8.2 – O presente contrato não implica em qualquer outra forma de associação.</p>
                                                    <p>8.3 – Este contrato, bem como seus direitos e obrigações dele decorrentes, não poderão ser cedidos e/ou transferidos pelas partes, obrigando-as, por si, seus herdeiros e/ou sucessores.</p>
                                                    <p>8.4 – Este instrumento representa todos os acordos e condições estipulados pelas partes para o seu objetivo, revogando e substituindo os contratos, anexos e aditivos firmados anteriormente pelas partes, os quais são dados neste ato como resilidos e quitados.</p>
                                                    <p>8.5 – Toda e qualquer alteração pertinente ao contrato deverá ser informada imediatamente à outra parte, assim que de sua ocorrência, sob pena de ser responsabilizada a parte a quem cabia esta obrigação pelos prejuízos acarretados decorrentes desse atraso.</p>
                                                    <p>8.6 – Todo e qualquer serviço a ser executado, bem como a utilização de equipamento ou de material, que não estejam previstos no presente contrato, somente poderão ocorrer se houver determinação por escrito, devidamente assinada pela CONTRATANTE, passando a fazer parte integrante deste contrato.</p>
                                                    <p>8.7 – Não pode a CONTRATADA transferir os serviços previstos neste instrumento, sob o risco de ocorrer a rescisão imediata, salvo com expressa autorização do CONTRATANTE.</p>
                                                    <p>8.8 – As partes desde já acordam que responderá por perdas e danos à parte que infringir qualquer cláusula prevista neste contrato.</p>
                                                    <p>8.9 – Fica expressamente estipulado que não se estabelece entre o CONTRATANTE e o pessoal da CONTRATADA, ou prepostos da CONTRATADA, utilizados na prestação dos serviços objeto deste contrato, qualquer vínculo ou relação de trabalho, sendo de exclusiva responsabilidade da CONTRATADA o cumprimento de todas as obrigações trabalhistas, previdenciárias, fiscais e relativas a acidentes de trabalho decorrentes da relação com seus empregados.</p>
                                                    <p className="ml-4 italic shadow-sm">Parágrafo único – Na hipótese de o CONTRATANTE vir a ser acionado judicialmente por empregados ou prepostos da CONTRATADA, esta se compromete a assumir a responsabilidade pela defesa e, se for o caso, ressarcir os valores comprovadamente pagos pelo CONTRATANTE, incluindo despesas e honorários advocatícios, desde que comprovada a responsabilidade da CONTRATADA.</p>
                                                    <p>8.10 – Fica convencionado que a CONTRATADA, em relação aos seus funcionários alocados na CONTRATANTE, se responsabiliza por quaisquer ônus decorrentes de fiscalizações realizadas pelo Ministério do Trabalho e do Emprego, através das Delegacias Regionais do Trabalho, tais como notificações para apresentação de documentos, registros de empregados, esclarecimentos, e outros que forem pertinentes à situação, além da apresentação de defesas e recursos administrativos decorrentes de autuações fiscais, com o necessário pagamento das multas administrativas impostas.</p>
                                                    <p>8.11 – Todas as informações a que tiver acesso o CONTRATADO em decorrência da execução do objeto do presente deverão ser tratadas confidencialmente, sendo vedada sua divulgação ou publicidade junto a terceiros.</p>

                                                    <p className="mt-8">Em caso de controvérsias, dúvidas, processos e conflitos, fica eleito o foro da comarca de Itapema-SC, ainda que exista outro mais privilegiado, sendo este o eleito para qualquer ação ou execução que possa ocorrer por motivo de descumprimento de algumas das cláusulas dispostas neste documento ou da legislação brasileira aplicável.</p>
                                                    <p className="mt-4">E, por estarem assim, justas e contratadas, CONTRATANTE E CONTRATADO assinam o presente instrumento em 2 (duas) vias de igual teor e forma para a produção de todos os efeitos de direito.</p>

                                                    <div className="text-right mt-20 mb-12 avoid-break">
                                                        <span className="font-bold italic">{contractorCity}, {getDateExtenso(signatureDateObj)}.</span>
                                                    </div>

                                                    {/* Signatures */}
                                                    <div className="grid grid-cols-2 gap-16 text-center text-sm mt-12 mb-12 px-4 avoid-break">
                                                        <div className="space-y-1">
                                                            <div className="border-t border-black pt-2 mb-1">
                                                                <p className="font-bold">CONTRATANTE</p>
                                                            </div>
                                                            <p className="font-bold uppercase leading-tight min-h-[1.2em]">{contractorName || "========================="}</p>
                                                            <p className="text-xs">CNPJ Nº {contractorCNPJ || "00.000.000/0000-00"}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="border-t border-black pt-2 mb-1">
                                                                <p className="font-bold">CONTRATADA</p>
                                                            </div>
                                                            <p className="font-bold uppercase leading-tight min-h-[1.2em]">DELUCCA SERVIÇOS PREDIAIS LTDA</p>
                                                            <p className="text-xs">CNPJ Nº 49.909.068/0001-87</p>
                                                        </div>
                                                        <div className="space-y-1 mt-6">
                                                            <div className="border-t border-black pt-2 mb-1">
                                                                <p className="font-bold">Testemunha 1</p>
                                                                <p className="text-xs">CPF: </p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1 mt-6">
                                                            <div className="border-t border-black pt-2 mb-1">
                                                                <p className="font-bold">Testemunha 2</p>
                                                                <p className="text-xs">CPF: </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&display=swap');
                
                .printable-area {
                    width: 100%;
                    max-width: 21cm;
                    min-height: 29.7cm;
                    padding: 1cm;
                    margin: 0 auto;
                    background: white;
                    font-family: "Arial", sans-serif;
                    font-size: 10pt;
                    line-height: 1.4;
                    text-align: justify;
                }
                @media (min-width: 1280px) {
                    .printable-area {
                        padding: 2cm;
                        font-size: 11pt;
                    }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
                .contract-header {
                    text-align: center;
                    font-size: 14pt;
                    font-weight: bold;
                    margin-bottom: 1.5cm;
                }
                @media print {
                    .no-print-scroll {
                        height: auto !important;
                        overflow: visible !important;
                    }
                    @page { 
                        margin: 0; /* Suppress browser header/footer */
                    }
                    body { margin: 0; border: none; }
                    body * {
                        visibility: hidden;
                    }
                    .no-print {
                        display: none !important;
                    }
                    /* Ensure parent containers do not hide overflow or clip the print */
                    body, html, main, div {
                        height: auto !important;
                        overflow: visible !important;
                    }
                    #printable-contract, #printable-contract * {
                        visibility: visible;
                    }
                    #printable-contract {
                        position: absolute;
                        left: 0;
                        right: 0;
                        top: 0;
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        box-shadow: none;
                    }
                    .printable-area {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                }
                    .page-break-container {
                        break-before: page;
                        page-break-before: always;
                    }
                    .avoid-break {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    /* Ensure no other elements overlap the top margin */
                    .page-break-container + * {
                        margin-top: 0 !important;
                    }
            ` }} />
        </div>
    );
}
