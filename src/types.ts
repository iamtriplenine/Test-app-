export type AccountType = 'courant' | 'epargne' | 'especes' | 'carte' | 'autre';
export type TransactionType = 'expense' | 'income' | 'transfer';
export type DebtType = 'owed_by_me' | 'owed_to_me'; // Owed by me (debt) or owed to me (loan/receivable)

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number; // Balance includes all transaction values
  color: string; // Tailwind gradient or color configuration
  createdAt: string;
}

export interface Transaction {
  id: string;
  label: string;
  amount: number;
  type: TransactionType;
  category: string;
  accountId: string; // Primary account impacted
  toAccountId?: string; // Target account (for transfers)
  date: string;
  description?: string;
  linkedDebtId?: string; // Optional link to a debt settlement
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  color: string;
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  accountId: string;
  transactionId: string;
}

export interface Debt {
  id: string;
  contactName: string;
  type: DebtType;
  totalAmount: number;
  remainingAmount: number;
  title: string;
  dueDate?: string;
  createdAt: string;
  status: 'active' | 'settled';
  payments: DebtPayment[];
}

export const CATEGORIES = [
  { name: 'Alimentation', icon: 'Utensils', color: '#f59e0b' },
  { name: 'Logement & Factures', icon: 'Home', color: '#3b82f6' },
  { name: 'Transport', icon: 'Car', color: '#10b981' },
  { name: 'Loisirs & Sorties', icon: 'Smile', color: '#ec4899' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#a855f7' },
  { name: 'Santé & Bien-être', icon: 'Heart', color: '#ef4444' },
  { name: 'Salaire & Revenus', icon: 'Briefcase', color: '#22c55e' },
  { name: 'Transfert', icon: 'ArrowLeftRight', color: '#64748b' },
  { name: 'Autre', icon: 'PlusCircle', color: '#6b7280' },
];

export const ACCOUNT_TYPES_META = [
  { type: 'courant', label: 'Compte Courant', icon: 'CreditCard' },
  { type: 'epargne', label: 'Compte d\'Épargne', icon: 'PiggyBank' },
  { type: 'especes', label: 'Espèces / Portefeuille', icon: 'Coins' },
  { type: 'carte', label: 'Carte de Crédit', icon: 'Wallet' },
  { type: 'autre', label: 'Autre Actif', icon: 'Hexagon' },
];
