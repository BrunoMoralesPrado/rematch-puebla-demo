import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type RefObject
} from 'react';
import {
  ACCESS_OPTIONS,
  type AccessType,
  type Booking,
  type BookingStatus,
  type BrandTheme,
  type DaySchedule
} from '../data/rematchData';
import { useRematchStore } from '../state/useRematchStore';

type OwnerTab = 'reservas' | 'horarios' | 'marca';
type ScheduleMode = 'hoy' | 'semana';
type DayKey = DaySchedule['key'];

const TABS: Array<{ id: OwnerTab; label: string }> = [
  { id: 'reservas', label: 'Reservas' },
  { id: 'horarios', label: 'Horarios' },
  { id: 'marca', label: 'Marca' }
];

const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: 'Confirmó',
  pending: 'Pendiente',
  cancelled: 'Cancelado'
};

const OWNER_ACCESS_OPTIONS: AccessType[] = [...ACCESS_OPTIONS, 'Clase muestra'];
const SLOT_TAG_OPTIONS = ['', 'GAINZ', 'HYROX', 'BOX'] as const;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const THEMES: Array<{ id: BrandTheme; title: string; desc: string; dot: string }> = [
  { id: 'classic', title: 'Clásico Rematch', desc: 'Rojo y negro de siempre', dot: '#E11D2E' },
  {
    id: 'xmas',
    title: 'Navidad (Temporada)',
    desc: 'Verde y rojo para diciembre',
    dot: 'linear-gradient(135deg, #15803D 50%, #E11D2E 50%)'
  },
  { id: 'hyrox', title: 'HYROX Race', desc: 'Amarillo de competencia', dot: '#FFD100' }
];

// En minúsculas para que React lo pase tal cual como atributo HTML nativo.
const CLOSED_BY_ANY = { closedby: 'any' } as Record<string, unknown>;
const SWITCH_ATTR = { switch: '' } as Record<string, unknown>;

/* ---------- Iconos SVG inline ---------- */

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="5 12.5 10 17.5 19 7" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

/* ---------- Utilidades ---------- */

function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('52')) return digits;
  return `52${digits.slice(-10)}`;
}

function bookingNote(booking: Booking): string {
  return [booking.noteTag, booking.noteText].filter(Boolean).join(' · ');
}

/**
 * Comportamiento común de los <dialog> nativos:
 * - Limpia returnValue al cerrar.
 * - Light-dismiss por coordenadas cuando el navegador no soporta closedby.
 */
function useDialogBehavior(ref: RefObject<HTMLDialogElement | null>, onClose: () => void) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;

    const handleClose = () => {
      dialog.returnValue = '';
      onCloseRef.current();
    };
    dialog.addEventListener('close', handleClose);

    const needsFallback = !('closedBy' in HTMLDialogElement.prototype);
    let pressedOutside = false;

    const isOutside = (event: PointerEvent) => {
      const rect = dialog.getBoundingClientRect();
      return (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      );
    };
    const handlePointerDown = (event: PointerEvent) => {
      pressedOutside = event.target === dialog && isOutside(event);
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (pressedOutside && event.target === dialog && isOutside(event)) dialog.close();
      pressedOutside = false;
    };

    if (needsFallback) {
      dialog.addEventListener('pointerdown', handlePointerDown);
      dialog.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      if (needsFallback) {
        dialog.removeEventListener('pointerdown', handlePointerDown);
        dialog.removeEventListener('pointerup', handlePointerUp);
      }
    };
  }, [ref]);
}

/* ---------- Componente ---------- */

