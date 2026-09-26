import { 
  User, Department, Category, CivicIssue, IssueComment, 
  Notification, AuditLog, SLAPolicy, ServiceArea, IssueStatus, IssuePriority, Appointment 
} from '../src/types';

export interface DatabaseState {
  users: User[];
  departments: Department[];
  categories: Category[];
  issues: CivicIssue[];
  comments: IssueComment[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  slaPolicies: SLAPolicy[];
  serviceAreas: ServiceArea[];
  appointments: Appointment[];
}

const initialDepartments: Department[] = [
  {
    id: 'dept-roads',
    name: 'Roads & Public Works',
    code: 'RPW',
    description: 'Maintenance of public roads, sidewalks, bridges, potholes, and drainage infrastructure.',
    contactEmail: 'roads@city.civicfix.gov',
    contactPhone: '+1 (555) 019-2831',
    headName: 'David Sterling',
    categories: ['Road Damage', 'Sidewalk & Curbs', 'Bridges & Overpasses'],
    activeOfficerCount: 8,
    openIssuesCount: 14,
    active: true,
  },
  {
    id: 'dept-water',
    name: 'Water Resources & Sewage',
    code: 'WRS',
    description: 'Potable water supply, pipe bursts, sewer backups, open storm drains, and flooding.',
    contactEmail: 'water@city.civicfix.gov',
    contactPhone: '+1 (555) 019-4822',
    headName: 'Maria Vasquez',
    categories: ['Water Leak / Pipe Burst', 'Sewage Overflow', 'Storm Drain Blocked'],
    activeOfficerCount: 6,
    openIssuesCount: 9,
    active: true,
  },
  {
    id: 'dept-electric',
    name: 'Street Lighting & Energy',
    code: 'SLE',
    description: 'Streetlights, exposed power lines, signal outages, and municipal electrical grids.',
    contactEmail: 'electrical@city.civicfix.gov',
    contactPhone: '+1 (555) 019-8391',
    headName: 'Kofi Mensah',
    categories: ['Streetlight Outage', 'Exposed Cables', 'Traffic Light Malfunction'],
    activeOfficerCount: 5,
    openIssuesCount: 6,
    active: true,
  },
  {
    id: 'dept-sanitation',
    name: 'Waste Management & Sanitation',
    code: 'WMS',
    description: 'Garbage accumulation, illegal dumping, public bin servicing, and hazardous spills.',
    contactEmail: 'sanitation@city.civicfix.gov',
    contactPhone: '+1 (555) 019-3320',
    headName: 'Robert Vance',
    categories: ['Illegal Dumping', 'Overflowing Bin', 'Debris / Litter'],
    activeOfficerCount: 7,
    openIssuesCount: 11,
    active: true,
  },
  {
    id: 'dept-parks',
    name: 'Parks, Trees & Urban Forest',
    code: 'PUF',
    description: 'Fallen trees, dangerous branches, playground repairs, and civic park upkeep.',
    contactEmail: 'parks@city.civicfix.gov',
    contactPhone: '+1 (555) 019-5519',
    headName: 'Claire Bennet',
    categories: ['Fallen Tree / Branch', 'Park Playground Equipment', 'Overgrown Vegetation'],
    activeOfficerCount: 4,
    openIssuesCount: 5,
    active: true,
  },
];

const initialCategories: Category[] = [
  {
    id: 'cat-road-damage',
    name: 'Road Damage & Potholes',
    slug: 'road-damage',
    departmentId: 'dept-roads',
    defaultPriority: 'HIGH',
    slaHours: { CRITICAL: 4, HIGH: 24, MEDIUM: 72, LOW: 168 },
    icon: 'construction',
    description: 'Potholes, asphalt crumbling, sinkholes, and roadway hazards.',
  },
  {
    id: 'cat-water-leak',
    name: 'Water & Sewage Outflow',
    slug: 'water-sewage',
    departmentId: 'dept-water',
    defaultPriority: 'HIGH',
    slaHours: { CRITICAL: 3, HIGH: 12, MEDIUM: 48, LOW: 120 },
    icon: 'droplets',
    description: 'Broken mains, geysers, flooded lanes, and raw sewage odors.',
  },
  {
    id: 'cat-streetlight',
    name: 'Streetlight & Signals',
    slug: 'streetlight',
    departmentId: 'dept-electric',
    defaultPriority: 'MEDIUM',
    slaHours: { CRITICAL: 6, HIGH: 24, MEDIUM: 72, LOW: 168 },
    icon: 'lightbulb',
    description: 'Dark street fixtures, flickering lights, knocked poles, traffic signal failure.',
  },
  {
    id: 'cat-waste',
    name: 'Waste & Illegal Dumping',
    slug: 'waste-dumping',
    departmentId: 'dept-sanitation',
    defaultPriority: 'MEDIUM',
    slaHours: { CRITICAL: 8, HIGH: 24, MEDIUM: 48, LOW: 120 },
    icon: 'trash-2',
    description: 'Uncollected trash bags, bulky debris dumps, hazardous material.',
  },
  {
    id: 'cat-trees',
    name: 'Fallen Trees & Overgrowth',
    slug: 'trees-overgrowth',
    departmentId: 'dept-parks',
    defaultPriority: 'HIGH',
    slaHours: { CRITICAL: 4, HIGH: 18, MEDIUM: 60, LOW: 144 },
    icon: 'trees',
    description: 'Trees blocking lanes, cracked heavy boughs, sightline obstruction.',
  },
  {
    id: 'cat-sidewalk',
    name: 'Sidewalk & Pedestrian Safety',
    slug: 'sidewalk',
    departmentId: 'dept-roads',
    defaultPriority: 'LOW',
    slaHours: { CRITICAL: 12, HIGH: 48, MEDIUM: 120, LOW: 240 },
    icon: 'footprints',
    description: 'Trip hazards, buckled concrete slabs, damaged curb cuts.',
  },
];

const initialUsers: User[] = [
  {
    id: 'usr-citizen-1',
    name: 'Maya Lin',
    email: 'citizen@civicfix.org',
    role: 'CITIZEN',
    phone: '+1 (555) 234-9811',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    active: true,
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'usr-citizen-2',
    name: 'Jordan Rivera',
    email: 'jordan.rivera@community.org',
    role: 'CITIZEN',
    phone: '+1 (555) 789-1122',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    active: true,
    createdAt: '2026-02-01T11:20:00Z',
  },
  {
    id: 'usr-officer-1',
    name: 'Marcus Vance',
    email: 'officer@civicfix.org',
    role: 'FIELD_OFFICER',
    departmentId: 'dept-roads',
    departmentName: 'Roads & Public Works',
    badgeNumber: 'RPW-409',
    phone: '+1 (555) 441-9988',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    active: true,
    createdAt: '2025-11-10T08:30:00Z',
  },
  {
    id: 'usr-officer-2',
    name: 'Tanya Gomez',
    email: 'tanya.gomez@city.civicfix.gov',
    role: 'FIELD_OFFICER',
    departmentId: 'dept-roads',
    departmentName: 'Roads & Public Works',
    badgeNumber: 'RPW-415',
    phone: '+1 (555) 441-9992',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    active: true,
    createdAt: '2025-12-01T08:30:00Z',
  },
  {
    id: 'usr-officer-3',
    name: 'Liam Chen',
    email: 'liam.chen@city.civicfix.gov',
    role: 'FIELD_OFFICER',
    departmentId: 'dept-water',
    departmentName: 'Water Resources & Sewage',
    badgeNumber: 'WRS-208',
    phone: '+1 (555) 441-7711',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    active: true,
    createdAt: '2025-10-15T08:30:00Z',
  },
  {
    id: 'usr-supervisor-1',
    name: 'Elena Rostova',
    email: 'supervisor@civicfix.org',
    role: 'DEPARTMENT_SUPERVISOR',
    departmentId: 'dept-roads',
    departmentName: 'Roads & Public Works',
    phone: '+1 (555) 881-2244',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    active: true,
    createdAt: '2025-08-01T08:00:00Z',
  },
  {
    id: 'usr-manager-1',
    name: 'David Sterling',
    email: 'manager@civicfix.org',
    role: 'DEPARTMENT_MANAGER',
    departmentId: 'dept-roads',
    departmentName: 'Roads & Public Works',
    phone: '+1 (555) 881-9900',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    active: true,
    createdAt: '2025-06-15T08:00:00Z',
  },
  {
    id: 'usr-admin-1',
    name: 'Sarah Chen',
    email: 'admin@civicfix.org',
    role: 'GOVERNMENT_ADMIN',
    phone: '+1 (555) 992-0011',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    active: true,
    createdAt: '2025-05-01T08:00:00Z',
  },
  {
    id: 'usr-superadmin-1',
    name: 'Alex Thorne',
    email: 'superadmin@civicfix.org',
    role: 'SUPER_ADMIN',
    phone: '+1 (555) 999-0000',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    active: true,
    createdAt: '2025-01-01T08:00:00Z',
  },
];

const initialSLAPolicies: SLAPolicy[] = [
  {
    id: 'sla-critical',
    priority: 'CRITICAL',
    targetResponseHours: 1,
    targetResolutionHours: 4,
    escalationWarningThresholdPercent: 75,
    autoEscalateOnBreach: true,
    description: 'Imminent hazard to life, public transit blockage, active electrical risk or water gushing.',
  },
  {
    id: 'sla-high',
    priority: 'HIGH',
    targetResponseHours: 4,
    targetResolutionHours: 24,
    escalationWarningThresholdPercent: 70,
    autoEscalateOnBreach: true,
    description: 'Significant traffic impediment, major roadway pothole, localized sewer backup.',
  },
  {
    id: 'sla-medium',
    priority: 'MEDIUM',
    targetResponseHours: 12,
    targetResolutionHours: 72,
    escalationWarningThresholdPercent: 80,
    autoEscalateOnBreach: false,
    description: 'Non-blocking street defects, illegal dumping, isolated streetlight outages.',
  },
  {
    id: 'sla-low',
    priority: 'LOW',
    targetResponseHours: 24,
    targetResolutionHours: 168,
    escalationWarningThresholdPercent: 85,
    autoEscalateOnBreach: false,
    description: 'Aesthetic sidewalk issues, faded line markings, non-hazardous park upkeep.',
  },
];

const initialServiceAreas: ServiceArea[] = [
  {
    id: 'zone-bbmp-east',
    name: 'BBMP East Zone (Indiranagar / MG Road)',
    zoneCode: 'BBMP-EZ',
    coordinates: [
      [12.9784, 77.6408],
      [12.9748, 77.6080],
      [12.9857, 77.6057],
      [12.9890, 77.6350],
    ],
    primaryDepartmentId: 'dept-roads',
    officersOnDutyCount: 5,
  },
  {
    id: 'zone-bbmp-south',
    name: 'BBMP South Zone (Koramangala / HSR / Jayanagar)',
    zoneCode: 'BBMP-SZ',
    coordinates: [
      [12.9352, 77.6245],
      [12.9121, 77.6446],
      [12.9308, 77.5838],
      [12.9500, 77.6100],
    ],
    primaryDepartmentId: 'dept-roads',
    officersOnDutyCount: 6,
  },
  {
    id: 'zone-bbmp-mahadevapura',
    name: 'BBMP Mahadevapura (Whitefield / Bellandur)',
    zoneCode: 'BBMP-MZ',
    coordinates: [
      [12.9698, 77.7499],
      [12.9260, 77.6762],
      [12.9500, 77.7000],
      [12.9800, 77.7200],
    ],
    primaryDepartmentId: 'dept-water',
    officersOnDutyCount: 4,
  },
  {
    id: 'zone-bbmp-west',
    name: 'BBMP West Zone (Malleshwaram / Rajajinagar)',
    zoneCode: 'BBMP-WZ',
    coordinates: [
      [13.0031, 77.5643],
      [12.9982, 77.5530],
      [13.0150, 77.5700],
      [12.9850, 77.5600],
    ],
    primaryDepartmentId: 'dept-electric',
    officersOnDutyCount: 4,
  },
];

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const hoursAhead = (h: number) => new Date(now.getTime() + h * 3600000).toISOString();

const initialIssues: CivicIssue[] = [
  {
    id: 'iss-1',
    publicId: 'CF-2026-004812',
    title: 'Deep Hazardous Pothole on 80 Feet Road, Koramangala 4th Block',
    description: 'A deep pothole measuring approx 3 feet across and 6 inches deep in the middle vehicular lane on 80 Feet Road. Two two-wheelers had near misses and BMTC buses are swerving erratically into oncoming traffic.',
    category: 'Road Damage & Potholes',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    latitude: 12.9352,
    longitude: 77.6245,
    address: '80 Feet Rd, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
    landmark: 'Near Sony World Junction, opposite Maharaja Restaurant',
    reporterId: 'usr-citizen-1',
    reporterName: 'Maya Lin',
    reporterEmail: 'citizen@civicfix.org',
    reporterPhone: '+91 98450 12345',
    departmentId: 'dept-roads',
    departmentName: 'Roads & Public Works',
    assignedOfficerId: 'usr-officer-1',
    assignedOfficerName: 'Marcus Vance',
    images: [
      {
        id: 'img-1-1',
        url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
        type: 'EVIDENCE',
        uploadedBy: 'usr-citizen-1',
        uploaderName: 'Maya Lin',
        uploaderRole: 'CITIZEN',
        caption: 'Deep asphalt collapse in active lane',
        createdAt: hoursAgo(20),
      },
      {
        id: 'img-1-2',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&auto=format&fit=crop&q=80',
        type: 'BEFORE',
        uploadedBy: 'usr-officer-1',
        uploaderName: 'Marcus Vance',
        uploaderRole: 'FIELD_OFFICER',
        caption: 'Officer arrival inspection: measured 6.2 inches deep',
        createdAt: hoursAgo(3),
      },
    ],
    upvotesCount: 34,
    upvotedByUserIds: ['usr-citizen-1', 'usr-citizen-2'],
    linkedIssuesCount: 4,
    createdAt: hoursAgo(20),
    updatedAt: hoursAgo(2),
    slaDeadline: hoursAhead(4),
    aiAnalysis: {
      category: 'Road Damage & Potholes',
      confidence: 96,
      suggestedSeverity: 'HIGH',
      reasoningSummary: 'Severe roadway crater exceeding 4 inches in high-speed municipal corridor with cycling vulnerability.',
      suggestedDepartment: 'Roads & Public Works',
    },
    statusHistory: [
      {
        id: 'sh-1-1',
        status: 'SUBMITTED',
        changedById: 'usr-citizen-1',
        changedByName: 'Maya Lin',
        changedByRole: 'CITIZEN',
        note: 'Issue reported with photo evidence and geocoded coordinates.',
        timestamp: hoursAgo(20),
      },
      {
        id: 'sh-1-2',
        status: 'VERIFIED',
        changedById: 'usr-supervisor-1',
        changedByName: 'Elena Rostova',
        changedByRole: 'DEPARTMENT_SUPERVISOR',
        note: 'Triage complete. High priority confirmed due to transit volume.',
        timestamp: hoursAgo(14),
      },
      {
        id: 'sh-1-3',
        status: 'ASSIGNED',
        changedById: 'usr-supervisor-1',
        changedByName: 'Elena Rostova',
        changedByRole: 'DEPARTMENT_SUPERVISOR',
        note: 'Assigned to Officer Marcus Vance (Vehicle RPW-Crew 3).',
        timestamp: hoursAgo(8),
      },
      {
        id: 'sh-1-4',
        status: 'IN_PROGRESS',
        changedById: 'usr-officer-1',
        changedByName: 'Marcus Vance',
        changedByRole: 'FIELD_OFFICER',
        note: 'Crew on site. Hot asphalt patch truck deployed, lane coned off.',
        timestamp: hoursAgo(2),
      },
    ],
    assignments: [
      {
        id: 'asg-1',
        officerId: 'usr-officer-1',
        officerName: 'Marcus Vance',
        assignedById: 'usr-supervisor-1',
        assignedByName: 'Elena Rostova',
        notes: 'Priority asphalt patching required before evening commute peak.',
        timestamp: hoursAgo(8),
        active: true,
      },
    ],
    escalations: [],
    commentsCount: 5,
    internalNotesCount: 2,
  },
  {
    id: 'iss-2',
    publicId: 'CF-2026-004813',
    title: 'Severe BWSSB Water Main Rupture Flooding 100 Feet Road',
    description: 'Clean drinking water is bursting out through cracked sidewalk and flooding into 2 lanes of 100 Feet Road. Pressure is high and water is pooling towards retail shop basements near the metro station.',
    category: 'Water & Sewage Outflow',
    status: 'ASSIGNED',
    priority: 'CRITICAL',
    latitude: 12.9784,
    longitude: 77.6408,
    address: '100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
    landmark: 'Near Indiranagar Metro Station (Reach 1)',
    reporterId: 'usr-citizen-2',
    reporterName: 'Jordan Rivera',
    reporterEmail: 'jordan.rivera@community.org',
    departmentId: 'dept-water',
    departmentName: 'Water Resources & Sewage',
    assignedOfficerId: 'usr-officer-3',
    assignedOfficerName: 'Liam Chen',
    images: [
      {
        id: 'img-2-1',
        url: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=800&auto=format&fit=crop&q=80',
        type: 'EVIDENCE',
        uploadedBy: 'usr-citizen-2',
        uploaderName: 'Jordan Rivera',
        uploaderRole: 'CITIZEN',
        caption: 'High pressure water pooling across intersection',
        createdAt: hoursAgo(2),
      },
    ],
    upvotesCount: 48,
    upvotedByUserIds: ['usr-citizen-1'],
    linkedIssuesCount: 7,
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(1),
    slaDeadline: hoursAhead(2),
    aiAnalysis: {
      category: 'Water & Sewage Outflow',
      confidence: 98,
      suggestedSeverity: 'CRITICAL',
      reasoningSummary: 'Active water main breach threatening private real estate basements and city water conservation.',
      suggestedDepartment: 'Water Resources & Sewage',
    },
    statusHistory: [
      {
        id: 'sh-2-1',
        status: 'SUBMITTED',
        changedById: 'usr-citizen-2',
        changedByName: 'Jordan Rivera',
        changedByRole: 'CITIZEN',
        note: 'Reported emergency burst.',
        timestamp: hoursAgo(2),
      },
      {
        id: 'sh-2-2',
        status: 'ASSIGNED',
        changedById: 'usr-admin-1',
        changedByName: 'Sarah Chen',
        changedByRole: 'GOVERNMENT_ADMIN',
        note: 'Emergency triage auto-escalated; assigned to specialist Liam Chen.',
        timestamp: hoursAgo(1),
      },
    ],
    assignments: [
      {
        id: 'asg-2',
        officerId: 'usr-officer-3',
        officerName: 'Liam Chen',
        assignedById: 'usr-admin-1',
        assignedByName: 'Sarah Chen',
        notes: 'Bring main shutoff valve key and bypass hose.',
        timestamp: hoursAgo(1),
        active: true,
      },
    ],
    escalations: [],
    commentsCount: 8,
    internalNotesCount: 3,
  },
  {
    id: 'iss-3',
    publicId: 'CF-2026-004814',
    title: 'BESCOM Streetlight Cluster Failure along 27th Main Road',
    description: 'Storm winds snapped light fixture poles. Wiring exposed near pedestrian walkway. Pitch black corridor at night along the lake road with loose wires wrapped around broken metal post.',
    category: 'Streetlight & Signals',
    status: 'SUBMITTED',
    priority: 'HIGH',
    latitude: 12.9121,
    longitude: 77.6446,
    address: '27th Main Rd, Sector 1, HSR Layout, Bengaluru, Karnataka 560102',
    landmark: 'Opposite Agara Lake Park pedestrian entrance',
    reporterId: 'usr-citizen-1',
    reporterName: 'Maya Lin',
    departmentId: 'dept-electric',
    departmentName: 'Street Lighting & Energy',
    images: [
      {
        id: 'img-3-1',
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        type: 'EVIDENCE',
        uploadedBy: 'usr-citizen-1',
        uploaderName: 'Maya Lin',
        uploaderRole: 'CITIZEN',
        caption: 'Pole collapsed onto curb with loose wiring',
        createdAt: hoursAgo(5),
      },
    ],
    upvotesCount: 19,
    upvotedByUserIds: [],
    linkedIssuesCount: 2,
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(5),
    slaDeadline: hoursAhead(19),
    aiAnalysis: {
      category: 'Streetlight & Signals',
      confidence: 94,
      suggestedSeverity: 'HIGH',
      reasoningSummary: 'Physical trauma to electrical pole and potential live cable hazard near pedestrian sidewalk.',
      suggestedDepartment: 'Street Lighting & Energy',
    },
    statusHistory: [
      {
        id: 'sh-3-1',
        status: 'SUBMITTED',
        changedById: 'usr-citizen-1',
        changedByName: 'Maya Lin',
        changedByRole: 'CITIZEN',
        note: 'Report created via mobile portal.',
        timestamp: hoursAgo(5),
      },
    ],
    assignments: [],
    escalations: [],
    commentsCount: 2,
    internalNotesCount: 0,
  },
  {
    id: 'iss-4',
    publicId: 'CF-2026-004815',
    title: 'Commercial Construction Waste Dumped along ITPL Main Road',
    description: 'Approximately 2 tons of concrete debris, broken tiles, sharp rebar, and chemical containers dumped blocking the footpath and bus bay along ITPL corridor.',
    category: 'Waste & Illegal Dumping',
    status: 'AWAITING_VERIFICATION',
    priority: 'MEDIUM',
    latitude: 12.9698,
    longitude: 77.7499,
    address: 'ITPL Main Rd, Pattandur Agrahara, Whitefield, Bengaluru, Karnataka 560066',
    landmark: 'Near Hope Farm Junction bus shelter',
    reporterId: 'usr-citizen-2',
    reporterName: 'Jordan Rivera',
    departmentId: 'dept-sanitation',
    departmentName: 'Waste Management & Sanitation',
    assignedOfficerId: 'usr-officer-1',
    assignedOfficerName: 'Marcus Vance',
    images: [
      {
        id: 'img-4-1',
        url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80',
        type: 'EVIDENCE',
        uploadedBy: 'usr-citizen-2',
        uploaderName: 'Jordan Rivera',
        uploaderRole: 'CITIZEN',
        caption: 'Debris piles blocking pedestrian footpath',
        createdAt: hoursAgo(28),
      },
      {
        id: 'img-4-2',
        url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
        type: 'AFTER',
        uploadedBy: 'usr-officer-1',
        uploaderName: 'Marcus Vance',
        uploaderRole: 'FIELD_OFFICER',
        caption: 'Cleaned, sanitized and debris hauled to municipal transfer station',
        createdAt: hoursAgo(4),
      },
    ],
    upvotesCount: 15,
    upvotedByUserIds: ['usr-citizen-2'],
    linkedIssuesCount: 1,
    createdAt: hoursAgo(30),
    updatedAt: hoursAgo(4),
    slaDeadline: hoursAgo(6),
    resolvedAt: hoursAgo(4),
    aiAnalysis: {
      category: 'Waste & Illegal Dumping',
      confidence: 92,
      suggestedSeverity: 'MEDIUM',
      reasoningSummary: 'Unpermitted construction material obstructing right-of-way.',
      suggestedDepartment: 'Waste Management & Sanitation',
    },
    statusHistory: [
      {
        id: 'sh-4-1',
        status: 'SUBMITTED',
        changedById: 'usr-citizen-2',
        changedByName: 'Jordan Rivera',
        changedByRole: 'CITIZEN',
        note: 'Reported debris obstruction.',
        timestamp: hoursAgo(30),
      },
      {
        id: 'sh-4-2',
        status: 'ASSIGNED',
        changedById: 'usr-supervisor-1',
        changedByName: 'Elena Rostova',
        changedByRole: 'DEPARTMENT_SUPERVISOR',
        note: 'Assigned to haul truck unit.',
        timestamp: hoursAgo(22),
      },
      {
        id: 'sh-4-3',
        status: 'IN_PROGRESS',
        changedById: 'usr-officer-1',
        changedByName: 'Marcus Vance',
        changedByRole: 'FIELD_OFFICER',
        note: 'Hauling debris.',
        timestamp: hoursAgo(10),
      },
      {
        id: 'sh-4-4',
        status: 'AWAITING_VERIFICATION',
        changedById: 'usr-officer-1',
        changedByName: 'Marcus Vance',
        changedByRole: 'FIELD_OFFICER',
        note: 'All dumped material cleared and power-washed. Submitted after photo.',
        timestamp: hoursAgo(4),
      },
    ],
    assignments: [
      {
        id: 'asg-4',
        officerId: 'usr-officer-1',
        officerName: 'Marcus Vance',
        assignedById: 'usr-supervisor-1',
        assignedByName: 'Elena Rostova',
        timestamp: hoursAgo(22),
        active: true,
      },
    ],
    escalations: [],
    commentsCount: 3,
    internalNotesCount: 1,
  },
  {
    id: 'iss-5',
    publicId: 'CF-2026-004816',
    title: 'Fallen Gulmohar Tree Limb Blocking Sampige Road',
    description: 'A large heavy branch broke from an old Gulmohar tree and collapsed across one lane of Sampige Road, pulling down internet optical fiber cables.',
    category: 'Fallen Trees & Overgrowth',
    status: 'VERIFIED_RESOLVED',
    priority: 'HIGH',
    latitude: 13.0031,
    longitude: 77.5643,
    address: 'Sampige Rd, 8th Cross, Malleshwaram, Bengaluru, Karnataka 560003',
    landmark: 'Near Malleshwaram Circle & 8th Cross Market',
    reporterId: 'usr-citizen-1',
    reporterName: 'Maya Lin',
    departmentId: 'dept-parks',
    departmentName: 'Parks, Trees & Urban Forest',
    assignedOfficerId: 'usr-officer-2',
    assignedOfficerName: 'Tanya Gomez',
    images: [
      {
        id: 'img-5-1',
        url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
        type: 'EVIDENCE',
        uploadedBy: 'usr-citizen-1',
        uploaderName: 'Maya Lin',
        uploaderRole: 'CITIZEN',
        caption: 'Split bough suspended over roadway',
        createdAt: hoursAgo(50),
      },
      {
        id: 'img-5-2',
        url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop&q=80',
        type: 'AFTER',
        uploadedBy: 'usr-officer-2',
        uploaderName: 'Tanya Gomez',
        uploaderRole: 'FIELD_OFFICER',
        caption: 'Arborist pruned hazardous split limb and secured canopy',
        createdAt: hoursAgo(24),
      },
    ],
    upvotesCount: 42,
    upvotedByUserIds: ['usr-citizen-1', 'usr-citizen-2'],
    linkedIssuesCount: 3,
    createdAt: hoursAgo(52),
    updatedAt: hoursAgo(12),
    slaDeadline: hoursAgo(34),
    resolvedAt: hoursAgo(24),
    closedAt: hoursAgo(12),
    verification: {
      verifiedByCitizen: true,
      citizenNotes: 'Inspected the road this morning, tree limb was safely removed and traffic is completely clear. Thank you!',
      verifiedAt: hoursAgo(12),
    },
    aiAnalysis: {
      category: 'Fallen Trees & Overgrowth',
      confidence: 97,
      suggestedSeverity: 'HIGH',
      reasoningSummary: 'Critical obstruction of active municipal thoroughfare with entangled utility wires.',
      suggestedDepartment: 'Parks, Trees & Urban Forest',
    },
    statusHistory: [
      {
        id: 'sh-5-1',
        status: 'SUBMITTED',
        changedById: 'usr-citizen-1',
        changedByName: 'Maya Lin',
        changedByRole: 'CITIZEN',
        note: 'Reported overhead hazard.',
        timestamp: hoursAgo(52),
      },
      {
        id: 'sh-5-2',
        status: 'VERIFIED',
        changedById: 'usr-supervisor-1',
        changedByName: 'Elena Rostova',
        changedByRole: 'DEPARTMENT_SUPERVISOR',
        note: 'Verified and marked high urgency.',
        timestamp: hoursAgo(48),
      },
      {
        id: 'sh-5-3',
        status: 'RESOLVED',
        changedById: 'usr-officer-2',
        changedByName: 'Tanya Gomez',
        changedByRole: 'FIELD_OFFICER',
        note: 'Pruning completed.',
        timestamp: hoursAgo(24),
      },
      {
        id: 'sh-5-4',
        status: 'VERIFIED_RESOLVED',
        changedById: 'usr-citizen-1',
        changedByName: 'Maya Lin',
        changedByRole: 'CITIZEN',
        note: 'Citizen confirmed resolution with 5-star feedback.',
        timestamp: hoursAgo(12),
      },
    ],
    assignments: [
      {
        id: 'asg-5',
        officerId: 'usr-officer-2',
        officerName: 'Tanya Gomez',
        assignedById: 'usr-supervisor-1',
        assignedByName: 'Elena Rostova',
        timestamp: hoursAgo(48),
        active: true,
      },
    ],
    escalations: [],
    commentsCount: 6,
    internalNotesCount: 2,
  },
  {
    id: 'iss-6',
    publicId: 'CF-2026-004817',
    title: 'Dislodged Stormwater Drain Grate near Outer Ring Road',
    description: 'Heavy vehicle dislodged a major SWD drain slab on the service road. An open rectangular trench 24 inches wide with rushing wastewater is exposing motorists and pedestrians to catastrophic accident risk.',
    category: 'Water & Sewage Outflow',
    status: 'UNDER_REVIEW',
    priority: 'CRITICAL',
    latitude: 12.9260,
    longitude: 77.6762,
    address: 'Outer Ring Rd, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103',
    landmark: 'Near EcoSpace Tech Park Bus Stop',
    reporterId: 'usr-citizen-1',
    reporterName: 'Maya Lin',
    departmentId: 'dept-water',
    departmentName: 'Water Resources & Sewage',
    images: [
      {
        id: 'img-6-1',
        url: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=800&auto=format&fit=crop&q=80',
        type: 'EVIDENCE',
        uploadedBy: 'usr-citizen-1',
        uploaderName: 'Maya Lin',
        uploaderRole: 'CITIZEN',
        caption: 'Open drain trench on active service road',
        createdAt: hoursAgo(1),
      },
    ],
    upvotesCount: 21,
    upvotedByUserIds: [],
    linkedIssuesCount: 0,
    createdAt: hoursAgo(1),
    updatedAt: hoursAgo(1),
    slaDeadline: hoursAhead(2),
    aiAnalysis: {
      category: 'Water & Sewage Outflow',
      confidence: 99,
      suggestedSeverity: 'CRITICAL',
      reasoningSummary: 'Catastrophic vehicle drop risk and open fall hazard into drain.',
      suggestedDepartment: 'Water Resources & Sewage',
    },
    statusHistory: [
      {
        id: 'sh-6-1',
        status: 'SUBMITTED',
        changedById: 'usr-citizen-1',
        changedByName: 'Maya Lin',
        changedByRole: 'CITIZEN',
        note: 'Emergency civic report submitted.',
        timestamp: hoursAgo(1),
      },
      {
        id: 'sh-6-2',
        status: 'UNDER_REVIEW',
        changedById: 'usr-admin-1',
        changedByName: 'Sarah Chen',
        changedByRole: 'GOVERNMENT_ADMIN',
        note: 'Supervisors alerted via priority paging.',
        timestamp: hoursAgo(1),
      },
    ],
    assignments: [],
    escalations: [],
    commentsCount: 1,
    internalNotesCount: 1,
  },
  {
    id: 'iss-7',
    publicId: 'CF-2026-004818',
    title: 'Traffic Signal Malfunction at MG Road & Brigade Road Junction',
    description: 'All traffic signal aspects stuck on flashing amber, causing severe peak-hour congestion at the main city intersection.',
    category: 'Streetlight & Signals',
    status: 'SUBMITTED',
    priority: 'HIGH',
    latitude: 12.9748,
    longitude: 77.6080,
    address: 'MG Road & Brigade Rd Junction, Ashok Nagar, Bengaluru, Karnataka 560001',
    landmark: 'Near Cauvery Arts & Crafts Emporium',
    reporterId: 'usr-citizen-2',
    reporterName: 'Jordan Rivera',
    departmentId: 'dept-electric',
    departmentName: 'Street Lighting & Energy',
    images: [
      {
        id: 'img-7-1',
        url: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&auto=format&fit=crop&q=80',
        type: 'EVIDENCE',
        uploadedBy: 'usr-citizen-2',
        uploaderName: 'Jordan Rivera',
        uploaderRole: 'CITIZEN',
        caption: 'Blinking amber signal causing traffic gridlock',
        createdAt: hoursAgo(3),
      },
    ],
    upvotesCount: 38,
    upvotedByUserIds: ['usr-citizen-2'],
    linkedIssuesCount: 1,
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(3),
    slaDeadline: hoursAhead(9),
    aiAnalysis: {
      category: 'Streetlight & Signals',
      confidence: 95,
      suggestedSeverity: 'HIGH',
      reasoningSummary: 'Critical transit junction signal failure creating pedestrian and vehicular gridlock.',
      suggestedDepartment: 'Street Lighting & Energy',
    },
    statusHistory: [
      {
        id: 'sh-7-1',
        status: 'SUBMITTED',
        changedById: 'usr-citizen-2',
        changedByName: 'Jordan Rivera',
        changedByRole: 'CITIZEN',
        note: 'Reported signal failure.',
        timestamp: hoursAgo(3),
      },
    ],
    assignments: [],
    escalations: [],
    commentsCount: 2,
    internalNotesCount: 0,
  },
  {
    id: 'iss-8',
    publicId: 'CF-2026-004819',
    title: 'Damaged Sidewalk Paver Blocks around Jayanagar Shopping Complex',
    description: 'Broken, loose paver tiles causing senior citizens and pedestrians to trip and fall near bus stop.',
    category: 'Road Damage & Potholes',
    status: 'SUBMITTED',
    priority: 'MEDIUM',
    latitude: 12.9308,
    longitude: 77.5838,
    address: '11th Main Rd, 4th Block, Jayanagar, Bengaluru, Karnataka 560011',
    landmark: 'Outside Jayanagar 4th Block BDA Complex',
    reporterId: 'usr-citizen-1',
    reporterName: 'Maya Lin',
    departmentId: 'dept-roads',
    departmentName: 'Roads & Public Works',
    images: [
      {
        id: 'img-8-1',
        url: 'https://images.unsplash.com/photo-1584463699039-38c53874175d?w=800&auto=format&fit=crop&q=80',
        type: 'EVIDENCE',
        uploadedBy: 'usr-citizen-1',
        uploaderName: 'Maya Lin',
        uploaderRole: 'CITIZEN',
        caption: 'Dislodged stone pavers with tripping hazard',
        createdAt: hoursAgo(6),
      },
    ],
    upvotesCount: 14,
    upvotedByUserIds: [],
    linkedIssuesCount: 0,
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(6),
    slaDeadline: hoursAhead(18),
    aiAnalysis: {
      category: 'Road Damage & Potholes',
      confidence: 91,
      suggestedSeverity: 'MEDIUM',
      reasoningSummary: 'Pedestrian right-of-way hazard near commercial transit hub.',
      suggestedDepartment: 'Roads & Public Works',
    },
    statusHistory: [
      {
        id: 'sh-8-1',
        status: 'SUBMITTED',
        changedById: 'usr-citizen-1',
        changedByName: 'Maya Lin',
        changedByRole: 'CITIZEN',
        note: 'Reported damaged walkway pavers.',
        timestamp: hoursAgo(6),
      },
    ],
    assignments: [],
    escalations: [],
    commentsCount: 1,
    internalNotesCount: 0,
  },
];

const initialComments: IssueComment[] = [
  {
    id: 'cmt-1',
    issueId: 'iss-1',
    userId: 'usr-citizen-1',
    userName: 'Maya Lin',
    userRole: 'CITIZEN',
    content: 'Thank you for acknowledging this quickly! The traffic was getting really backed up earlier.',
    isInternal: false,
    createdAt: hoursAgo(18),
  },
  {
    id: 'cmt-2',
    issueId: 'iss-1',
    userId: 'usr-citizen-2',
    userName: 'Jordan Rivera',
    userRole: 'CITIZEN',
    content: 'Can confirm, my car wheel hit this yesterday evening. Glad it is being prioritized.',
    isInternal: false,
    createdAt: hoursAgo(12),
  },
  {
    id: 'cmt-3',
    issueId: 'iss-1',
    userId: 'usr-officer-1',
    userName: 'Marcus Vance',
    userRole: 'FIELD_OFFICER',
    content: 'Traffic control signs placed. We are cutting around the perimeter and prepping emulsion binder.',
    isInternal: false,
    createdAt: hoursAgo(2),
  },
  {
    id: 'cmt-int-1',
    issueId: 'iss-1',
    userId: 'usr-supervisor-1',
    userName: 'Elena Rostova',
    userRole: 'DEPARTMENT_SUPERVISOR',
    content: 'INTERNAL NOTE: Ensure crew checks the underlying sub-base. Water seepage was detected 50ft north last month.',
    isInternal: true,
    createdAt: hoursAgo(7),
  },
  {
    id: 'cmt-int-2',
    issueId: 'iss-1',
    userId: 'usr-officer-1',
    userName: 'Marcus Vance',
    userRole: 'FIELD_OFFICER',
    content: 'INTERNAL NOTE: Sub-base is solid gravel, no sub-surface void. Standard 2-layer hot mix will suffice.',
    isInternal: true,
    createdAt: hoursAgo(2),
  },
];

const initialNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'usr-citizen-1',
    title: 'Work Underway on CF-2026-004812',
    message: 'Officer Marcus Vance has arrived at Market & 4th Street and started asphalt patching.',
    type: 'STATUS_CHANGE',
    issueId: 'iss-1',
    issuePublicId: 'CF-2026-004812',
    read: false,
    createdAt: hoursAgo(2),
  },
  {
    id: 'notif-2',
    userId: 'usr-officer-1',
    title: 'New High Priority Assignment',
    message: 'You were assigned to hazardous pothole CF-2026-004812 by Supervisor Elena Rostova.',
    type: 'ASSIGNMENT',
    issueId: 'iss-1',
    issuePublicId: 'CF-2026-004812',
    read: true,
    createdAt: hoursAgo(8),
  },
  {
    id: 'notif-3',
    userId: 'usr-supervisor-1',
    title: 'SLA Warning: 4h Remaining',
    message: 'Issue CF-2026-004812 has 4 hours remaining before SLA target resolution deadline.',
    type: 'SLA_BREACH',
    issueId: 'iss-1',
    issuePublicId: 'CF-2026-004812',
    read: false,
    createdAt: hoursAgo(1),
  },
  {
    id: 'notif-4',
    userId: 'usr-citizen-2',
    title: 'Verification Needed for CF-2026-004815',
    message: 'Officer Marcus Vance has marked the illegal dumping as cleared. Please verify the fix.',
    type: 'VERIFICATION',
    issueId: 'iss-4',
    issuePublicId: 'CF-2026-004815',
    read: false,
    createdAt: hoursAgo(4),
  },
];

