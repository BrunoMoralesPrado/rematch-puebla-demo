import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ACCESS_OPTIONS,
  COACH_NOTE_TAGS,
  REMATCH_BUSINESS,
  type AccessType,
  type Booking,
  type DaySchedule
} from '../data/rematchData';
import { useRematchStore } from '../state/useRematchStore';

type Step = 1 | 2 | 3;
type FieldKey = 'name' | 'phone';
type WaFeedback = 'confirmed' | 'cancelled' | 'full' | null;

const SUPPORTS_USER_INVALID =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('selector(:user-invalid)');

const ERROR_TEXT: Record<FieldKey, string> = {
  name: 'Escribe tu nombre (mínimo 2 letras).',
  phone: 'Revisa tu WhatsApp: necesitamos 10 dígitos.'
};

const ANNOUNCE_DELAY_MS = 500;

/* ---------- Iconos SVG inline ---------- */

function ChevronIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12.5 11 15.5 16 9.5" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z" />
    </svg>
  );
}

/* ---------- Utilidades ---------- */

function spotsLabel(free: number): { text: string; className: string } {
  if (free <= 0) return { text: 'Lleno', className: 'rm-spots-txt full' };
  if (free === 1) return { text: 'Queda 1', className: 'rm-spots-txt low' };
  if (free <= 3) return { text: `Quedan ${free}`, className: 'rm-spots-txt low' };
  return { text: `${free} libres`, className: 'rm-spots-txt' };
}

function syncPhoneValidity(input: HTMLInputElement): void {
  const digits = input.value.replace(/\D/g, '').length;
  const wrongLength = input.value.trim() !== '' && (digits < 10 || digits > 13);
  input.setCustomValidity(wrongLength ? ERROR_TEXT.phone : '');
}

function buildNote(booking: Booking): string {
  return [booking.noteTag, booking.noteText].filter(Boolean).join(' · ');
}

/* ---------- Componente ---------- */

