import { addMinutes, addDays, format, isBefore, isAfter, set } from "date-fns";

type TimeRange = { start: string; end: string };
type Schedule = Record<string, TimeRange[]>;

export function generateAvailableSlots(
    schedule: Schedule | null | undefined,
    maxOrders: number | null | undefined,
    todayOrders: any[]
): { time: string; available: boolean }[] {
    if (!schedule) return [];

    // 0 o null = sin límite
    const capacity = maxOrders && maxOrders > 0 ? maxOrders : Infinity;

    // 1. Obtener rangos de hoy
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayStr = days[new Date().getDay()];
    const ranges = schedule[todayStr] || [];

    if (ranges.length === 0) return [];

    // 2. Generar todos los slots
    const slots: string[] = [];
    const now = new Date();

    // earliestRealSlot: 5 minutos desde la hora actual (margen mínimo de preparación)
    const earliestRealSlot = addMinutes(now, 5);

    ranges.forEach(range => {
        const [startHours, startMins] = range.start.split(':').map(Number);
        const [endHours, endMins] = range.end.split(':').map(Number);

        let currentSlot = set(now, { hours: startHours, minutes: startMins, seconds: 0, milliseconds: 0 });
        let endTime = set(now, { hours: endHours, minutes: endMins, seconds: 0, milliseconds: 0 });

        // Fix medianoche: si end <= start, el end es del día siguiente
        // Ej: 19:00 - 00:00 → end debe ser mañana a las 00:00
        // Ej: 20:00 - 02:00 → end debe ser mañana a las 02:00
        if (!isAfter(endTime, currentSlot)) {
            endTime = addDays(endTime, 1);
        }

        // Generar slots cada 30 min + incluir explícitamente el slot del cierre
        // (ej. si abre 19:00 y cierra 23:00 → slots: 19:00, 19:30, ..., 22:30, 23:00)
        const slotsForRange = new Set<string>();
        while (isBefore(currentSlot, endTime)) {
            if (!isBefore(currentSlot, earliestRealSlot)) {
                slotsForRange.add(format(currentSlot, "HH:mm"));
            }
            currentSlot = addMinutes(currentSlot, 30);
        }
        // Slot final = hora de cierre (selectable hasta 5 min antes)
        if (!isBefore(endTime, earliestRealSlot)) {
            slotsForRange.add(format(endTime, "HH:mm"));
        }
        slotsForRange.forEach(s => slots.push(s));
    });

    // 3. Contar órdenes de hoy
    const currentSlotString = format(earliestRealSlot, "HH:mm");

    const ordersCounts = todayOrders.reduce((acc: Record<string, number>, order: any) => {
        let slotTime = "";
        if (order.is_asap) {
            slotTime = currentSlotString;
        } else if (order.scheduled_time) {
            const dateObj = new Date(order.scheduled_time);
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