const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: hoursAgo(20),
    actorId: 'usr-citizen-1',
    actorName: 'Maya Lin',
    actorRole: 'CITIZEN',
    action: 'ISSUE_SUBMITTED',
    resource: 'CIVIC_ISSUE',
    resourceId: 'iss-1',
    details: { publicId: 'CF-2026-004812', category: 'Road Damage & Potholes', priority: 'HIGH' },
  },
  {
    id: 'aud-2',
    timestamp: hoursAgo(14),
    actorId: 'usr-supervisor-1',
    actorName: 'Elena Rostova',
    actorRole: 'DEPARTMENT_SUPERVISOR',
    action: 'STATUS_TRANSITION',
    resource: 'CIVIC_ISSUE',
    resourceId: 'iss-1',
    details: { fromStatus: 'SUBMITTED', toStatus: 'VERIFIED' },
  },
  {
    id: 'aud-3',
    timestamp: hoursAgo(8),
    actorId: 'usr-supervisor-1',
    actorName: 'Elena Rostova',
    actorRole: 'DEPARTMENT_SUPERVISOR',
    action: 'OFFICER_ASSIGNED',
    resource: 'CIVIC_ISSUE',
    resourceId: 'iss-1',
    details: { officerId: 'usr-officer-1', officerName: 'Marcus Vance' },
  },
  {
    id: 'aud-4',
    timestamp: hoursAgo(2),
    actorId: 'usr-officer-1',
    actorName: 'Marcus Vance',
    actorRole: 'FIELD_OFFICER',
    action: 'STATUS_TRANSITION',
    resource: 'CIVIC_ISSUE',
    resourceId: 'iss-1',
    details: { fromStatus: 'ASSIGNED', toStatus: 'IN_PROGRESS' },
  },
  {
    id: 'aud-5',
    timestamp: hoursAgo(4),
    actorId: 'usr-officer-1',
    actorName: 'Marcus Vance',
    actorRole: 'FIELD_OFFICER',
    action: 'ISSUE_RESOLVED',
    resource: 'CIVIC_ISSUE',
    resourceId: 'iss-4',
    details: { afterPhotoAttached: true, resolutionTimeHours: 26 },
  },
  {
    id: 'aud-6',
    timestamp: hoursAgo(12),
    actorId: 'usr-citizen-1',
    actorName: 'Maya Lin',
    actorRole: 'CITIZEN',
    action: 'CITIZEN_VERIFIED_RESOLVED',
    resource: 'CIVIC_ISSUE',
    resourceId: 'iss-5',
    details: { verified: true, rating: 5 },
  },
];

