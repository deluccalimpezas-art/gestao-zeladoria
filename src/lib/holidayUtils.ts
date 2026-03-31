export const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const getEaster = (year: number) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
};

export const getHolidays = (month: number, year: number) => {
    const holidays: { day: number, name: string }[] = [];
    
    // Fixed holidays
    const fixed: Record<number, string>[] = [
        {}, // dummy
        { 1: "Ano Novo" }, // Jan
        {}, // Feb
        {}, // Mar
        { 21: "Tiradentes" }, // Apr
        { 1: "Dia do Trabalho" }, // May
        {}, // Jun
        { 9: "Civismo (SP)" }, // Jul
        {}, // Aug
        { 7: "Independência" }, // Sep
        { 12: "Aparecida" }, // Oct
        { 2: "Finados", 15: "Proclamação", 20: "Consciência Negra" }, // Nov
        { 25: "Natal" } // Dec
    ];

    if (fixed[month]) {
        Object.entries(fixed[month]).forEach(([day, name]) => {
            holidays.push({ day: parseInt(day), name });
        });
    }

    // Movable holidays
    const easter = getEaster(year);
    
    const addMovable = (date: Date, name: string) => {
        if (date.getMonth() + 1 === month) {
            holidays.push({ day: date.getDate(), name });
        }
    };

    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    addMovable(goodFriday, "Sexta Santa");

    const carnival = new Date(easter);
    carnival.setDate(easter.getDate() - 47);
    addMovable(carnival, "Carnaval");

    const corpusChristi = new Date(easter);
    corpusChristi.setDate(easter.getDate() + 60);
    addMovable(corpusChristi, "Corpus Christi");

    return holidays.sort((a, b) => a.day - b.day);
};
