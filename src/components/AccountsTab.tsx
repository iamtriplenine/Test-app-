import React, { useState } from 'react';
import { Account, AccountType } from '../types';
import { LucideIcon } from './LucideIcon';
import { motion, AnimatePresence } from 'motion/react';

interface AccountsTabProps {
  accounts: Account[];
  onAddAccount: (name: string, type: AccountType, balance: number, color: string) => void;
  onDeleteAccount: (id: string) => void;
  transactionsCount: Record<string, number>;
}

const GRADIENTS = [
  { name: 'Bleu Cosmique', value: 'from-blue-600 to-indigo-600 shadow-blue-500/20' },
  { name: 'Vert Émeraude', value: 'from-emerald-500 to-teal-600 shadow-emerald-500/20' },
  { name: 'Mandarine Solaire', value: 'from-amber-500 to-orange-500 shadow-amber-500/20' },
  { name: 'Néon Violet', value: 'from-purple-600 to-fuchsia-600 shadow-purple-500/20' },
  { name: 'Flamant Rose', value: 'from-rose-500 to-pink-600 shadow-rose-500/20' },
  { name: 'Gris Sidéral', value: 'from-zinc-700 to-zinc-900 shadow-zinc-500/10' },
];

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: string }[] = [
  { type: 'courant', label: 'Compte Courant', icon: 'CreditCard' },
  { type: 'epargne', label: 'Compte d\'Épargne', icon: 'PiggyBank' },
  { type: 'especes', label: 'Espèces / Portefeuille', icon: 'Coins' },
  { type: 'carte', label: 'Carte de Crédit', icon: 'Wallet' },
  { type: 'autre', label: 'Autre Actif', icon: 'Hexagon' },
];

export function AccountsTab({ accounts, onAddAccount, onDeleteAccount, transactionsCount }: AccountsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('courant');
  const [balance, setBalance] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const initialBal = parseFloat(balance) || 0;
    onAddAccount(name, type, initialBal, selectedGradient);
    setName('');
    setType('courant');
    setBalance('');
    setSelectedGradient(GRADIENTS[0].value);
    setShowAddForm(false);
  };

  return (
    <div id="accounts-tab-root" className="space-y-6">
      {/* Tab Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Vos Comptes</h2>
          <p className="text-sm text-neutral-400">Gérez vos banques, portefeuilles et liquidités</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium text-sm px-4 py-2.5 rounded-full shadow-lg shadow-indigo-500/20 hover:brightness-110 active:brightness-95 transition-all duration-300"
        >
          {showAddForm ? (
            <>
              <LucideIcon name="X" size={16} /> Fermer
            </>
          ) : (
            <>
              <LucideIcon name="Plus" size={16} /> Ajouter un Compte
            </>
          )}
        </motion.button>
      </div>

      {/* Slide Transition for Creating New Account */}
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
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              Nouveau Compte Financier
            </h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Nom du Compte</label>
                <input
                  type="text"
                  placeholder="e.g. Compte Courant Principal, Revolut"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Solde Initial (€)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 text-white text-sm rounded-xl px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Type de Compte</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {ACCOUNT_TYPES.map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setType(t.type)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                        type === t.type
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-white/5 bg-slate-950/30 text-neutral-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <LucideIcon name={t.icon} size={18} />
                      <span className="text-[10px] font-medium leading-tight">{t.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Thème Visuel</label>
                <div className="flex flex-wrap gap-2.5">
                  {GRADIENTS.map((g) => (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() => setSelectedGradient(g.value)}
                      title={g.name}
                      className={`w-10 h-10 rounded-xl bg-gradient-to-r ${g.value.split(' ').slice(0,2).join(' ')} relative transition-all duration-300 hover:scale-105 ${
                        selectedGradient === g.value
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {selectedGradient === g.value && (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <LucideIcon name="Check" size={16} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-white text-slate-950 hover:bg-neutral-200 active:bg-neutral-300 font-medium text-sm px-6 py-2.5 rounded-full flex items-center gap-2 transition"
                >
                  <LucideIcon name="Check" size={16} /> Créer le Compte
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Accounts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {accounts.map((acc, index) => {
          const mainType = ACCOUNT_TYPES.find((t) => t.type === acc.type);
          const hasTxs = (transactionsCount[acc.id] || 0) > 0;

          return (
            <motion.div
              layout
              key={acc.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-gradient-to-br ${acc.color} rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-48 group hover:-translate-y-1 transition-all duration-300`}
            >
              {/* Glassmorphic fluid bubble accents internally */}
              <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-white/10 blur-2xl group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-28 h-28 rounded-full bg-white/5 blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

              {/* Card top */}
              <div className="flex justify-between items-start z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                    <LucideIcon name={mainType?.icon || 'CreditCard'} size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white tracking-snug drop-shadow-sm line-clamp-1">{acc.name}</h4>
                    <span className="text-[10px] font-mono text-white/75 bg-white/10 px-2 py-0.5 rounded-full">{mainType?.label}</span>
                  </div>
                </div>

                {/* Delete button only if there isn't active dependencies */}
                <button
                  onClick={() => {
                    if (confirm(`Voulez-vous supprimer le compte "${acc.name}" ? Les transactions liées perdront leur affectation de compte.`)) {
                      onDeleteAccount(acc.id);
                    }
                  }}
                  className="w-7 h-7 rounded-full bg-black/15 hover:bg-rose-600/30 text-white/50 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                  title="Supprimer le compte"
                >
                  <LucideIcon name="Trash2" size={14} />
                </button>
              </div>

              {/* Card bottom */}
              <div className="z-10 mt-auto">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/70">Solde Actuel</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-bold tracking-tight">
                    {acc.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-lg font-semibold text-white/80">€</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
