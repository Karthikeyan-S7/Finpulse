import { useMemo } from 'react';

/**
 * Custom Hook: useFinancialAnalytics
 * Evaluates income, expenses, net cash flow, savings rate, burn velocity,
 * category distribution, budget status, and 3-month trailing averages.
 */
export function useFinancialAnalytics(transactions = [], budgets = []) {
  return useMemo(() => {
    let income = 0;
    let expenses = 0;
    const categoryTotals = {};
    const historicalCategoryTotals = {}; // transactions in prior 90 days

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based
    const currentDay = Math.max(1, now.getDate());

    // 90 days ago cutoff for trailing 3-month average calculation
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    transactions.forEach((tx) => {
      // Exclude transfers and opening balances
      if (tx.isTransfer || tx.category === 'Transfer' || tx.merchant === 'Opening Balance') {
        return;
      }

      const amount = Number(tx.amount) || 0;
      const txDate = tx.transactionDate ? new Date(tx.transactionDate) : null;
      const isCurrentMonth = txDate && txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;

      if (tx.transactionType === 'INCOME') {
        if (isCurrentMonth || !txDate) {
          income += amount;
        }
      } else if (tx.transactionType === 'EXPENSE') {
        if (isCurrentMonth || !txDate) {
          expenses += amount;
          categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amount;
        }

        // Tally historical for 3-month trailing suggestions
        if (txDate && txDate >= ninetyDaysAgo && !isCurrentMonth) {
          historicalCategoryTotals[tx.category] = (historicalCategoryTotals[tx.category] || 0) + amount;
        }
      }
    });

    const netCashFlow = income - expenses;
    const rawSavingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const savingsRate = Math.round(Math.max(-100, Math.min(100, rawSavingsRate)) * 10) / 10;
    const averageDailyBurn = Math.round((expenses / currentDay) * 100) / 100;

    // Budget health & status calculation
    const budgetStatus = budgets.map((b) => {
      const spent = categoryTotals[b.category] || 0;
      const limit = Number(b.monthlyLimit) || 1;
      const remaining = limit - spent;
      const percentUsed = Math.round((spent / limit) * 100);

      let status = 'OK';
      if (percentUsed > 100) {
        status = 'OVER';
      } else if (percentUsed >= 80) {
        status = 'WARNING';
      }

      return {
        id: b.id,
        category: b.category,
        monthlyLimit: limit,
        limit,
        spent,
        remaining,
        percentUsed,
        status,
        isWarning: percentUsed >= 80,
      };
    });

    // Suggested limits (3-month trailing monthly average per category)
    const suggestedLimits = {};
    for (const [cat, histTotal] of Object.entries(historicalCategoryTotals)) {
      suggestedLimits[cat] = Math.round(histTotal / 3.0);
    }

    // Category distribution for charts
    const categoryDistribution = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: expenses > 0 ? Math.round((amount / expenses) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      income,
      expenses,
      netCashFlow,
      savingsRate,
      averageDailyBurn,
      dailyBurnRate: averageDailyBurn, // backward-compatibility alias
      totalIncome: income,             // backward-compatibility alias
      totalExpense: expenses,          // backward-compatibility alias
      netRevenue: income,              // backward-compatibility alias
      netSavings: netCashFlow,         // backward-compatibility alias
      categoryTotals,
      categoryDistribution,
      budgetStatus,
      budgetAlerts: budgetStatus.filter((b) => b.isWarning), // backward-compatibility alias
      suggestedLimits,
    };
  }, [transactions, budgets]);
}
