import React, { useState, useMemo } from 'react';
import { Transaction, Account, CATEGORIES, TransactionType } from '../types';
import { LucideIcon } from './LucideIcon';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionsTabProps {
  transactions: Transaction[];
  accounts: Account[];
  onAddTransaction: (
    label: string,
    amount: number,
    type: TransactionType,
    category: string,
    accountId: string,
    toAccountId?: string,
    date?: string,
    description?: string
  ) => void;
  onDeleteTransaction: (id: string) => void;
}

export function TransactionsTab({
  transactions,
  accounts,
  onAddTransaction,
  onDeleteTransaction,
}: TransactionsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [filterAccountId, setFilterAccountId] = useState('all');

  // New Transaction Form States
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Auto-fill account when opening form
  React.useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
      // toAccountId differs if transfer
      if (accounts[1]) {
        setToAccountId(accounts[1].id);
      } else {
        setToAccountId(accounts[0].id);
      }
    }
  }, [accounts, accountId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount) || 0;
    if (!label.trim() || parsedAmount <= 0 || !accountId) return;

    onAddTransaction(
      label,
      parsedAmount,
      type,
      type === 'transfer' ? 'Transfert' : category,
      accountId,
      type === 'transfer' ? toAccountId : undefined,
      date,
      description || undefined
    );

    // Reset states
    setLabel('');
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowAddForm(false);
  };

  // Safe category selection adjustments based on transaction type
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'transfer') {
      setCategory('Transfert');
    } else if (newType === 'income') {
      setCategory('Salaire & Revenus');
    } else {
      setCategory('Alimentation');
    }
  };

  // Filter and Search Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search matches label, category, description
        const query = search.toLowerCase();
        const matchesSearch =
          tx.label.toLowerCase().includes(query) ||
          tx.category.toLowerCase().includes(query) ||
          (tx.description && tx.description.toLowerCase().includes(query));

        const matchesType = filterType === 'all' || tx.type === filterType;

        const matchesAccount =
          filterAccountId === 'all' ||
          tx.accountId === filterAccountId ||
          tx.toAccountId === filterAccountId;

        return matchesSearch && matchesType && matchesAccount;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, search, filterType, filterAccountId]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((tx) => {
      const dateKey = tx.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const formatDateHeader = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    if (dateStr === today) {
      return "Aujourd'hui";
    }
    if (dateStr === yesterday) {
      return 'Hier';
    }

    // Otherwise format date fully (e.g., Mardi 2 Juin)
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateLabel = new Date(dateStr).toLocaleDateString('fr-FR', options);
    // Capitalize first letter
    return dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
  };

  return (
    <div id="transactions-tab-root" className="space-y-6">
      {/* Header section with creators */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Flux de Transactions</h2>
          <p className="text-sm text-neutral-400">Enregistrez et analysez votre activité financière</p>
        </div>

        {accounts.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium text-sm px-4 py-2.5 rounded-full shadow-lg shadow-emerald-500/20 hover:brightness-110 active:brightness-95 transition-all duration-300 cursor-pointer"
          >
            {showAddForm ? (
              <>
                <LucideIcon name="X" size={16} /> Fermer
              </>
            ) : (
              <>
                <LucideIcon name="Plus" size={16} /> Nouvelle Transaction
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Slide transition for new transaction form */}
      <AnimatePresence>
        {showAddForm && accounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              Saisir une Transaction
            </h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Type Switcher */}
              <div className="md:col-span-3 space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Type de Flux</label>
                <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/5 max-w-sm">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('expense')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      type === 'expense' ? 'bg-rose-500 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Dépense
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('income')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      type === 'income' ? 'bg-emerald-500 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Revenu
                  </button>
                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleTypeChange('transfer')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                        type === 'transfer' ? 'bg-zinc-700 text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Virement
                    </button>
                  )}
                </div>
              </div>

              {/* Description visual */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Libellé principal</label>
                <input
                  type="text"
                  placeholder="e.g. Courses Auchan, Salaire, Netflix..."
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Montant (€)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500 transition-all"
                  required
                  min="0.01"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  required
                />
              </div>

              {/* Account selection */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
                  {type === 'transfer' ? 'Compte Démetteur (Source)' : 'Compte appliqué'}
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} className="bg-slate-950 text-white">
                      {a.name} ({a.balance.toFixed(2)} €)
                    </option>
                  ))}
                </select>
              </div>

              {/* If Transfer: Target Account */}
              {type === 'transfer' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold text-amber-400">
                    Compte Bénéficiaire (Cible)
                  </label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-amber-500/20 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 cursor-pointer"
                    required
                  >
                    {accounts
                      .filter((a) => a.id !== accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id} className="bg-slate-950 text-white">
                          {a.name} ({a.balance.toFixed(2)} €)
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                /* Category */
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Catégorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    required
                  >
                    {CATEGORIES.filter((c) => {
                      if (type === 'income') return c.name === 'Salaire & Revenus' || c.name === 'Autre';
                      return c.name !== 'Salaire & Revenus' && c.name !== 'Transfert';
                    }).map((cat) => (
                      <option key={cat.name} value={cat.name} className="bg-slate-950 text-white">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Optional details */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Note / Commentaire (Optionnel)</label>
                <input
                  type="text"
                  placeholder="e.g. Cadeau d'anniversaire, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Submit btn */}
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-white text-slate-950 hover:bg-neutral-200 active:bg-neutral-300 font-semibold text-sm px-6 py-3 rounded-full flex items-center gap-2 transition"
                >
                  <LucideIcon name="Check" size={16} /> Enregistrer la Transaction
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and search parameters */}
      <div className="backdrop-blur-xl bg-slate-950/40 border border-white/5 rounded-3xl p-5 gap-4 flex flex-col md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
            <LucideIcon name="Search" size={16} />
          </span>
          <input
            type="text"
            placeholder="Rechercher par libellé ou note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/10 focus:ring-1 focus:ring-white/5 transition-all"
          />
        </div>

        {/* Filters Wrapper */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Account Filter */}
          <select
            value={filterAccountId}
            onChange={(e) => setFilterAccountId(e.target.value)}
            className="bg-slate-950 border border-white/5 rounded-2xl px-4 py-2.5 text-xs text-neutral-300 font-medium cursor-pointer focus:outline-none focus:border-white/10"
          >
            <option value="all">Tous les comptes</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Type Filters */}
          <div className="flex bg-slate-950 border border-white/5 rounded-2xl p-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-all ${
                filterType === 'all' ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Tout
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-all ${
                filterType === 'expense' ? 'bg-rose-500/10 text-rose-400' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Dépenses
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-all ${
                filterType === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Revenus
            </button>
            {accounts.length > 1 && (
              <button
                onClick={() => setFilterType('transfer')}
                className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-all ${
                  filterType === 'transfer' ? 'bg-zinc-800 text-zinc-300' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Virements
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grouped list representation */}
      {Object.keys(groupedTransactions).length === 0 ? (
        <div className="backdrop-blur-xl bg-slate-950/20 border border-white/5 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-neutral-500 mx-auto mb-4">
            <LucideIcon name="Info" size={24} />
          </div>
          <h4 className="text-lg font-medium text-white">Aucune transaction trouvée</h4>
          <p className="text-sm text-neutral-400 max-w-sm mx-auto mt-1">Modifiez vos filtres ou ajoutez une nouvelle transaction en haut.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedTransactions).map((dateStr) => {
            const txs = groupedTransactions[dateStr];
            return (
              <div key={dateStr} className="space-y-3">
                {/* Date Header */}
                <h3 className="text-xs font-mono font-bold tracking-wider text-neutral-500 uppercase px-2">
                  {formatDateHeader(dateStr)}
                </h3>

                {/* Transactions on that date */}
                <div className="space-y-2">
                  {txs.map((tx) => {
                    const catMeta = CATEGORIES.find((c) => c.name === tx.category);
                    const sourceAcc = accounts.find((a) => a.id === tx.accountId);
                    const targetAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;

                    const isIncome = tx.type === 'income';
                    const isExpense = tx.type === 'expense';
                    const isTransfer = tx.type === 'transfer';

                    return (
                      <motion.div
                        layout
                        key={tx.id}
                        className="backdrop-blur-xl bg-slate-950/30 border border-white/2 outline-none rounded-2xl p-4 flex justify-between items-center group hover:bg-slate-950/50 hover:border-white/5 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Category symbol */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${catMeta?.color || '#cfd8dc'}15`,
                              color: catMeta?.color || '#90a4ae',
                            }}
                          >
                            <LucideIcon name={catMeta?.icon || 'PlusCircle'} size={18} />
                          </div>

                          {/* Transaction descriptions */}
                          <div className="min-w-0">
                            <h4 className="font-semibold text-white text-sm tracking-tight truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                              {tx.label}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 text-neutral-500 font-sans mt-0.5 text-[11px]">
                              <span className="text-neutral-400">{tx.category}</span>
                              <span>•</span>
                              {isTransfer ? (
                                <span className="flex items-center gap-1">
                                  <span className="text-neutral-300 font-medium">{sourceAcc?.name || 'Compte supprimé'}</span>
                                  <LucideIcon name="ChevronRight" size={10} className="text-neutral-600" />
                                  <span className="text-blue-400 font-medium">{targetAcc?.name || 'Compte supprimé'}</span>
                                </span>
                              ) : (
                                <span className="text-neutral-400">
                                  via <span className="text-neutral-300 font-medium">{sourceAcc?.name || 'Compte supprimé'}</span>
                                </span>
                              )}
                              {tx.description && (
                                <>
                                  <span>•</span>
                                  <span className="italic line-clamp-1 text-neutral-500 max-w-[120px] sm:max-w-none">{tx.description}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Cash value and Action delete */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right font-mono">
                            <span
                              className={`text-sm font-bold ${
                                isIncome
                                  ? 'text-emerald-400'
                                  : isExpense
                                  ? 'text-rose-400'
                                  : 'text-neutral-300'
                              }`}
                            >
                              {isIncome ? '+' : isExpense ? '-' : '~'}
                              {tx.amount.toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              €
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              if (confirm(`Voulez-vous supprimer la transaction "${tx.label}" ? Le solde des comptes impactés sera recalculé.`)) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            className="w-7 h-7 rounded-full bg-white/3 hover:bg-rose-600/20 text-neutral-500 hover:text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                            title="Supprimer la transaction"
                          >
                            <LucideIcon name="Trash2" size={13} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
