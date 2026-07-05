export type IncomeCategory = "Salary" | "Freelancing" | "Business" | "Investments" | "Other";

export type ExpenseCategory =
  | "Food"
  | "Transport"
  | "Shopping"
  | "Rent"
  | "EMI"
  | "Entertainment"
  | "Education"
  | "Healthcare"
  | "Bills"
  | "Other";

export type InvestmentType = "Stocks" | "Mutual Funds" | "Gold" | "Cryptocurrency" | "Fixed Deposit" | "Real Estate";

export interface Income {
  id?: string;
  userId: string;
  category: IncomeCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  recurring?: boolean;
}

export interface Expense {
  id?: string;
  userId: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  recurring?: boolean;
}

export interface Budget {
  id?: string;
  userId: string;
  category: string; // can be "Total" or any ExpenseCategory
  limit: number;
  month: string; // YYYY-MM
}

export interface Saving {
  id?: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string; // YYYY-MM-DD
}

export interface Investment {
  id?: string;
  userId: string;
  investmentType: InvestmentType;
  investedAmount: number;
  currentValue: number;
  purchaseDate: string; // YYYY-MM-DD
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  preferredCurrency: string;
  createdAt: string;
}

export interface AISuggestionItem {
  type: "warning" | "opportunity" | "tip";
  category: "budget" | "saving" | "investment" | "general";
  title: string;
  message: string;
}

export interface AISuggestions {
  financialHealthScore: number;
  healthAssessment: string;
  suggestions: AISuggestionItem[];
  monthlyReportAnalysis: string;
}

export interface EMI {
  id: string;
  userId: string;
  loanName: string;
  principalAmount: number;
  interestRate: number; // percentage
  tenureMonths: number;
  monthlyEmi: number;
  startDate: string;
  remainingMonths: number;
}

export interface BillReminder {
  id: string;
  userId: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  category: string;
  paid: boolean;
}
