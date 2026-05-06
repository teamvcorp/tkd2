export interface Program {
  id: string;
  name: string;
  description: string;
  stripeProductId: string; // Replace with real Stripe Product IDs
  pricePerYear: number;    // in cents USD
  oneTimeFee?: boolean;    // true if this is a one-time charge, not annual
  durationYears?: number;  // fixed program duration before renewal is required
}

export const PROGRAMS: Program[] = [
  {
    id: 'White - Red',
    name: 'Self Paced Taekwondo',
    description: 'Come when you can train as hard as your schedule allows. We will support you as needed.',
    stripeProductId: 'prod_UF1U4x512Nzz1B',
    pricePerYear: 60000, // $600/yr
  },
  {
    id: 'White - Orange',
    name: 'Tier 1: Taekwondo Beginner',
    description: 'Ages 4–6 · Fun, foundational TKD',
    stripeProductId: 'prod_UEd0dT4JRBl3rr',
    pricePerYear: 90000, // $900/yr
  },
  {
    id: 'Green - Light Blue',
    name: 'Tier 2: Taekwondo Intermediate',
    description: 'Ages 7–12 · Belt progression & basics',
    stripeProductId: 'prod_UEd1yG4vzSsUGp',
    pricePerYear: 120000, // $1,200/yr
  },
  {
    id: 'DarkBlue - Red',
    name: 'Tier 3: Taekwondo Advanced',
    description: 'Ages 13–17 · Advanced forms & sparring',
    stripeProductId: 'prod_UEd3xUKkkl6Egm',
    pricePerYear: 150000, // $1,500/yr
  },
  {
    id: 'Deputy Black belt Program',
    name: 'Deputy Black',
    description: 'Black Belt Preparation',
    stripeProductId: 'prod_U9gCDkYdEIcFTR',
    pricePerYear: 210000, // $2,100/yr
  },
  {
    id: 'Black belt Program',
    name: 'Black Belt',
    description: 'All ages · 5-year program · renewal required after 5 years',
    stripeProductId: 'prod_U9gDE8dgEvqYsC',
    pricePerYear: 1000000, // $10,000 one-time (covers 5 years)
    oneTimeFee: true,
    durationYears: 5,
  },
  {
    id: 'Homeschool Taekwondo Program',
    name: 'Homeschool +',
    description: 'All ages · Best for 6+ students',
    stripeProductId: 'prod_U9g1CzFYMg1jUY',
    pricePerYear: 240000, // $2,400 /yr
  },
];

export function getProgramById(id: string): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}

export function formatPrice(cents: number, oneTimeFee?: boolean, durationYears?: number): string {
  const amount = `$${(cents / 100).toLocaleString()}`;
  if (oneTimeFee) {
    return durationYears ? `${amount} / ${durationYears} yrs` : amount;
  }
  return `${amount}/yr`;
}