export class Database {
  private state: DatabaseState;

  constructor() {
    // Start with clean initial state: genuine departments, categories, SLA policies, service areas, and authorized user accounts.
    // Clean production state: issues, comments, notifications, audit logs start empty.
    this.state = {
      users: [...initialUsers],
      departments: [...initialDepartments],
      categories: [...initialCategories],
      issues: [],
      comments: [],
      notifications: [],
      auditLogs: [],
      slaPolicies: [...initialSLAPolicies],
      serviceAreas: [...initialServiceAreas],
      appointments: [],
    };
  }

  // Clear all data to empty state
  clearAllData(): void {
    this.state.issues = [];
    this.state.comments = [];
    this.state.notifications = [];
    this.state.auditLogs = [];
    this.state.appointments = [];
    // Reset department counts
    this.state.departments.forEach(d => {
      d.openIssuesCount = 0;
    });
  }

  // Optional manual development seed data for testing
  seedDevelopmentData(): { issuesCount: number } {
    this.state.issues = [...initialIssues];
    this.state.comments = [...initialComments];
    this.state.notifications = [...initialNotifications];
    this.state.auditLogs = [...initialAuditLogs];
    this.state.departments = [...initialDepartments];
    return { issuesCount: this.state.issues.length };
  }

  // Users
  getUsers(): User[] {
    return this.state.users;
  }

