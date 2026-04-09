"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area,
} from "recharts";
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Clock, TrendingUp, Users, ChevronDown, Check } from "lucide-react";
import { useDateRange } from "@/context/date-range-context";
import { useAccount } from "@/context/account-context";
import { formatNumber, formatPercent, cn } from "@/lib/utils";
import { DataSourceBadge } from "@/components/layout/data-source-badge";
import { externalLinks } from "@/lib/external-links";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function StatCard({ icon: Icon, label, value, subtitle, color = "text-card-foreground", colorHex }: {
  icon: any; label: string; value: string | number; subtitle?: string; color?: string; colorHex?: string; // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${!colorHex ? color : ''}`} style={colorHex ? { color: colorHex } : undefined}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

// Mock agent data -- will be replaced by real RingCentral API data
const mockAgents = [
  { id: "1", name: "Carlos Martinez", extension: "101", inbound: 45, outbound: 62, answered: 42, missed: 3, avgDuration: "3:24" },
  { id: "2", name: "Jessica Ramirez", extension: "102", inbound: 38, outbound: 47, answered: 36, missed: 2, avgDuration: "4:12" },
  { id: "3", name: "David Johnson", extension: "103", inbound: 29, outbound: 55, answered: 28, missed: 1, avgDuration: "2:48" },
  { id: "4", name: "Maria Garcia", extension: "104", inbound: 22, outbound: 31, answered: 20, missed: 2, avgDuration: "3:55" },
  { id: "5", name: "Robert Lee", extension: "105", inbound: 18, outbound: 24, answered: 16, missed: 2, avgDuration: "3:10" },
];

function AgentCallsTab() {
  const { currentAccount } = useAccount();
  const COLORS = currentAccount.chartPalette;
  const positiveColor = currentAccount.positiveColor;
  const primary = currentAccount.colors.primary;

  const [selectedAgents, setSelectedAgents] = useState<string[]>(mockAgents.map((a) => a.id));
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [directionFilter, setDirectionFilter] = useState<"all" | "inbound" | "outbound">("all");

  const filteredAgents = mockAgents.filter((a) => selectedAgents.includes(a.id));

  const toggleAgent = (id: string) => {
    setSelectedAgents((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const totalInbound = filteredAgents.reduce((s, a) => s + a.inbound, 0);
  const totalOutbound = filteredAgents.reduce((s, a) => s + a.outbound, 0);
  const totalAnswered = filteredAgents.reduce((s, a) => s + a.answered, 0);
  const totalMissed = filteredAgents.reduce((s, a) => s + a.missed, 0);

  const chartData = filteredAgents.map((a) => ({
    name: a.name.split(" ")[0],
    inbound: a.inbound,
    outbound: a.outbound,
  }));

  return (
    <>
      {/* Agent Selector + Direction Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Agent dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAgentDropdown(!showAgentDropdown)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm hover:bg-muted/30 transition-colors"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{selectedAgents.length} of {mockAgents.length} agents</span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", showAgentDropdown && "rotate-180")} />
          </button>

          {showAgentDropdown && (
            <div className="absolute z-20 top-full left-0 mt-1 w-72 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
              <div className="p-2 border-b border-border">
                <button
                  onClick={() => setSelectedAgents(selectedAgents.length === mockAgents.length ? [] : mockAgents.map((a) => a.id))}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  {selectedAgents.length === mockAgents.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              {mockAgents.map((agent) => {
                const isSelected = selectedAgents.includes(agent.id);
                return (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted/30 transition-colors border-b border-border last:border-0"
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    )}>
                      {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{agent.name}</p>
                      <p className="text-[10px] text-muted-foreground">Ext. {agent.extension}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Direction filter */}
        <div className="flex gap-1">
          {(["all", "inbound", "outbound"] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => setDirectionFilter(dir)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                directionFilter === dir
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {dir === "all" ? "All" : dir === "inbound" ? "Inbound" : "Outbound"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard icon={PhoneIncoming} label="Total Inbound" value={formatNumber(totalInbound)} colorHex={positiveColor} />
        <StatCard icon={PhoneOutgoing} label="Total Outbound" value={formatNumber(totalOutbound)} colorHex={primary} />
        <StatCard icon={PhoneIncoming} label="Answered" value={formatNumber(totalAnswered)} colorHex={positiveColor} />
        <StatCard icon={PhoneMissed} label="Missed" value={formatNumber(totalMissed)} color="text-red-500" />
      </div>

      {/* Chart: Calls by Agent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold text-card-foreground mb-3">Calls by Agent</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)" }} />
                <Legend />
                {(directionFilter === "all" || directionFilter === "inbound") && (
                  <Bar dataKey="inbound" name="Inbound" fill={positiveColor} radius={[6, 6, 6, 6]} maxBarSize={24} />
                )}
                {(directionFilter === "all" || directionFilter === "outbound") && (
                  <Bar dataKey="outbound" name="Outbound" fill={primary} radius={[6, 6, 6, 6]} maxBarSize={24} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Direction Split Pie */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold text-card-foreground mb-3">Call Direction Split</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Inbound", value: totalInbound, fill: positiveColor },
                    { name: "Outbound", value: totalOutbound, fill: primary },
                  ]}
                  cx="50%" cy="50%" innerRadius="40%" outerRadius="65%" paddingAngle={3} dataKey="value"
                  label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  <Cell fill={positiveColor} />
                  <Cell fill={primary} />
                </Pie>
                <Tooltip formatter={(v) => formatNumber(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Agent Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-base font-semibold text-card-foreground">Agent Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Agent</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Extension</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Inbound</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Outbound</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Answered</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Missed</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Avg Duration</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((agent) => (
                <tr key={agent.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium text-card-foreground">{agent.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{agent.extension}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: positiveColor }}>{agent.inbound}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: primary }}>{agent.outbound}</td>
                  <td className="px-4 py-2.5 text-right font-bold">{agent.inbound + agent.outbound}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: positiveColor }}>{agent.answered}</td>
                  <td className="px-4 py-2.5 text-right text-red-500">{agent.missed}</td>
                  <td className="px-4 py-2.5 text-right">{agent.avgDuration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function CallLogsPage() {
  const { dateRange } = useDateRange();
  const { apiAccountId, currentAccount } = useAccount();
  const COLORS = currentAccount.chartPalette;
  const positiveColor = currentAccount.positiveColor;
  const primary = currentAccount.colors.primary;
  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");

  const [activeTab, setActiveTab] = useState<"overview" | "agents">("overview");

  const { data, isLoading } = useSWR(
    `/api/call-logs?startDate=${startDate}&endDate=${endDate}&accountId=${apiAccountId}`,
    fetcher,
    { refreshInterval: 300000, revalidateOnFocus: false }
  );

  const cr = data?.data?.callrail;
  const isLive = cr && !cr.error;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">Call Logs</h2>
        <p className="text-sm text-muted-foreground">CallRail marketing attribution + RingCentral call volume</p>
        <DataSourceBadge sources={externalLinks["/call-logs"] || []} />
      </div>

      {/* Sub-tabs: Overview | Agent Calls */}
      <div className="flex gap-1 border-b border-border mb-4">
        {([
          { key: "overview" as const, label: "Overview" },
          { key: "agents" as const, label: "Agent Calls" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "agents" ? (
        <AgentCallsTab />
      ) : (
        <>
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {isLive && (
            <>
              {/* Row 1: Key Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-4">
                <StatCard icon={Phone} label="Total Calls" value={formatNumber(cr.totalCalls)} />
                <StatCard icon={PhoneIncoming} label="Answered" value={formatNumber(cr.answered)} colorHex={positiveColor} />
                <StatCard icon={PhoneMissed} label="Missed" value={formatNumber(cr.missed)} color="text-red-500" />
                <StatCard icon={TrendingUp} label="Answer Rate" value={formatPercent(cr.answerRate)} />
                <StatCard icon={Clock} label="Avg. Duration" value={`${cr.avgDuration}s`} />
                <StatCard icon={Users} label="First-Time Callers" value={formatNumber(cr.firstTimeCalls)} />
              </div>

              {/* Row 1.5: Funnel + Missed Rate */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="text-base font-semibold text-card-foreground mb-3">Efficiency Funnel</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Calls</span>
                      <span className="font-bold">{cr.totalCalls}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full"><div className="h-full rounded-full" style={{ width: "100%", backgroundColor: primary }} /></div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Answered</span>
                      <span className="font-bold" style={{ color: positiveColor }}>{cr.answered}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full"><div className="h-full rounded-full" style={{ width: `${cr.totalCalls > 0 ? (cr.answered / cr.totalCalls) * 100 : 0}%`, backgroundColor: positiveColor }} /></div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Qualified (30s+)</span>
                      <span className="font-bold text-primary">{cr.qualifiedCalls}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: `${cr.totalCalls > 0 ? (cr.qualifiedCalls / cr.totalCalls) * 100 : 0}%` }} /></div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="text-base font-semibold text-card-foreground mb-3">Missed Call Rate</h3>
                  <p className="text-4xl font-bold text-red-500">{cr.missedCallRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{cr.missed} of {cr.totalCalls} calls missed</p>
                  <div className="mt-3 w-full h-3 bg-muted rounded-full">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${cr.missedCallRate}%` }} />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="text-base font-semibold text-card-foreground mb-3">Lead Quality</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Qualified Leads (30s+)</p>
                      <p className="text-xl font-bold text-primary">{cr.qualifiedCalls}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Qualification Rate</p>
                      <p className="text-xl font-bold">{cr.totalCalls > 0 ? Math.round((cr.qualifiedCalls / cr.totalCalls) * 100) : 0}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Lead Attribution Chart + Calls by Day */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="text-base font-semibold text-card-foreground mb-3">Lead Attribution by Source</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cr.bySource?.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 10, fontFamily: "var(--font-geist-sans), sans-serif" }} />
                        <YAxis type="category" dataKey="source" width={130} tick={{ fontSize: 10, fontFamily: "var(--font-geist-sans), sans-serif" }} />
                        <Tooltip contentStyle={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: 12 }} />
                        <Bar dataKey="answered" name="Answered" fill={positiveColor} stackId="a" radius={[0, 6, 6, 0]} />
                        <Bar dataKey="missed" name="Missed" fill="#9CA3AF" stackId="a" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="text-base font-semibold text-card-foreground mb-1">Calls by Day of Week</h3>
                  <p className="text-[10px] text-muted-foreground mb-3">Total calls for the selected date range</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cr.byDayOfWeek} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: "var(--font-geist-sans), sans-serif" }} />
                        <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-geist-sans), sans-serif" }} />
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "var(--font-geist-sans), sans-serif", fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: 12 }} />
                        <Bar dataKey="repeat" name="Repeat Calls" fill={COLORS[1]} stackId="a" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="firstTime" name="First-Time Calls" fill={COLORS[2]} stackId="a" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 3: Calls by Hour */}
              <div className="mb-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="text-base font-semibold text-card-foreground mb-3">Calls by Hour of Day</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cr.byHour}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="hour"
                          tickFormatter={(h) => {
                            if (h === 0) return "12 AM";
                            if (h === 12) return "12 PM";
                            return h > 12 ? `${h - 12} PM` : `${h} AM`;
                          }}
                          tick={{ fontSize: 10, fontFamily: "var(--font-geist-sans), sans-serif" }}
                        />
                        <YAxis tick={{ fontSize: 10, fontFamily: "var(--font-geist-sans), sans-serif" }} />
                        <Tooltip
                          contentStyle={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: 12 }}
                          labelFormatter={(h) => {
                            const hr = Number(h);
                            const start = hr === 0 ? "12:00 AM" : hr === 12 ? "12:00 PM" : hr > 12 ? `${hr - 12}:00 PM` : `${hr}:00 AM`;
                            const endHr = hr + 1;
                            const end = endHr === 12 ? "12:59 PM" : endHr > 12 ? `${endHr - 12}:59 PM` : `${endHr === 0 ? 12 : endHr}:59 AM`;
                            return `${start} - ${end}`;
                          }}
                        />
                        <Area type="monotone" dataKey="count" stroke={primary} fill={primary} fillOpacity={0.15} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 4: Source Attribution Table */}
              <div className="rounded-lg border border-border bg-card overflow-hidden mb-4">
                <div className="px-4 py-3 border-b border-border bg-muted/30">
                  <h3 className="text-base font-semibold text-card-foreground">Lead Source Attribution</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Source</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Answered</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Qualified (30s+)</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Missed</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Answer Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cr.bySource?.map((s: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <tr key={s.source} className="border-b border-border last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-medium text-card-foreground">{s.source}</td>
                          <td className="px-4 py-2.5 text-right">{s.total}</td>
                          <td className="px-4 py-2.5 text-right" style={{ color: positiveColor }}>{s.answered}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-primary">{s.qualified}</td>
                          <td className="px-4 py-2.5 text-right text-red-500">{s.missed}</td>
                          <td className="px-4 py-2.5 text-right">
                            {s.total > 0 ? Math.round((s.answered / s.total) * 100) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!isLoading && !isLive && (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No call data available. Check your CallRail and RingCentral API credentials.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