export function ClientFlow() {
  const store = useRematchStore();
  const { days, bookings } = store;

  const [step, setStep] = useState<Step>(1);
  const [dayKey, setDayKey] = useState<DaySchedule['key']>('mie');
  const [slotId, setSlotId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [accessType, setAccessType] = useState<AccessType>('Miembro');
  const [noteTag, setNoteTag] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({ name: false, phone: false });
  const [invalid, setInvalid] = useState<Record<FieldKey, boolean>>({ name: false, phone: false });
  const [submitFailed, setSubmitFailed] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [waFeedback, setWaFeedback] = useState<WaFeedback>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceTimer = useRef<number | undefined>(undefined);
  const isFirstRender = useRef(true);
  // Campos que la persona ya editó: igual que :user-invalid, no marcamos error sin interacción real.
  const dirty = useRef<Record<FieldKey, boolean>>({ name: false, phone: false });

  const day = days.find((item) => item.key === dayKey) ?? days[0];
  const slot = day?.slots.find((item) => item.id === slotId) ?? null;
  const booking = bookingId ? bookings.find((item) => item.id === bookingId) ?? null : null;

  // Al cambiar de paso, llevamos el foco al título para lectores de pantalla.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  useEffect(() => () => window.clearTimeout(announceTimer.current), []);

  function announce(message: string) {
    window.clearTimeout(announceTimer.current);
    setLiveMessage('');
    if (!message) return;
    announceTimer.current = window.setTimeout(() => setLiveMessage(message), ANNOUNCE_DELAY_MS);
  }

  function getInput(field: FieldKey): HTMLInputElement | null {
    return field === 'name' ? nameRef.current : phoneRef.current;
  }

  function checkField(field: FieldKey): boolean {
    const input = getInput(field);
    if (!input) return true;
    if (field === 'phone') syncPhoneValidity(input);
    return input.validity.valid;
  }

  function handleBlur(field: FieldKey) {
    if (!dirty.current[field] && !touched[field]) return;
    const isValid = checkField(field);
    setTouched((prev) => ({ ...prev, [field]: true }));
    setInvalid((prev) => ({ ...prev, [field]: !isValid }));
    announce(isValid ? '' : ERROR_TEXT[field]);
  }

  function handleFieldChange(field: FieldKey, event: ChangeEvent<HTMLInputElement>) {
    dirty.current[field] = true;
    if (field === 'name') setName(event.target.value);
    else setPhone(event.target.value);
    if (field === 'phone') syncPhoneValidity(event.target);
    // Solo re-evaluamos en vivo si ya hubo interacción (blur o envío fallido).
    if (touched[field]) {
      const isValid = event.target.validity.valid;
      if (invalid[field] === !isValid) return;
      setInvalid((prev) => ({ ...prev, [field]: !isValid }));
      if (!isValid) announce(ERROR_TEXT[field]);
    }
  }

  function fieldClass(field: FieldKey): string {
    const showFallback = (!SUPPORTS_USER_INVALID || submitFailed) && touched[field];
    if (!showFallback) return 'rm-input';
    return invalid[field] ? 'rm-input user-invalid-fallback' : 'rm-input user-valid-fallback';
  }

  function describedBy(field: FieldKey): string {
    const hintId = field === 'name' ? 'client-name-hint' : 'client-phone-hint';
    const errorId = field === 'name' ? 'client-name-error' : 'client-phone-error';
    return touched[field] && invalid[field] ? `${hintId} ${errorId}` : hintId;
  }

  function chooseSlot(id: string) {
    setSlotId(id);
    setStep(2);
  }

  function goBackToSlots() {
    setStep(1);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nameValid = checkField('name');
    const phoneValid = checkField('phone');
    setTouched({ name: true, phone: true });
    setInvalid({ name: !nameValid, phone: !phoneValid });

    const firstInvalid: FieldKey | null = !nameValid ? 'name' : !phoneValid ? 'phone' : null;
    if (firstInvalid) {
      setSubmitFailed(true);
      const input = getInput(firstInvalid);
      requestAnimationFrame(() => input?.focus());
      announce(ERROR_TEXT[firstInvalid]);
      return;
    }

    if (!day || !slot || !slot.enabled || store.freeSpotsFor(day.key, slot) <= 0) {
      announce('Ese horario ya no está disponible. Elige otra hora.');
      setStep(1);
      return;
    }

    const created = store.addBooking({
      dayKey: day.key,
      slotId: slot.id,
      name,
      phone,
      accessType,
      noteTag: noteTag ?? undefined,
      noteText
    });
    setBookingId(created.id);
    setWaFeedback(null);
    setSubmitFailed(false);
    setStep(3);
  }

  function startAnother() {
    // Conservamos nombre y WhatsApp para que reservar otra clase sea más rápido.
    setNoteTag(null);
    setNoteText('');
    setTouched({ name: false, phone: false });
    setInvalid({ name: false, phone: false });
    dirty.current = { name: false, phone: false };
    setSubmitFailed(false);
    setBookingId(null);
    setWaFeedback(null);
    setSlotId(null);
    setStep(1);
  }

  /* ---------- Paso 1 ---------- */
  function renderStepOne() {
    const enabledSlots = day ? day.slots.filter((item) => item.enabled) : [];
    return (
      <>
        <div className="rm-days-grid" role="group" aria-label="Día de la clase">
          {days.map((item) => (
            <button
              key={item.key}
              type="button"
              className="rm-day-btn"
              aria-pressed={item.key === dayKey}
              aria-label={item.fullLabel}
              onClick={() => setDayKey(item.key)}
            >
              <span className="rm-day-short">{item.shortDay}</span>
              <span className="rm-day-num">{item.dayNumber}</span>
            </button>
          ))}
        </div>

        {day && (
          <div className="rm-focus-row">
            <span className="rm-focus-name">{day.focus}</span>
            <span className="rm-focus-coach">{day.coach}</span>
          </div>
        )}

        {enabledSlots.length === 0 ? (
          <p className="rm-hint">Este día no hay horarios abiertos. Prueba con otro día.</p>
        ) : (
          <ul className="rm-slots-list" role="list" aria-label={`Horarios del ${day?.fullLabel ?? ''}`}>
            {enabledSlots.map((item) => {
              const free = day ? store.freeSpotsFor(day.key, item) : 0;
              const spots = spotsLabel(free);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className="rm-slot-btn"
                    disabled={free <= 0}
                    onClick={() => chooseSlot(item.id)}
                  >
                    <span className="rm-slot-left">
                      <span className="rm-slot-hour">{item.time}</span>
                      {item.tag && <span className="rm-slot-tag">{item.tag}</span>}
                    </span>
                    <span className="rm-slot-right">
                      <span className={spots.className}>{spots.text}</span>
                      {free > 0 && <ChevronIcon />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  }

  /* ---------- Paso 2 ---------- */
  function renderStepTwo() {
    if (!day || !slot) {
      return (
        <button type="button" className="rm-secondary-btn" onClick={goBackToSlots}>
          Elegir horario
        </button>
      );
    }
    return (
      <>
        <div className="rm-chosen-banner">
          <div>
            <p className="rm-chosen-k">{day.fullLabel} · {day.focus}</p>
            <p className="rm-chosen-v">
              {slot.time}
              {slot.tag ? ` ${slot.tag}` : ''}
            </p>
          </div>
          <button type="button" className="rm-link-btn" onClick={goBackToSlots}>
            Cambiar hora
          </button>
        </div>

        <form className="rm-form" noValidate onSubmit={handleSubmit}>
          <div className="rm-field">
            <label className="rm-label" htmlFor="client-name">1. Tu nombre</label>
            <span id="client-name-hint" className="rm-hint">Como quieres que te llame el coach</span>
            <input
              ref={nameRef}
              id="client-name"
              className={fieldClass('name')}
              type="text"
              required
              minLength={2}
              autoComplete="name"
              value={name}
              onChange={(event) => handleFieldChange('name', event)}
              onBlur={() => handleBlur('name')}
              aria-invalid={touched.name && invalid.name ? 'true' : 'false'}
              aria-describedby={describedBy('name')}
            />
            <p id="client-name-error" className="rm-error-msg">
              <AlertIcon />
              {ERROR_TEXT.name}
            </p>
          </div>

          <div className="rm-field">
            <label className="rm-label" htmlFor="client-phone">2. Tu WhatsApp</label>
            <span id="client-phone-hint" className="rm-hint">10 dígitos para mandarte el recordatorio</span>
            <input
              ref={phoneRef}
              id="client-phone"
              className={fieldClass('phone')}
              type="tel"
              required
              pattern="[\d\s+\-\(\)]{10,16}"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => handleFieldChange('phone', event)}
              onBlur={() => handleBlur('phone')}
              aria-invalid={touched.phone && invalid.phone ? 'true' : 'false'}
              aria-describedby={describedBy('phone')}
            />
            <p id="client-phone-error" className="rm-error-msg">
              <AlertIcon />
              {ERROR_TEXT.phone}
            </p>
          </div>

          <div className="rm-field" role="group" aria-labelledby="client-pass-label">
            <span id="client-pass-label" className="rm-label">3. ¿Cómo entras?</span>
            <div className="rm-passes-grid">
              {ACCESS_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="rm-pass-btn"
                  aria-pressed={accessType === option}
                  onClick={() => setAccessType(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <details className="rm-details dashed">
            <summary>+ ¿Algún aviso para el coach? (opcional)</summary>
            <div className="rm-details-body">
              <div className="rm-chips-row" role="group" aria-label="Avisos rápidos">
                {COACH_NOTE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="rm-chip-btn"
                    aria-pressed={noteTag === tag}
                    onClick={() => setNoteTag((prev) => (prev === tag ? null : tag))}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="rm-input"
                placeholder="Ej. molestia en rodilla o primera clase"
                aria-label="Aviso para el coach"
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
              />
            </div>
          </details>

          <button type="submit" className="rm-primary-btn">
            Apartar mi lugar
          </button>
        </form>
      </>
    );
  }

  /* ---------- Paso 3 ---------- */
  function renderStepThree() {
    if (!booking) {
      return (
        <>
          <p className="rm-hint">Esta reserva ya no aparece en la lista del coach.</p>
          <button type="button" className="rm-secondary-btn" onClick={startAnother}>
            Reservar otra clase
          </button>
        </>
      );
    }

    const bookedDay = days.find((item) => item.key === booking.dayKey);
    const bookedSlot = bookedDay?.slots.find((item) => item.id === booking.slotId);
    const dayLabel = bookedDay?.fullLabel ?? '';
    const focus = bookedDay?.focus ?? '';
    const time = bookedSlot ? `${bookedSlot.time}${bookedSlot.tag ? ` ${bookedSlot.tag}` : ''}` : '';
    const isCancelled = booking.status === 'cancelled';
    const note = buildNote(booking);
    const firstName = booking.name.split(' ')[0];

    const reminderText =
      `Hola ${firstName}, te esperamos en REMATCH hoy a las ${time} (${focus}). ` +
      `Tu folio es ${booking.folio}. ¿Nos confirmas si vienes?` +
      (note ? ` El coach ya tiene tu aviso: ${note}.` : '');

    const waText = [
      `Hola REMATCH, soy ${booking.name}.`,
      `Aparté lugar para el ${dayLabel} a las ${time} (${focus}).`,
      `Folio: ${booking.folio}. Entro con: ${booking.accessType}.`,
      note ? `Aviso para el coach: ${note}.` : ''
    ]
      .filter(Boolean)
      .join(' ');
    const waUrl = `https://wa.me/${REMATCH_BUSINESS.whatsappPhone}?text=${encodeURIComponent(waText)}`;

    function confirmAttendance() {
      if (!booking) return;
      if (booking.status === 'cancelled' && bookedSlot && bookedDay && store.freeSpotsFor(bookedDay.key, bookedSlot) <= 0) {
        setWaFeedback('full');
        return;
      }
      store.updateBookingStatus(booking.id, 'confirmed');
      setWaFeedback('confirmed');
    }

    function cancelSpot() {
      if (!booking) return;
      store.updateBookingStatus(booking.id, 'cancelled');
      setWaFeedback('cancelled');
    }

    return (
      <>
        <div className="rm-confirm-card">
          <span className={isCancelled ? 'rm-confirm-status cancelled' : 'rm-confirm-status'}>
            {isCancelled ? <XCircleIcon /> : <CheckCircleIcon />}
            {isCancelled ? 'Lugar liberado' : 'Lugar apartado'}
          </span>
          <p className="rm-confirm-name">Listo, {booking.name}</p>
          <p className="rm-step-counter">Folio {booking.folio}</p>
          <p className="rm-confirm-meta">
            {dayLabel} · {time} · {booking.accessType}
          </p>
          <a className="rm-address-link" href={REMATCH_BUSINESS.mapsUrl} target="_blank" rel="noopener noreferrer">
            <PinIcon /> {REMATCH_BUSINESS.address}
          </a>
        </div>

        <section className="rm-wa-sim" aria-labelledby="wa-sim-title">
          <div className="rm-wa-sim-head">
            <span id="wa-sim-title">WHATSAPP AUTOMÁTICO · 2 H ANTES</span>
          </div>
          <p className="rm-wa-bubble">{reminderText}</p>
          <div className="rm-wa-actions">
            <button type="button" className="rm-wa-btn yes" onClick={confirmAttendance}>
              Sí, asistiré
            </button>
            <button type="button" className="rm-wa-btn no" onClick={cancelSpot}>
              Cancelar lugar
            </button>
          </div>
          <div role="status">
            {waFeedback === 'confirmed' && (
              <p className="rm-wa-feedback">Gracias, el coach ya te ve como confirmado.</p>
            )}
            {waFeedback === 'cancelled' && (
              <p className="rm-wa-feedback cancelled">
                Tu lugar se liberó y ya aparece como disponible en la lista del Coach. Gracias por avisar.
              </p>
            )}
            {waFeedback === 'full' && (
              <p className="rm-wa-feedback cancelled">Ese horario ya se llenó. Puedes reservar otra hora.</p>
            )}
          </div>
        </section>

        <a className="rm-primary-btn wa" href={waUrl} target="_blank" rel="noopener noreferrer">
          <ChatIcon />
          Abrir en WhatsApp
        </a>

        <button type="button" className="rm-secondary-btn" onClick={startAnother}>
          Reservar otra clase
        </button>
      </>
    );
  }

  const titles: Record<Step, string> = {
    1: 'Elige día y hora',
    2: 'Tus datos',
    3: 'Confirmación'
  };

  return (
    <section className="rm-form" aria-labelledby="client-step-title">
      <div className="rm-step-intro">
        <h1 id="client-step-title" ref={headingRef} tabIndex={-1} className="rm-step-title">
          {titles[step]}
        </h1>
        <span className="rm-step-counter">Paso {step} de 3</span>
      </div>

      {step === 1 && renderStepOne()}
      {step === 2 && renderStepTwo()}
      {step === 3 && renderStepThree()}

      <div aria-live="polite" className="visually-hidden">
        {liveMessage}
      </div>
    </section>
  );
}

export default ClientFlow;
