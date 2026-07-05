import React, { useState, useMemo } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, getCurrencySymbol } from "../lib/utils";
import { IncomeCategory, ExpenseCategory, Income, Expense } from "../types";
import {
  Plus,
  Search,
  Filter,
  Trash,
  Edit2,
  TrendingUp,
  TrendingDown,
  Calendar,
  X,
  PlusCircle,
  HelpCircle,
  Repeat,
} from "lucide-react";

export default function TransactionsView() {
  const {
    incomes,
    expenses,
    currency,
    addIncome,
    editIncome,
    deleteIncome,
    addExpense,
    editExpense,
    deleteExpense,
  } = useFinance();

  // Navigation and Filter state
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Add/Edit panels
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [editId, setEditId] = useState<string | null>(null);

  // Form State
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("2026-07-05");
  const [description, setDescription] = useState("");
  const [recurring, setRecurring] = useState(false);

  const categories = useMemo(() => {
    return {
      income: ["Salary", "Freelancing", "Business", "Investments", "Other"],
      expense: [
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
      ],
    };
  }, []);

  // Set default category when toggling form type
  React.useEffect(() => {
    if (!editId) {
      setCategory(formType === "income" ? "Salary" : "Food");
    }
  }, [formType, editId]);

  // Combined ledger list sorted by date descending
  const ledger = useMemo(() => {
    const list = [
      ...incomes.map((item) => ({ ...item, type: "income" as const })),
      ...expenses.map((item) => ({ ...item, type: "expense" as const })),
    ];
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [incomes, expenses]);

  // Filtered list
  const filteredLedger = useMemo(() => {
    return ledger.filter((item) => {
      // 1. Type filter
      if (filterType !== "all" && item.type !== filterType) return false;
      
      // 2. Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;

      // 3. Search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = item.description?.toLowerCase().includes(query);
        const catMatch = item.category?.toLowerCase().includes(query);
        if (!descMatch && !catMatch) return false;
      }

      return true;
    });
  }, [ledger, filterType, selectedCategory, searchQuery]);

  const resetForm = () => {
    setAmount("");
    setCategory(formType === "income" ? "Salary" : "Food");
    setDate("2026-07-05");
    setDescription("");
    setRecurring(false);
    setEditId(null);
  };

  const handleOpenAdd = (type: "income" | "expense") => {
    setFormType(type);
    resetForm();
    setShowAddForm(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditId(item.id);
    setFormType(item.type);
    setAmount(item.amount.toString());
    setCategory(item.category);
    setDate(item.date);
    setDescription(item.description);
    setRecurring(!!item.recurring);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }

    try {
      if (editId) {
        if (formType === "income") {
          await editIncome(editId, {
            category: category as IncomeCategory,
            amount: numAmount,
            date,
            description,
            recurring,
          });
        } else {
          await editExpense(editId, {
            category: category as ExpenseCategory,
            amount: numAmount,
            date,
            description,
            recurring,
          });
        }
      } else {
        if (formType === "income") {
          await addIncome({
            category: category as IncomeCategory,
            amount: numAmount,
            date,
            description,
            recurring,
          });
        } else {
          await addExpense({
            category: category as ExpenseCategory,
            amount: numAmount,
            date,
            description,
            recurring,
          });
        }
      }
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      console.error("Failed saving transaction record:", err);
    }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete this ${item.type} record?`)) {
      try {
        if (item.type === "income") {
          await deleteIncome(item.id);
        } else {
          await deleteExpense(item.id);
        }
      } catch (err) {
        console.error("Failed deleting transaction record:", err);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* LEFT 2 COLUMNS: Ledger Register & Filters */}
      <div className="xl:col-span-2 space-y-4">
        
        {/* Upper Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg">
          {/* Tabs */}
          <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl">
            <button
              onClick={() => {
                setFilterType("all");
                setSelectedCategory("all");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                filterType === "all" ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Ledgers
            </button>
            <button
              onClick={() => {
                setFilterType("income");
                setSelectedCategory("all");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                filterType === "income"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              Inflow
            </button>
            <button
              onClick={() => {
                setFilterType("expense");
                setSelectedCategory("all");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                filterType === "expense" ? "bg-rose-500/15 text-rose-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              Outflow
            </button>
          </div>

          {/* Quick Creator buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAdd("income")}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Income
            </button>
            <button
              onClick={() => handleOpenAdd("expense")}
              className="flex-1 sm:flex-none px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-rose-500/10"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Expense
            </button>
          </div>
        </div>

        {/* Detailed Filters & Search */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by description or category name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-slate-200"
            />
          </div>

          <div className="relative w-full md:w-48">
            <Filter className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-slate-300 appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {filterType !== "expense" &&
                categories.income.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              {filterType !== "income" &&
                categories.expense.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800/60 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-100">Ledger Statement</h3>
            <span className="text-xs text-slate-500 font-mono">
              Filtered: {filteredLedger.length} items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 bg-slate-950/20">
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                      No transaction logs match current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-600" />
                          {item.date}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-300">{item.category}</td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-[180px] truncate">
                        <span className="flex items-center gap-1.5">
                          {item.description || "—"}
                          {item.recurring && (
                            <Repeat className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" title="Recurring Payment" />
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                            item.type === "income"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold font-mono ${
                          item.type === "income" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {item.type === "income" ? "+" : "-"}
                        {formatCurrency(item.amount, currency)}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 bg-slate-850 hover:bg-red-950/40 text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Add/Edit Pane */}
      <div className="space-y-4">
        {showAddForm ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 p-1 bg-slate-950 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <PlusCircle className={`w-5 h-5 ${formType === "income" ? "text-emerald-400" : "text-rose-400"}`} />
              <h3 className="text-base font-semibold text-slate-100">
                {editId ? `Edit ${formType}` : `Add New ${formType}`}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Amount ({currency})</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-slate-500 font-mono font-bold">
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-200"
                >
                  {formType === "income"
                    ? categories.income.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))
                    : categories.expense.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Transaction Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-200 font-mono"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Description / Merchant</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Groceries Shop"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-200"
                />
              </div>

              {/* Recurring Switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Recurring Transaction</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Repeat monthly cashflow automatically</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 focus:ring-opacity-25 accent-emerald-500"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  {editId ? "Update Entry" : "Record Entry"}
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center py-12">
            <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-slate-200">Interactive Inspector</h3>
            <p className="text-xs text-slate-400 max-w-[200px] mx-auto mt-2 leading-relaxed">
              Select any transaction edit icon or create a new entry on the left to activate this editor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
