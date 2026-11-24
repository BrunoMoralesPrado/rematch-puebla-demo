export type BrandTheme = 'classic' | 'xmas' | 'hyrox';

export type AccessType = 'Miembro' | 'TotalPass' | 'Fitpass' | 'Wellhub' | 'Clase muestra';

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled';

export interface ClassSlot {
  id: string;
  time: string;
  tag?: string;
  capacity: number;
  enabled: boolean;
}

export interface DaySchedule {
  key: 'mie' | 'jue' | 'vie' | 'sab';
  shortDay: string;
  dayNumber: string;
  fullLabel: string;
  focus: string;
  coach: string;
  slots: ClassSlot[];
}

export interface WeeklyItem {
  id: string;
  day: string;
  focus: string;
}

export interface Booking {
  id: string;
  folio: string;
  dayKey: DaySchedule['key'];
  slotId: string;
  name: string;
  phone: string;
  accessType: AccessType;
  noteTag?: string;
  noteText?: string;
  status: BookingStatus;
  createdAt: string;
}

export const REMATCH_BUSINESS = {
  brandName: 'REMATCH FIT HOUSE',
  clubTag: 'HYROX OFFICIAL GYM',
  zone: 'La Loma, Puebla',
  address: 'Nuestra Sra. de Los Ángeles 5, La Loma 72150, Puebla, Pue.',
  mapsUrl: 'https://maps.google.com/?q=Nuestra+Sra+de+Los+Angeles+5+La+Loma+Puebla',
  whatsappPhone: '525559443915',
  whatsappDisplay: '+52 55 5944 3915',
  email: 'barajas.rematch@gmail.com',
  headCoach: 'Coach Huiki'
} as const;

export const ACCESS_OPTIONS: AccessType[] = [
  'Miembro',
  'TotalPass',
  'Fitpass',
  'Wellhub'
];

export const COACH_NOTE_TAGS = [
  'Primera vez',
  'Molestia física',
  'Meta HYROX'
] as const;

export const INITIAL_WEEKLY_PROGRAM: WeeklyItem[] = [
  { id: 'lun', day: 'Lun', focus: 'LEG DAY' },
  { id: 'mar', day: 'Mar', focus: 'UPPER PULL' },
  { id: 'mie', day: 'Mié', focus: 'RUN · HYROX' },
  { id: 'jue', day: 'Jue', focus: 'LEG DAY' },
  { id: 'vie', day: 'Vie', focus: 'UPPER PUSH' },
  { id: 'sab', day: 'Sáb', focus: 'HYROX · BOX' }
];

export const INITIAL_DAYS: DaySchedule[] = [
  {
    key: 'mie',
    shortDay: 'Mié',
    dayNumber: '25',
    fullLabel: 'Mié 25 Nov',
    focus: 'RUN · HYROX',
    coach: 'Coach Huiki',
    slots: [
      { id: 'mie-0515', time: '5:15 am', capacity: 16, enabled: true },
      { id: 'mie-0640', time: '6:40 am', capacity: 16, enabled: true },
      { id: 'mie-0800', time: '8:00 am', capacity: 16, enabled: true },
      { id: 'mie-1900', time: '7:00 pm', tag: 'GAINZ', capacity: 16, enabled: true },
      { id: 'mie-1920', time: '7:20 pm', capacity: 16, enabled: true }
    ]
  },
  {
    key: 'jue',
    shortDay: 'Jue',
    dayNumber: '26',
    fullLabel: 'Jue 26 Nov',
    focus: 'LEG DAY',
    coach: 'Coach Huiki',
    slots: [
      { id: 'jue-0515', time: '5:15 am', capacity: 16, enabled: true },
      { id: 'jue-0640', time: '6:40 am', capacity: 16, enabled: true },
      { id: 'jue-0800', time: '8:00 am', capacity: 16, enabled: true },
      { id: 'jue-1900', time: '7:00 pm', capacity: 16, enabled: true },
      { id: 'jue-2000', time: '8:00 pm', capacity: 16, enabled: true }
    ]
  },
  {
    key: 'vie',
    shortDay: 'Vie',
    dayNumber: '27',
    fullLabel: 'Vie 27 Nov',
    focus: 'UPPER PUSH',
    coach: 'Coach Huiki',
    slots: [
      { id: 'vie-0515', time: '5:15 am', tag: 'HYROX', capacity: 16, enabled: true },
      { id: 'vie-0640', time: '6:40 am', capacity: 16, enabled: true },
      { id: 'vie-0800', time: '8:00 am', capacity: 16, enabled: true },
      { id: 'vie-1900', time: '7:00 pm', capacity: 16, enabled: true }
    ]
  },
  {
    key: 'sab',
    shortDay: 'Sáb',
    dayNumber: '28',
    fullLabel: 'Sáb 28 Nov',
    focus: 'HYROX · BOX',
    coach: 'Coach Huiki',
    slots: [
      { id: 'sab-0700', time: '7:00 am', tag: 'HYROX', capacity: 16, enabled: true },
      { id: 'sab-0900', time: '9:00 am', tag: 'BOX', capacity: 16, enabled: true }
    ]
  }
];

