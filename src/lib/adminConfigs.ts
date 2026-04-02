export const ADMIN_CONFIGS = [
    { name: 'Up', email: 'contato@upcondominios.com' },
    { name: 'Vibra', email: 'financeiro@vibracondominios.com.br' },
    { name: 'Vip', email: 'contato@vipscondominios.com.br' },
    { name: '3s', email: 'whatsapp' },
    { name: 'Dihel', email: 'whatsapp' },
    { name: 'neval', email: 'whatsapp' },
    { name: 'JN', email: 'adm01@jncondominios.com.br' },
    { name: 'ReM', email: 'financeiro1@rmcontabilidadesc.com.br' },
];

export const getAdminEmail = (adminName?: string): string | null => {
    if (!adminName) return null;
    const normalized = adminName.trim().toUpperCase();
    const config = ADMIN_CONFIGS.find(c => c.name.toUpperCase() === normalized);
    return config ? config.email : null;
};
