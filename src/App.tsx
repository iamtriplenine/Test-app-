/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Account, Transaction, Budget, Debt, AccountType, TransactionType, DebtType, CATEGORIES } from './types';
import * as storage from './utils/storage';
import { LucideIcon } from './components/LucideIcon';
import { LiquidChart } from './components/LiquidChart';
import { AccountsTab } from './components/AccountsTab';
import { TransactionsTab } from './components/TransactionsTab';
import { BudgetsTab } from './components/BudgetsTab';
import { DebtsTab } from './components/DebtsTab';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'dashboard' | 'accounts' | 'transactions' | 'budgets' | 'debts';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Core financial state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  // Load initial data
  useEffect(() => {
    setAccounts(storage.getAccounts());
    setTransactions(storage.getTransactions());
    setBudgets(storage.getBudgets());
    setDebts(storage.getDebts());
  }, []);

  // Live total calculations
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  const activeDebtsTotal = useMemo(() => {
    return debts
      .filter((d) => d.type === 'owed_by_me' && d.status === 'active')
      .reduce((sum, d) => sum + d.remainingAmount, 0);
  }, [debts]);

  const activeCreancesTotal = useMemo(() => {
    return debts
      .filter((d) => d.type === 'owed_to_me' && d.status === 'active')
      .reduce((sum, d) => sum + d.remainingAmount, 0);
  }, [debts]);

  // Compute stats of current month savings (incomes - expenses)
  const currentMonthStats = useMemo(() => {
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const monthExpenses = transactions
      .filter((tx) => tx.type === 'expense' && tx.date.startsWith(currentMonthStr))
      .reduce((sum, tx) => sum + tx.amount, 0);

    const monthIncomes = transactions
      .filter((tx) => tx.type === 'income' && tx.date.startsWith(currentMonthStr))
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      expenses: monthExpenses,
      incomes: monthIncomes,
      savings: monthIncomes - monthExpenses,
    };
  }, [transactions]);

  // Helper mapping transactions to accounts to disable deletes if active
  const transactionsCountByAccount = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((tx) => {
      counts[tx.accountId] = (counts[tx.accountId] || 0) + 1;
      if (tx.toAccountId) {
        counts[tx.toAccountId] = (counts[tx.toAccountId] || 0) + 1;
      }
    });
    return counts;
  }, [transactions]);

  // --- Handlers ---

  // Add Account
  const handleAddAccount = (name: string, type: AccountType, balance: number, color: string) => {
    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      name,
      type,
      balance,
      color,
      createdAt: new Date().toISOString(),
    };
    const updated = [...accounts, newAcc];
    setAccounts(updated);
    storage.saveAccounts(updated);
  };

  // Delete Account
  const handleDeleteAccount = (id: string) => {
    const updated = accounts.filter((a) => a.id !== id);
    setAccounts(updated);
    storage.saveAccounts(updated);

    // Filter out transactions or keep them orphan, but it's cleaner to remove to prevent error
    const updatedTxs = transactions.filter((tx) => tx.accountId !== id && tx.toAccountId !== id);
    setTransactions(updatedTxs);
    storage.saveTransactions(updatedTxs);
  };

  // Add Budget
  const handleAddBudget = (category: string, limit: number, color: string) => {
    const newBudget: Budget = {
      id: `bud-${Date.now()}`,
      category,
      limit,
      color,
    };
    const updated = [...budgets, newBudget];
    setBudgets(updated);
    storage.saveBudgets(updated);
  };

  // Delete Budget
  const handleDeleteBudget = (id: string) => {
    const updated = budgets.filter((b) => b.id !== id);
    setBudgets(updated);
    storage.saveBudgets(updated);
  };

  // Add Debt
  const handleAddDebt = (contactName: string, type: DebtType, totalAmount: number, title: string, dueDate?: string) => {
    const newDebt: Debt = {
      id: `debt-${Date.now()}`,
      contactName,
      type,
      totalAmount,
      remainingAmount: totalAmount,
      title,
      dueDate,
      createdAt: new Date().toISOString(),
      status: 'active',
      payments: [],
    };
    const updated = [...debts, newDebt];
    setDebts(updated);
    storage.saveDebts(updated);
  };

  // Delete Debt
  const handleDeleteDebt = (id: string) => {
    const updated = debts.filter((d) => d.id !== id);
    setDebts(updated);
    storage.saveDebts(updated);
  };

  // Make dynamic payment towards active debt
  const handleAddDebtPayment = (debtId: string, amount: number, accountId: string) => {
    const targetDebt = debts.find((d) => d.id === debtId);
    if (!targetDebt) return;

    const paymentId = `pay-${Date.now()}`;
    const transactionId = `t-pay-${Date.now()}`;

    // Create corresponding transaction
    const label = targetDebt.type === 'owed_by_me'
      ? `Remboursement vers : ${targetDebt.contactName}`
      : `Reçu de : ${targetDebt.contactName} (Créance)`;

    const txType: TransactionType = targetDebt.type === 'owed_by_me' ? 'expense' : 'income';

    const newTx: Transaction = {
      id: transactionId,
      label,
      amount,
      type: txType,
      category: 'Autre',
      accountId,
      date: new Date().toISOString().split('T')[0],
      description: `Remboursement sur l'engagement "${targetDebt.title}"`,
      linkedDebtId: debtId,
    };

    // Update account balances
    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === accountId) {
        if (txType === 'income') {
          return { ...acc, balance: acc.balance + amount };
        } else {
          return { ...acc, balance: acc.balance - amount };
        }
      }
      return acc;
    });

    // Update debt
    const updatedDebts = debts.map((d) => {
      if (d.id === debtId) {
        const newRemaining = Math.max(0, d.remainingAmount - amount);
        const isSettled = newRemaining === 0;
        const newPayment = {
          id: paymentId,
          amount,
          date: new Date().toISOString(),
          accountId,
          transactionId,
        };
        return {
          ...d,
          remainingAmount: newRemaining,
          status: isSettled ? ('settled' as const) : ('active' as const),
          payments: [...d.payments, newPayment],
        };
      }
      return d;
    });

    // Save states
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    storage.saveTransactions(updatedTxs);

    setAccounts(updatedAccounts);
    storage.saveAccounts(updatedAccounts);

    setDebts(updatedDebts);
    storage.saveDebts(updatedDebts);
  };

  // Record Transaction
  const handleAddTransaction = (
    label: string,
    amount: number,
    type: TransactionType,
    category: string,
    accountId: string,
    toAccountId?: string,
    date?: string,
    description?: string
  ) => {
    const newTx: Transaction = {
      id: `t-${Date.now()}`,
      label,
      amount,
      type,
      category,
      accountId,
      toAccountId,
      date: date || new Date().toISOString().split('T')[0],
      description,
    };

    // Commit transaction
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    storage.saveTransactions(updatedTxs);

    // Commit account transitions
    const updatedAccounts = accounts.map((acc) => {
      if (type === 'transfer') {
        if (acc.id === accountId) {
          return { ...acc, balance: acc.balance - amount };
        }
        if (acc.id === toAccountId) {
          return { ...acc, balance: acc.balance + amount };
        }
      } else {
        if (acc.id === accountId) {
          if (type === 'income') {
            return { ...acc, balance: acc.balance + amount };
          } else {
            return { ...acc, balance: acc.balance - amount };
          }
        }
      }
      return acc;
    });
    setAccounts(updatedAccounts);
    storage.saveAccounts(updatedAccounts);
  };

  // Rollback Transaction
  const handleDeleteTransaction = (id: string) => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (!txToDelete) return;

    const updatedTxs = transactions.filter((t) => t.id !== id);
    setTransactions(updatedTxs);
    storage.saveTransactions(updatedTxs);

    // Rollback bank balances
    const amount = txToDelete.amount;
    const updatedAccounts = accounts.map((acc) => {
      if (txToDelete.type === 'transfer') {
        // Source adds back, destination subtracts
        if (acc.id === txToDelete.accountId) {
          return { ...acc, balance: acc.balance + amount };
        }
        if (acc.id === txToDelete.toAccountId) {
          return { ...acc, balance: acc.balance - amount };
        }
      } else {
        if (acc.id === txToDelete.accountId) {
          if (txToDelete.type === 'income') {
            return { ...acc, balance: acc.balance - amount };
          } else {
            return { ...acc, balance: acc.balance + amount };
          }
        }
      }
      return acc;
    });
    setAccounts(updatedAccounts);
    storage.saveAccounts(updatedAccounts);

    // If attached to debt repayment: subtract repayment from historical logs
    if (txToDelete.linkedDebtId) {
      const updatedDebts = debts.map((d) => {
        if (d.id === txToDelete.linkedDebtId) {
          const matchingPayment = d.payments.find((p) => p.transactionId === id);
          if (matchingPayment) {
            const returnedAmount = d.remainingAmount + matchingPayment.amount;
            const updatedPayments = d.payments.filter((p) => p.transactionId !== id);
            return {
              ...d,
              remainingAmount: Math.min(d.totalAmount, returnedAmount),
              payments: updatedPayments,
              status: 'active' as const,
            };
          }
        }
        return d;
      });
      setDebts(updatedDebts);
      storage.saveDebts(updatedDebts);
    }
  };

  // Reset demo databases
  const handleReset = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes vos données de budget ?')) {
      storage.resetAllData();
    }
  };

  // Get current date formatted beautifully
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 flex flex-col relative grid-bg pb-24">
      {/* Decorative Blur Ambient circles */}
      <div className="glow-spot-indigo left-0 top-1/4 -translate-y-1/2" />
      <div className="glow-spot-emerald right-0 top-2/3 -translate-y-1/2" />

      {/* Top Navigation Headers */}
      <header className="sticky top-0 z-40 bg-[#050508]/75 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1.5px] shadow-lg shadow-indigo-500/10 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <LucideIcon name="Sparkles" size={18} className="text-indigo-400" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Budget & Dettes
                <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Pro
                </span>
              </h1>
              <p className="text-[11px] text-neutral-400 font-mono font-medium first-letter:uppercase">{todayFormatted}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl text-[11px] font-mono font-bold bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition flex items-center gap-1.5 border border-white/5"
              title="Réinitialiser les données de démonstration"
            >
              <LucideIcon name="RefreshCcw" size={12} />
              Reset
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-white/5 flex items-center justify-center text-xs text-white uppercase font-bold shadow-inner">
              AI
            </div>
          </div>
        </div>
      </header>

      {/* Main Canvas Body */}
      <main className="max-w-7xl w-full mx-auto px-6 py-8 relative z-10 flex-1">
        {/* Render Tab states dynamically */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Apple Glass dashboard micro stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {/* Total Net Balance Card */}
                <div
                  id="stat-net-worth"
                  onClick={() => setActiveTab('accounts')}
                  className="backdrop-blur-xl bg-slate-950/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between group hover:border-white/10 transition-all duration-300 cursor-pointer"
                >
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1">Patrimoine Global</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight text-white font-sans">
                      {totalBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm font-semibold text-neutral-400">€</span>
                  </div>
                  <span className="text-[10px] text-blue-400 mt-4 flex items-center gap-1 font-medium group-hover:translate-x-1 transition-transform duration-300">
                    Gérer les comptes <LucideIcon name="ChevronRight" size={11} />
                  </span>
                </div>

                {/* Savings index Card */}
                <div
                  id="stat-savings"
                  onClick={() => setActiveTab('transactions')}
                  className="backdrop-blur-xl bg-slate-950/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between group hover:border-white/10 transition-all duration-300 cursor-pointer"
                >
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1">Épargne ce mois</p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-2xl font-bold tracking-tight font-sans ${
                        currentMonthStats.savings >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {currentMonthStats.savings >= 0 ? '+' : ''}
                      {currentMonthStats.savings.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm font-semibold text-neutral-400">€</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-4 flex items-center gap-1 font-mono">
                    In: +{currentMonthStats.incomes.toFixed(0)} | Out: -{currentMonthStats.expenses.toFixed(0)}
                  </span>
                </div>

                {/* Debts I Owe Card */}
                <div
                  id="stat-debts"
                  onClick={() => setActiveTab('debts')}
                  className="backdrop-blur-xl bg-slate-950/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between group hover:border-white/10 transition-all duration-300 cursor-pointer"
                >
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1">Mes Dettes</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold tracking-tight font-sans ${activeDebtsTotal > 0 ? 'text-rose-400' : 'text-neutral-400'}`}>
                      {activeDebtsTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm font-semibold text-neutral-400">€</span>
                  </div>
                  <span className="text-[10px] text-rose-300/80 mt-4 flex items-center gap-1 font-medium group-hover:translate-x-1 transition-transform duration-300">
                    Niveau d'endettement <LucideIcon name="ChevronRight" size={11} />
                  </span>
                </div>

                {/* Loans to Receive Card */}
                <div
                  id="stat-creances"
                  onClick={() => setActiveTab('debts')}
                  className="backdrop-blur-xl bg-slate-950/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between group hover:border-white/10 transition-all duration-300 cursor-pointer"
                >
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1">Mes Créances</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold tracking-tight font-sans ${activeCreancesTotal > 0 ? 'text-emerald-400' : 'text-neutral-400'}`}>
                      {activeCreancesTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm font-semibold text-neutral-400">€</span>
                  </div>
                  <span className="text-[10px] text-emerald-300/80 mt-4 flex items-center gap-1 font-medium group-hover:translate-x-1 transition-transform duration-300">
                    Rendre service <LucideIcon name="ChevronRight" size={11} />
                  </span>
                </div>
              </div>

              {/* Vector SVG timeline flow chart */}
              <LiquidChart transactions={transactions} />

              {/* Accounts Slider and Budget alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Compact Accounts Overview */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-lg font-semibold text-white tracking-tight">Comptes Principaux</h3>
                    <button
                      onClick={() => setActiveTab('accounts')}
                      className="text-xs font-medium text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      Détails de comptes <LucideIcon name="ChevronRight" size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {accounts.slice(0, 4).map((acc) => (
                      <div
                        key={acc.id}
                        className={`bg-slate-950/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden group hover:border-white/10 transition duration-300`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${acc.color.split(' ').slice(0,2).join(' ')} flex items-center justify-center text-white font-bold text-xs`}>
                             €
                          </div>
                          <div>
                            <span className="text-sm font-medium text-white block truncate max-w-[120px]">{acc.name}</span>
                            <span className="text-[10px] text-neutral-500 font-mono capitalize">{acc.type}</span>
                          </div>
                        </div>

                        <span className="text-sm font-bold text-white font-mono shrink-0">
                          {acc.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Budget alerts */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-lg font-semibold text-white tracking-tight">Objectifs Budget</h3>
                    <button
                      onClick={() => setActiveTab('budgets')}
                      className="text-xs font-medium text-purple-400 hover:underline flex items-center gap-0.5"
                    >
                      Établir plafonds <LucideIcon name="ChevronRight" size={12} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {budgets.length === 0 ? (
                      <div className="backdrop-blur-xl bg-slate-950/20 border border-white/5 rounded-2xl p-4 text-center text-xs text-neutral-500">
                        Aucun budget défini.
                      </div>
                    ) : (
                      budgets.slice(0, 3).map((b) => {
                        // Calc spending
                        const mStr = new Date().toISOString().slice(0, 7);
                        const spent = transactions
                          .filter((t) => t.category === b.category && t.type === 'expense' && t.date.startsWith(mStr))
                          .reduce((sum, t) => sum + t.amount, 0);
                        const percent = b.limit > 0 ? (spent / b.limit) * 100 : 0;
                        const isOver = spent > b.limit;

                        return (
                          <div
                            key={b.id}
                            className="bg-slate-950/30 border border-white/5 rounded-2xl p-4 space-y-2 relative overflow-hidden"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-white">{b.category}</span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                  isOver
                                    ? 'bg-rose-500/10 text-rose-400'
                                    : percent >= 75
                                    ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-emerald-500/10 text-emerald-400'
                                }`}
                              >
                                {percent.toFixed(0)}%
                              </span>
                            </div>

                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isOver ? 'bg-rose-500' : percent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, percent)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                              <span>Saisi: {spent.toFixed(0)} €</span>
                              <span>Max: {b.limit.toFixed(0)} €</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Transactions List on Dashboard */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-lg font-semibold text-white tracking-tight">Flux de caisse récent</h3>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-xs font-medium text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    Voir l'historique complet <LucideIcon name="ChevronRight" size={12} />
                  </button>
                </div>

                <div className="space-y-2">
                  {transactions.slice(0, 4).map((tx) => {
                    const isIncome = tx.type === 'income';
                    const isExpense = tx.type === 'expense';
                    const txAccount = accounts.find((a) => a.id === tx.accountId);

                    return (
                      <div
                        key={tx.id}
                        className="bg-slate-950/20 border border-white/5 rounded-2xl p-4 flex justify-between items-center group hover:bg-slate-950/40 transition duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                            isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            <LucideIcon name={isIncome ? 'TrendingUp' : 'TrendingDown'} size={14} />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-white block">{tx.label}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {tx.category} • sur <span className="text-neutral-400">{txAccount?.name || 'Inconnu'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono text-sm font-bold">
                          <span className={isIncome ? 'text-emerald-400' : isExpense ? 'text-rose-400' : 'text-neutral-300'}>
                            {isIncome ? '+' : isExpense ? '-' : '~'}
                            {tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                          </span>
                          <span className="block text-[9px] text-neutral-600 font-normal">
                            {new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'accounts' && (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <AccountsTab
                accounts={accounts}
                onAddAccount={handleAddAccount}
                onDeleteAccount={handleDeleteAccount}
                transactionsCount={transactionsCountByAccount}
              />
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <TransactionsTab
                transactions={transactions}
                accounts={accounts}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </motion.div>
          )}

          {activeTab === 'budgets' && (
            <motion.div
              key="budgets"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <BudgetsTab
                budgets={budgets}
                transactions={transactions}
                onAddBudget={handleAddBudget}
                onDeleteBudget={handleDeleteBudget}
              />
            </motion.div>
          )}

          {activeTab === 'debts' && (
            <motion.div
              key="debts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <DebtsTab
                debts={debts}
                accounts={accounts}
                onAddDebt={handleAddDebt}
                onAddDebtPayment={handleAddDebtPayment}
                onDeleteDebt={handleDeleteDebt}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating high-class Liquid Bottom Dock Navigational switcher */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[calc(100%-2rem)]">
        <div id="liquid-glass-dock" className="backdrop-blur-2xl bg-slate-900/60 border border-white/10 rounded-full py-2.5 px-4 flex justify-between items-center shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          {/* Dashboard Hub button */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-full relative transition ${
              activeTab === 'dashboard' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {activeTab === 'dashboard' && (
              <motion.span
                layoutId="activeDockBubble"
                className="absolute inset-0 bg-white/10 rounded-full z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <LucideIcon name="Sparkles" size={16} className="z-10" />
            <span className="text-[10px] font-medium tracking-tight z-10">Board</span>
          </button>

          {/* Accounts Hub button */}
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-full relative transition ${
              activeTab === 'accounts' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {activeTab === 'accounts' && (
              <motion.span
                layoutId="activeDockBubble"
                className="absolute inset-0 bg-white/10 rounded-full z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <LucideIcon name="Wallet" size={16} className="z-10" />
            <span className="text-[10px] font-medium tracking-tight z-10">Comptes</span>
          </button>

          {/* Transactions Hub button */}
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-full relative transition ${
              activeTab === 'transactions' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {activeTab === 'transactions' && (
              <motion.span
                layoutId="activeDockBubble"
                className="absolute inset-0 bg-white/10 rounded-full z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <LucideIcon name="ArrowLeftRight" size={16} className="z-10" />
            <span className="text-[10px] font-medium tracking-tight z-10">Flux</span>
          </button>

          {/* Budgets Hub button */}
          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-full relative transition ${
              activeTab === 'budgets' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {activeTab === 'budgets' && (
              <motion.span
                layoutId="activeDockBubble"
                className="absolute inset-0 bg-white/10 rounded-full z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <LucideIcon name="PiggyBank" size={16} className="z-10" />
            <span className="text-[10px] font-medium tracking-tight z-10">Budgets</span>
          </button>

          {/* Debts Hub button */}
          <button
            onClick={() => setActiveTab('debts')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-full relative transition ${
              activeTab === 'debts' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {activeTab === 'debts' && (
              <motion.span
                layoutId="activeDockBubble"
                className="absolute inset-0 bg-white/10 rounded-full z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <LucideIcon name="Users" size={16} className="z-10" />
            <span className="text-[10px] font-medium tracking-tight z-10">Dettes</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