  getUserById(id: string): User | undefined {
    return this.state.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.state.users.push(newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.state.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.state.users[idx] = { ...this.state.users[idx], ...updates };
    return this.state.users[idx];
  }

  // Departments
  getDepartments(): Department[] {
    return this.state.departments;
  }

  getDepartmentById(id: string): Department | undefined {
    return this.state.departments.find(d => d.id === id);
  }

  createDepartment(dept: Omit<Department, 'id' | 'activeOfficerCount' | 'openIssuesCount'>): Department {
    const newDept: Department = {
      ...dept,
      id: `dept-${Date.now()}`,
      activeOfficerCount: 0,
      openIssuesCount: 0,
    };
    this.state.departments.push(newDept);
    return newDept;
  }

  updateDepartment(id: string, updates: Partial<Department>): Department | undefined {
    const idx = this.state.departments.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    this.state.departments[idx] = { ...this.state.departments[idx], ...updates };
    return this.state.departments[idx];
  }

  // Categories
  getCategories(): Category[] {
    return this.state.categories;
  }

  createCategory(cat: Omit<Category, 'id'>): Category {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
    };
    this.state.categories.push(newCat);
    return newCat;
  }

  // SLA Policies
  getSLAPolicies(): SLAPolicy[] {
    return this.state.slaPolicies;
  }

