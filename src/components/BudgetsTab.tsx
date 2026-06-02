import React, { useState } from 'react';
import { Budget, CATEGORIES, Transaction } from '../types';
import { LucideIcon } from './LucideIcon';
import { motion, AnimatePresence } from 'motion/react';

interface BudgetsTabProps {
  budgets: Budget[];
  transactions: Transaction[];
  onAddBudget: (category: string, limit: number, color: string) => void;
  onDeleteBudget: (id: string) => void;
}

export function BudgetsTab({ budgets, transactions, onAddBudget, onDeleteBudget }: BudgetsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [limit, setLimit] = useState('');

  // Get current month string (YYYY-MM)
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  // Compute total spending for each category during the current month
  const categorySpending = React.useMemo(() => {
    const spendingMap: Record<string, number> = {};
    
    // Initialize with 0 for existing budgets
    budgets.forEach(b => {
      spendingMap[b.category] = 0;
    });

    transactions.forEach(tx => {
      // only count expenses, specific to the current month
      if (tx.type === 'expense' && tx.date.startsWith(currentMonthStr)) {
        spendingMap[tx.category] = (spendingMap[tx.category] || 0) + tx.amount;
      }
    });

    return spendingMap;
  }, [transactions, budgets, currentMonthStr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lValue = parseFloat(limit) || 0;
    if (lValue <= 0) return;

    // Retrieve target category metadata color
    const catMeta = CATEGORIES.find(c => c.name === category);
    const color = catMeta?.color || '#3b82f6';

    onAddBudget(category, lValue, color);
    setLimit('');
    setShowAddForm(false);
  };

  // Find remaining categories that don't have a budget yet
  const availableCategoriesForBudget = CATEGORIES.filter(
    cat => cat.name !== 'Salaire & Revenus' && cat.name !== 'Transfert' && !budgets.some(b => b.category === cat.name)
  );

  return (
    <div id="budgets-tab-root" className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Suivi des Budgets</h2>
          <p className="text-sm text-neutral-400">Limitez vos dépenses mensuelles par catégorie</p>
        </div>
        
        {availableCategoriesForBudget.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium text-sm px-4 py-2.5 rounded-full shadow-lg shadow-purple-500/20 hover:brightness-110 active:brightness-95 transition-all duration-300"
          >
            {showAddForm ? (
              <>
                <LucideIcon name="X" size={16} /> Fermer
              </>
            ) : (
              <>
                <LucideIcon name="Plus" size={16} /> Créer un Budget
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Accordion slide budget form */}
      <AnimatePresence>
        {showAddForm && availableCategoriesForBudget.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
              Nouveau Budget Mensuel
            </h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Catégorie cible</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
                >
                  {availableCategoriesForBudget.map((cat) => (
                    <option key={cat.name} value={cat.name} className="bg-slate-950 text-white">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Limite Mensuelle (€)</label>
                <input
                  type="number"
                  placeholder="200"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  required
                  min="1"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-white text-slate-950 hover:bg-neutral-200 active:bg-neutral-300 font-medium text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <LucideIcon name="Check" size={16} /> Allouer le Budget
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Budgets */}
      {budgets.length === 0 ? (
        <div className="backdrop-blur-xl bg-slate-950/20 border border-white/5 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 mx-auto mb-4">
            <LucideIcon name="Sparkles" size={28} />
          </div>
          <h4 className="text-lg font-medium text-white">Aucun budget défini</h4>
          <p className="text-sm text-neutral-400 max-w-sm mx-auto mt-1 mb-6">Set category benchmarks to visually cap expenditures and stack savings.</p>
          {availableCategoriesForBudget.length > 0 && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium text-xs px-4 py-2.5 rounded-full hover:bg-purple-500/20 transition"
            >
              Créer votre premier budget
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((b, index) => {
            const spent = categorySpending[b.category] || 0;
            const percentage = b.limit > 0 ? (spent / b.limit) * 100 : 0;
            const remaining = Math.max(0, b.limit - spent);
            const isOver = spent > b.limit;

            // Define coloring based on percentage
            let statusColor = 'from-emerald-500 to-teal-500 shadow-emerald-500/20';
            let glowColor = 'rgba(16,185,129,0.3)';
            let textColor = 'text-emerald-400';
            let progressBg = 'bg-emerald-500/10';

            if (percentage >= 70 && percentage < 100) {
              statusColor = 'from-amber-400 to-orange-500 shadow-amber-500/20';
              glowColor = 'rgba(245,158,11,0.3)';
              textColor = 'text-amber-400';
              progressBg = 'bg-amber-400/10';
            } else if (percentage >= 100) {
              statusColor = 'from-rose-500 to-red-600 shadow-rose-500/25';
              glowColor = 'rgba(239,68,68,0.4)';
              textColor = 'text-rose-500';
              progressBg = 'bg-rose-500/10';
            }

            const catMeta = CATEGORIES.find(c => c.name === b.category);

            return (
              <motion.div
                layout
                key={b.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="backdrop-blur-xl bg-slate-950/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300"
              >
                {/* Micro glow behind */}
                <div
                  className="absolute -right-20 -bottom-20 w-40 h-40 rounded-full blur-[60px] pointer-events-none transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${b.color}15` }}
                />

                {/* Card Top */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: `${b.color}20`, color: b.color }}
                    >
                      <LucideIcon name={catMeta?.icon || 'ShoppingBag'} size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white tracking-tight">{b.category}</h4>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Ce mois-ci</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono px-2.5 py-1 rounded-full ${progressBg} ${textColor} border-0`}>
                      {percentage.toFixed(0)}%
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Voulez-vous supprimer le budget pour "${b.category}" ?`)) {
                          onDeleteBudget(b.id);
                        }
                      }}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-rose-600/20 text-neutral-400 hover:text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                      title="Supprimer le budget"
                    >
                      <LucideIcon name="Trash2" size={13} />
                    </button>
                  </div>
                </div>

                {/* Progress bar info */}
                <div className="flex justify-between items-baseline mb-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">Dépensé</span>
                    <p className="text-lg font-semibold text-white">
                      {spent.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">Plafond</span>
                    <p className="text-sm font-medium text-neutral-300">
                      {b.limit.toLocaleString('fr-FR')} €
                    </p>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden relative">
                  <div
                    className={`absolute left-0 top-0 h-full bg-gradient-to-r ${statusColor} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>

                {/* Bottom state labels */}
                <div className="flex justify-between items-center mt-3 text-[11px] font-mono text-neutral-400">
                  {isOver ? (
                    <span className="text-rose-400 flex items-center gap-1">
                      <LucideIcon name="AlertCircle" size={12} /> Dépassé de {(spent - b.limit).toFixed(2)} €
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <LucideIcon name="CheckCircle2" size={12} /> Économise encore {remaining.toFixed(2)} €
                    </span>
                  )}
                  <span className="opacity-65">Reste: {remaining.toFixed(2)} €</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
