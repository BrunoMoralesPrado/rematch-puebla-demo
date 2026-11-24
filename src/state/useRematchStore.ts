import { useSyncExternalStore } from 'react';
import {
  INITIAL_BOOKINGS,
  INITIAL_DAYS,
  INITIAL_WEEKLY_PROGRAM,
  type AccessType,
  type Booking,
  type BookingStatus,
  type BrandTheme,
  type ClassSlot,
  type DaySchedule,
  type WeeklyItem
} from '../data/rematchData';

const STORAGE_KEY = 'rematch_demo_v1';
const VALID_THEMES: BrandTheme[] = ['classic', 'xmas', 'hyrox'];
const FOLIO_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export type DayKey = DaySchedule['key'];

export interface RematchState {
  days: DaySchedule[];
  weeklyProgram: WeeklyItem[];
  bookings: Booking[];
  theme: BrandTheme;
  customLogo: string | null;
}

export interface AddBookingInput {
  dayKey: DayKey;
  slotId: string;
  name: string;
  phone: string;
  accessType: AccessType;
  noteTag?: string;
  noteText?: string;
}

export interface AddSlotInput {
  time: string;
  tag?: string;
  capacity?: number;
}

/* ---------- Helpers puros ---------- */

/** Lugares ocupados de un horario: todo lo que no esté cancelado. */
export function countOccupied(bookings: Booking[], dayKey: DayKey, slotId: string): number {
  let total = 0;
  for (const booking of bookings) {
    if (booking.dayKey === dayKey && booking.slotId === slotId && booking.status !== 'cancelled') {
      total += 1;
    }
  }
  return total;
}

/** Lugares libres de un horario (nunca negativo). */
export function getFreeSpots(slot: ClassSlot, bookings: Booking[], dayKey: DayKey): number {
  return Math.max(0, slot.capacity - countOccupied(bookings, dayKey, slot.id));
}

/** Convierte "7:00 pm" o "19:00" a minutos desde medianoche para ordenar. */
export function timeToMinutes(time: string): number {
  const match = time.trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/** Normaliza "19:00" a "7:00 pm". Si ya viene con am/pm lo deja limpio. */
export function formatSlotTime(time: string): string {
  const clean = time.trim().toLowerCase();
  const withMeridiem = clean.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (withMeridiem) return `${Number(withMeridiem[1])}:${withMeridiem[2]} ${withMeridiem[3]}`;
  const twentyFour = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (!twentyFour) return time.trim();
  const hours = Number(twentyFour[1]);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours12}:${twentyFour[2]} ${suffix}`;
}

/* ---------- Estado inicial + persistencia segura ---------- */

function createInitialState(): RematchState {
  return {
    days: structuredClone(INITIAL_DAYS),
    weeklyProgram: structuredClone(INITIAL_WEEKLY_PROGRAM),
    bookings: structuredClone(INITIAL_BOOKINGS),
    theme: 'classic',
    customLogo: null
  };
}

function isValidState(value: unknown): value is RematchState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<RematchState>;
  return (
    Array.isArray(candidate.days) &&
    candidate.days.every((day) => day && typeof day.key === 'string' && Array.isArray(day.slots)) &&
    Array.isArray(candidate.weeklyProgram) &&
    Array.isArray(candidate.bookings) &&
    typeof candidate.theme === 'string' &&
    VALID_THEMES.includes(candidate.theme) &&
    (candidate.customLogo === null || typeof candidate.customLogo === 'string')
  );
}

function loadState(): RematchState {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return createInitialState();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed: unknown = JSON.parse(raw);
    if (isValidState(parsed)) return parsed;
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage bloqueado o datos dañados: arrancamos con la muestra.
  }
  return createInitialState();
}

function persistState(value: RematchState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Sin espacio o modo privado: la demo sigue funcionando en memoria.
  }
}

/* ---------- Store compartido (una sola fuente para Cliente y Dueño) ---------- */

let state: RematchState = loadState();
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function setState(updater: (prev: RematchState) => RematchState): void {
  state = updater(state);
  persistState(state);
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): RematchState {
  return state;
}

// Si la demo está abierta en dos pestañas, se mantienen sincronizadas.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = loadState();
    emit();
  });
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createFolio(existing: Booking[]): string {
  const used = new Set(existing.map((booking) => booking.folio));
  let folio = '';
  do {
    let code = '';
    for (let i = 0; i < 4; i += 1) {
      code += FOLIO_CHARS[Math.floor(Math.random() * FOLIO_CHARS.length)];
    }
    folio = `#RM-${code}`;
  } while (used.has(folio));
  return folio;
}