export function OwnerPanel() {
  const store = useRematchStore();
  const { days, bookings, weeklyProgram, theme, customLogo } = store;

  const [tab, setTab] = useState<OwnerTab>('reservas');
  const tabRefs = useRef<Record<OwnerTab, HTMLButtonElement | null>>({
    reservas: null,
    horarios: null,
    marca: null
  });

  // Reservas
  const [listDayKey, setListDayKey] = useState<DayKey>('mie');
  const [listSlotId, setListSlotId] = useState<string>('mie-1900');
  const addBookingDialogRef = useRef<HTMLDialogElement>(null);
  const addNameRef = useRef<HTMLInputElement>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAccess, setNewAccess] = useState<AccessType>('Miembro');
  const [newNote, setNewNote] = useState('');
  const [addError, setAddError] = useState('');

  // Horarios
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('hoy');
  const [scheduleDayKey, setScheduleDayKey] = useState<DayKey>('mie');
  const addSlotDialogRef = useRef<HTMLDialogElement>(null);
  const addSlotTimeRef = useRef<HTMLInputElement>(null);
  const [slotTime, setSlotTime] = useState('18:00');
  const [slotTag, setSlotTag] = useState<string>('');
  const [slotCapacity, setSlotCapacity] = useState('16');

  // Marca
  const [logoMessage, setLogoMessage] = useState('');

  useDialogBehavior(addBookingDialogRef, () => {
    setNewName('');
    setNewPhone('');
    setNewAccess('Miembro');
    setNewNote('');
    setAddError('');
  });

  useDialogBehavior(addSlotDialogRef, () => {
    setSlotTime('18:00');
    setSlotTag('');
    setSlotCapacity('16');
  });

  const listDay = days.find((day) => day.key === listDayKey) ?? days[0];
  const listSlot = listDay?.slots.find((slot) => slot.id === listSlotId) ?? listDay?.slots[0] ?? null;
  const slotBookings =
    listDay && listSlot
      ? bookings.filter((booking) => booking.dayKey === listDay.key && booking.slotId === listSlot.id)
      : [];
  const listOccupied = listDay && listSlot ? store.occupiedFor(listDay.key, listSlot.id) : 0;

  const scheduleDay = days.find((day) => day.key === scheduleDayKey) ?? days[0];

  /* ---------- Pestañas ---------- */
  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = TABS.findIndex((item) => item.id === tab);
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    else return;
    event.preventDefault();
    const nextTab = TABS[next].id;
    setTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  }

  /* ---------- Reservas ---------- */
  function handleListDayChange(event: ChangeEvent<HTMLSelectElement>) {
    const key = event.target.value as DayKey;
    setListDayKey(key);
    const firstSlot = days.find((day) => day.key === key)?.slots[0];
    if (firstSlot) setListSlotId(firstSlot.id);
  }

  function openAddBooking() {
    const dialog = addBookingDialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    addNameRef.current?.focus();
  }

  function handleAddBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!listDay || !listSlot) return;
    if (store.freeSpotsFor(listDay.key, listSlot) <= 0) {
      setAddError('Esta clase ya está llena. Libera un lugar o elige otro horario.');
      return;
    }
    store.addBooking({
      dayKey: listDay.key,
      slotId: listSlot.id,
      name: newName,
      phone: newPhone,
      accessType: newAccess,
      noteText: newNote
    });
    addBookingDialogRef.current?.close();
  }

  /* ---------- Horarios ---------- */
  function openAddSlot() {
    const dialog = addSlotDialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    addSlotTimeRef.current?.focus();
  }

  function handleAddSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scheduleDay || !slotTime) return;
    store.addSlot(scheduleDay.key, {
      time: slotTime,
      tag: slotTag || undefined,
      capacity: Number(slotCapacity) || 16
    });
    addSlotDialogRef.current?.close();
  }

  /* ---------- Marca ---------- */
  function handleLogoFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoMessage('Ese archivo no es una imagen. Usa PNG, JPG o SVG.');
      input.value = '';
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoMessage('La imagen pesa más de 2 MB. Prueba con una más ligera.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        store.setCustomLogo(reader.result);
        setLogoMessage('Logo actualizado. Ya se ve arriba en el encabezado.');
      }
    };
    reader.onerror = () => setLogoMessage('No pudimos leer la imagen. Intenta de nuevo.');
    reader.readAsDataURL(file);
    input.value = '';
  }

  function restoreLogo() {
    store.setCustomLogo(null);
    setLogoMessage('Listo, regresamos al logo oficial.');
  }

  function handleReset() {
    if (window.confirm('¿Reiniciar todo a los datos de muestra? Se borran los cambios de esta demo.')) {
      store.resetDemo();
      setListDayKey('mie');
      setListSlotId('mie-1900');
      setScheduleDayKey('mie');
      setLogoMessage('');
    }
  }

  /* ---------- Render por pestaña ---------- */
  function renderReservas() {
    return (
      <>
        <div className="rm-owner-filter">
          <label className="visually-hidden" htmlFor="owner-day">Día</label>
          <select id="owner-day" className="rm-select" value={listDay?.key ?? ''} onChange={handleListDayChange}>
            {days.map((day) => (
              <option key={day.key} value={day.key}>
                {`${day.fullLabel} · ${day.focus}`}
              </option>
            ))}
          </select>
          <label className="visually-hidden" htmlFor="owner-slot">Clase</label>
          <select
            id="owner-slot"
            className="rm-select"
            value={listSlot?.id ?? ''}
            onChange={(event) => setListSlotId(event.target.value)}
          >
            {listDay?.slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {`${slot.time}${slot.tag ? ` ${slot.tag}` : ''} · ${store.occupiedFor(listDay.key, slot.id)} de ${slot.capacity}${slot.enabled ? '' : ' (apagado)'}`}
              </option>
            ))}
          </select>
        </div>

        {listSlot && (
          <div className="rm-summary-bar">
            <span className="rm-summary-title">
              {listSlot.time} {listSlot.tag ?? ''} · {listOccupied} de {listSlot.capacity}
            </span>
            <button type="button" className="rm-compact-btn" onClick={openAddBooking}>
              + Anotar
            </button>
          </div>
        )}

        <p className="rm-hint">Toca un nombre para ver detalles</p>

        {slotBookings.length === 0 ? (
          <p className="rm-hint">Todavía no hay alumnos en esta clase.</p>
        ) : (
          <ul className="rm-slots-list" role="list">
            {slotBookings.map((booking) => {
              const note = bookingNote(booking);
              const firstName = booking.name.split(' ')[0];
              const greeting =
                `Hola ${firstName}, te escribe el coach de REMATCH. ` +
                `Te esperamos el ${listDay?.fullLabel ?? ''} a las ${listSlot?.time ?? ''}.` +
                (note ? ` Vi tu aviso (${note}) y lo tomamos en cuenta.` : '');
              const waUrl = `https://wa.me/${toWhatsAppNumber(booking.phone)}?text=${encodeURIComponent(greeting)}`;
              return (
                <li key={booking.id}>
                  <details className="rm-details">
                    <summary>
                      <span className="rm-person-summary-inner">
                        <span>
                          <span className="rm-person-name">{booking.name}</span>
                          <span className="rm-person-pass">{booking.accessType}</span>
                        </span>
                        <span className={`rm-pill-status ${booking.status}`}>{STATUS_LABEL[booking.status]}</span>
                      </span>
                    </summary>
                    <div className="rm-details-body">
                      <p className="rm-person-pass">WhatsApp: {booking.phone}</p>
                      {note && <p className="rm-note-highlight">{note}</p>}
                      <div className="rm-person-actions">
                        <a className="rm-btn-wa-sm" href={waUrl} target="_blank" rel="noopener noreferrer">
                          Escribir por WhatsApp
                        </a>
                        <button
                          type="button"
                          className="rm-btn-ghost-sm"
                          onClick={() => store.removeBooking(booking.id)}
                          aria-label={`Quitar a ${booking.name} de la clase`}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  }

  function renderHorarios() {
    return (
      <>
        <div className="rm-seg" role="group" aria-label="Vista de horarios">
          <button
            type="button"
            className="rm-seg-btn"
            aria-pressed={scheduleMode === 'hoy'}
            onClick={() => setScheduleMode('hoy')}
          >
            Hoy
          </button>
          <button
            type="button"
            className="rm-seg-btn"
            aria-pressed={scheduleMode === 'semana'}
            onClick={() => setScheduleMode('semana')}
          >
            Semana
          </button>
        </div>

        {scheduleMode === 'hoy' && scheduleDay && (
          <>
            <div className="rm-days-grid" role="group" aria-label="Día a editar">
              {days.map((day) => (
                <button
                  key={day.key}
                  type="button"
                  className="rm-day-btn"
                  aria-pressed={day.key === scheduleDay.key}
                  aria-label={day.fullLabel}
                  onClick={() => setScheduleDayKey(day.key)}
                >
                  <span className="rm-day-short">{day.shortDay}</span>
                  <span className="rm-day-num">{day.dayNumber}</span>
                </button>
              ))}
            </div>

            <div className="rm-field">
              <label className="rm-label" htmlFor="owner-day-focus">Entrenamiento del día</label>
              <input
                id="owner-day-focus"
                type="text"
                className="rm-input"
                placeholder="RUN · HYROX"
                value={scheduleDay.focus}
                onChange={(event) => store.updateDayFocus(scheduleDay.key, event.target.value)}
              />
            </div>

            <div className="rm-slots-list">
              {scheduleDay.slots.map((slot) => (
                <label key={slot.id} className="rm-switch-row">
                  <span className="rm-switch-label-txt">
                    {slot.time}
                    {slot.tag && <span className="rm-slot-tag">{slot.tag}</span>}
                    <span className="rm-summary-sub">
                      {store.occupiedFor(scheduleDay.key, slot.id)} de {slot.capacity}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    {...SWITCH_ATTR}
                    checked={slot.enabled}
                    onChange={() => store.toggleSlotEnabled(scheduleDay.key, slot.id)}
                  />
                </label>
              ))}
            </div>

            <button type="button" className="rm-primary-btn" onClick={openAddSlot}>
              + Agregar horario
            </button>
          </>
        )}

        {scheduleMode === 'semana' && (
          <div className="rm-slots-list">
            {weeklyProgram.map((item) => (
              <div key={item.id} className="rm-week-row">
                <label className="rm-week-day" htmlFor={`week-${item.id}`}>
                  {item.day}
                </label>
                <input
                  id={`week-${item.id}`}
                  type="text"
                  className="rm-week-input"
                  value={item.focus}
                  onChange={(event) => store.updateWeeklyFocus(item.id, event.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  function renderMarca() {
    return (
      <>
        <div className="rm-slots-list" role="group" aria-label="Estilo de la marca">
          {THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              className="rm-theme-card"
              aria-pressed={theme === item.id}
              onClick={() => store.setTheme(item.id)}
            >
              <span className="rm-slot-left">
                <span className="rm-theme-dot" style={{ background: item.dot }} aria-hidden="true" />
                <span>
                  <span className="rm-person-name">{item.title}</span>
                  <span className="rm-person-pass">{item.desc}</span>
                </span>
              </span>
              {theme === item.id && <CheckIcon />}
            </button>
          ))}
        </div>

        <div className="rm-upload-box">
          <UploadIcon />
          <label className="rm-label" htmlFor="owner-logo-file">Sube tu logo</label>
          <span className="rm-upload-rule">Marco automático: máx. 180 x 44 px</span>
          <span className="rm-hint">PNG, JPG o SVG de hasta 2 MB</span>
          <input id="owner-logo-file" type="file" accept="image/*" onChange={handleLogoFile} />
          {customLogo && (
            <div className="rm-logo-frame">
              <img src={customLogo} alt="Vista previa del logo subido" />
            </div>
          )}
          <p className="rm-hint" role="status">{logoMessage}</p>
          {customLogo && (
            <button type="button" className="rm-text-action" onClick={restoreLogo}>
              Restaurar logo oficial
            </button>
          )}
        </div>

        <button type="button" className="rm-text-action" onClick={handleReset}>
          Reiniciar datos de muestra
        </button>
      </>
    );
  }

  return (
    <section className="rm-form" aria-labelledby="owner-title">
      <h1 id="owner-title" className="visually-hidden">Panel del dueño</h1>

      <div className="rm-owner-tabs" role="tablist" aria-label="Secciones del panel">
        {TABS.map((item) => (
          <button
            key={item.id}
            ref={(node) => {
              tabRefs.current[item.id] = node;
            }}
            type="button"
            role="tab"
            id={`owner-tab-${item.id}`}
            className="rm-owner-tab"
            aria-selected={tab === item.id}
            aria-controls={`owner-panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
            onKeyDown={handleTabKeyDown}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`owner-panel-${tab}`}
        aria-labelledby={`owner-tab-${tab}`}
        className="rm-form"
      >
        {tab === 'reservas' && renderReservas()}
        {tab === 'horarios' && renderHorarios()}
        {tab === 'marca' && renderMarca()}
      </div>

      {/* Dialog: anotar alumno */}
      <dialog
        ref={addBookingDialogRef}
        className="rm-dialog"
        aria-labelledby="add-booking-title"
        {...CLOSED_BY_ANY}
      >
        <div className="rm-dialog-head">
          <h1 id="add-booking-title" className="rm-dialog-title">Anotar alumno en clase</h1>
        </div>
        {listDay && listSlot && (
          <p className="rm-hint">
            {listDay.fullLabel} · {listSlot.time} {listSlot.tag ?? ''}
          </p>
        )}
        <form className="rm-form" onSubmit={handleAddBooking}>
          <div className="rm-field">
            <label className="rm-label" htmlFor="add-name">Nombre</label>
            <input
              ref={addNameRef}
              id="add-name"
              type="text"
              className="rm-input"
              required
              minLength={2}
              autoComplete="off"
              autoFocus
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
          </div>
          <div className="rm-field">
            <label className="rm-label" htmlFor="add-phone">WhatsApp</label>
            <input
              id="add-phone"
              type="tel"
              className="rm-input"
              required
              inputMode="tel"
              pattern="[\d\s+\-\(\)]{10,16}"
              autoComplete="off"
              value={newPhone}
              onChange={(event) => setNewPhone(event.target.value)}
            />
          </div>
          <div className="rm-field">
            <label className="rm-label" htmlFor="add-access">Pase</label>
            <select
              id="add-access"
              className="rm-select"
              value={newAccess}
              onChange={(event) => setNewAccess(event.target.value as AccessType)}
            >
              {OWNER_ACCESS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="rm-field">
            <label className="rm-label" htmlFor="add-note">Aviso para el coach (opcional)</label>
            <input
              id="add-note"
              type="text"
              className="rm-input"
              placeholder="Ej. primera clase"
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
            />
          </div>
          <div aria-live="polite" className="rm-live-slot">
            {addError && <p className="rm-note-highlight">{addError}</p>}
          </div>
          <div className="rm-dialog-actions">
            <button type="button" className="rm-secondary-btn" onClick={() => addBookingDialogRef.current?.close()}>
              Cancelar
            </button>
            <button type="submit" className="rm-primary-btn">
              Anotar
            </button>
          </div>
        </form>
      </dialog>

      {/* Dialog: agregar horario */}
      <dialog
        ref={addSlotDialogRef}
        className="rm-dialog"
        aria-labelledby="add-slot-title"
        {...CLOSED_BY_ANY}
      >
        <div className="rm-dialog-head">
          <h1 id="add-slot-title" className="rm-dialog-title">Agregar horario</h1>
        </div>
        {scheduleDay && <p className="rm-hint">{scheduleDay.fullLabel} · {scheduleDay.focus}</p>}
        <form className="rm-form" onSubmit={handleAddSlot}>
          <div className="rm-field">
            <label className="rm-label" htmlFor="slot-time">Hora</label>
            <input
              ref={addSlotTimeRef}
              id="slot-time"
              type="time"
              className="rm-input"
              required
              autoFocus
              value={slotTime}
              onChange={(event) => setSlotTime(event.target.value)}
            />
          </div>
          <div className="rm-field">
            <label className="rm-label" htmlFor="slot-tag">Tipo de clase (opcional)</label>
            <select
              id="slot-tag"
              className="rm-select"
              value={slotTag}
              onChange={(event) => setSlotTag(event.target.value)}
            >
              {SLOT_TAG_OPTIONS.map((option) => (
                <option key={option || 'none'} value={option}>
                  {option || 'Clase normal'}
                </option>
              ))}
            </select>
          </div>
          <div className="rm-field">
            <label className="rm-label" htmlFor="slot-capacity">Lugares</label>
            <input
              id="slot-capacity"
              type="number"
              className="rm-input"
              required
              min={1}
              max={60}
              inputMode="numeric"
              value={slotCapacity}
              onChange={(event) => setSlotCapacity(event.target.value)}
            />
          </div>
          <div className="rm-dialog-actions">
            <button type="button" className="rm-secondary-btn" onClick={() => addSlotDialogRef.current?.close()}>
              Cancelar
            </button>
            <button type="submit" className="rm-primary-btn">
              Agregar
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}

export default OwnerPanel;
