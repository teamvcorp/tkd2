export interface Purchase {
  id: string;           // Stripe PaymentIntent ID
  productId: string;
  productName: string;
  category: string;
  size?: string;
  fulfillment: 'ship' | 'pickup';
  shippingAddress?: string;
  amount: number;       // in cents
  purchasedAt: string;  // ISO
}

export interface Kid {
  name: string;
  age: number;
  rank: string;
  program?: string;               // program ID from PROGRAMS list
  status?: 'pending' | 'active' | 'inactive';
  expiresAt?: string;             // ISO datetime
  stripePaymentIntentId?: string;
  avatarUrl?: string;             // Public blob URL for kid's profile photo
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  // Parent / guardian info
  parentName: string;
  parentAge: number;
  // Children enrolled
  kids: Kid[];
  stripeCustomerId?: string;      // Stripe Customer ID (cus_xxx)
  stripePaymentMethodId?: string; // Saved default payment method (pm_xxx)
  purchases?: Purchase[];
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  parentName: string;
  parentAge: number;
  kids: Kid[];
  stripeCustomerId?: string;
  hasPaymentMethod: boolean;
  purchases?: Purchase[];
}
