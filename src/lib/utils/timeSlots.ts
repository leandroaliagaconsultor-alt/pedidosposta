import { addMinutes, format, isBefore, isAfter, set, parseISO, startOfMinute } from "date-fns";

type TimeRange = { start: string; end: string };
type Schedule = Record<string, TimeRange[]>;

export function generateAvailableSlots(
    schedule: Schedule | null | undefined,
    maxOrders: number | null | undefined,
    todayOrders: any[]
): { time: string; available: boolean }[] {
    if (!schedule) return [];

    const capacity = maxOrders || 10;

    // 1. Obtener rangos de hoy
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayStr = days[new Date().getDay()];
    const ranges = schedule[todayStr] || [];

    if (ranges.length === 0) return [];

    // 2. Generar todos los slots
    const slots: string[] = [];
    const now = new Date();

    // earliestRealSlot: 30 minutos desde la hora actual para dar margen a preparación
    const earliestRealSlot = addMinutes(now, 30);

    ranges.forEach(range => {
        const [startHours, startMins] = range.start.split(':').map(Number);
        const [endHours, endMins] = range.end.split(':').map(Number);

        let currentSlot = set(now, { hours: startHours, minutes: startMins, seconds: 0, milliseconds: 0 });
        const endTime = set(now, { hours: endHours, minutes: endMins, seconds: 0, milliseconds: 0 });

        while (isBefore(currentSlot, endTime)) {
            // Solo incluimos slots futuros
            if (isAfter(currentSlot, earliestRealSlot)) {
                slots.push(format(currentSlot, "HH:mm"));
            }
            currentSlot = addMinutes(currentSlot, 30);
        }
    });

    // 3. Contar órdenes de hoy
    // Bloque actual, para agrupar las ASAP
    const currentSlotString = format(earliestRealSlot, "HH:mm");

    const ordersCounts = todayOrders.reduce((acc: Record<string, number>, order: any) => {
        // En base a is_asap o scheduled_time
        let slotTime = "";
        if (order.is_asap) {
            // Asumimos que ASAP aplica al bloque siguiente a la hora actual (redondeado o no)
            // Esto es simplificado, podríamos usar una variable global del bloque actual.
            slotTime = currentSlotString;
        } else if (order.scheduled_time) {
            // Extraer HH:mm del TIMESTAMPTZ asumiendo que ya viene en la zona del local
            // parseISO puede usarse si order.scheduled_time está en ISO string ISO
            const dateObj = new Date(order.scheduled_time);
            // Esto tomará la zona horaria del navegador, lo cual es correcto si el cliente está en el mismo país.
            slotTime = format(dateObj, "HH:mm");
        }

        if (slotTime) {
            acc[slotTime] = (acc[slotTime] || 0) + 1;
        }
        return acc;
    }, {});

    // 4. Validar capacidad
    return slots.map(slot => {
        const count = ordersCounts[slot] || 0;
        return {
            time: slot,
            available: count < capacity
        };
    });
}
