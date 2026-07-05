import React, { useState, useMemo } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, getCurrencySymbol } from "../lib/utils";
import { Budget } from "../types";
import {
  Plus,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  Percent,
  X,
  Target,
} from "lucide-react";

export default function BudgetView() {
  const { expenses, budgets, currency, addBudget, deleteBudget } = useFinance();

  const currentMonthStr = "2026-07";

  // Category select options
  const categories = [
    "Food",
    "Transport",
    "Shopping",
    "Rent",
    "EMI",
    "Entertainment",
    "Education",
    "Healthcare",
    "Bills",
    "Other",
  ];

  // Forms
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState("Food");
  const [limit, setLimit] = useState("");

  // Calculate actual spending in current month YYYY-MM
  const spentByCategory = useMemo(() => {
    const map: { [key: string]: number } = {};
    expenses
      .filter((e) => e.date.startsWith(currentMonthStr))
      .forEach((e) => {
        map[e.category] = (map[e.category] || 0) + e.amount;
      });
    return map;
  }, [expenses]);

  // Merge budgets with spent amounts
  const budgetStatusList = useMemo(() => {
    const list = budgets
      .filter((b) => b.month === currentMonthStr)
      .map((b) => {
        const spent = spentByCategory[b.category] || 0;
        const percent = Math.min(Math.round((spent / b.limit) * 100), 999);
        const remaining = b.limit - spent;
        return {
          ...b,
          spent,
          percent,
          remaining,
          status: spent > b.limit ? "exceeded" : spent >= b.limit * 0.8 ? "warning" : "ok",
        };
      });

    // Add unbudgeted categories that had expenses
    Object.keys(spentByCategory).forEach((cat) => {
      const alreadyIncluded = list.some((x) => x.category === cat);
      if (!alreadyIncluded) {
        const spent = spentByCategory[cat];
        list.push({
          id: `unb_${cat}`,
          category: cat,
          limit: 0,
          month: currentMonthStr,
          spent,
          percent: 100,
          remaining: -spent,
          status: "unbudgeted",
        });
      }
    });

    return list;
  }, [budgets, spentByCategory]);

  // Overall budget progress
  const totalBudgetStats = useMemo(() => {
    const activeBudgets = budgets.filter((b) => b.month === currentMonthStr);
    const totalLimit = activeBudgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpentInBudgetedCategories = activeBudgets.reduce(
      (sum, b) => sum + (spentByCategory[b.category] || 0),
      0
    );
    const totalSpentAll = Object.keys(spentByCategory).reduce(
      (sum, key) => sum + (spentByCategory[key] || 0),
      0
    );

    const percent = totalLimit > 0 ? Math.round((totalSpentInBudgetedCategories / totalLimit) * 100) : 0;

    return {
      totalLimit,
      totalSpentBudgeted: totalSpentInBudgetedCategories,
      totalSpentAll,
      percent,
    };
  }, [budgets, spentByCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseFloat(limit);
    if (isNaN(numLimit) || numLimit <= 0) {
      alert("Please enter a valid budget limit.");
      return;
    }

    try {
      await addBudget({
        category,
        limit: numLimit,
        month: currentMonthStr,
      });
      setShowAddForm(false);
      setLimit("");
    } catch (err) {
      console.error("Error setting budget limit:", err);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (id.startsWith("unb_")) return;
    if (confirm("Are you sure you want to delete this category budget limit?")) {
      try {
        await deleteBudget(id);
      } catch (err) {
        console.error("Error deleting budget:", err);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* LEFT 2 COLUMNS: Current status */}
      <div className="xl:col-span-2 space-y-6">
        {/* Total Month Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div>
              <span className="text-[10px] bg-slate-950 px-2 py-1 rounded-md text-emerald-400 font-bold font-mono">
                JULY 2026 STATUS
              </span>
              <h2 className="text-lg font-bold text-slate-100 mt-2">Consolidated Monthly Cap</h2>
            </div>
            <div className="text-right sm:text-right">
              <p className="text-xs text-slate-400">Total Spent Across Budgeted Items</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">
                {formatCurrency(totalBudgetStats.totalSpentBudgeted, currency)}
                <span className="text-xs font-normal text-slate-500 font-mono">
                  {" "}
                  / {formatCurrency(totalBudgetStats.totalLimit, currency)}
                </span>
              </h3>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totalBudgetStats.percent > 100
                    ? "bg-rose-500"
                    : totalBudgetStats.percent >= 80
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }`}
                style={{ width: `${Math.min(totalBudgetStats.percent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{totalBudgetStats.percent}% Limit Expended</span>
              <span>
                Remaining:{" "}
                {formatCurrency(Math.max(0, totalBudgetStats.totalLimit - totalBudgetStats.totalSpentBudgeted), currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Category Limits */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
            <h3 className="text-sm font-semibold text-slate-100">Category Budgets Statement</h3>
            <span className="text-xs text-slate-500">Current Month (July 2026)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetStatusList.map((b) => (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border transition-all ${
                  b.status === "exceeded"
                    ? "bg-red-500/5 border-red-500/20"
                    : b.status === "warning"
                    ? "bg-amber-500/5 border-amber-500/20"
                    : b.status === "unbudgeted"
                    ? "bg-slate-950/40 border-slate-800/40 opacity-75"
                    : "bg-slate-950/20 border-slate-800/60"
                }`}
              >
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{b.category}</h4>
                    {b.status === "unbudgeted" ? (
                      <p className="text-[10px] text-slate-500 mt-1">No limit defined</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        Limit: {formatCurrency(b.limit, currency)}
                      </p>
                    )}
                  </div>

                  {b.status === "exceeded" ? (
                    <span className="flex items-center gap-1 bg-rose-500/10 text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3" /> Exceeded
                    </span>
                  ) : b.status === "warning" ? (
                    <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3" /> Near Limit
                    </span>
                  ) : b.status === "unbudgeted" ? (
                    <button
                      onClick={() => {
                        setCategory(b.category);
                        setShowAddForm(true);
                      }}
                      className="text-[9px] bg-slate-800 hover:bg-slate-700 hover:text-white font-bold text-slate-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Set Limit
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <CheckCircle className="w-3 h-3" /> Healthy
                    </span>
                  )}
                </div>

                {/* Spent stat line */}
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5 font-mono">
                  <span className="text-slate-400 text-[11px]">Spent: {formatCurrency(b.spent, currency)}</span>
                  {b.status !== "unbudgeted" && (
                    <span className={b.remaining < 0 ? "text-rose-400" : "text-slate-400"}>
                      {b.remaining < 0 ? "-" : ""}
                      {formatCurrency(Math.abs(b.remaining), currency)} {b.remaining < 0 ? "Over" : "Left"}
                    </span>
                  )}
                </div>

                {/* Progress Mini Bar */}
                {b.status !== "unbudgeted" && (
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-950">
                    <div
                      className={`h-full rounded-full ${
                        b.status === "exceeded"
                          ? "bg-rose-500"
                          : b.status === "warning"
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                      style={{ width: `${Math.min(b.percent, 100)}%` }}
                    />
                  </div>
                )}

                {/* Delete Budget option */}
                {b.status !== "unbudgeted" && (
                  <div className="flex justify-end mt-2.5 pt-2 border-t border-slate-800/30">
                    <button
                      onClick={() => handleDeleteBudget(b.id!)}
                      className="text-[10px] text-slate-500 hover:text-rose-400 cursor-pointer"
                    >
                      Delete Limit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Budget Planner Creator */}
      <div>
        {showAddForm ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 p-1 bg-slate-950 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-slate-100">Configure Limit</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-200"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Monthly Spending Limit ({currency})</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-slate-500 font-mono font-bold">
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                Establish Limit
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center py-8">
            <Target className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-slate-200">Budget Limit Setup</h3>
            <p className="text-xs text-slate-400 max-w-[200px] mx-auto mt-2 leading-relaxed">
              Define a cap for any category. ValueVault will alert you immediately once category spent goes past 80%.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Configure Category Cap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
