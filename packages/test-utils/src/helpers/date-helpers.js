export function daysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}
export function daysFromNow(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}
export function hoursAgo(hours) {
    const date = new Date();
    date.setHours(date.getHours() - hours);
    return date;
}
export function hoursFromNow(hours) {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return date;
}
export function startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}
export function endOfDay(date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}
export function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}
export function endOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
export function isSameDay(a, b) {
    return (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate());
}
export function fixedDate(year, month, day) {
    return new Date(Date.UTC(year, month - 1, day));
}
export function fixedDateTime(year, month, day, hours = 0, minutes = 0, seconds = 0) {
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
}
//# sourceMappingURL=date-helpers.js.map