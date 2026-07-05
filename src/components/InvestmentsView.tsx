import React, { useState, useMemo } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, formatPercent, getCurrencySymbol } from "../lib/utils";
import { InvestmentType, Investment } from "../types";
import {
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Briefcase,
  PieChart as PieIcon,
  Trash,
  Edit2,
  Percent,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

export default function InvestmentsView() {
  const { investments, currency, addInvestment, editInvestment, deleteInvestment } = useFinance();

  // Allocation Colors
  const COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#22d3ee"];

  // Filter and forms
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"All" | InvestmentType>("All");

  // Form states
  const [investmentType, setInvestmentType] = useState<InvestmentType>("Stocks");
  const [investedAmount, setInvestedAmount] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("2026-07-05");

  const investmentTypes: InvestmentType[] = [
    "Stocks",
    "Mutual Funds",
    "Gold",
    "Cryptocurrency",
    "Fixed Deposit",
    "Real Estate",
  ];

  // Calculated summaries
  const stats = useMemo(() => {
    const totalInvested = investments.reduce((sum, item) => sum + item.investedAmount, 0);
    const totalCurrent = investments.reduce((sum, item) => sum + item.currentValue, 0);
    const diff = totalCurrent - totalInvested;
    const gainPercent = totalInvested > 0 ? (diff / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      diff,
      gainPercent,
    };
  }, [investments]);

  // Allocation chart data
  const allocationData = useMemo(() => {
    const map: { [key: string]: number } = {};
    investments.forEach((inv) => {
      map[inv.investmentType] = (map[inv.investmentType] || 0) + inv.currentValue;
    });

    return Object.keys(map).map((type) => ({
      name: type,
      value: map[type],
    }));
  }, [investments]);

  // Filtered investments
  const filteredInvestments = useMemo(() => {
    return investments.filter((inv) => filterType === "All" || inv.investmentType === filterType);
  }, [investments, filterType]);

  const resetForm = () => {
    setInvestmentType("Stocks");
    setInvestedAmount("");
    setCurrentValue("");
    setPurchaseDate("2026-07-05");
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invested = parseFloat(investedAmount);
    const current = parseFloat(currentValue);

    if (isNaN(invested) || invested <= 0) {
      alert("Please enter a valid invested amount.");
      return;
    }
    if (isNaN(current) || current < 0) {
      alert("Please enter a valid current valuation.");
      return;
    }

    try {
      if (editId) {
        await editInvestment(editId, {
          investmentType,
          investedAmount: invested,
          currentValue: current,
          purchaseDate,
        });
      } else {
        await addInvestment({
          investmentType,
          investedAmount: invested,
          currentValue: current,
          purchaseDate,
        });
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Failed saving portfolio entry:", err);
    }
  };

  const handleOpenEdit = (inv: Investment) => {
    setEditId(inv.id!);
    setInvestmentType(inv.investmentType);
    setInvestedAmount(inv.investedAmount.toString());
    setCurrentValue(inv.currentValue.toString());
    setPurchaseDate(inv.purchaseDate || "2026-07-05");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this portfolio asset?")) {
      try {
        await deleteInvestment(id);
      } catch (err) {
        console.error("Failed deleting portfolio asset:", err);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* LEFT 2 COLUMNS: list, filter, allocations */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Core summary card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="sm:border-r border-slate-800/60 pr-2">
            <p className="text-xs text-slate-400">Total Invested Principal</p>
            <h3 className="text-xl font-bold text-slate-100 mt-1">
              {formatCurrency(stats.totalInvested, currency)}
            </h3>
          </div>

          <div className="sm:border-r border-slate-800/60 sm:px-4">
            <p className="text-xs text-slate-400">Current Valuation</p>
            <h3 className="text-xl font-bold text-blue-400 mt-1">
              {formatCurrency(stats.totalCurrent, currency)}
            </h3>
          </div>

          <div className="sm:pl-4">
            <p className="text-xs text-slate-400">Profit / Loss (Yield)</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xl font-bold ${stats.diff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {formatCurrency(stats.diff, currency)}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                  stats.diff >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {formatPercent(stats.gainPercent)}
              </span>
            </div>
          </div>
        </div>

        {/* Filters and charts panel */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Allocation Breakdown Pie */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-lg">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-blue-400" />
                Asset Distribution
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Allocation by current valuation</p>
            </div>

            <div className="h-40 w-full relative flex items-center justify-center my-4">
              {allocationData.length === 0 ? (
                <div className="text-center text-xs text-slate-500">No assets tracked.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {allocationData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                        color: "#f8fafc",
                        fontSize: "12px",
                      }}
                      formatter={(v: any) => formatCurrency(v, currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {allocationData.map((item, idx) => (
                <div key={item.name} className="flex justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    {item.name}
                  </span>
                  <span className="font-mono text-slate-300 font-bold">
                    {Math.round((item.value / (stats.totalCurrent || 1)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* List panel */}
          <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                Asset Registry
              </h3>
              
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg text-[10px] p-1 px-2 text-slate-300 cursor-pointer outline-none focus:border-emerald-500"
              >
                <option value="All">All Types</option>
                {investmentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 flex-1">
              {filteredInvestments.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">No assets matched current filter.</div>
              ) : (
                filteredInvestments.map((inv) => {
                  const gain = inv.currentValue - inv.investedAmount;
                  const pct = inv.investedAmount > 0 ? (gain / inv.investedAmount) * 100 : 0;
                  return (
                    <div
                      key={inv.id}
                      className="p-3 bg-slate-950/40 border border-slate-800/40 rounded-2xl flex justify-between items-center hover:bg-slate-950 transition-colors"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{inv.investmentType}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">Purchased: {inv.purchaseDate}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Cost: {formatCurrency(inv.investedAmount, currency)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-200">{formatCurrency(inv.currentValue, currency)}</p>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold mt-1 ${
                            gain >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {gain >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {formatPercent(pct)}
                        </span>
                        
                        {/* Quick actions inline */}
                        <div className="flex justify-end gap-2 mt-1.5 opacity-40 hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(inv)}
                            className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                          >
                            Edit
                          </button>
                          <span className="text-[10px] text-slate-700">|</span>
                          <button
                            onClick={() => handleDelete(inv.id!)}
                            className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
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
        </div>
      </div>

      {/* RIGHT COLUMN: Builder panel */}
      <div>
        {showForm ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 p-1 bg-slate-950 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <Plus className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-slate-100">
                {editId ? "Edit Asset Asset" : "Record Portfolio Asset"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Asset Type</label>
                <select
                  value={investmentType}
                  onChange={(e) => setInvestmentType(e.target.value as InvestmentType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-200"
                >
                  {investmentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Invested Capital ({currency})</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-slate-500 font-mono font-bold">
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={investedAmount}
                    onChange={(e) => setInvestedAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Current Valuation ({currency})</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-slate-500 font-mono font-bold">
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Acquisition Date</label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-200 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                {editId ? "Update Valuation" : "Record Asset"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center py-8">
            <Briefcase className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-slate-200">Asset Valuation Tracker</h3>
            <p className="text-xs text-slate-400 max-w-[200px] mx-auto mt-2 leading-relaxed">
              Consolidate your Stocks, Mutual Funds, Cryptos, and Gold positions under ValueVault to inspect yield yields.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="mt-5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Add Portfolio Asset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
