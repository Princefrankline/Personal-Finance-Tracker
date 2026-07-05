import React from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, getCurrencySymbol } from "../lib/utils";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  FileText,
  Download,
  CheckCircle,
  HelpCircle,
  Activity,
} from "lucide-react";

export default function InsightsView() {
  const {
    incomes,
    expenses,
    budgets,
    savings,
    investments,
    currency,
    aiSuggestions,
    aiLoading,
    fetchAISuggestions,
  } = useFinance();

  // Export full ledger statement to CSV
  const handleExportCSV = () => {
    try {
      const headers = "Date,Ledger Type,Category,Description,Amount\n";
      
      const rowsIn = incomes
        .map(
          (item) =>
            `"${item.date}","Income","${item.category}","${(item.description || "").replace(/"/g, '""')}",${item.amount}`
        )
        .join("\n");

      const rowsOut = expenses
        .map(
          (item) =>
            `"${item.date}","Expense","${item.category}","${(item.description || "").replace(/"/g, '""')}",${item.amount}`
        )
        .join("\n");

      const csvContent = headers + rowsIn + (rowsIn && rowsOut ? "\n" : "") + rowsOut;
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ValueVault_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("CSV Export error:", err);
      alert("Failed exporting CSV sheet. Try verifying entry characters.");
    }
  };

  // Generate a printer-friendly monthly report window
  const handlePrintReport = () => {
    const totalIn = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalOut = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalSavings = savings.reduce((sum, g) => sum + g.savedAmount, 0);
    const totalPortfolio = investments.reduce((sum, i) => sum + i.currentValue, 0);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocked! Enable popups to download/print reports.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>ValueVault - Executive Financial Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; }
            .header { border-b: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            h1 { margin: 0; color: #0f172a; font-size: 24px; }
            .meta { font-size: 12px; color: #64748b; font-family: monospace; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
            .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
            .stat-val { font-size: 18px; font-weight: bold; margin-top: 5px; color: #0f172a; }
            .section { margin-bottom: 30px; }
            h2 { font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; color: #0f172a; }
            p { font-size: 13px; line-height: 1.6; color: #334155; }
            table { w-full: 100%; width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { text-align: left; font-size: 11px; color: #64748b; border-bottom: 2px solid #e2e8f0; padding: 8px 4px; }
            td { font-size: 12px; border-bottom: 1px solid #f1f5f9; padding: 10px 4px; }
            .right { text-align: right; }
            .green { color: #10b981; font-weight: bold; }
            .red { color: #f43f5e; font-weight: bold; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>ValueVault Executive Report</h1>
              <span class="meta">Compiled on: ${new Date().toLocaleDateString()} | Active Vault Scope</span>
            </div>
            <button class="no-print" onclick="window.print()" style="padding: 10px 15px; background: #0f172a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
              Print / Save PDF
            </button>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">All-time cash inflow</div>
              <div class="stat-val">${getCurrencySymbol(currency)}${totalIn.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">All-time cash outflow</div>
              <div class="stat-val">${getCurrencySymbol(currency)}${totalOut.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Savings reserves</div>
              <div class="stat-val">${getCurrencySymbol(currency)}${totalSavings.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Portfolio assets</div>
              <div class="stat-val">${getCurrencySymbol(currency)}${totalPortfolio.toFixed(2)}</div>
            </div>
          </div>

          <div class="section">
            <h2>AI Smart Advisor Assessment</h2>
            <p>${aiSuggestions?.healthAssessment || "Insufficient account data. Please record more entries."}</p>
          </div>

          <div class="section">
            <h2>Monthly Statement Summary</h2>
            <p>${aiSuggestions?.monthlyReportAnalysis || "No general summary available. Log transactions to compile stats."}</p>
          </div>

          <div class="section" style="page-break-before: always;">
            <h2>Recent Transactions Ledger</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th class="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${[
                  ...incomes.map((x) => ({ ...x, type: "Income" })),
                  ...expenses.map((x) => ({ ...x, type: "Expense" })),
                ]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 15)
                  .map(
                    (tx) => `
                  <tr>
                    <td>${tx.date}</td>
                    <td>${tx.type}</td>
                    <td>${tx.category}</td>
                    <td>${tx.description || "—"}</td>
                    <td class="right ${tx.type === "Income" ? "green" : "red"}">
                      ${tx.type === "Income" ? "+" : "-"}${getCurrencySymbol(currency)}${tx.amount.toFixed(2)}
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            AI Financial Advisor
          </h1>
          <p className="text-xs text-slate-400 mt-1">Smart planning insights backed by Gemini 3.5 Flash</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchAISuggestions}
            disabled={aiLoading}
            className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl hover:text-white cursor-pointer transition-colors disabled:opacity-40"
            title="Refresh Advisor Analysis"
          >
            <RefreshCw className={`w-4 h-4 ${aiLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-400" /> Export CSV
          </button>

          <button
            onClick={handlePrintReport}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
          >
            <FileText className="w-4 h-4 stroke-[2.5]" /> Executive Report
          </button>
        </div>
      </div>

      {/* Main double panel columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Suggestions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-100 mb-5">Actionable Advisor Bulletins</h3>

            {aiLoading ? (
              <div className="text-center py-20 text-xs text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p>Generating smart portfolio suggestions and scores...</p>
              </div>
            ) : !aiSuggestions ? (
              <div className="text-center py-16 text-xs text-slate-500">
                Record more entries and trigger a manual compile above.
              </div>
            ) : (
              <div className="space-y-4">
                {aiSuggestions.suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 border rounded-2xl flex items-start gap-3.5 transition-all ${
                      item.type === "warning"
                        ? "bg-rose-500/5 border-rose-500/10 text-rose-400"
                        : item.type === "opportunity"
                        ? "bg-blue-500/5 border-blue-500/10 text-blue-400"
                        : "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    <div className="mt-1 shrink-0">
                      {item.type === "warning" ? (
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      ) : item.type === "opportunity" ? (
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Lightbulb className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1.5">{item.message}</p>
                      <span className="inline-block mt-3 text-[9px] font-bold uppercase font-mono tracking-wider text-slate-500">
                        Category: {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Vigor Index & report context cards */}
        <div className="space-y-6">
          
          {/* Index meter card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-slate-100 mb-5 w-full text-left">Financial Vigor Index</h3>

            <div className="relative w-36 h-36 flex items-center justify-center my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-850"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400 transition-all duration-700"
                  strokeWidth="3"
                  strokeDasharray={`${aiSuggestions?.financialHealthScore || 70}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-100 font-mono">
                  {aiSuggestions?.financialHealthScore || 70}
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">SCORE</span>
              </div>
            </div>

            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider font-mono">
                <CheckCircle className="w-3.5 h-3.5" /> Stable Posture
              </span>
            </div>
          </div>

          {/* General Report assessment text */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Advisor Assessment
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-slate-950/40 border border-slate-800/40 rounded-2xl">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Overview</h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  {aiSuggestions?.healthAssessment || "Track more incomes to let Gemini formulate a profile."}
                </p>
              </div>

              <div className="p-4 bg-slate-950/40 border border-slate-800/40 rounded-2xl">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Ledger surplus</h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  {aiSuggestions?.monthlyReportAnalysis || "Inflow ratios must be tracked to compute surplus values."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
