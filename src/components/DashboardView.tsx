import React, { useMemo } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency } from "../lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Briefcase,
  Activity,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardView({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const {
    incomes,
    expenses,
    savings,
    investments,
    currency,
    aiSuggestions,
    reminders,
    toggleReminderPaid,
  } = useFinance();

  // Current Month Anchor (July 2026)
  const currentMonthStr = "2026-07";

  // Calculate stats
  const totals = useMemo(() => {
    const totalIn = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalOut = expenses.reduce((sum, item) => sum + item.amount, 0);
    
    // Current month calculations
    const curMonthIn = incomes
      .filter((item) => item.date.startsWith(currentMonthStr))
      .reduce((sum, item) => sum + item.amount, 0);

    const curMonthOut = expenses
      .filter((item) => item.date.startsWith(currentMonthStr))
      .reduce((sum, item) => sum + item.amount, 0);

    const totalSaved = savings.reduce((sum, goal) => sum + goal.savedAmount, 0);
    
    const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
    const currentInvestmentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);

    return {
      netWorth: totalIn - totalOut + currentInvestmentValue,
      totalIncome: totalIn,
      totalExpense: totalOut,
      monthlyIncome: curMonthIn,
      monthlyExpense: curMonthOut,
      totalSavings: totalSaved,
      investedAmount: totalInvested,
      investmentCurrentValue: currentInvestmentValue,
    };
  }, [incomes, expenses, savings, investments]);

  // Chart 1: Income vs Expense by Month (last 6 months)
  const monthlyChartData = useMemo(() => {
    const months = ["2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"];
    return months.map((m) => {
      const monthIn = incomes
        .filter((item) => item.date.startsWith(m))
        .reduce((sum, item) => sum + item.amount, 0);
      const monthOut = expenses
        .filter((item) => item.date.startsWith(m))
        .reduce((sum, item) => sum + item.amount, 0);
      
      const label = new Date(m + "-02").toLocaleString("default", {
        month: "short",
      });
      return {
        name: label,
        Income: monthIn,
        Expenses: monthOut,
      };
    });
  }, [incomes, expenses]);

  // Chart 2: Category Expense Breakdown
  const expenseCategoryData = useMemo(() => {
    const breakdown: { [key: string]: number } = {};
    expenses
      .filter((item) => item.date.startsWith(currentMonthStr))
      .forEach((item) => {
        breakdown[item.category] = (breakdown[item.category] || 0) + item.amount;
      });

    return Object.keys(breakdown).map((cat) => ({
      name: cat,
      value: breakdown[cat],
    }));
  }, [expenses]);

  const COLORS = [
    "#34d399", // Emerald
    "#60a5fa", // Blue
    "#f472b6", // Pink
    "#fb7185", // Rose
    "#fbbf24", // Amber
    "#a78bfa", // Purple
    "#22d3ee", // Cyan
    "#fb923c", // Orange
    "#94a3b8", // Slate
    "#818cf8", // Indigo
  ];

  // Combined Recent Transactions
  const recentTransactions = useMemo(() => {
    const combined = [
      ...incomes.map((item) => ({ ...item, type: "income" as const })),
      ...expenses.map((item) => ({ ...item, type: "expense" as const })),
    ];
    // Sort descending by date
    return combined.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [incomes, expenses]);

  // Pending Bill Reminders for next 7 days
  const pendingBills = useMemo(() => {
    return reminders.filter((r) => !r.paid).slice(0, 3);
  }, [reminders]);

  return (
    <div className="space-y-6">
      {/* Upper Panel Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Financial Command Center</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time balances and visual insights for July 2026</p>
        </div>
        
        {/* Quick Sync Card */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 px-4">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-slate-300 text-xs font-mono">FIRESTORE SYNC: ONLINE</span>
        </div>
      </div>

      {/* Financial Overview Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition-opacity">
            <DollarSign className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-xs font-medium text-slate-400">Net Asset Worth</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">{formatCurrency(totals.netWorth, currency)}</h3>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Includes portfolio & cash balance</span>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition-opacity">
            <TrendingUp className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-xs font-medium text-slate-400">Monthly Inflow (July)</p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(totals.monthlyIncome, currency)}</h3>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-400">
            <span className="text-slate-500 font-mono">Total All-Time: {formatCurrency(totals.totalIncome, currency)}</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition-opacity">
            <TrendingDown className="w-16 h-16 text-rose-400" />
          </div>
          <p className="text-xs font-medium text-slate-400">Monthly Outflow (July)</p>
          <h3 className="text-2xl font-bold text-rose-400 mt-1">{formatCurrency(totals.monthlyExpense, currency)}</h3>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-400">
            <span className="text-slate-500 font-mono">Total All-Time: {formatCurrency(totals.totalExpense, currency)}</span>
          </div>
        </div>

        {/* Investments Value */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition-opacity">
            <Briefcase className="w-16 h-16 text-blue-500" />
          </div>
          <p className="text-xs font-medium text-slate-400">Investment Portfolio</p>
          <h3 className="text-2xl font-bold text-blue-400 mt-1">
            {formatCurrency(totals.investmentCurrentValue, currency)}
          </h3>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-400">
            <span className="text-blue-500/80 font-semibold">
              Profit/Loss:{" "}
              {formatCurrency(totals.investmentCurrentValue - totals.investedAmount, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts & Advisor Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income vs Expense Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-slate-100">Inflow vs Outflow History</h2>
            <span className="text-xs text-slate-400">6-Month Trend</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", marginTop: "10px" }} />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Expense Share Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-100">Category-wise Outlays</h2>
            <p className="text-slate-400 text-xs mt-0.5">July 2026 expense shares</p>
          </div>
          
          <div className="h-48 w-full flex items-center justify-center relative">
            {expenseCategoryData.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-12">No expenses logged for this month.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                    formatter={(value: any) => formatCurrency(value, currency)}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Center Label */}
            {expenseCategoryData.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Outflow</span>
                <span className="text-sm font-bold text-slate-100">
                  {formatCurrency(totals.monthlyExpense, currency)}
                </span>
              </div>
            )}
          </div>

          {/* Custom Legends Grid */}
          <div className="grid grid-cols-2 gap-2 mt-4 max-h-24 overflow-y-auto pr-1">
            {expenseCategoryData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-400 truncate max-w-[80px]">{entry.name}</span>
                <span className="text-slate-200 ml-auto font-medium font-mono">
                  {Math.round((entry.value / (totals.monthlyExpense || 1)) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Double Column Row: Transactions & AI Advisor Health Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Recent Ledger Activity</h2>
              <p className="text-slate-400 text-xs mt-0.5">Real-time ledger updates</p>
            </div>
            <button
              onClick={() => setActiveTab("transactions")}
              className="text-xs text-emerald-400 hover:underline cursor-pointer"
            >
              Manage Ledger
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 text-xs font-medium text-slate-400">
                  <th className="py-3 px-1">Date</th>
                  <th className="py-3 px-1">Category</th>
                  <th className="py-3 px-1">Description</th>
                  <th className="py-3 px-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-slate-500">
                      No transactions found. Add income or expenses to begin.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx, idx) => (
                    <tr key={tx.id || idx} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 px-1 font-mono text-xs text-slate-400">{tx.date}</td>
                      <td className="py-3.5 px-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            tx.type === "income"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-1 text-slate-300 max-w-[150px] truncate">{tx.description || "—"}</td>
                      <td
                        className={`py-3.5 px-1 text-right font-semibold font-mono ${
                          tx.type === "income" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount, currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Financial Health Score Ring & Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-100">Financial Vigor Index</h2>
              <span className="p-1 px-2.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-wider uppercase font-mono">
                AI Insight
              </span>
            </div>

            {/* Score circle */}
            <div className="flex items-center gap-6 py-2 border-b border-slate-800/60 pb-5 mb-5">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  {/* Gray background circle */}
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Progress circle colored */}
                  <path
                    className="text-emerald-400 transition-all duration-500"
                    strokeWidth="3.5"
                    strokeDasharray={`${aiSuggestions?.financialHealthScore || 70}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-100 font-mono">
                    {aiSuggestions?.financialHealthScore || 70}
                  </span>
                  <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">Score</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-200">
                  {aiSuggestions && aiSuggestions.financialHealthScore >= 80
                    ? "Excellent Health"
                    : aiSuggestions && aiSuggestions.financialHealthScore >= 60
                    ? "Healthy Stature"
                    : "Needs Rebalancing"}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-3">
                  {aiSuggestions?.healthAssessment ||
                    "Add more incomes and expenses to activate real-time advisor assessments and scores."}
                </p>
              </div>
            </div>

            {/* Quick Bill Reminder Checkbox List */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Deadlines</h4>
              
              {pendingBills.length === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-slate-950/40 rounded-2xl border border-slate-800/40 text-xs text-slate-500">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>All upcoming bills cleared!</span>
                </div>
              ) : (
                pendingBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-3 bg-slate-950/40 rounded-2xl border border-slate-800/40 hover:bg-slate-950 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={bill.paid}
                        onChange={() => toggleReminderPaid(bill.id)}
                        className="w-4 h-4 text-emerald-500 border-slate-700 bg-slate-950 rounded focus:ring-emerald-500 focus:ring-opacity-25 accent-emerald-500"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{bill.title}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          Due: {bill.dueDate}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-300">
                      {formatCurrency(bill.amount, currency)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab("insights")}
            className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Analyze Advisor Reports
          </button>
        </div>
      </div>
    </div>
  );
}
