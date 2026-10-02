export interface Pending { method: 'email' | 'phone'; contact: string }
const KEY = 'roomie-otp';
export const savePending = (p: Pending) => sessionStorage.setItem(KEY, JSON.stringify(p));
export const loadPending = (): Pending | null => JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
export const clearPending = () => sessionStorage.removeItem(KEY);