/* ---------- Acciones ---------- */

function addBooking(input: AddBookingInput): Booking {
  const noteTag = input.noteTag?.trim();
  const noteText = input.noteText?.trim();
  const booking: Booking = {
    id: createId('bk'),
    folio: createFolio(state.bookings),
    dayKey: input.dayKey,
    slotId: input.slotId,
    name: input.name.trim(),
    phone: input.phone.trim(),
    accessType: input.accessType,
    noteTag: noteTag ? noteTag : undefined,
    noteText: noteText ? noteText : undefined,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };
  setState((prev) => ({ ...prev, bookings: [booking, ...prev.bookings] }));
  return booking;
}

function updateBookingStatus(bookingId: string, status: BookingStatus): void {
  setState((prev) => ({
    ...prev,
    bookings: prev.bookings.map((booking) =>
      booking.id === bookingId ? { ...booking, status } : booking
    )
  }));
}

function removeBooking(bookingId: string): void {
  setState((prev) => ({
    ...prev,
    bookings: prev.bookings.filter((booking) => booking.id !== bookingId)
  }));
}

function updateDay(dayKey: DayKey, change: (day: DaySchedule) => DaySchedule): void {
  setState((prev) => ({
    ...prev,
    days: prev.days.map((day) => (day.key === dayKey ? change(day) : day))
  }));
}

function toggleSlotEnabled(dayKey: DayKey, slotId: string): void {
  updateDay(dayKey, (day) => ({
    ...day,
    slots: day.slots.map((slot) => (slot.id === slotId ? { ...slot, enabled: !slot.enabled } : slot))
  }));
}

function addSlot(dayKey: DayKey, input: AddSlotInput): void {
  const time = formatSlotTime(input.time);
  if (!time) return;
  const tag = input.tag?.trim().toUpperCase();
  const capacity = Math.min(60, Math.max(1, Math.round(input.capacity ?? 16)));
  const newSlot: ClassSlot = {
    id: createId(dayKey),
    time,
    tag: tag ? tag : undefined,
    capacity,
    enabled: true
  };
  updateDay(dayKey, (day) => ({
    ...day,
    slots: [...day.slots, newSlot].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
  }));
}

function updateDayFocus(dayKey: DayKey, focus: string): void {
  updateDay(dayKey, (day) => ({ ...day, focus }));
}

function updateWeeklyFocus(id: string, focus: string): void {
  setState((prev) => ({
    ...prev,
    weeklyProgram: prev.weeklyProgram.map((item) => (item.id === id ? { ...item, focus } : item))
  }));
}

function setTheme(theme: BrandTheme): void {
  setState((prev) => ({ ...prev, theme }));
}

function setCustomLogo(dataUrl: string | null): void {
  setState((prev) => ({ ...prev, customLogo: dataUrl }));
}

function resetDemo(): void {
  setState(() => createInitialState());
}

const actions = {
  addBooking,
  updateBookingStatus,
  removeBooking,
  toggleSlotEnabled,
  addSlot,
  updateDayFocus,
  updateWeeklyFocus,
  setTheme,
  setCustomLogo,
  resetDemo
};

export type RematchStore = RematchState &
  typeof actions & {
    occupiedFor: (dayKey: DayKey, slotId: string) => number;
    freeSpotsFor: (dayKey: DayKey, slot: ClassSlot) => number;
  };

/** Hook compartido: Vista Cliente y Vista Dueño leen y escriben el mismo estado en vivo. */
export function useRematchStore(): RematchStore {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    ...snapshot,
    ...actions,
    occupiedFor: (dayKey, slotId) => countOccupied(snapshot.bookings, dayKey, slotId),
    freeSpotsFor: (dayKey, slot) => getFreeSpots(slot, snapshot.bookings, dayKey)
  };
}