function seedGroup(
  prefix: string,
  dayKey: DaySchedule['key'],
  slotId: string,
  names: Array<{
    name: string;
    phone: string;
    accessType: AccessType;
    status: BookingStatus;
    noteTag?: string;
    noteText?: string;
  }>
): Booking[] {
  return names.map((item, idx) => ({
    id: `${prefix}-${idx + 1}`,
    folio: `#RM-${slotId.slice(-4).toUpperCase()}${idx + 1}`,
    dayKey,
    slotId,
    name: item.name,
    phone: item.phone,
    accessType: item.accessType,
    noteTag: item.noteTag,
    noteText: item.noteText,
    status: item.status,
    createdAt: '2026-11-24T12:00:00.000Z'
  }));
}

export const INITIAL_BOOKINGS: Booking[] = [
  // Mié 25 · 5:15 am (10/16 -> 6 libres)
  ...seedGroup('m515', 'mie', 'mie-0515', [
    { name: 'Luis Ortega', phone: '222 118 4401', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Paola Jiménez', phone: '222 409 8821', accessType: 'TotalPass', status: 'confirmed' },
    { name: 'Marco Ruiz', phone: '222 773 1902', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Fernanda Sosa', phone: '222 390 2255', accessType: 'Fitpass', status: 'pending' },
    { name: 'Jorge Méndez', phone: '222 501 7740', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Valeria Nava', phone: '222 812 3004', accessType: 'Wellhub', status: 'confirmed' },
    { name: 'Héctor Paredes', phone: '222 619 5511', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Daniela Cruz', phone: '222 248 9130', accessType: 'TotalPass', status: 'pending' },
    { name: 'Iván Morales', phone: '222 930 1122', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Regina Torres', phone: '222 441 6700', accessType: 'Miembro', status: 'confirmed' }
  ]),
  // Mié 25 · 6:40 am (14/16 -> Quedan 2)
  ...seedGroup('m640', 'mie', 'mie-0640', [
    { name: 'Rodrigo León', phone: '222 301 9081', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Camila Peña', phone: '222 511 4320', accessType: 'TotalPass', status: 'confirmed' },
    { name: 'Sebastián Díaz', phone: '222 640 7781', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Ximena García', phone: '222 882 1940', accessType: 'Miembro', status: 'confirmed', noteTag: 'Meta HYROX', noteText: 'Preparando tiempos para carrera HYROX' },
    { name: 'Emilio Rojas', phone: '222 710 6623', accessType: 'Fitpass', status: 'confirmed' },
    { name: 'Natalia Flores', phone: '222 299 3412', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Óscar Reyes', phone: '222 480 9954', accessType: 'Wellhub', status: 'pending' },
    { name: 'Mariana Castro', phone: '222 533 2109', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Tomás Navarro', phone: '222 617 8832', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Lucía Bautista', phone: '222 728 4501', accessType: 'TotalPass', status: 'confirmed' },
    { name: 'Gael Cortés', phone: '222 194 3380', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Renata Medina', phone: '222 865 7120', accessType: 'Miembro', status: 'pending' },
    { name: 'Pablo Aguilar', phone: '222 350 9241', accessType: 'Fitpass', status: 'confirmed' },
    { name: 'Ana Paula Ríos', phone: '222 912 6044', accessType: 'Miembro', status: 'confirmed' }
  ]),
  // Mié 25 · 8:00 am (8/16 -> 8 libres)
  ...seedGroup('m800', 'mie', 'mie-0800', [
    { name: 'Paty Velasco', phone: '222 411 2309', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Eduardo Luna', phone: '222 522 8741', accessType: 'TotalPass', status: 'confirmed' },
    { name: 'Mónica Cabrera', phone: '222 633 9012', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Raúl Chávez', phone: '222 744 1280', accessType: 'Wellhub', status: 'pending' },
    { name: 'Laura Domínguez', phone: '222 855 4491', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Alejandra Soto', phone: '222 966 3172', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Bruno Pérez', phone: '222 177 6543', accessType: 'Clase muestra', status: 'confirmed', noteTag: 'Primera vez', noteText: 'Primera vez entrenando en La Loma' },
    { name: 'Tania Fuentes', phone: '222 288 7890', accessType: 'Fitpass', status: 'confirmed' }
  ]),
  // Mié 25 · 7:00 pm GAINZ (11/16 -> 5 libres, protagonistas en la lista)
  ...seedGroup('m1900', 'mie', 'mie-1900', [
    {
      name: 'Andrea Morales',
      phone: '222 489 1024',
      accessType: 'Miembro',
      status: 'confirmed',
      noteTag: 'Molestia física',
      noteText: 'Molestia leve en rodilla izquierda'
    },
    {
      name: 'Carlos Domínguez',
      phone: '222 310 7742',
      accessType: 'TotalPass',
      status: 'confirmed'
    },
    {
      name: 'Sofía Herrera',
      phone: '222 904 5180',
      accessType: 'Clase muestra',
      status: 'pending',
      noteTag: 'Primera vez',
      noteText: 'Primera vez en Rematch'
    },
    { name: 'Diego Vázquez', phone: '222 514 8830', accessType: 'Fitpass', status: 'confirmed' },
    { name: 'Mariana Cruz', phone: '222 678 1923', accessType: 'Wellhub', status: 'confirmed' },
    { name: 'Ricardo Salgado', phone: '222 402 6611', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Karla Mendoza', phone: '222 781 3309', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Hugo Sánchez', phone: '222 329 5510', accessType: 'TotalPass', status: 'pending' },
    { name: 'Elena Pacheco', phone: '222 890 1204', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Andrés Silva', phone: '222 215 9981', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Paulina Serrano', phone: '222 609 4472', accessType: 'Fitpass', status: 'confirmed' }
  ]),
  // Mié 25 · 7:20 pm (16/16 -> Llena)
  ...seedGroup('m1920', 'mie', 'mie-1920', [
    { name: 'Javier Morales', phone: '222 101 2001', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Andrea Tapia', phone: '222 102 2002', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Luis Fernando Gil', phone: '222 103 2003', accessType: 'TotalPass', status: 'confirmed' },
    { name: 'Gabriela Núñez', phone: '222 104 2004', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Mauricio Lara', phone: '222 105 2005', accessType: 'Fitpass', status: 'confirmed' },
    { name: 'Isabel Moreno', phone: '222 106 2006', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Fernando Romero', phone: '222 107 2007', accessType: 'Wellhub', status: 'confirmed' },
    { name: 'Jimena Vázquez', phone: '222 108 2008', accessType: 'Miembro', status: 'confirmed' },
    { name: 'César Delgado', phone: '222 109 2009', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Abril Ramírez', phone: '222 110 2010', accessType: 'TotalPass', status: 'confirmed' },
    { name: 'Jorge Guzmán', phone: '222 111 2011', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Estefanía Solís', phone: '222 112 2012', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Arturo Márquez', phone: '222 113 2013', accessType: 'Fitpass', status: 'confirmed' },
    { name: 'Fátima Ortiz', phone: '222 114 2014', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Mateo Aguilar', phone: '222 115 2015', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Diana Campos', phone: '222 116 2016', accessType: 'TotalPass', status: 'confirmed' }
  ]),
  // Jue 26 · 7:00 pm (13/16 -> Quedan 3)
  ...seedGroup('j1900', 'jue', 'jue-1900', [
    { name: 'Miguel Ángel Vera', phone: '222 340 1120', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Claudia Ibarra', phone: '222 550 8823', accessType: 'TotalPass', status: 'confirmed' },
    { name: 'Sergio Bautista', phone: '222 661 9914', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Pamela Cruz', phone: '222 772 3345', accessType: 'Wellhub', status: 'pending' },
    { name: 'Víctor Hugo Salas', phone: '222 883 4456', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Adriana Flores', phone: '222 994 5567', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Roberto Mejía', phone: '222 205 6678', accessType: 'Fitpass', status: 'confirmed' },
    { name: 'Nadia Ponce', phone: '222 316 7789', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Israel Gómez', phone: '222 427 8890', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Karen Lozano', phone: '222 538 9901', accessType: 'TotalPass', status: 'confirmed' },
    { name: 'David Zepeda', phone: '222 649 1012', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Sonia Méndez', phone: '222 750 2123', accessType: 'Miembro', status: 'pending' },
    { name: 'Emiliano Torres', phone: '222 861 3234', accessType: 'Miembro', status: 'confirmed' }
  ]),
  // Sáb 28 · 7:00 am HYROX (14/16 -> Quedan 2)
  ...seedGroup('s0700', 'sab', 'sab-0700', [
    { name: 'Ximena García', phone: '222 882 1940', accessType: 'Miembro', status: 'confirmed', noteTag: 'Meta HYROX', noteText: 'Simulacro completo en parejas' },
    { name: 'Alejandro Tapia', phone: '222 440 2231', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Mariana López', phone: '222 551 3342', accessType: 'TotalPass', status: 'confirmed' },
    { name: 'Diego Navarro', phone: '222 662 4453', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Sofía Méndez', phone: '222 773 5564', accessType: 'Fitpass', status: 'confirmed' },
    { name: 'Carlos Prieto', phone: '222 884 6675', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Valeria Cruz', phone: '222 995 7786', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Fernando Solís', phone: '222 106 8897', accessType: 'Wellhub', status: 'pending' },
    { name: 'Paula Rangel', phone: '222 217 9908', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Héctor León', phone: '222 328 1019', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Lucía Vázquez', phone: '222 439 2120', accessType: 'TotalPass', status: 'confirmed' },
    { name: 'Tomás Rivera', phone: '222 540 3231', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Regina Sosa', phone: '222 651 4342', accessType: 'Miembro', status: 'confirmed' },
    { name: 'Gael Ortiz', phone: '222 762 5453', accessType: 'Miembro', status: 'confirmed' }
  ])
];
