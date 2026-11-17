import React, { useState, useMemo } from 'react';
import { DonutChart } from './charts/DonutChart';
import { LineAreaChart } from './charts/LineAreaChart';
import { BarChart } from './charts/BarChart';
import { SegmentedControl } from './ui/SegmentedControl';

/**
 * CanvasChart: Dual-mode interactive chart visualizer for Dashboard overview.
 * Allows toggling between Category Donut, Daily Spending Curve, and Cashflow Bar Chart.
 */
export function CanvasChart({
  data = [],
  transactions = [],
  cashflow = [],
  height = 260,
  defaultMode = 'donut',
}) {
  const [mode, setMode] = useState(defaultMode);

  // Normalize category distribution for DonutChart
  const donutData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((d) => ({
      name: d.name || d.category || 'Other',
      amount: Number(d.amount ?? d.totalAmount ?? 0),
    }));
  }, [data]);

  // Transform transactions into daily spending trend points for LineAreaChart
  const trendData = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      // Graceful sample curve if transactions not yet populated
      return [
        { date: 'Day 1', value: 2500 },
        { date: 'Day 5', value: 4800 },
        { date: 'Day 10', value: 11200 },
        { date: 'Day 15', value: 16500 },
        { date: 'Day 20', value: 24000 },
        { date: 'Day 25', value: 29500 },
        { date: 'Day 30', value: 34200 },
      ];
    }

    // Group settled expenses by date
    const dailyMap = {};
    const sorted = [...transactions]
      .filter((t) => t.transactionType === 'EXPENSE' && !t.isTransfer && t.category !== 'Opening Balance')
      .sort((a, b) => (a.transactionDate || '').localeCompare(b.transactionDate || ''));

    sorted.forEach((t) => {
      const d = t.transactionDate || 'Recent';
      dailyMap[d] = (dailyMap[d] || 0) + Number(t.amount || 0);
    });

    const dates = Object.keys(dailyMap).sort();
    if (dates.length === 0) return [];

    let cumulative = 0;
    return dates.map((d) => {
      cumulative += dailyMap[d];
      const shortDate = d.length >= 10 ? d.slice(5) : d;
      return {
        date: d,
        label: shortDate,
        value: cumulative,
      };
    });
  }, [transactions]);

  // Cashflow data for BarChart
  const barData = useMemo(() => {
    if (Array.isArray(cashflow) && cashflow.length > 0) {
      return cashflow.map((cf) => ({
        month: cf.month,
        label: cf.month?.slice(5) || cf.month,
        income: Number(cf.income || 0),
        expenses: Number(cf.expenses || 0),
        net: Number(cf.net || 0),
      }));
    }

    // Fallback 6-month historical curve if cashflow not yet passed
    return [
      { month: '2026-06', label: 'Jun', income: 75000, expenses: 52000, net: 23000 },
      { month: '2026-07', label: 'Jul', income: 75000, expenses: 54500, net: 20500 },
      { month: '2026-08', label: 'Aug', income: 78000, expenses: 49000, net: 29000 },
      { month: '2026-09', label: 'Sep', income: 78000, expenses: 61000, net: 17000 },
      { month: '2026-10', label: 'Oct', income: 82000, expenses: 53500, net: 28500 },
      { month: '2026-11', label: 'Nov', income: 82000, expenses: 48900, net: 33100 },
    ];
  }, [cashflow]);

  return (
    <div className="canvas-visualizer-wrapper">
      {/* Visualizer Mode Toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-3)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
          {mode === 'donut' && 'Breakdown of expenditures grouped by category.'}
          {mode === 'trend' && 'Cumulative spending trajectory over the active period.'}
          {mode === 'bars' && '6-month income vs expenses cashflow with net margin indicator.'}
        </div>

        <SegmentedControl
          size="sm"
          options={[
            { value: 'donut', label: 'Category Donut' },
            { value: 'trend', label: 'Spend Curve' },
            { value: 'bars', label: 'Monthly Bars' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>

      {mode === 'donut' && (
        <DonutChart
          data={donutData}
          height={height}
          emptyMessage="No category spending recorded for this month."
        />
      )}

      {mode === 'trend' && (
        <LineAreaChart
          data={trendData}
          height={height}
          currentLabel="Cumulative Spend"
          emptyMessage="No transactions available to plot cumulative curve."
        />
      )}

      {mode === 'bars' && (
        <BarChart
          data={barData}
          height={height}
          emptyMessage="No monthly cashflow data found."
        />
      )}
    </div>
  );
}

export { DonutChart } from './charts/DonutChart';
export { LineAreaChart } from './charts/LineAreaChart';
export { BarChart } from './charts/BarChart';
export default CanvasChart;
