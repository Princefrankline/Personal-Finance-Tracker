import React, { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, getCurrencySymbol } from "../lib/utils";
import { Saving } from "../types";
import {
  Plus,
  X,
  Target,
  PiggyBank,
  TrendingUp,
  Calendar,
  Trash,
  PlusCircle,
} from "lucide-react";

export default function SavingsView() {
  const { savings, currency, addSaving, editSaving, deleteSaving } = useFinance();

  // Dialog / Edit modes
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [deadline, setDeadline] = useState("2026-12-31");

  // Contribution popup state
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");

  const resetForm = () => {
    setGoalName("");
    setTargetAmount("");
    setSavedAmount("");
    setDeadline("2026-12-31");
    setEditId(null);
  };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(targetAmount);
    const savedVal = parseFloat(savedAmount || "0");

    if (isNaN(targetVal) || targetVal <= 0) {
      alert("Please enter a valid target amount.");
      return;
    }
    if (isNaN(savedVal) || savedVal < 0) {
      alert("Please enter a valid saved amount.");
      return;
    }

    try {
      if (editId) {
        await editSaving(editId, {
          goalName,
          targetAmount: targetVal,
          savedAmount: savedVal,
          deadline,
        });
      } else {
        await addSaving({
          goalName,
          targetAmount: targetVal,
          savedAmount: savedVal,
          deadline,
        });
      }
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      console.error("Failed storing saving goal:", err);
    }
  };

  const handleOpenEdit = (goal: Saving) => {
    setEditId(goal.id!);
    setGoalName(goal.goalName);
    setTargetAmount(goal.targetAmount.toString());
    setSavedAmount(goal.savedAmount.toString());
    setDeadline(goal.deadline || "2026-12-31");
    setShowAddForm(true);
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm("Are you sure you want to delete this savings goal?")) {
      try {
        await deleteSaving(id);
      } catch (err) {
        console.error("Failed deleting saving goal:", err);
      }
    }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionGoalId) return;
    const value = parseFloat(contributionAmount);
    if (isNaN(value) || value <= 0) {
      alert("Please enter a valid deposit amount.");
      return;
    }

    const goal = savings.find((s) => s.id === contributionGoalId);
    if (!goal) return;

    try {
      const nextSaved = goal.savedAmount + value;
      await editSaving(contributionGoalId, {
        savedAmount: Math.min(nextSaved, goal.targetAmount),
      });
      setContributionGoalId(null);
      setContributionAmount("");
    } catch (err) {
      console.error("Failed updating saved contribution:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* LEFT 2 COLUMNS: savings list */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Statistics panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <PiggyBank className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Savings Reserves</p>
              <h2 className="text-2xl font-bold text-slate-100 mt-1">
                {formatCurrency(
                  savings.reduce((sum, g) => sum + g.savedAmount, 0),
                  currency
                )}
              </h2>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-xs text-slate-400">Target Cumulative</p>
            <h3 className="text-lg font-semibold text-slate-300 mt-1">
              {formatCurrency(
                savings.reduce((sum, g) => sum + g.targetAmount, 0),
                currency
              )}
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              Aggregate Savings Health:{" "}
              {Math.round(
                (savings.reduce((sum, g) => sum + g.savedAmount, 0) /
                  (savings.reduce((sum, g) => sum + g.targetAmount, 0) || 1)) *
                  100
              )}
              % Completed
            </span>
          </div>
        </div>

        {/* Goals cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savings.length === 0 ? (
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
              No saving goals established. Setup a target fund on the right to start!
            </div>
          ) : (
            savings.map((g) => {
              const percent = Math.min(Math.round((g.savedAmount / g.targetAmount) * 100), 100);
              return (
                <div
                  key={g.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Goal Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">{g.goalName}</h3>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          Target: {g.deadline || "—"}
                        </p>
                      </div>

                      <span className="text-xs bg-slate-950 px-2.5 py-1 rounded-xl text-emerald-400 font-bold font-mono">
                        {percent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 mb-4">
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>{formatCurrency(g.savedAmount, currency)} saved</span>
                        <span>{formatCurrency(g.targetAmount, currency)} target</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-slate-800/40 pt-3 mt-3">
                    <button
                      onClick={() => setContributionGoalId(g.id!)}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-emerald-400 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      + Top Up
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(g)}
                        className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        Edit
                      </button>
                      <span className="text-slate-800">|</span>
                      <button
                        onClick={() => handleDeleteGoal(g.id!)}
                        className="text-xs text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Goal builder & Contribution Modals */}
      <div className="space-y-4">
        {/* Quick Deposit contribution block */}
        {contributionGoalId && (
          <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden animate-fade-in">
            <button
              onClick={() => setContributionGoalId(null)}
              className="absolute top-4 right-4 p-1 bg-slate-950 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-5">
              <PiggyBank className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-slate-100">Deposit Savings</h3>
            </div>

            <form onSubmit={handleAddContribution} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Contribution Amount ({currency})</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-slate-500 font-mono font-bold">
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  Deposit Funds
                </button>
                <button
                  type="button"
                  onClick={() => setContributionGoalId(null)}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Create / Edit Goal panel */}
        {showAddForm ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 p-1 bg-slate-950 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-slate-100">
                {editId ? "Edit Savings Goal" : "Create Saving Goal"}
              </h3>
            </div>

            <form onSubmit={handleSubmitGoal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Macbook Pro"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Target Amount ({currency})</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-slate-500 font-mono font-bold">
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Initial Saved Amount ({currency})</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-slate-500 font-mono font-bold">
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={savedAmount}
                    onChange={(e) => setSavedAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Goal Target Deadline</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-200 font-mono"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  {editId ? "Update Goal" : "Create Goal"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center py-8">
            <PlusCircle className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-slate-200">Establish Target</h3>
            <p className="text-xs text-slate-400 max-w-[200px] mx-auto mt-2 leading-relaxed">
              Plan and fund custom milestones. Track your achievements securely with real-time status rings.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="mt-5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Establish Savings Target
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
