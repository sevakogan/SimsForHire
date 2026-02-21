export const SITE = {
  name: 'SIMSFORHIRE',
  tagline: 'Premium Racing Simulators for Events',
  url: 'https://simsforhire.com',
} as const

export const NAV_LINKS = [
  { label: 'Fleet', href: '#fleet' },
  { label: 'Events', href: '#events' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
] as const

export const HERO = {
  videoId: 'hBRNvZfHSQE',
  headingLine1: 'WE BRING THE',
  headingLine2: 'RACE TO YOU',
  subtext:
    'Full-motion racing simulators delivered, set up, and operated anywhere in Miami. Corporate events, private parties, brand activations.',
  ctaPrimary: { label: 'BOOK YOUR EVENT', href: '#contact' },
  ctaSecondary: { label: 'VIEW FLEET', href: '#fleet' },
} as const

export const MARQUEE_ITEMS = [
  'SIMSFORHIRE',
  'FULL MOTION',
  'CORPORATE EVENTS',
  'PRIVATE PARTIES',
  'MIAMI',
  'BRAND ACTIVATIONS',
] as const

export const FLEET = [
  {
    tag: 'FLAGSHIP',
    name: 'Full Motion Simulator',
    image: '/images/full_motion_2.jpg',
    description:
      'Our flagship full-motion platform powered by the Sigma Integrale motion system and Simucube 2 direct drive wheelbase. Featuring Heusinkveld Ultimate brake pedals, Cube Controls GT Pro wheels, Sparco GT racing seat, and triple 39" 165Hz 1ms displays.',
    equipment: [
      'Sigma Integrale Motion Platform',
      'Simucube 2 Direct Drive Wheelbase',
      'Heusinkveld Ultimate Brake Pedals',
      'BDH H1SQ H-Pattern / Sequential Shifter',
      'Simagic GT Neo Formula Wheel',
      'Triple 39" 165Hz 1ms MTP Screens',
      'Sparco GT Racing Seat',
      'Heusinkveld V2 Handbrake',
      'Cube Controls GT Pro Wheels',
    ],
    specs: [
      { value: '3x39"', label: '165Hz Triples' },
      { value: 'DD', label: 'Direct Drive' },
    ],
    number: '01',
  },
  {
    tag: 'VERSATILE',
    name: 'Non-Motion Simulator',
    description:
      'A high-fidelity static rig with professional-grade direct drive, triple displays, and load-cell pedals. Perfect for high-volume events with quick driver changes.',
    specs: [
      { value: 'DD', label: 'Direct Drive' },
      { value: 'Triple', label: 'Display Config' },
      { value: 'LC', label: 'Load-Cell Pedals' },
    ],
    number: '02',
  },
] as const

export const STATS = [
  { value: '4', suffix: '+', label: 'Events Completed' },
  { value: '11', suffix: '+', label: 'Simulators Deployed' },
  { value: '2.4K', suffix: '+', label: 'Racers Served' },
  { value: '5.0', suffix: '/5', label: 'Client Rating' },
] as const

export const EVENTS = [
  {
    name: 'Art Basel Miami',
    type: 'Brand Activation',
    date: 'December 2025',
    venue: 'OFFSPEC Miami × Vossen',
    stats: { people: '650+', sims: '4', days: '2' },
    description:
      'Two days of nonstop racing action at Miami\'s premier Art Basel car show. SimsForHire partnered with OFFSPEC Miami and Vossen Wheels to deploy four full-motion simulators alongside a jaw-dropping lineup of exotic cars — from widebody Porsches to custom-wrapped supercars. Guests lined up to compete on professional-grade rigs while DJs set the soundtrack and the Miami skyline lit up the night. An unforgettable fusion of car culture, art, and high-octane sim racing.',
    images: [
      { src: '/images/artbasel-1.jpg', alt: 'Full-motion simulator setup at OFFSPEC Miami during Art Basel' },
      { src: '/images/artbasel-2.jpg', alt: 'Crowd gathered around SimsForHire rigs at Art Basel event' },
      { src: '/images/artbasel-3.jpg', alt: 'Driver competing on racing simulator with exotic cars in background' },
      { src: '/images/artbasel-4.jpg', alt: 'Night scene at OFFSPEC Miami with sim racing and car show' },
      { src: '/images/artbasel-5.jpg', alt: 'Vossen Wheels partnership display with SimsForHire simulators' },
      { src: '/images/artbasel-6.jpg', alt: 'Wide shot of Art Basel event space with racing simulators' },
    ],
  },
  {
    name: 'Wynwood Marketplace',
    type: 'Private Party',
    date: 'January 2026',
    venue: 'Wynwood Marketplace',
    stats: { people: '850+', sims: '4', days: '1' },
    description:
      'An exclusive private event at Wynwood Marketplace that brought together 850 guests for a night of competition and celebration. Four SimsForHire rigs took center stage as partygoers battled it out on the leaderboard, with the crowd erupting after every close finish. From VIP lounges to open-air sim racing under the neon glow of Wynwood\'s famous murals — this was sim racing meets Miami nightlife at its finest.',
    images: [
      { src: '/images/wynwood-1.jpg', alt: 'SimsForHire setup at Wynwood Marketplace private party' },
      { src: '/images/wynwood-2.jpg', alt: 'Guests competing on racing simulators at Wynwood event' },
      { src: '/images/wynwood-3.jpg', alt: 'Crowd watching sim racing competition at Wynwood Marketplace' },
      { src: '/images/wynwood-4.jpg', alt: 'Full-motion rig under neon lights at Wynwood private party' },
      { src: '/images/wynwood-5.jpg', alt: 'VIP area with racing simulators at Wynwood Marketplace' },
      { src: '/images/wynwood-6.jpg', alt: 'Wide shot of Wynwood Marketplace event with SimsForHire rigs' },
    ],
  },
  {
    name: 'RMC Miami',
    type: 'Car Culture',
    date: 'February 2026',
    venue: 'RMC Miami',
    stats: { people: '300+', sims: '2', days: '1' },
    description:
      'SimsForHire rolled into one of Miami\'s most exclusive private car meets with two competition-ready rigs. RMC Miami brought together collectors, enthusiasts, and gearheads — and our simulators gave them a chance to push limits without risking the paint. Drivers went head-to-head on iconic tracks while surrounded by million-dollar machinery. Intimate, high-energy, and the perfect crossover of real and virtual motorsport.',
    images: [
      { src: '/images/rmc-1.jpg', alt: 'SimsForHire racing rig alongside exotic cars at RMC Miami' },
      { src: '/images/rmc-2.jpg', alt: 'Car enthusiast competing on full-motion simulator at RMC meet' },
      { src: '/images/rmc-3.jpg', alt: 'Head-to-head sim racing competition at RMC Miami car meet' },
      { src: '/images/rmc-4.jpg', alt: 'SimsForHire setup surrounded by luxury vehicles at RMC Miami' },
      { src: '/images/rmc-5.jpg', alt: 'Crowd watching sim racing at private RMC Miami gathering' },
      { src: '/images/rmc-6.jpg', alt: 'Close-up of racing simulator cockpit at RMC Miami event' },
    ],
  },
  {
    name: 'DRT 2026 × Vossen',
    type: 'Trade Show',
    date: 'March 2026',
    venue: 'DRT Show × Vossen Wheels',
    stats: { people: '600+', sims: '1', days: '2' },
    description:
      'SimsForHire teamed up with Vossen Wheels at the DRT 2026 trade show to deliver a one-of-a-kind drift and racing experience. One full-motion rig drew massive crowds over two days as attendees lined up to throw it sideways on legendary drift circuits and hammer through GT-class racing. With Vossen\'s iconic wheel display as the backdrop, our simulator became the show floor\'s most talked-about attraction — turning tire-kickers into full-throttle competitors.',
    images: [
      { src: '/images/drt-1.jpg', alt: 'SimsForHire simulator at DRT 2026 trade show with Vossen display' },
      { src: '/images/drt-2.jpg', alt: 'Crowd lined up for drift simulator experience at DRT show' },
      { src: '/images/drt-3.jpg', alt: 'Driver drifting on full-motion simulator at Vossen booth' },
      { src: '/images/drt-4.jpg', alt: 'Wide shot of DRT 2026 show floor with SimsForHire activation' },
      { src: '/images/drt-5.jpg', alt: 'Close-up of racing action on simulator at DRT Vossen partnership' },
      { src: '/images/drt-6.jpg', alt: 'SimsForHire branding alongside Vossen Wheels at DRT 2026' },
    ],
  },
] as const

export const SERVICES = [
  {
    number: '01',
    title: 'Corporate Events',
    description:
      'Team building, client entertainment, and employee engagement through competitive sim racing experiences.',
  },
  {
    number: '02',
    title: 'Private Parties',
    description:
      'Birthdays, bachelor parties, and celebrations elevated with professional racing simulators.',
  },
  {
    number: '03',
    title: 'Trade Shows',
    description:
      'Draw crowds to your booth with an interactive racing experience that generates leads and buzz.',
  },
  {
    number: '04',
    title: 'Brand Activations',
    description:
      'Custom-branded simulator experiences that connect your audience with your product in an unforgettable way.',
  },
] as const

export const ABOUT = {
  heading: 'BUILT FOR THE LOVE OF RACING',
  paragraphs: [
    'SimsForHire was born from a simple idea: bring the thrill of professional sim racing to any event, anywhere in Miami. What started as a passion project by the team at ShiftArcade has grown into South Florida\'s go-to provider of premium racing simulator experiences.',
    'Every event we do is fully managed — from delivery and setup to on-site operation and teardown. Our team handles the logistics so you can focus on your guests. Whether it\'s a corporate team-building day or a music festival with thousands of attendees, we bring the same level of precision and excitement.',
  ],
  shiftArcadeUrl: 'https://shiftarcade.com',
} as const

export const TESTIMONIALS = [
  {
    quote:
      'The SimsForHire team transformed our corporate event into an unforgettable experience. The full-motion simulators had everyone talking for weeks.',
    author: 'Marcus Chen',
    role: 'Event Director, TechVentures Inc.',
  },
  {
    quote:
      'From setup to teardown, everything was flawless. Our guests couldn\'t get enough of the racing simulators. Booking again next quarter.',
    author: 'Sofia Ramirez',
    role: 'VP of Marketing, Apex Brands',
  },
  {
    quote:
      'We\'ve worked with several entertainment vendors, but SimsForHire stands apart. Professional, reliable, and their equipment is top-notch.',
    author: 'Daniela Reyes',
    role: 'Operations Manager, Grand Events Co.',
  },
  {
    quote:
      'The reaction from our clients was incredible. SimsForHire delivered an activation that perfectly represented our brand\'s commitment to performance.',
    author: 'James Okafor',
    role: 'Creative Director, Velocity Agency',
  },
  {
    quote:
      'Best entertainment investment we\'ve made. The simulators were a massive hit at our product launch. SimsForHire handled everything seamlessly.',
    author: 'Andre Williams',
    role: 'Founder, Pinnacle Events',
  },
] as const

export const CONTACT = {
  email: 'hello@simsforhire.com',
  phone: '(305) 555-RACE',
  location: 'Miami, FL',
} as const
