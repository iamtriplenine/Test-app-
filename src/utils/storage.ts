import { Account, Transaction, Budget, Debt } from '../types';

const STORAGE_KEYS = {
  ACCOUNTS: 'apple_budget_accounts',
  TRANSACTIONS: 'apple_budget_transactions',
  BUDGETS: 'apple_budget_budgets',
  DEBTS: 'apple_budget_debts',
};

const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    name: 'Compte Courant Apple',
    type: 'courant',
    balance: 2450.50,
    color: 'from-blue-600 to-indigo-600 shadow-blue-500/20',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'acc-2',
    name: 'Épargne Vision Pro',
    type: 'epargne',
    balance: 8100.00,
    color: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'acc-3',
    name: 'Portefeuille Liquide',
    type: 'especes',
    balance: 185.00,
    color: 'from-amber-500 to-orange-500 shadow-amber-500/20',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const INITIAL_BUDGETS: Budget[] = [
  { id: 'bud-1', category: 'Alimentation', limit: 350, color: '#f59e0b' },
  { id: 'bud-2', category: 'Shopping', limit: 200, color: '#a855f7' },
  { id: 'bud-3', category: 'Loisirs & Sorties', limit: 150, color: '#ec4899' },
  { id: 'bud-4', category: 'Transport', limit: 100, color: '#10b981' }
];

const INITIAL_DEBTS: Debt[] = [
  {
    id: 'debt-1',
    contactName: 'Thomas',
    type: 'owed_to_me',
    totalAmount: 320,
    remainingAmount: 170,
    title: 'Achat d\'une console rétro',
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    payments: [
      {
        id: 'pay-1',
        amount: 150,
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        accountId: 'acc-1',
        transactionId: 't-pay-1'
      }
    ]
  },
  {
    id: 'debt-2',
    contactName: 'Sophie',
    type: 'owed_by_me',
    totalAmount: 450,
    remainingAmount: 150,
    title: 'Part billets de vacances d\'été',
    dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    payments: [
      {
        id: 'pay-2',
        amount: 300,
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        accountId: 'acc-1',
        transactionId: 't-pay-2'
      }
    ]
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't-1',
    label: 'Salaire Mensuel',
    amount: 2200.00,
    type: 'income',
    category: 'Salaire & Revenus',
    accountId: 'acc-1',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Salaire entreprise'
  },
  {
    id: 't-2',
    label: 'Supermarché Auchan',
    amount: 85.50,
    type: 'expense',
    category: 'Alimentation',
    accountId: 'acc-1',
    date: new Date().toISOString().split('T')[0],
    description: 'Courses de la semaine'
  },
  {
    id: 't-3',
    label: 'Boulangerie Artisanale',
    amount: 4.80,
    type: 'expense',
    category: 'Alimentation',
    accountId: 'acc-3',
    date: new Date().toISOString().split('T')[0],
    description: 'Pain et viennoiseries'
  },
  {
    id: 't-4',
    label: 'Dîner entre amis',
    amount: 54.00,
    type: 'expense',
    category: 'Alimentation',
    accountId: 'acc-1',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Sushi night'
  },
  {
    id: 't-5',
    label: 'Abonnement Cinéma',
    amount: 21.90,
    type: 'expense',
    category: 'Loisirs & Sorties',
    accountId: 'acc-1',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  {
    id: 't-6',
    label: 'Achat Veste Apple Park',
    amount: 110.00,
    type: 'expense',
    category: 'Shopping',
    accountId: 'acc-1',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Édition limitée'
  },
  {
    id: 't-7',
    label: 'Recharge Pass Navigo',
    amount: 86.40,
    type: 'expense',
    category: 'Transport',
    accountId: 'acc-1',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  {
    id: 't-8',
    label: 'Virement vers Épargne',
    amount: 300.00,
    type: 'transfer',
    category: 'Transfert',
    accountId: 'acc-1',
    toAccountId: 'acc-2',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Virement d\'épargne programmé'
  },
  // Linked payments for initialization consistency
  {
    id: 't-pay-1',
    label: 'Remboursement Thomas (Partie)',
    amount: 150.00,
    type: 'income',
    category: 'Autre',
    accountId: 'acc-1',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Remboursement partiel dettes',
    linkedDebtId: 'debt-1'
  },
  {
    id: 't-pay-2',
    label: 'Virement Sophie (Partie)',
    amount: 300.00,
    type: 'expense',
    category: 'Autre',
    accountId: 'acc-1',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Remboursement partiel dettes',
    linkedDebtId: 'debt-2'
  }
];

export function getAccounts(): Account[] {
  const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
  if (!data) {
    saveAccounts(INITIAL_ACCOUNTS);
    return INITIAL_ACCOUNTS;
  }
  return JSON.parse(data);
}

export function saveAccounts(accounts: Account[]): void {
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

export function getTransactions(): Transaction[] {
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (!data) {
    saveTransactions(INITIAL_TRANSACTIONS);
    return INITIAL_TRANSACTIONS;
  }
  return JSON.parse(data);
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export function getBudgets(): Budget[] {
  const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
  if (!data) {
    saveBudgets(INITIAL_BUDGETS);
    return INITIAL_BUDGETS;
  }
  return JSON.parse(data);
}

export function saveBudgets(budgets: Budget[]): void {
  localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
}

export function getDebts(): Debt[] {
  const data = localStorage.getItem(STORAGE_KEYS.DEBTS);
  if (!data) {
    saveDebts(INITIAL_DEBTS);
    return INITIAL_DEBTS;
  }
  return JSON.parse(data);
}

export function saveDebts(debts: Debt[]): void {
  localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
}

export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.BUDGETS);
  localStorage.removeItem(STORAGE_KEYS.DEBTS);
  window.location.reload();
}
