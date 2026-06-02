import React, { useState, useMemo, useRef } from 'react';
import { Transaction } from '../types';

interface LiquidChartProps {
  transactions: Transaction[];
}

export function LiquidChart({ transactions }: LiquidChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate historical data for the last 14 days
  const chartData = useMemo(() => {
    const days: { dateStr: string; label: string; income: number; expense: number }[] = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      days.push({ dateStr, label: displayLabel, income: 0, expense: 0 });
    }

    // Accumulate transactions for each day
    transactions.forEach((tx) => {
      const txDay = days.find((day) => day.dateStr === tx.date);
      if (txDay) {
        if (tx.type === 'income') {
          txDay.income += tx.amount;
        } else if (tx.type === 'expense') {
          txDay.expense += tx.amount;
        }
      }
    });

    // Make it cumulative to show a continuous flow or smooth timeline
    let runningIncome = 0;
    let runningExpense = 0;
    return days.map((day) => {
      runningIncome += day.income;
      runningExpense += day.expense;
      return {
        ...day,
        cumulativeIncome: runningIncome,
        cumulativeExpense: runningExpense,
      };
    });
  }, [transactions]);

  // Chart measurements
  const width = 600;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  // Find max value to auto-scale the height
  const maxVal = useMemo(() => {
    const values = chartData.flatMap((d) => [d.cumulativeIncome, d.cumulativeExpense]);
    const max = Math.max(...values, 100); // fallback minimum max value to avoid div by zero
    return max * 1.15; // 15% head room
  }, [chartData]);

  // Map values to coordinates
  const points = useMemo(() => {
    const stepX = (width - paddingX * 2) / (chartData.length - 1);
    
    const incomeCoords = chartData.map((d, i) => {
      const x = paddingX + i * stepX;
      const y = height - paddingY - (d.cumulativeIncome / maxVal) * (height - paddingY * 2);
      return { x, y };
    });

    const expenseCoords = chartData.map((d, i) => {
      const x = paddingX + i * stepX;
      const y = height - paddingY - (d.cumulativeExpense / maxVal) * (height - paddingY * 2);
      return { x, y };
    });

    return { incomeCoords, expenseCoords };
  }, [chartData, maxVal]);

  // Generate SVG Bezier path command for coordinates
  const getCurvePath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const incomePath = getCurvePath(points.incomeCoords);
  const expensePath = getCurvePath(points.expenseCoords);

  // Dynamic values of hovered index
  const activeData = hoveredIndex !== null ? chartData[hoveredIndex] : null;

  return (
    <div id="liquid-chart-container" className="relative select-none backdrop-blur-xl bg-slate-950/40 border border-white/5 rounded-3xl p-6 overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/10" ref={containerRef}>
      {/* Liquid fluid glowing gradients in background */}
      <div className="absolute -left-20 -top-20 w-48 h-48 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full bg-violet-600/10 blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-2 mb-6">
        <div>
          <span className="font-mono text-xs tracking-wider text-neutral-400 uppercase">Cash-Flow Évolutif (14 Jours)</span>
          <h3 className="text-xl font-semibold text-white tracking-tight mt-0.5">Perspective d'Épargne</h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="text-neutral-300">Entrées</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            <span className="text-neutral-300">Sorties</span>
          </div>
        </div>
      </div>

      {/* Interactive Tooltip Overlay when Hovered */}
      <div className="h-10 flex items-center justify-between px-2 mb-2">
        {activeData ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full">{activeData.label}</span>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 block -mb-0.5">CUMUL ENTRÉES</span>
                <span className="text-xs font-semibold text-emerald-400">+{activeData.cumulativeIncome.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 block -mb-0.5">CUMUL SORTIES</span>
                <span className="text-xs font-semibold text-rose-400">-{activeData.cumulativeExpense.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-neutral-500 font-sans">
            Glissez le doigt ou la souris sur le graphique pour inspecter les détails
          </div>
        )}
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-x-auto select-none no-scrollbar">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[500px] h-auto overflow-visible"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="expenseAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing lines shadow filters */}
            <filter id="glow-income" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#34d399" floodOpacity="0.3" />
            </filter>
            <filter id="glow-expense" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#f43f5e" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={(height - paddingY * 2) / 2 + paddingY}
            x2={width - paddingX}
            y2={(height - paddingY * 2) / 2 + paddingY}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />

          {/* Areas first so lines sit on top */}
          {incomePath && (
            <path
              d={`${incomePath} L ${points.incomeCoords[points.incomeCoords.length - 1].x} ${height - paddingY} L ${points.incomeCoords[0].x} ${height - paddingY} Z`}
              fill="url(#incomeAreaGrad)"
            />
          )}
          {expensePath && (
            <path
              d={`${expensePath} L ${points.expenseCoords[points.expenseCoords.length - 1].x} ${height - paddingY} L ${points.expenseCoords[0].x} ${height - paddingY} Z`}
              fill="url(#expenseAreaGrad)"
            />
          )}

          {/* Lines */}
          {incomePath && (
            <path
              d={incomePath}
              fill="none"
              stroke="#34d399"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="url(#glow-income)"
            />
          )}

          {/* Expense Line */}
          {expensePath && (
            <path
              d={expensePath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="url(#glow-expense)"
            />
          )}

          {/* Interactive vertical hover indicator */}
          {hoveredIndex !== null && (
            <line
              x1={points.incomeCoords[hoveredIndex].x}
              y1={paddingY}
              x2={points.incomeCoords[hoveredIndex].x}
              y2={height - paddingY}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          )}

          {/* Nodes for data points when hovered or always visible on edges */}
          {chartData.map((_, i) => {
            const incNode = points.incomeCoords[i];
            const expNode = points.expenseCoords[i];
            const isHovered = hoveredIndex === i;

            return (
              <g key={i}>
                {/* Invisible larger hover zone for easier touch/cursor target */}
                <rect
                  x={incNode.x - (width - paddingX * 2) / (chartData.length * 2)}
                  y={paddingY}
                  width={(width - paddingX * 2) / (chartData.length - 1)}
                  height={height - paddingY * 2}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {isHovered && (
                  <>
                    {/* Income Point hover bubble */}
                    <circle
                      cx={incNode.x}
                      cy={incNode.y}
                      r="7"
                      fill="#10b981"
                      stroke="#fff"
                      strokeWidth="2"
                      className="shadow-lg shadow-emerald-500/20"
                    />
                    {/* Expense Point hover bubble */}
                    <circle
                      cx={expNode.x}
                      cy={expNode.y}
                      r="7"
                      fill="#ef4444"
                      stroke="#fff"
                      strokeWidth="2"
                      className="shadow-lg shadow-rose-500/20"
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* X Axis Date Labels */}
          {chartData.map((day, i) => {
            // Draw subset of labels to prevent overlapping
            if (i % 2 !== 0 && i !== chartData.length - 1) return null;
            const node = points.incomeCoords[i];
            return (
              <text
                key={i}
                x={node.x}
                y={height - 8}
                textAnchor="middle"
                fill="#888899"
                fontSize="9"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                className="opacity-80"
              >
                {day.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
