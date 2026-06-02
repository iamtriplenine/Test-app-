import React, { useState } from 'react';
import { Debt, Account, DebtType } from '../types';
import { LucideIcon } from './LucideIcon';
import { motion, AnimatePresence } from 'motion/react';

interface DebtsTabProps {
  debts: Debt[];
  accounts: Account[];
  onAddDebt: (contactName: string, type: DebtType, totalAmount: number, title: string, dueDate?: string) => void;
  onAddDebtPayment: (debtId: string, amount: number, accountId: string) => void;
  onDeleteDebt: (id: string) => void;
}

export function DebtsTab({ debts, accounts, onAddDebt, onAddDebtPayment, onDeleteDebt }: DebtsTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'owed_by_me' | 'owed_to_me'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Custom states for creating new Debt
  const [contactName, setContactName] = useState('');
  const [type, setType] = useState<DebtType>('owed_by_me');
  const [totalAmount, setTotalAmount] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  // States for making a partial payment
  const [payModalDebt, setPayModalDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');

  // Auto-fill first account when opening payment modal
  React.useEffect(() => {
    if (payModalDebt && accounts.length > 0 && !paymentAccountId) {
      setPaymentAccountId(accounts[0].id);
    }
  }, [payModalDebt, accounts, paymentAccountId]);

  const handleSubmitDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(totalAmount) || 0;
    if (!contactName.trim() || amountVal <= 0 || !title.trim()) return;

    onAddDebt(contactName, type, amountVal, title, dueDate || undefined);

    // Reset Form
    setContactName('');
    setTotalAmount('');
    setTitle('');
    setDueDate('');
    setShowAddForm(false);
  };

  const handleDebtPaymentAndClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalDebt) return;
    const payVal = parseFloat(paymentAmount) || 0;
    if (payVal <= 0 || !paymentAccountId) return;

    onAddDebtPayment(payModalDebt.id, payVal, paymentAccountId);

    // Reset payment states
    setPayModalDebt(null);
    setPaymentAmount('');
    setPaymentAccountId('');
  };

  const filteredDebts = debts.filter((d) => {
    if (filterType === 'all') return true;
    return d.type === filterType;
  });

  return (
    <div id="debts-tab-root" className="space-y-6">
      {/* Header section with filter actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Dettes & Créances</h2>
          <p className="text-sm text-neutral-400">Suivez l'argent emprunté, prêté et les remboursements</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {/* Filters */}
          <div className="flex bg-slate-900 border border-white/5 rounded-full p-1 text-xs font-medium grow md:grow-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                filterType === 'all' ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterType('owed_by_me')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                filterType === 'owed_by_me' ? 'bg-white/10 text-rose-400' : 'text-neutral-400 hover:text-rose-400'
              }`}
            >
              Mes Dettes
            </button>
            <button
              onClick={() => setFilterType('owed_to_me')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                filterType === 'owed_to_me' ? 'bg-white/10 text-emerald-400' : 'text-neutral-400 hover:text-emerald-400'
              }`}
            >
              Mes Créances
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-sm px-4 py-2.5 rounded-full shadow-lg shadow-orange-500/20 hover:brightness-110 active:brightness-95 transition-all duration-300 cursor-pointer text-nowrap"
          >
            {showAddForm ? (
              <>
                <LucideIcon name="X" size={16} /> Fermer
              </>
            ) : (
              <>
                <LucideIcon name="Plus" size={16} /> Enregistrer Dettes
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Accordion form for adding debt */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              Nouvel Engagement de Dette / Prêt
            </h3>

            <form onSubmit={handleSubmitDebt} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Nature de la Dette</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('owed_by_me')}
                    className={`flex items-center justify-center gap-2 py-3 border rounded-xl text-sm font-medium transition-all ${
                      type === 'owed_by_me'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                        : 'border-white/5 bg-slate-950/30 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Je dois de l'argent (Dette)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('owed_to_me')}
                    className={`flex items-center justify-center gap-2 py-3 border rounded-xl text-sm font-medium transition-all ${
                      type === 'owed_to_me'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/5 bg-slate-950/30 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    On me doit de l'argent (Prêt)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Nom du Contact</label>
                <input
                  type="text"
                  placeholder="Sophie, Thomas, Airbnb..."
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Titre / Raison</label>
                <input
                  type="text"
                  placeholder="e.g. Courses de vacances, Prêt Console, Facture électricité"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Montant Initial (€)</label>
                <input
                  type="number"
                  placeholder="150.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  required
                  min="0.01"
                  step="any"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Date d'échéance (Optionnel)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all cursor-pointer"
                />
              </div>

              <div className="flex items-end justify-end">
                <button
                  type="submit"
                  className="bg-white text-slate-950 hover:bg-neutral-200 active:bg-neutral-300 font-medium text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition w-full md:w-auto"
                >
                  <LucideIcon name="Check" size={16} /> Enregistrer l'Engagement
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of active / settled debts */}
      {filteredDebts.length === 0 ? (
        <div className="backdrop-blur-xl bg-slate-950/20 border border-white/5 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-neutral-500 mx-auto mb-4 border border-white/5">
            <LucideIcon name="Info" size={24} />
          </div>
          <h4 className="text-lg font-medium text-white">Aucune dette ou créance</h4>
          <p className="text-sm text-neutral-400 max-w-sm mx-auto mt-1">Vous n'avez pas d'autres engagements d'argent enregistrés sous cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDebts.map((d, index) => {
            const paid = d.totalAmount - d.remainingAmount;
            const progressPercent = (paid / d.totalAmount) * 100;
            const isOwedByMe = d.type === 'owed_by_me';
            const isSettled = d.status === 'settled' || d.remainingAmount === 0;

            return (
              <motion.div
                layout
                key={d.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`backdrop-blur-xl bg-slate-950/40 border ${
                  isSettled ? 'border-neutral-500/20 opacity-70' : isOwedByMe ? 'border-rose-500/10' : 'border-emerald-500/10'
                } rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300`}
              >
                {/* Background glow highlights */}
                <div
                  className={`absolute -right-16 -top-16 w-32 h-32 rounded-full blur-[50px] pointer-events-none transition-all duration-300 ${
                    isSettled ? 'bg-neutral-500/5' : isOwedByMe ? 'bg-rose-500/5' : 'bg-emerald-500/5'
                  }`}
                />

                {/* Card Top */}
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                          isSettled
                            ? 'bg-zinc-800 text-zinc-400'
                            : isOwedByMe
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                      >
                        {isSettled ? 'Remboursé' : isOwedByMe ? 'Dette (Je dois)' : 'Créance (On me doit)'}
                      </span>
                      {d.dueDate && !isSettled && (
                        <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-mono">
                          <LucideIcon name="Calendar" size={11} /> Échéance: {new Date(d.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-white tracking-tight text-lg leading-snug line-clamp-1">{d.title}</h4>
                    <p className="text-xs text-neutral-400 flex items-center gap-1">
                      <LucideIcon name="User" size={12} className="opacity-60" /> {isOwedByMe ? 'À rembourser à' : 'Prêté à'}{' '}
                      <strong className="text-white font-medium">{d.contactName}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Voulez-vous supprimer cette dette/créance ? Les remboursements déjà enregistrés n'auront plus de pivot.`)) {
                        onDeleteDebt(d.id);
                      }
                    }}
                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-rose-600/20 text-neutral-400 hover:text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                    title="Supprimer la dette"
                  >
                    <LucideIcon name="Trash2" size={13} />
                  </button>
                </div>

                {/* Amount tracking section */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 my-4 text-center">
                  <div>
                    <span className="text-[9px] font-mono text-neutral-500 uppercase block">Total</span>
                    <span className="text-sm font-semibold text-white">{d.totalAmount.toFixed(2)} €</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-neutral-500 uppercase block">Remboursé</span>
                    <span className="text-sm font-semibold text-neutral-400">{paid.toFixed(2)} €</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-neutral-500 uppercase block">Reste</span>
                    <span className={`text-sm font-bold ${isSettled ? 'text-zinc-500' : isOwedByMe ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {d.remainingAmount.toFixed(2)} €
                    </span>
                  </div>
                </div>

                {/* Progress bar repay progress */}
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>Progression du remboursement</span>
                    <span>{progressPercent.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                        isSettled
                          ? 'from-zinc-600 to-zinc-500'
                          : isOwedByMe
                          ? 'from-rose-500 to-amber-500'
                          : 'from-emerald-500 to-teal-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Action for logging payments */}
                {!isSettled && accounts.length > 0 && (
                  <div className="mt-5 pt-1.5">
                    <button
                      onClick={() => setPayModalDebt(d)}
                      className={`w-full py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 border-[1.5px] transition cursor-pointer ${
                        isOwedByMe
                          ? 'border-rose-500/20 bg-rose-500/5 text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/30'
                          : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                      }`}
                    >
                      <LucideIcon name="RefreshCcw" size={13} />
                      Enregistrer un remboursement
                    </button>
                  </div>
                )}

                {/* Listing of historical payments internally on this debt */}
                {d.payments && d.payments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Historique des versements</span>
                    <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 no-scrollbar text-xs">
                      {d.payments.map((p) => {
                        const targetAcc = accounts.find((a) => a.id === p.accountId);
                        return (
                          <div key={p.id} className="flex justify-between items-center text-[11px] bg-slate-950/20 px-2.5 py-1.5 rounded-lg border border-white/5">
                            <span className="text-neutral-400 font-mono">
                              {new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-neutral-500 truncate max-w-[120px] font-sans">
                              via <span className="text-white font-medium">{targetAcc?.name || 'Inconnu'}</span>
                            </span>
                            <span className={`font-mono font-semibold ${isOwedByMe ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {isOwedByMe ? '-' : '+'}{p.amount.toFixed(2)} €
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Repay Modal pop up */}
      <AnimatePresence>
        {payModalDebt && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setPayModalDebt(null)}
                className="absolute right-4 top-4 text-neutral-400 hover:text-white"
              >
                <LucideIcon name="X" size={18} />
              </button>

              <h3 className="text-lg font-semibold text-white mb-2">Enregistrer un versement</h3>
              <p className="text-xs text-neutral-400 mb-5">
                Remboursement vers Sophie, Thomas ou Autre sur l'engagement : <strong className="text-white">{payModalDebt.title}</strong>{' '}
                ({payModalDebt.contactName}). Reste dû : <strong>{payModalDebt.remainingAmount.toFixed(2)} €</strong>.
              </p>

              <form onSubmit={handleDebtPaymentAndClose} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Compte affecté</label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 cursor-pointer"
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id} className="bg-slate-950 text-white">
                        {a.name} (Solde : {a.balance.toFixed(2)} €)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">Montant du Paiement (€)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 transition-all"
                    required
                    max={payModalDebt.remainingAmount}
                    min="0.01"
                  />
                  <div className="flex justify-between pt-0.5">
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(payModalDebt.remainingAmount.toString())}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      Payer la totalité ({payModalDebt.remainingAmount.toFixed(2)} €)
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPayModalDebt(null)}
                    className="px-4 py-2 text-neutral-400 hover:text-white font-medium text-xs rounded-xl"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-white text-slate-950 hover:bg-neutral-200 active:bg-neutral-300 px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-lg transition"
                  >
                    <LucideIcon name="Check" size={14} /> Valider le remboursement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
