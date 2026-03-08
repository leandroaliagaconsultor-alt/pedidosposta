export type TimeRange = { start: string; end: string };

export type Schedule = {
    sunday: TimeRange[];
    monday: TimeRange[];
    tuesday: TimeRange[];
    wednesday: TimeRange[];
    thursday: TimeRange[];
    friday: TimeRange[];
    saturday: TimeRange[];
};

export type OverrideStatus = 'none' | 'force_open' | 'force_close';

export function checkIfStoreIsOpen(
    schedule: Schedule | null | undefined,
    overrideStatus: OverrideStatus | null | undefined,
    timezone: string = 'America/Argentina/Buenos_Aires'
): boolean {
    if (overrideStatus === 'force_open') return true;
    if (overrideStatus === 'force_close') return false;

    if (!schedule) return true; // Si no hay horario configurado, mantén la tienda abierta por defecto.

    const now = new Date();

    // Utiliza Intl para obtener las partes del tiempo en la zona horaria del local
    const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);

    let weekday = '';
    let hourStr = '';
    let minuteStr = '';

    for (const part of parts) {
        if (part.type === 'weekday') weekday = part.value.toLowerCase();
        if (part.type === 'hour') hourStr = part.value;
        if (part.type === 'minute') minuteStr = part.value;
    }

    // Ajuste en caso de '24' que devuelve Intl a veces
    if (hourStr === '24') hourStr = '00';

    const currentMinutes = parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10);

    const dateMap: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
    };
    const numToDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    const currentDayNum = dateMap[weekday];
    const prevDayNum = (currentDayNum + 6) % 7;
    const prevWeekday = numToDay[prevDayNum] as keyof Schedule;

    // 1. Revisar si la hora actual cae dentro del horario de HOY
    const daySchedule = schedule[weekday as keyof Schedule] || [];
    for (const range of daySchedule) {
        if (!range.start || !range.end) continue;
        const [startH, startM] = range.start.split(':').map(Number);
        const [endH, endM] = range.end.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (startMinutes <= endMinutes) {
            if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) return true;
        } else {
            // Horario trasnocha (ej: 20:00 a 02:00) y estamos antes de medianoche (ej: 22:00)
            if (currentMinutes >= startMinutes) return true;
        }
    }

    // 2. Revisar si la hora actual es parte del trasnoche del horario de AYER
    const prevDaySchedule = schedule[prevWeekday] || [];
    for (const range of prevDaySchedule) {
        if (!range.start || !range.end) continue;
        const [startH, startM] = range.start.split(':').map(Number);
        const [endH, endM] = range.end.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (startMinutes > endMinutes) {
            // Horario trasnocha desde ayer hasta los minutos indicados (ej: 02:00 -> 120 minutos)
            if (currentMinutes <= endMinutes) return true;
        }
    }

    return false;
}
