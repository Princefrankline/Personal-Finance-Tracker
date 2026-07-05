import React, { useState, useMemo } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, getCurrencySymbol } from "../lib/utils";
import { EMI, BillReminder } from "../types";
import {
  Calendar,
  DollarSign,
  Plus,
  Trash,
  CheckCircle,
  Clock,
  Percent,
  TrendingDown,
  ChevronRight,
  Calculator,
  X,
} from "lucide-react";

export default function RemindersView() {
  const {
    emis,
    reminders,
    currency,
    addEMI,
    deleteEMI,
    addReminder,
    toggleReminderPaid,
    deleteReminder,
  } = useFinance();

  // Dialog togglers
  const [showBillForm, setShowBillForm] = useState(false);
  const [showEmiForm, setShowEmiForm] = useState(false);

  // Bill Form states
  const [billTitle, setBillTitle] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDueDate, setBillDueDate] = useState("2026-07-10");
  const [billCategory, setBillCategory] = useState("Bills");

  // EMI Calculator/Form states
  const [loanName, setLoanName] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenureMonths, setTenureMonths] = useState("");
  const [startDate, setStartDate] = useState("2026-07-01");

  // Local state EMI live preview
  const liveEmiPreview = useMemo(() => {
    const P = parseFloat(principalAmount);
    const annualR = parseFloat(interestRate);
    const N = parseInt(tenureMonths);

    if (isNaN(P) || P <= 0 || isNaN(annualR) || annualR < 0 || isNaN(N) || N <= 0) {
      return null;
    }

    const R = annualR / 12 / 100;
    if (R === 0) return Math.round(P / N);

    const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    return emi;
  }, [principalAmount, interestRate, tenureMonths]);

  // Combined calculations for stats
  const totals = useMemo(() => {
    const activeReminders = reminders.filter((r) => !r.paid);
    const totalPendingBills = activeReminders.reduce((sum, r) => sum + r.amount, 0);
    const totalMonthlyEmi = emis.reduce((sum, e) => sum + e.monthlyEmi, 0);

    return {
      totalPendingBills,
      totalMonthlyEmi,
      pendingCount: activeReminders.length,
    };
  }, [reminders, emis]);

  const handleSubmitBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(billAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid bill amount.");
      return;
    }

    try {
      await addReminder({
        title: billTitle,
        amount: amt,
        dueDate: billDueDate,
        category: billCategory,
        paid: false,
      });
      setBillTitle("");
      setBillAmount("");
      setShowBillForm(false);
    } catch (err) {
      console.error("Failed adding bill reminder:", err);
    }
  };

  const handleSubmitEMI = async (e: React.FormEvent) => {
    e.preventDefault();
    const P = parseFloat(principalAmount);
    const R = parseFloat(interestRate);
    const N = parseInt(tenureMonths);

    if (isNaN(P) || P <= 0 || isNaN(R) || R < 0 || isNaN(N) || N <= 0) {
      alert("Please provide valid numbers for all fields.");
      return;
    }

    const rMonthly = R / 12 / 100;
    const monthlyEmiVal =
      rMonthly === 0
        ? P / N
        : (P * rMonthly * Math.pow(1 + rMonthly, N)) / (Math.pow(1 + rMonthly, N) - 1);

    try {
      await addEMI({
        loanName,
        principalAmount: P,
        interestRate: R,
        tenureMonths: N,
        monthlyEmi: Math.round(monthlyEmiVal),
        startDate,
        remainingMonths: N,
      });

      setLoanName("");
      setPrincipalAmount("");
      setInterestRate("");
      setTenureMonths("");
      setShowEmiForm(false);
    } catch (err) {
      console.error("Failed adding EMI tracker:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* LEFT 2 COLUMNS: Bills and EMIs lists */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Summaries Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Monthly Bill Pending</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">
                {formatCurrency(totals.totalPendingBills, currency)}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                {totals.pendingCount} unpaid deadlines
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Monthly EMI Commitments</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">
                {formatCurrency(totals.totalMonthlyEmi, currency)}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                {emis.length} active loans
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Bill Reminders Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/60 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Bill Deadlines Calendar</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Recurring utilities and recurring checks</p>
            </div>
            <button
              onClick={() => {
                setShowBillForm(true);
                setShowEmiForm(false);
              }}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Schedule Bill
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {reminders.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                No scheduled bill reminders found. Create one to begin.
              </div>
            ) : (
              reminders.map((rem) => (
                <div
                  key={rem.id}
                  className={`flex items-center justify-between p-3.5 border rounded-2xl transition-all ${
                    rem.paid
                      ? "bg-slate-950/20 border-slate-900 opacity-60"
                      : "bg-slate-950/40 border-slate-800/50 hover:bg-slate-950"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <input
                      type="checkbox"
                      checked={rem.paid}
                      onChange={() => toggleReminderPaid(rem.id)}
                      className="w-4 h-4 text-emerald-500 border-slate-700 bg-slate-950 rounded focus:ring-emerald-500 focus:ring-opacity-25 accent-emerald-500 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold ${rem.paid ? "line-through text-slate-500" : "text-slate-200"}`}>
                        {rem.title}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" /> Due: {rem.dueDate}
                        <span className="text-slate-700">|</span> Category: {rem.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-xs font-bold font-mono ${rem.paid ? "text-slate-500" : "text-slate-200"}`}>
                      {formatCurrency(rem.amount, currency)}
                    </span>
                    <button
                      onClick={() => deleteReminder(rem.id)}
                      className="text-slate-600 hover:text-rose-400 p-1 bg-slate-900 rounded hover:bg-slate-850 cursor-pointer transition-colors"
                      title="Delete Reminder"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* EMI Loans Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/60 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">EMI & Amortized Loans</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Automated interest calculation schedules</p>
            </div>
            <button
              onClick={() => {
                setShowEmiForm(true);
                setShowBillForm(false);
              }}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Initialize Loan
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {emis.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 font-sans">
                No active EMIs tracked. Launch a loan setup above to start.
              </div>
            ) : (
              emis.map((emi) => (
                <div
                  key={emi.id}
                  className="p-4 bg-slate-950/40 border border-slate-800/50 hover:bg-slate-950 rounded-2xl flex flex-col justify-between hover:border-slate-700/60 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{emi.loanName}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <Percent className="w-3 h-3" /> Rate: {emi.interestRate}% APR
                        <span className="text-slate-700">|</span> Tenure: {emi.tenureMonths} Months
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-200">{formatCurrency(emi.monthlyEmi, currency)}</p>
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 font-bold px-1.5 py-0.5 rounded uppercase mt-1 inline-block font-mono">
                        Monthly EMI
                      </span>
                    </div>
                  </div>

                  {/* Loan Details bar */}
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-slate-800/40 pt-2.5 mt-1.5">
                    <span>Principal: {formatCurrency(emi.principalAmount, currency)}</span>
                    <span>Start: {emi.startDate}</span>
                    <button
                      onClick={() => deleteEMI(emi.id)}
                      className="text-slate-500 hover:text-rose-400 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Builder Modals */}
      <div className="space-y-4">
        {/* Bill Creator form */}
        {showBillForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <button
              onClick={() => setShowBillForm(false)}
              className="absolute top-4 right-4 p-1 bg-slate-950 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-slate-100">Schedule Bill</h3>
            </div>

            <form onSubmit={handleSubmitBill} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Bill Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electric Utility bill"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-200"
                />
              </div>

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
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Due Date</label>
                <input
                  type="date"
                  required
                  value={billDueDate}
                  onChange={(e) => setBillDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-200 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Category</label>
                <select
                  value={billCategory}
                  onChange={(e) => setBillCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-200"
                >
                  <option value="Bills">Bills</option>
                  <option value="Rent">Rent</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                Schedule Bill
              </button>
            </form>
          </div>
        )}

        {/* EMI Creator form */}
        {showEmiForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <button
              onClick={() => setShowEmiForm(false)}
              className="absolute top-4 right-4 p-1 bg-slate-950 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-semibold text-slate-100">Initialize Loan EMI</h3>
            </div>

            <form onSubmit={handleSubmitEMI} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Loan/Debt Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Car Loan"
                  value={loanName}
                  onChange={(e) => setLoanName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Principal Amount ({currency})</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Interest % (APR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 5.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-100 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Tenure (Months)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 36"
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Loan Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-slate-200 font-mono"
                />
              </div>

              {/* Math preview */}
              {liveEmiPreview !== null && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Expected Monthly EMI</p>
                  <p className="text-base font-bold text-emerald-400 mt-1 font-mono">
                    {formatCurrency(Math.round(liveEmiPreview), currency)}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/10"
              >
                Track Loan Amortization
              </button>
            </form>
          </div>
        )}

        {!showBillForm && !showEmiForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center py-8">
            <Calculator className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-slate-200">Liability Setup Panel</h3>
            <p className="text-xs text-slate-400 max-w-[200px] mx-auto mt-2 leading-relaxed">
              Plan scheduled billings and amortize personal debts to see precisely how much cash flow is bound each month.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