  updateSLAPolicy(id: string, updates: Partial<SLAPolicy>): SLAPolicy | undefined {
    const idx = this.state.slaPolicies.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.state.slaPolicies[idx] = { ...this.state.slaPolicies[idx], ...updates };
    return this.state.slaPolicies[idx];
  }

  // Service Areas
  getServiceAreas(): ServiceArea[] {
    return this.state.serviceAreas;
  }

  // Issues
  getIssues(): CivicIssue[] {
    return this.state.issues;
  }

  getIssueById(id: string): CivicIssue | undefined {
    return this.state.issues.find(i => i.id === id || i.publicId === id);
  }

  createIssue(issueData: Omit<CivicIssue, 'id' | 'publicId' | 'statusHistory' | 'assignments' | 'escalations' | 'commentsCount' | 'internalNotesCount' | 'upvotesCount' | 'upvotedByUserIds' | 'linkedIssuesCount' | 'createdAt' | 'updatedAt'>): CivicIssue {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const publicId = `CF-2026-00${randomSuffix}`;
    const id = `iss-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newIssue: CivicIssue = {
      ...issueData,
      id,
      publicId,
      statusHistory: [
        {
          id: `sh-${Date.now()}-1`,
          status: issueData.status,
          changedById: issueData.reporterId,
          changedByName: issueData.reporterName,
          changedByRole: 'CITIZEN',
          note: 'Civic issue submitted via CivicFix portal.',
          timestamp,
        },
      ],
      assignments: [],
      escalations: [],
      images: issueData.images || [],
      upvotesCount: 1,
      upvotedByUserIds: [issueData.reporterId],
      linkedIssuesCount: 0,
      commentsCount: 0,
      internalNotesCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.state.issues.unshift(newIssue);

    // Update department counts
    const dept = this.getDepartmentById(newIssue.departmentId);
    if (dept) {
      dept.openIssuesCount += 1;
    }

    // Add Audit Log
    this.addAuditLog({
      actorId: newIssue.reporterId,
      actorName: newIssue.reporterName,
      actorRole: 'CITIZEN',
      action: 'ISSUE_SUBMITTED',
      resource: 'CIVIC_ISSUE',
      resourceId: newIssue.id,
      details: {
        publicId: newIssue.publicId,
        category: newIssue.category,
        priority: newIssue.priority,
        address: newIssue.address,
      },
    });

    return newIssue;
  }

  updateIssue(id: string, updates: Partial<CivicIssue>): CivicIssue | undefined {
    const idx = this.state.issues.findIndex(i => i.id === id || i.publicId === id);
    if (idx === -1) return undefined;
    
    this.state.issues[idx] = {
      ...this.state.issues[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.state.issues[idx];
  }

  transitionIssueStatus(
    issueId: string, 
    newStatus: IssueStatus, 
    actor: { id: string; name: string; role: any }, 
    note: string
  ): CivicIssue | undefined {
    const issue = this.getIssueById(issueId);
    if (!issue) return undefined;

    const previousStatus = issue.status;
    const timestamp = new Date().toISOString();

    const historyEntry = {
      id: `sh-${Date.now()}`,
      status: newStatus,
      changedById: actor.id,
      changedByName: actor.name,
      changedByRole: actor.role,
      note: note || `Status transitioned to ${newStatus}`,
      timestamp,
    };

    issue.status = newStatus;
    issue.statusHistory.push(historyEntry);
    issue.updatedAt = timestamp;

    if (newStatus === 'RESOLVED' || newStatus === 'AWAITING_VERIFICATION') {
      issue.resolvedAt = timestamp;
    }
    if (newStatus === 'VERIFIED_RESOLVED' || newStatus === 'CLOSED') {
      issue.closedAt = timestamp;
    }

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'STATUS_TRANSITION',
      resource: 'CIVIC_ISSUE',
      resourceId: issue.id,
      details: { previousStatus, newStatus, note },
    });

    // Notify citizen reporter
    if (issue.reporterId !== actor.id) {
      this.createNotification({
        userId: issue.reporterId,
        title: `Status Update: ${issue.publicId}`,
        message: `Your reported issue "${issue.title}" is now ${newStatus.replace('_', ' ')}.`,
        type: newStatus === 'AWAITING_VERIFICATION' ? 'VERIFICATION' : 'STATUS_CHANGE',
        issueId: issue.id,
        issuePublicId: issue.publicId,
      });
    }

    return issue;
  }

  assignOfficer(
    issueId: string,
    officer: User,
    assignedBy: { id: string; name: string; role: any },
    notes?: string
  ): CivicIssue | undefined {
    const issue = this.getIssueById(issueId);
    if (!issue) return undefined;

    const timestamp = new Date().toISOString();

    // Deactivate previous active assignments
    issue.assignments.forEach(a => a.active = false);

    issue.assignments.push({
      id: `asg-${Date.now()}`,
      officerId: officer.id,
      officerName: officer.name,
      assignedById: assignedBy.id,
      assignedByName: assignedBy.name,
      notes,
      timestamp,
      active: true,
    });

    issue.assignedOfficerId = officer.id;
    issue.assignedOfficerName = officer.name;
    issue.status = 'ASSIGNED';
    issue.updatedAt = timestamp;

    issue.statusHistory.push({
      id: `sh-${Date.now()}`,
      status: 'ASSIGNED',
      changedById: assignedBy.id,
      changedByName: assignedBy.name,
      changedByRole: assignedBy.role,
      note: `Assigned to ${officer.name}. ${notes ? `Instructions: ${notes}` : ''}`,
      timestamp,
    });

    this.addAuditLog({
      actorId: assignedBy.id,
      actorName: assignedBy.name,
      actorRole: assignedBy.role,
      action: 'OFFICER_ASSIGNED',
      resource: 'CIVIC_ISSUE',
      resourceId: issue.id,
      details: { officerId: officer.id, officerName: officer.name, notes },
    });

    // Notify Officer
    this.createNotification({
      userId: officer.id,
      title: `New Assignment: ${issue.publicId}`,
      message: `You were assigned to "${issue.title}" by ${assignedBy.name}.`,
      type: 'ASSIGNMENT',
      issueId: issue.id,
      issuePublicId: issue.publicId,
    });

    return issue;
  }

  escalateIssue(
    issueId: string,
    level: 'SUPERVISOR' | 'MANAGER' | 'ADMIN',
    reason: string,
    escalatedBy: { id: string; name: string; role: any }
  ): CivicIssue | undefined {
    const issue = this.getIssueById(issueId);
    if (!issue) return undefined;

    const timestamp = new Date().toISOString();

    issue.escalations.push({
      id: `esc-${Date.now()}`,
      level,
      reason,
      escalatedById: escalatedBy.id,
      escalatedByName: escalatedBy.name,
      status: 'OPEN',
      timestamp,
    });

    // Escalate priority if not already critical
    if (issue.priority === 'LOW') issue.priority = 'MEDIUM';
    else if (issue.priority === 'MEDIUM') issue.priority = 'HIGH';
    else if (issue.priority === 'HIGH') issue.priority = 'CRITICAL';

    issue.updatedAt = timestamp;

    this.addAuditLog({
      actorId: escalatedBy.id,
      actorName: escalatedBy.name,
      actorRole: escalatedBy.role,
      action: 'ISSUE_ESCALATED',
      resource: 'CIVIC_ISSUE',
      resourceId: issue.id,
      details: { level, reason, newPriority: issue.priority },
    });

    // Notify Supervisors & Managers
    const leadershipUsers = this.state.users.filter(u => 
      u.role === 'DEPARTMENT_SUPERVISOR' || u.role === 'DEPARTMENT_MANAGER' || u.role === 'GOVERNMENT_ADMIN'
    );
    leadershipUsers.forEach(u => {
      this.createNotification({
        userId: u.id,
        title: `ESCALATION ALERT: ${issue.publicId}`,
        message: `Issue "${issue.title}" escalated to ${level}: ${reason}`,
        type: 'ESCALATION',
        issueId: issue.id,
        issuePublicId: issue.publicId,
      });
    });

    return issue;
  }

  toggleUpvote(issueId: string, userId: string): { upvoted: boolean; count: number } | undefined {
    const issue = this.getIssueById(issueId);
    if (!issue) return undefined;

    const idx = issue.upvotedByUserIds.indexOf(userId);
    let upvoted = false;
    if (idx === -1) {
      issue.upvotedByUserIds.push(userId);
      issue.upvotesCount += 1;
      upvoted = true;
    } else {
      issue.upvotedByUserIds.splice(idx, 1);
      issue.upvotesCount = Math.max(0, issue.upvotesCount - 1);
      upvoted = false;
    }
    return { upvoted, count: issue.upvotesCount };
  }

  // Comments
  getComments(issueId: string, includeInternal: boolean = false): IssueComment[] {
    return this.state.comments.filter(c => c.issueId === issueId && (includeInternal || !c.isInternal));
  }

  addComment(comment: Omit<IssueComment, 'id' | 'createdAt'>): IssueComment {
    const newComment: IssueComment = {
      ...comment,
      id: `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.state.comments.push(newComment);

    const issue = this.getIssueById(comment.issueId);
    if (issue) {
      if (comment.isInternal) {
        issue.internalNotesCount += 1;
      } else {
        issue.commentsCount += 1;
      }
      issue.updatedAt = new Date().toISOString();
    }
    return newComment;
  }

