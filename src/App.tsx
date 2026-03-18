/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Info, Settings2, SlidersHorizontal } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Factorial can overflow quickly, so we use log-gamma for binomial coefficients
function logFactorial(n: number): number {
  if (n <= 1) return 0;
  let res = 0;
  for (let i = 2; i <= n; i++) {
    res += Math.log(i);
  }
  return res;
}

function binomialProbability(n: number, k: number, p: number): number {
  if (k < 0 || k > n) return 0;
  // P(X=k) = exp(log(n!) - log(k!) - log((n-k)!) + k*log(p) + (n-k)*log(1-p))
  const logP = logFactorial(n) - logFactorial(k) - logFactorial(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p);
  return Math.exp(logP);
}

export default function App() {
  const [lociCount, setLociCount] = useState<number>(10);
  const [populationSize, setPopulationSize] = useState<number>(1000);
  const [yAxisMode, setYAxisMode] = useState<'auto' | 'fixed'>('auto');
  const [xAxisMode, setXAxisMode] = useState<'auto' | 'fixed'>('fixed');

  const data = useMemo(() => {
    const n = 2 * lociCount; // 2 alleles per locus
    const p = 0.5;
    const points = [];
    
    // For the infinitesimal model, we want to see the discrete bars.
    // We'll calculate all points. Even at L=500 (n=1000), this is performant.
    for (let k = 0; k <= n; k++) {
      const prob = binomialProbability(n, k, p);
      if (prob > 0.00001 || n < 100) { // Only add points with non-negligible probability
        points.push({
          phenotype: (k - lociCount) / lociCount, // Normalized to [-1, 1]
          frequency: prob,
        });
      }
    }
    return points;
  }, [lociCount]);

  const xDomain = useMemo(() => {
    if (xAxisMode === 'fixed' || lociCount <= 10) {
      return [-1.5, 1.5];
    }
    if (data.length === 0) return [-1, 1];
    const maxVal = Math.max(...data.map(d => Math.abs(d.phenotype)));
    // Add a small padding to ensure bars aren't cut off at the edges
    const padding = maxVal * 0.05;
    const limit = maxVal + padding;
    return [-limit, limit];
  }, [data, xAxisMode, lociCount]);

  const xTicks = useMemo(() => {
    const limit = xDomain[1];
    const ticks = [];
    const count = 3; // 3 ticks on each side of 0
    for (let i = -count; i <= count; i++) {
      ticks.push((limit / count) * i);
    }
    return ticks;
  }, [xDomain]);

  const stats = useMemo(() => {
    const mean = 0;
    const sd = Math.sqrt(0.5 / lociCount);
    return { mean, sd, twoSd: 2 * sd };
  }, [lociCount]);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="border-b border-[#141414] pb-6">
          <h1 className="text-4xl md:text-6xl font-serif italic tracking-tight mb-2">
            Fisher's Infinitesimal Model
          </h1>
          <p className="text-sm uppercase tracking-widest opacity-60 flex items-center gap-2">
            <Info size={14} />
            Quantitative Genetics Simulation
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Controls Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white/50 p-6 rounded-2xl border border-[#141414]/10 backdrop-blur-sm space-y-6">
              <div className="flex items-center gap-2 font-serif italic text-lg border-b border-[#141414]/10 pb-2">
                <Settings2 size={18} />
                Parameters
              </div>
              
              <div className="space-y-4">
                <div className="space-y-4">
                  <label className="text-[13px] font-mono uppercase opacity-50 block">
                    Number of Loci (L)
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setLociCount(Math.max(1, lociCount - 1))}
                      className="p-2 bg-[#141414] text-[#E4E3E0] rounded-lg hover:bg-[#141414]/80 transition-colors"
                      title="Decrease"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                    
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={lociCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) {
                          setLociCount(Math.min(500, Math.max(1, val)));
                        }
                      }}
                      className="flex-1 bg-white border border-[#141414]/20 rounded-lg px-3 py-2 font-mono font-bold text-center focus:outline-none focus:border-[#141414]"
                    />
                    
                    <button 
                      onClick={() => setLociCount(Math.min(500, lociCount + 1))}
                      className="p-2 bg-[#141414] text-[#E4E3E0] rounded-lg hover:bg-[#141414]/80 transition-colors"
                      title="Increase"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="500"
                    value={lociCount}
                    onChange={(e) => setLociCount(parseInt(e.target.value))}
                    className="w-full accent-[#141414]"
                  />
                  <div className="flex justify-between font-mono text-[13px] opacity-50">
                    <span>MIN: 1</span>
                    <span>MAX: 500</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-[#141414]/10">
                  <label className="text-[13px] font-mono uppercase opacity-50 block">
                    X-Axis Scaling
                  </label>
                  <div className="flex bg-white border border-[#141414]/20 rounded-lg p-1">
                    <button
                      onClick={() => setXAxisMode('auto')}
                      className={cn(
                        "flex-1 py-1.5 text-[13px] font-mono rounded-md transition-all",
                        xAxisMode === 'auto' ? "bg-[#141414] text-white shadow-md" : "text-[#141414] hover:bg-[#141414]/5"
                      )}
                    >
                      AUTO
                    </button>
                    <button
                      onClick={() => setXAxisMode('fixed')}
                      className={cn(
                        "flex-1 py-1.5 text-[13px] font-mono rounded-md transition-all",
                        xAxisMode === 'fixed' ? "bg-[#141414] text-white shadow-md" : "text-[#141414] hover:bg-[#141414]/5"
                      )}
                    >
                      FIXED
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-[#141414]/10">
                  <label className="text-[13px] font-mono uppercase opacity-50 block">
                    Y-Axis Scaling
                  </label>
                  <div className="flex bg-white border border-[#141414]/20 rounded-lg p-1">
                    <button
                      onClick={() => setYAxisMode('auto')}
                      className={cn(
                        "flex-1 py-1.5 text-[13px] font-mono rounded-md transition-all",
                        yAxisMode === 'auto' ? "bg-[#141414] text-white shadow-md" : "text-[#141414] hover:bg-[#141414]/5"
                      )}
                    >
                      AUTO
                    </button>
                    <button
                      onClick={() => setYAxisMode('fixed')}
                      className={cn(
                        "flex-1 py-1.5 text-[13px] font-mono rounded-md transition-all",
                        yAxisMode === 'fixed' ? "bg-[#141414] text-white shadow-md" : "text-[#141414] hover:bg-[#141414]/5"
                      )}
                    >
                      FIXED (0.5)
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[#141414] text-[#E4E3E0] rounded-xl space-y-2">
                  <p className="text-xs uppercase tracking-tighter opacity-70">Model Context</p>
                  <p className="text-sm leading-relaxed">
                    As the number of loci <span className="font-mono italic">L</span> increases, the discrete binomial distribution converges to a continuous normal distribution.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border border-[#141414] rounded-2xl space-y-4">
              <h3 className="font-serif italic text-xl">Theory</h3>
              <p className="text-sm opacity-80 leading-relaxed">
                R.A. Fisher's 1918 paper proposed that continuous variation in traits is the result of many Mendelian factors, each with a small effect.
              </p>
              <div className="font-mono text-xs opacity-50 space-y-1">
                <p>μ = L</p>
                <p>σ² = L / 2</p>
              </div>
            </div>
          </aside>

          {/* Main Chart Area */}
          <main className="lg:col-span-3 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-[#141414]/5 h-[500px] relative overflow-hidden">
              <div className="absolute top-8 right-8 flex flex-col items-end">
                <span className="text-xs font-mono uppercase opacity-40">Distribution Type</span>
                <span className="font-serif italic text-2xl">
                  {lociCount > 50 ? 'Quasi-Normal' : 'Binomial'}
                </span>
              </div>

              <div className="w-full h-full pt-12">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} barGap={0} barCategoryGap={0}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                    <XAxis 
                      dataKey="phenotype" 
                      stroke="#141414" 
                      fontSize={12}
                      tickLine={true}
                      axisLine={true}
                      type="number"
                      domain={xDomain}
                      ticks={xTicks}
                      tickFormatter={(val) => val.toFixed(2)}
                      label={{ value: 'Phenotype (Normalized Value)', position: 'insideBottom', offset: -5, fontSize: 13, fontFamily: 'Georgia' }}
                    />
                    <YAxis 
                      stroke="#141414" 
                      fontSize={12}
                      tickLine={true}
                      axisLine={true}
                      domain={yAxisMode === 'fixed' ? [0, 0.5] : [0, 'auto']}
                      label={{ value: 'Genotype Frequency', angle: -90, position: 'insideLeft', fontSize: 13, fontFamily: 'Georgia' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right"
                      wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                      payload={[
                        { value: 'Frequency', type: 'rect', id: 'freq', color: '#141414' },
                        { value: 'Mean', type: 'line', id: 'mean', color: '#141414' },
                        { value: '±2SD', type: 'line', id: '2sd', color: '#FF4444' }
                      ]}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#141414', border: 'none', borderRadius: '12px', color: '#E4E3E0' }}
                      itemStyle={{ color: '#E4E3E0', fontSize: '13px' }}
                      labelStyle={{ color: '#E4E3E0', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}
                      formatter={(value: number) => [value.toFixed(4), 'Frequency']}
                      labelFormatter={(label: number) => `Phenotype: ${label.toFixed(2)}`}
                      cursor={{ fill: '#141414', fillOpacity: 0.1 }}
                    />
                    <ReferenceLine x={stats.mean} stroke="#141414" strokeDasharray="3 3" label={{ value: 'Mean', position: 'top', fontSize: 12, fill: '#141414' }} />
                    <ReferenceLine x={stats.mean - stats.twoSd} stroke="#FF4444" strokeDasharray="3 3" label={{ value: '-2SD', position: 'top', fontSize: 12, fill: '#FF4444' }} />
                    <ReferenceLine x={stats.mean + stats.twoSd} stroke="#FF4444" strokeDasharray="3 3" label={{ value: '+2SD', position: 'top', fontSize: 12, fill: '#FF4444' }} />
                    <Bar 
                      dataKey="frequency" 
                      fill="#141414" 
                      radius={[2, 2, 0, 0]}
                      animationDuration={500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-white/30 rounded-2xl border border-[#141414]/10">
                <p className="text-xs font-mono uppercase opacity-50 mb-1">Total Alleles</p>
                <p className="text-3xl font-serif">{lociCount * 2}</p>
              </div>
              <div className="p-6 bg-white/30 rounded-2xl border border-[#141414]/10">
                <p className="text-xs font-mono uppercase opacity-50 mb-1">Mean Phenotype</p>
                <p className="text-3xl font-serif">0</p>
              </div>
              <div className="p-6 bg-white/30 rounded-2xl border border-[#141414]/10">
                <p className="text-xs font-mono uppercase opacity-50 mb-1">Variance (σ²)</p>
                <p className="text-3xl font-serif">{(0.5 / lociCount).toFixed(4)}</p>
              </div>
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="pt-12 border-t border-[#141414]/10 flex justify-between items-center text-xs font-mono uppercase tracking-widest opacity-40">
          <p>© 2026 Quantitative Genetics Lab</p>
          <p>Fisherian Simulation v1.0</p>
        </footer>
      </div>
    </div>
  );
}