  // Notifications
  getNotifications(userId: string): Notification[] {
    return this.state.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createNotification(notif: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification {
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.state.notifications.unshift(newNotif);
    return newNotif;
  }

  markNotificationRead(id: string): boolean {
    const notif = this.state.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      return true;
    }
    return false;
  }

  markAllNotificationsRead(userId: string): number {
    let count = 0;
    this.state.notifications.forEach(n => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        count++;
      }
    });
    return count;
  }

  // Audit Logs
  getAuditLogs(limit: number = 50): AuditLog[] {
    return [...this.state.auditLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      ...entry,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(newLog);
    return newLog;
  }

  // Appointments
  getAppointments(): Appointment[] {
    return [...(this.state.appointments || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getAppointmentById(id: string): Appointment | undefined {
    return (this.state.appointments || []).find(a => a.id === id || a.publicId === id);
  }

  createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Appointment {
    if (!this.state.appointments) {
      this.state.appointments = [];
    }
    const id = `apt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const publicId = appointment.publicId || `APT-${Date.now().toString(36).toUpperCase()}`;
    const newAppointment: Appointment = {
      ...appointment,
      id,
      publicId,
      createdAt: new Date().toISOString(),
      status: appointment.status || 'CONFIRMED',
    };
    this.state.appointments.unshift(newAppointment);
    return newAppointment;
  }

  updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
    if (!this.state.appointments) return null;
    const index = this.state.appointments.findIndex(a => a.id === id || a.publicId === id);
    if (index === -1) return null;
    this.state.appointments[index] = {
      ...this.state.appointments[index],
      ...updates,
    };
    return this.state.appointments[index];
  }
}

export const db = new Database();
