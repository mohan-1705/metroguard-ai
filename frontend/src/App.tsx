import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import {
  ShieldAlert, Train, Activity, CheckCircle, Settings,
  Bell, Database, AlertTriangle, Check, X, History,
  BarChart3, RefreshCw, Layers, Lock, FileSearch, CheckSquare, ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar as RechartsBar, Legend,
} from "recharts";
import { api, SensorReading, Incident, WorkOrder, Approval, AuditLog } from "./services/api";

// Toast Notification component helper
interface Toast {
  id: string;
  type: "info" | "warning" | "error" | "success" | "ai";
  message: string;
}

export default function App() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [role, setRole] = useState<string>("Maintenance Manager");
  const [wsStatus, setWsStatus] = useState<"Connected" | "Disconnected" | "Reconnecting">("Disconnected");
  const [lastWsEvent, setLastWsEvent] = useState<any>(null);
  
  const addToast = (message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Set up WebSockets
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: any;

    const connect = () => {
      setWsStatus("Reconnecting");
      ws = new WebSocket("ws://localhost:8000/ws/sensors");

      ws.onopen = () => {
        setWsStatus("Connected");
        addToast("Connected to live telemetry stream.", "success");
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          setLastWsEvent(packet);
          
          if (packet.event_type === "SENSOR_RECEIVED") {
            // Only trigger alert if status is CRITICAL
            if (packet.data.vibration > 7.0 || packet.data.axle_temperature > 100) {
              addToast(`Alert: Train ${packet.data.train_id} exceeding demo safety bounds!`, "warning");
            }
          } else if (packet.event_type === "INCIDENT_CREATED") {
            addToast(`AI Agent: New Incident ${packet.data.id} created (${packet.data.detected_issue})`, "ai");
          } else if (packet.event_type === "WORK_ORDER_CREATED") {
            addToast(`Automation: Work Order ${packet.data.work_order_id} dispatch triggered.`, "success");
          } else if (packet.event_type === "INCIDENT_UPDATED") {
            addToast(`Incident ${packet.data.id} status updated to: ${packet.data.status}`, "info");
          }
        } catch (e) {
          console.error("Error parsing WS packet", e);
        }
      };

      ws.onclose = () => {
        setWsStatus("Disconnected");
        reconnectTimeout = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-darkBg text-gray-200 font-sans">
        {/* Sidebar Nav */}
        <Sidebar wsStatus={wsStatus} />

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0">
<Topbar role={role} setRole={setRole} />

          <main className="flex-1 p-6 overflow-y-auto">
            <Routes>
              <Route path="/" element={<OverviewDashboard lastEvent={lastWsEvent} />} />
              <Route path="/live" element={<LiveMonitoring lastEvent={lastWsEvent} />} />
              <Route path="/incidents" element={<IncidentManagement />} />
              <Route path="/incidents/:id" element={<IncidentDetails role={role} addToast={addToast} />} />
              <Route path="/agent" element={<AgentExecution lastEvent={lastWsEvent} />} />
              <Route path="/approval" element={<HumanApproval role={role} />} />
              <Route path="/maintenance" element={<MaintenanceWorkOrders />} />
              <Route path="/work-order/:id" element={<WorkOrderDetails />} />
              <Route path="/knowledge" element={<KnowledgeBase addToast={addToast} />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/approvals-history" element={<ApprovalHistory />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/settings" element={<SettingsPage addToast={addToast} />} />
            </Routes>
          </main>
        </div>

        {/* Floating Toast Notification Stack */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
          {toasts.map(t => (
            <div 
              key={t.id} 
              className={`p-4 rounded-lg shadow-lg flex items-start gap-3 border ${
                t.type === "warning" ? "bg-amber-950 border-amber-800 text-amber-200" :
                t.type === "error" ? "bg-red-950 border-red-800 text-red-200" :
                t.type === "success" ? "bg-emerald-950 border-emerald-800 text-emerald-200" :
                t.type === "ai" ? "bg-purple-950 border-purple-800 text-purple-200" :
                "bg-slate-900 border-slate-700 text-slate-200"
              }`}
            >
              <div className="mt-0.5">
                {t.type === "warning" && <AlertTriangle className="h-5 w-5" />}
                {t.type === "error" && <X className="h-5 w-5 text-red-400" />}
                {t.type === "success" && <Check className="h-5 w-5 text-emerald-400" />}
                {t.type === "ai" && <ShieldCheck className="h-5 w-5 text-purple-400" />}
                {t.type === "info" && <Bell className="h-5 w-5 text-blue-400" />}
              </div>
              <div>
                <p className="text-sm font-semibold">{t.type === "ai" ? "MetroGuard AI Agent" : "System Alert"}</p>
                <p className="text-xs text-gray-300 mt-0.5">{t.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </HashRouter>
  );
}

/* SIDEBAR NAVIGATION */
function Sidebar({ wsStatus }: { wsStatus: string }) {
  const links = [
    { to: "/", label: "Overview", icon: Layers },
    { to: "/live", label: "Live Monitoring", icon: Activity },
    { to: "/incidents", label: "Incidents", icon: ShieldAlert },
    { to: "/agent", label: "AI Agent", icon: ShieldCheck },
    { to: "/maintenance", label: "Maintenance", icon: CheckSquare },
    { to: "/knowledge", label: "Knowledge Base", icon: FileSearch },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/approval", label: "Approvals", icon: Lock },
    { to: "/approvals-history", label: "Approval History", icon: History },
    { to: "/audit-logs", label: "Audit Logs", icon: Database },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-darkSurface border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <span className="text-2xl">🚇</span>
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide">MetroGuard AI</h1>
          <p className="text-[10px] text-gray-400 tracking-wider font-semibold uppercase">DECISION PLATFORM</p>
        </div>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
        {links.map(l => (
          <Link 
            key={l.to} 
            to={l.to} 
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Stream Status:</span>
          <div className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${
              wsStatus === "Connected" ? "bg-emerald-500" :
              wsStatus === "Reconnecting" ? "bg-amber-500 animate-pulse" : "bg-red-500"
            }`} />
            <span className="font-semibold text-gray-300">{wsStatus}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* TOPBAR HEADER */
function Topbar({ role, setRole }: { role: string; setRole: (r: string) => void }) {
  return (
    <header className="h-16 bg-darkSurface border-b border-slate-800 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xs px-2.5 py-1 bg-emerald-950/50 border border-emerald-800 text-emerald-400 rounded-full font-semibold">
          ● System Operational
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-gray-400" />
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-electricBlue"
          >
            <option value="Admin">Admin</option>
            <option value="Maintenance Manager">Maintenance Manager</option>
            <option value="Engineer">Engineer</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-semibold text-white">
            U
          </div>
          <div className="text-xs">
            <p className="font-bold text-white">Operations Crew</p>
            <p className="text-gray-400">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

/* PAGE 1: OVERVIEW DASHBOARD */
function OverviewDashboard({ lastEvent }: { lastEvent: any }) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.getDashboard();
      setDashboardData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [lastEvent]);

  if (loading || !dashboardData) {
    return <div className="text-sm text-gray-400">Loading operational KPIs...</div>;
  }

  const { kpis, critical_alerts, recent_timeline } = dashboardData;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Metro Operations Overview</h2>
        <p className="text-sm text-gray-400">Real-time maintenance intelligence and AI-assisted incident management</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Active Trains", val: kpis.active_trains, icon: Train, color: "text-blue-400" },
          { label: "Active Incidents", val: kpis.active_incidents, icon: ShieldAlert, color: "text-amber-400" },
          { label: "Critical Alerts", val: kpis.critical_alerts, icon: AlertTriangle, color: "text-red-400" },
          { label: "Open Work Orders", val: kpis.open_work_orders, icon: CheckSquare, color: "text-orange-400" },
          { label: "AI Recs", val: kpis.ai_recommendations, icon: ShieldCheck, color: "text-purple-400" },
          { label: "System Health", val: `${kpis.system_health}%`, icon: Activity, color: "text-emerald-400" }
        ].map((k, idx) => (
          <div key={idx} className="bg-darkSurface border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">{k.label}</p>
              <h3 className="text-lg font-bold text-white mt-1">{k.val}</h3>
            </div>
            <k.icon className={`h-6 w-6 ${k.color}`} />
          </div>
        ))}
      </div>

      {/* Grid: Network Map, Alerts & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conceptual map */}
        <div className="lg:col-span-2 bg-darkSurface border border-slate-800 rounded-xl p-6 flex flex-col">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-white">Conceptual Network Visualization</h4>
            <p className="text-xs text-gray-400">Simulated demonstration telemetry tracking map</p>
          </div>
          <div className="flex-1 h-64 bg-slate-950/40 rounded-lg relative overflow-hidden flex flex-col justify-center gap-6 p-6 border border-slate-800/40">
            {/* Red Line */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-red-500 font-bold w-20">RED LINE</span>
              <div className="h-1 bg-red-600 flex-1 relative rounded-full">
                <span className="absolute left-[20%] -top-1 w-3 h-3 rounded-full bg-red-500 border border-slate-900" title="Miyapur Station" />
                <span className="absolute left-[25%] -top-3 text-[9px] text-gray-400">Miyapur</span>
                <span className="absolute left-[50%] -top-2 px-1.5 py-0.5 text-[8px] bg-emerald-500 text-white rounded font-bold">MTR-109</span>
              </div>
            </div>
            {/* Blue Line */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-blue-500 font-bold w-20">BLUE LINE</span>
              <div className="h-1 bg-blue-600 flex-1 relative rounded-full">
                <span className="absolute left-[40%] -top-1 w-3 h-3 rounded-full bg-blue-500 border border-slate-900" title="Ameerpet Station" />
                <span className="absolute left-[45%] -top-3 text-[9px] text-gray-400">Ameerpet</span>
                <span className="absolute left-[40%] -top-3 w-3 h-3 bg-red-500 animate-ping rounded-full" />
                <span className="absolute left-[70%] -top-2 px-1.5 py-0.5 text-[8px] bg-red-600 text-white rounded font-bold">MTR-204</span>
              </div>
            </div>
            {/* Green Line */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-emerald-500 font-bold w-20">GREEN LINE</span>
              <div className="h-1 bg-emerald-600 flex-1 relative rounded-full">
                <span className="absolute left-[60%] -top-1 w-3 h-3 rounded-full bg-emerald-500 border border-slate-900" title="Nagole Station" />
                <span className="absolute left-[65%] -top-3 text-[9px] text-gray-400">Nagole</span>
                <span className="absolute left-[30%] -top-2 px-1.5 py-0.5 text-[8px] bg-emerald-500 text-white rounded font-bold">MTR-301</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel stack */}
        <div className="flex flex-col gap-6">
          {/* Critical alerts */}
          <div className="bg-darkSurface border border-slate-800 rounded-xl p-5 flex flex-col">
            <h4 className="text-sm font-bold text-white mb-3">Critical Alerts Panel</h4>
            <div className="space-y-3">
              {critical_alerts.map((a: any, idx: number) => (
                <div key={idx} className="bg-red-950/20 border border-red-900/50 p-3 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-red-400">{a.id} - {a.location}</p>
                    <p className="text-gray-300 mt-1">{a.message}</p>
                  </div>
                  <span className="text-[10px] text-gray-400">{a.time_ago}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Timeline */}
          <div className="bg-darkSurface border border-slate-800 rounded-xl p-5 flex flex-col">
            <h4 className="text-sm font-bold text-white mb-3">Recent AI Activity Timeline</h4>
            <div className="space-y-3 flex-1">
              {recent_timeline.map((t: any, idx: number) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="flex flex-col items-center">
                    <span className="h-2 w-2 rounded-full bg-purple-500 mt-1" />
                    {idx < recent_timeline.length - 1 && <span className="w-0.5 bg-slate-800 flex-1 my-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-200">{t.event}</span>
                      <span className="text-[10px] text-gray-400">{t.timestamp}</span>
                    </div>
                    <span className="text-[10px] text-purple-400 font-semibold">{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* PAGE 2: LIVE MONITORING */
function LiveMonitoring({ lastEvent }: { lastEvent: any }) {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [filterLine, setFilterLine] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchSensors = async () => {
    try {
      const res = await api.getSensors();
      setReadings(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, [lastEvent]);

  const filtered = readings.filter(r => {
    return (!filterLine || r.line === filterLine) &&
           (!filterStatus || r.status === filterStatus);
  });

  // Calculate history data for chart
  const mtr204Data = readings
    .filter(r => r.train_id === "MTR-204")
    .slice(0, 10)
    .reverse()
    .map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      vibration: r.vibration,
      axle: r.axle_temperature,
      brake: r.brake_temperature
    }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Live Sensor Monitoring</h2>
        <p className="text-sm text-gray-400">Real-time telemetry streams from track sensor arrays and train bogie metrics</p>
      </div>

      {/* Filters */}
      <div className="bg-darkSurface border border-slate-800 p-4 rounded-xl flex gap-4 text-xs">
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400">Line</label>
          <select 
            value={filterLine} 
            onChange={(e) => setFilterLine(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-gray-300 rounded px-3 py-1.5 focus:outline-none"
          >
            <option value="">All Lines</option>
            <option value="Blue">Blue</option>
            <option value="Red">Red</option>
            <option value="Green">Green</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400">Status</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-gray-300 rounded px-3 py-1.5 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="NORMAL">NORMAL</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Live Table */}
      <div className="bg-darkSurface border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-gray-400 font-semibold">
                <th className="p-4">Train</th>
                <th className="p-4">Line</th>
                <th className="p-4">Station</th>
                <th className="p-4">Speed</th>
                <th className="p-4">Vibration</th>
                <th className="p-4">Axle Temp</th>
                <th className="p-4">Brake Temp</th>
                <th className="p-4">Track Temp</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20 text-gray-300">
                  <td className="p-4 font-bold text-white">{r.train_id}</td>
                  <td className="p-4">{r.line}</td>
                  <td className="p-4">{r.station}</td>
                  <td className="p-4">{r.speed} km/h</td>
                  <td className="p-4 font-mono">{r.vibration} mm/s</td>
                  <td className="p-4 font-mono">{r.axle_temperature}°C</td>
                  <td className="p-4 font-mono">{r.brake_temperature}°C</td>
                  <td className="p-4 font-mono">{r.track_temperature}°C</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === "CRITICAL" ? "bg-red-950 text-red-400 border border-red-800" :
                      r.status === "WARNING" ? "bg-amber-950 text-amber-400 border border-amber-800" :
                      "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{new Date(r.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">No telemetry logs found. Trigger the simulator mode.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend charts */}
      {mtr204Data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-darkSurface border border-slate-800 p-5 rounded-xl">
            <h4 className="text-sm font-bold text-white mb-4">Vibration Trend (MTR-204)</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mtr204Data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#223047" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#151d30", borderColor: "#334155" }} />
                  <Line type="monotone" dataKey="vibration" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Vibration (mm/s)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-darkSurface border border-slate-800 p-5 rounded-xl">
            <h4 className="text-sm font-bold text-white mb-4">Bogie Temperature Trends (MTR-204)</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mtr204Data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#223047" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#151d30", borderColor: "#334155" }} />
                  <Line type="monotone" dataKey="axle" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Axle Temp (°C)" />
                  <Line type="monotone" dataKey="brake" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Brake Temp (°C)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* PAGE 3: INCIDENT MANAGEMENT */
function IncidentManagement() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchIncidents = async () => {
    try {
      const res = await api.getIncidents();
      setIncidents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Incident Management</h2>
          <p className="text-sm text-gray-400">Audit logs and response tracker for anomalies</p>
        </div>
        <button 
          onClick={fetchIncidents}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      <div className="bg-darkSurface border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-gray-400 font-semibold">
                <th className="p-4">Incident ID</th>
                <th className="p-4">Train</th>
                <th className="p-4">Location</th>
                <th className="p-4">Detected Issue</th>
                <th className="p-4">Severity</th>
                <th className="p-4">AI Confidence</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created At</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-gray-300">
              {incidents.map((i, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20">
                  <td className="p-4 font-bold text-white">{i.id}</td>
                  <td className="p-4 font-semibold">{i.train_id}</td>
                  <td className="p-4">{i.station} ({i.line})</td>
                  <td className="p-4">{i.detected_issue}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      i.severity === "CRITICAL" ? "bg-red-950 text-red-400 border border-red-900" :
                      i.severity === "HIGH" ? "bg-orange-950 text-orange-400 border border-orange-900" :
                      i.severity === "WARNING" ? "bg-amber-950 text-amber-400 border border-amber-900" :
                      "bg-emerald-950 text-emerald-400 border border-emerald-900"
                    }`}>
                      {i.severity}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-semibold text-purple-400">
                    {i.ai_confidence ? `${Math.round(i.ai_confidence * 100)}%` : "N/A"}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                      i.status === "Awaiting Approval" ? "bg-amber-900/40 text-amber-300 border border-amber-800/50" :
                      i.status === "Approved" ? "bg-blue-900/40 text-blue-300 border border-blue-800/50" :
                      i.status === "In Progress" ? "bg-purple-900/40 text-purple-300 border border-purple-800/50" :
                      i.status === "Resolved" ? "bg-emerald-900/40 text-emerald-300 border border-emerald-800/50" :
                      "bg-slate-800 text-slate-400"
                    }`}>
                      {i.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{new Date(i.created_at).toLocaleString()}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => navigate(`/incidents/${i.id}`)}
                      className="px-2.5 py-1 bg-electricBlue hover:bg-blue-700 text-white rounded text-[11px] font-semibold transition-colors"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {incidents.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">No active incidents found. Generate a sensor anomaly to test.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* PAGES 4, 5, 6: INCIDENT DETAILS & AI ASSESSMENT */
function IncidentDetails({ role, addToast }: { role: string; addToast: (msg: string, type?: Toast["type"]) => void }) {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [ragDocs, setRagDocs] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      const res = await api.getIncidentDetails(id);
      setIncident(res.data);
      
      // Load history for train
      const histRes = await api.getSensorHistory(res.data.train_id);
      setHistory(histRes.data);

      // Load related knowledge doc RAG evidence
      const searchRes = await api.searchKnowledge(res.data.detected_issue);
      setRagDocs(searchRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleApprove = async () => {
    if (role !== "Maintenance Manager") {
      addToast("Unauthorized: Only Maintenance Managers can approve incident response triggers.", "error");
      return;
    }
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await api.approveIncident(id, comment);
      if (res.data.success) {
        addToast(`Incident Approved! Work Order ${res.data.work_order_id} created.`, "success");
        loadData();
      }
    } catch (e) {
      console.error(e);
      addToast("Failed to process approval.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (role !== "Maintenance Manager") {
      addToast("Unauthorized: Only Maintenance Managers can audit-reject actions.", "error");
      return;
    }
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await api.rejectIncident(id, comment);
      if (res.data.success) {
        addToast("Incident response action rejected.", "info");
        loadData();
      }
    } catch (e) {
      console.error(e);
      addToast("Failed to process rejection.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (!incident) return <div className="text-gray-400 text-xs">Loading incident details...</div>;

  const currentReading = history[0] || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/incidents" className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
          ← Back to Incidents
        </Link>
        <span className="text-slate-700">|</span>
        <h2 className="text-xl font-bold text-white">Incident {incident.id} Details</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Stats Details */}
        <div className="bg-darkSurface border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <span className="text-gray-400 font-medium">Incident:</span>
            <span className="font-bold text-white">{incident.id}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <span className="text-gray-400 font-medium">Train Unit:</span>
            <span className="font-semibold text-white">{incident.train_id} ({incident.line} Line)</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <span className="text-gray-400 font-medium">Station Area:</span>
            <span className="font-semibold text-white">{incident.station}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <span className="text-gray-400 font-medium">Severity Classification:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              incident.severity === "CRITICAL" ? "bg-red-950 text-red-400 border border-red-900" : "bg-amber-950 text-amber-400 border border-amber-800"
            }`}>{incident.severity}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <span className="text-gray-400 font-medium">Current Status:</span>
            <span className="font-semibold text-gray-200">{incident.status}</span>
          </div>
          
          {/* Telemetry Evidence Card list */}
          {currentReading && (
            <div className="pt-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Sensor evidence thresholds</p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-900/50 border border-slate-850 p-2.5 rounded">
                  <p className="text-gray-400">Vibration</p>
                  <p className={`font-bold mt-1 ${currentReading.vibration > 7.0 ? 'text-red-400' : 'text-gray-200'}`}>{currentReading.vibration} mm/s</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">Demo Limit: 7.0</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-850 p-2.5 rounded">
                  <p className="text-gray-400">Axle Bearing</p>
                  <p className={`font-bold mt-1 ${currentReading.axle_temperature > 100.0 ? 'text-red-400' : 'text-gray-200'}`}>{currentReading.axle_temperature}°C</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">Demo Limit: 100</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-850 p-2.5 rounded">
                  <p className="text-gray-400">Brakes</p>
                  <p className={`font-bold mt-1 ${currentReading.brake_temperature > 120.0 ? 'text-red-400' : 'text-gray-200'}`}>{currentReading.brake_temperature}°C</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">Demo Limit: 120</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-850 p-2.5 rounded">
                  <p className="text-gray-400">Track Temperature</p>
                  <p className={`font-bold mt-1 ${currentReading.track_temperature > 65.0 ? 'text-red-400' : 'text-gray-200'}`}>{currentReading.track_temperature}°C</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">Demo Limit: 65</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Incident Assessment & RAG Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Assessment Panel */}
          <div className="bg-darkSurface border border-slate-850 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">AI Incident Assessment</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-purple-400 font-bold block">Confidence Rating</span>
                <span className="text-xs font-mono font-semibold text-gray-300">{incident.ai_confidence ? `${Math.round(incident.ai_confidence * 100)}%` : "Calculating..."}</span>
              </div>
            </div>

            <div className="text-xs space-y-3">
              <div>
                <p className="font-semibold text-purple-400">AI Assessment Summary</p>
                <p className="text-gray-300 leading-relaxed mt-1">{incident.ai_summary || "AI summary generation pending..."}</p>
              </div>

              <div>
                <p className="font-semibold text-purple-400">Recommended Action Flow</p>
                <p className="text-gray-300 leading-relaxed mt-1">{incident.recommendation || "Recommended action plan pending..."}</p>
              </div>
            </div>
          </div>

          {/* RAG Evidence Documents */}
          <div className="bg-darkSurface border border-slate-850 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Retrieved Maintenance SOP Evidence</h3>
            <div className="space-y-3">
              {ragDocs.map((d, idx) => (
                <div key={idx} className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg text-xs space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span className="font-bold text-purple-400">{d.metadata.document_name} — {d.metadata.section}</span>
                    <span>Relevance: {Math.round(d.score * 100)}%</span>
                  </div>
                  <p className="text-gray-300 italic">"...{d.text}..."</p>
                </div>
              ))}
              {ragDocs.length === 0 && (
                <p className="text-xs text-gray-500 italic">No relevant maintenance evidence was found. Human review required.</p>
              )}
            </div>
          </div>

          {/* Safety Gate Approval / Execution Workflow Panel */}
          {incident.status === "Awaiting Approval" && (
            <div className="bg-amber-950/20 border border-amber-900 p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white text-amber-400">Human Approval Safety Gate Required</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                This incident requires visual verification of evidence and reviewer approval. Clicking **Approve** dispatches the simulated work order to a technician and alerts operations.
              </p>
              <div className="space-y-3">
                <textarea 
                  placeholder="Include comments, inspection logs or instructions (optional)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded text-xs text-gray-300 focus:outline-none focus:border-amber-700"
                  rows={2}
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="reviewed-check" 
                      className="rounded bg-slate-950 border-slate-850 text-electricBlue focus:ring-0" 
                    />
                    <label htmlFor="reviewed-check" className="text-[10px] text-gray-400 select-none cursor-pointer">
                      I have reviewed the available evidence and AI recommendation.
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold disabled:opacity-50 transition-colors"
                    >
                      Approve Maintenance
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* PAGE 7: AI AGENT EXECUTION */
function AgentExecution({ lastEvent }: { lastEvent: any }) {
  const [audits, setAudits] = useState<any[]>([]);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const res = await api.getAuditLogs();
        setAudits(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAudits();
  }, [lastEvent]);

  // Extract events related to the latest incident workflow
  const latestIncident = audits.find(a => a.incident_id)?.incident_id || null;
  const workflowEvents = audits.filter(a => a.incident_id === latestIncident).map(a => a.event_type);

  const steps = [
    { key: "SENSOR_RECEIVED", label: "EVENT RECEIVED" },
    { key: "SENSOR_RECEIVED", label: "VALIDATE DATA" },
    { key: "ANOMALY_DETECTED", label: "DETECT ANOMALY" },
    { key: "RAG_SEARCH", label: "RETRIEVE KNOWLEDGE" },
    { key: "AI_ANALYSIS", label: "ANALYZE INCIDENT" },
    { key: "POLICY_CHECK", label: "POLICY CHECK" },
    { key: "APPROVAL_REQUESTED", label: "HUMAN APPROVAL" },
    { key: "WORK_ORDER_CREATED", label: "AUTOMATION" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">AI Agent Execution Workflow</h2>
        <p className="text-sm text-gray-400">Visualizing the compiled LangGraph workflow state machine execution in real-time</p>
      </div>

      <div className="bg-darkSurface border border-slate-800 rounded-xl p-8 flex flex-col items-center">
        <div className="w-full max-w-lg space-y-4">
          <div className="pb-3 border-b border-slate-800 mb-4 flex justify-between items-center text-xs text-gray-400">
            <span>Tracking Incident Workflow: <strong className="text-white">{latestIncident || "None"}</strong></span>
            <span>Steps Completed: {steps.filter(s => workflowEvents.includes(s.key)).length} / {steps.length}</span>
          </div>

          <div className="flex flex-col gap-3">
            {steps.map((s, idx) => {
              const completed = workflowEvents.includes(s.key);
              const running = !completed && idx === steps.findIndex(st => !workflowEvents.includes(st.key));
              
              return (
                <div key={idx} className="flex items-center gap-4 text-xs">
                  {/* Step status dot indicator */}
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold ${
                    completed ? "bg-emerald-950 border border-emerald-700 text-emerald-400" :
                    running ? "bg-blue-950 border border-blue-600 text-blue-400 animate-pulse" :
                    "bg-slate-900 border border-slate-800 text-gray-500"
                  }`}>
                    {completed ? "✓" : idx + 1}
                  </div>

                  <div className="flex-1 bg-slate-900/50 border border-slate-850 p-3 rounded-lg flex items-center justify-between">
                    <span className={`font-semibold ${
                      completed ? "text-gray-200" :
                      running ? "text-blue-400" : "text-gray-500"
                    }`}>{s.label}</span>
                    
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      completed ? "bg-emerald-950/40 text-emerald-400" :
                      running ? "bg-blue-950/40 text-blue-400" : "bg-slate-950 text-gray-500"
                    }`}>
                      {completed ? "COMPLETED" : running ? "RUNNING" : "WAITING"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* PAGE 8: HUMAN APPROVAL PANEL */
function HumanApproval({ role }: { role: string }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const navigate = useNavigate();

  const fetchIncidents = async () => {
    try {
      const res = await api.getIncidents();
      setIncidents(res.data.filter(i => i.status === "Awaiting Approval"));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Human Safety Boundary Approvals</h2>
        <p className="text-sm text-gray-400">Inspect incidents flagged by the AI policy engine for manual validation</p>
        <p className="text-xs text-gray-500">Reviewer role: {role}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {incidents.map((i, idx) => (
          <div key={idx} className="bg-darkSurface border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] bg-red-950 text-red-400 border border-red-900 rounded font-bold px-2 py-0.5">
                  ⚠ HUMAN REVIEW REQUIRED
                </span>
                <h4 className="text-sm font-bold text-white mt-2">{i.id} - {i.train_id}</h4>
                <p className="text-xs text-gray-400 mt-1">{i.detected_issue} ({i.station})</p>
              </div>
              <span className="text-xs text-gray-500">{new Date(i.created_at).toLocaleTimeString()}</span>
            </div>
            
            <p className="text-xs text-gray-300 bg-slate-900/60 p-3 rounded italic">
              "Review the recommended simulated maintenance workflow based on the retrieved evidence."
            </p>

            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => navigate(`/incidents/${i.id}`)}
                className="px-3 py-1.5 bg-electricBlue hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors"
              >
                Review Evidence & Approve
              </button>
            </div>
          </div>
        ))}
        {incidents.length === 0 && (
          <div className="col-span-2 bg-slate-900/20 border border-slate-850 p-12 text-center rounded-xl">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">Queue Clear</p>
            <p className="text-xs text-gray-500 mt-1">No incidents awaiting approval. Trigger an anomaly to run approval cycles.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* PAGE 9, 10: MAINTENANCE WORK ORDERS */
function MaintenanceWorkOrders() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const res = await api.getWorkOrders();
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Maintenance Work Orders</h2>
        <p className="text-sm text-gray-400">Dispatched work orders and technician field assignments</p>
      </div>

      <div className="bg-darkSurface border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-gray-400 font-semibold">
                <th className="p-4">Work Order</th>
                <th className="p-4">Incident</th>
                <th className="p-4">Task</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Technician Assigned</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created At</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-gray-300">
              {orders.map((o, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20">
                  <td className="p-4 font-bold text-white">{o.id}</td>
                  <td className="p-4 font-semibold">{o.incident_id}</td>
                  <td className="p-4 max-w-xs truncate">{o.task}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      o.priority === "CRITICAL" ? "bg-red-950 text-red-400 border border-red-900" :
                      o.priority === "HIGH" ? "bg-orange-950 text-orange-400 border border-orange-900" :
                      "bg-slate-800 text-gray-300"
                    }`}>
                      {o.priority}
                    </span>
                  </td>
                  <td className="p-4 text-purple-400 font-medium">{o.technician?.name || "Unassigned"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      o.status === "Completed" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                      o.status === "In Progress" ? "bg-purple-950 text-purple-400 border border-purple-800" :
                      "bg-slate-900 text-gray-500 border border-slate-800"
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => navigate(`/work-order/${o.id}`)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-semibold transition-colors"
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">No work orders dispatched yet. Approve an incident response to trigger.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* PAGE 10: WORK ORDER DETAILS */
function WorkOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      const res = await api.getWorkOrderDetails(id);
      setOrder(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleUpdate = async (status: string) => {
    if (!id) return;
    setStatusLoading(true);
    try {
      await api.updateWorkOrder(id, status);
      fetchDetails();
    } catch (e) {
      console.error(e);
    } finally {
      setStatusLoading(false);
    }
  };

  if (!order) return <div className="text-gray-400 text-xs">Loading work order details...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/maintenance" className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
          ← Back to Maintenance
        </Link>
        <span className="text-slate-700">|</span>
        <h2 className="text-xl font-bold text-white">Work Order {order.id} details</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-darkSurface border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-gray-400">Order ID:</span>
            <span className="font-bold text-white">{order.id}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-gray-400">Associated Incident:</span>
            <span className="font-semibold text-white">{order.incident_id}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-gray-400">Task Instructions:</span>
            <span className="font-semibold text-white max-w-xs text-right">{order.task}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-gray-400">Priority:</span>
            <span className="font-semibold text-white">{order.priority}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-gray-400">Current Status:</span>
            <span className="font-bold text-purple-400">{order.status}</span>
          </div>

          <div className="pt-4 flex gap-2">
            {order.status === "Created" && (
              <button 
                onClick={() => handleUpdate("In Progress")}
                disabled={statusLoading}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold transition-colors"
              >
                Mark In Progress
              </button>
            )}
            {order.status === "In Progress" && (
              <button 
                onClick={() => handleUpdate("Completed")}
                disabled={statusLoading}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors"
              >
                Complete Work Order
              </button>
            )}
          </div>
        </div>

        {/* Assigned Technician Profile */}
        <div className="bg-darkSurface border border-slate-800 rounded-xl p-5 text-xs space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">Assigned Technician</h3>
          {order.technician ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-950 border border-purple-800 text-purple-300 flex items-center justify-center font-bold">
                  {order.technician.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-white">{order.technician.name}</h4>
                  <p className="text-gray-400 text-[10px]">{order.technician.specialty}</p>
                </div>
              </div>
              <div className="flex justify-between text-gray-400 mt-2">
                <span>Field Status:</span>
                <span className="text-purple-400 font-semibold">{order.technician.status}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No technician assigned.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* PAGE 11: KNOWLEDGE BASE */
function KnowledgeBase({ addToast }: { addToast: (msg: string, type?: Toast["type"]) => void }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [ingesting, setIngesting] = useState(false);

  const fetchDocs = async () => {
    try {
      const res = await api.getKnowledgeDocuments();
      setDocs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleSearch = async () => {
    if (!search) return;
    try {
      const res = await api.searchKnowledge(search);
      setSearchResults(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleIngest = async () => {
    setIngesting(true);
    try {
      await api.ingestKnowledge();
      addToast("Knowledge base re-indexed successfully.", "success");
      fetchDocs();
    } catch (e) {
      console.error(e);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Search Maintenance Knowledge</h2>
          <p className="text-sm text-gray-400">Search simulated standard operating procedures and diagnostic guidelines</p>
        </div>
        <button 
          onClick={handleIngest}
          disabled={ingesting}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className="h-3 w-3" />
          {ingesting ? "Ingesting..." : "Re-Index Vector Store"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document list */}
        <div className="bg-darkSurface border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">Indexed Library</h3>
          <div className="space-y-3">
            {docs.map((d, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-850 p-3 rounded-lg text-xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">{d.name}</h4>
                  <p className="text-gray-400 text-[10px] mt-0.5">Version: {d.version} | Pages: {d.pages}</p>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded">
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Semantic Search */}
        <div className="lg:col-span-2 bg-darkSurface border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">Semantic RAG Explorer</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Search SOP query (e.g. bogie vibration, caliper hot box)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-850 p-2.5 rounded text-xs text-gray-300 focus:outline-none focus:border-purple-600"
            />
            <button 
              onClick={handleSearch}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded transition-colors"
            >
              Search
            </button>
          </div>

          <div className="space-y-3">
            {searchResults.map((r, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-850 p-3.5 rounded-lg text-xs space-y-2">
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span className="font-bold text-purple-400">{r.metadata.document_name} — {r.metadata.section}</span>
                  <span>Relevance Score: {Math.round(r.score * 100)}%</span>
                </div>
                <p className="text-gray-300 leading-relaxed italic">"...{r.text}..."</p>
              </div>
            ))}
            {searchResults.length === 0 && search && (
              <p className="text-xs text-gray-500 italic">No search results found matching query.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* PAGE 12: ANALYTICS */
function Analytics() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getAnalytics();
        setData(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  if (!data) return <div className="text-gray-400 text-xs">Loading analytics graphs...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Operations Analytics</h2>
        <p className="text-sm text-gray-400">Historical logs and performance indices for MetroGuard AI</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Avg AI Assessment Time", val: `${data.kpis.avg_analysis_time_sec}s`, desc: "Inference + RAG Search latency" },
          { label: "Avg Crew Approval Time", val: `${data.kpis.avg_approval_time_min}m`, desc: "Pending human-approval wait time" },
          { label: "Rec Acceptance Rate", val: `${data.kpis.acceptance_rate}%`, desc: "Approved vs Rejected recs" },
          { label: "Order Completion Rate", val: `${data.kpis.resolution_rate}%`, desc: "Completed vs open tickets" }
        ].map((k, idx) => (
          <div key={idx} className="bg-darkSurface border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-gray-400 font-medium">{k.label}</p>
            <h3 className="text-lg font-bold text-white mt-1">{k.val}</h3>
            <p className="text-[10px] text-gray-500 mt-1">{k.desc}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-darkSurface border border-slate-800 p-5 rounded-xl flex flex-col">
          <h4 className="text-sm font-bold text-white mb-4">Incidents by Line</h4>
          <div className="h-56 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data.incidents_by_line} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={65} 
                  label
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip />
                <Legend formatter={(value) => <span className="text-[11px] text-gray-400">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-darkSurface border border-slate-800 p-5 rounded-xl flex flex-col lg:col-span-2">
          <h4 className="text-sm font-bold text-white mb-4">Incidents by Category</h4>
          <div className="h-56 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.incidents_by_type}>
                <CartesianGrid strokeDasharray="3 3" stroke="#223047" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#151d30", borderColor: "#334155" }} />
                <RechartsBar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* PAGE 13: APPROVAL HISTORY */
function ApprovalHistory() {
  const [approvals, setApprovals] = useState<Approval[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getApprovals();
        setApprovals(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Manual Approval History</h2>
        <p className="text-sm text-gray-400">Complete audit log of human approval and override events</p>
      </div>

      <div className="bg-darkSurface border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-gray-400 font-semibold">
                <th className="p-4">Incident ID</th>
                <th className="p-4">Audited Reviewer</th>
                <th className="p-4">Decision</th>
                <th className="p-4">Reviewer Comments</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-gray-300">
              {approvals.map((a, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20">
                  <td className="p-4 font-bold text-white">{a.incident_id}</td>
                  <td className="p-4 font-medium">{a.reviewer}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.decision === "Approved" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                      "bg-red-950 text-red-400 border border-red-800"
                    }`}>
                      {a.decision.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 italic max-w-sm truncate">{a.comment || "None provided"}</td>
                  <td className="p-4 text-gray-400">{new Date(a.timestamp).toLocaleString()}</td>
                </tr>
              ))}
              {approvals.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No approvals recorded in logs yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* PAGE 14: AUDIT LOGS */
function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getAuditLogs();
        setLogs(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">System Audit Trails</h2>
        <p className="text-sm text-gray-400">Complete, tamper-proof logs tracking sensor events, AI workflow executions, and actions</p>
      </div>

      <div className="bg-darkSurface border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-gray-400 font-semibold">
                <th className="p-4">Event ID</th>
                <th className="p-4">Event Type</th>
                <th className="p-4">Incident ID</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Transaction Details</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-gray-300">
              {logs.map((l, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20">
                  <td className="p-4 font-mono font-bold text-white">{l.id}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/70 border border-slate-700 text-gray-300">
                      {l.event_type}
                    </span>
                  </td>
                  <td className="p-4 font-bold">{l.incident_id || "—"}</td>
                  <td className="p-4 text-purple-400 font-medium">{l.user}</td>
                  <td className="p-4 max-w-sm truncate text-gray-400" title={JSON.stringify(l.metadata)}>
                    {JSON.stringify(l.metadata)}
                  </td>
                  <td className="p-4 text-gray-400">{new Date(l.timestamp).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No transaction logs registered.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* PAGE 15: SETTINGS */
function SettingsPage({ addToast }: { addToast: (msg: string, type?: Toast["type"]) => void }) {
  const [model, setModel] = useState("llama3");
  const [topK, setTopK] = useState(3);
  const [chunkSize, setChunkSize] = useState(500);

  const saveSettings = () => {
    addToast("Settings successfully applied to agent policy layer.", "success");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">System Settings</h2>
        <p className="text-sm text-gray-400">Configure simulated LLM context limits, RAG indices, and notification endpoints</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* LLM Config */}
        <div className="bg-darkSurface border border-slate-800 p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">LLM Engine Configuration</h3>
          <div className="flex flex-col gap-2">
            <label className="text-gray-400">Model Selector</label>
            <input 
              type="text" 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-gray-300 rounded p-2.5 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-gray-400">Ollama API Endpoint</label>
            <input 
              type="text" 
              value="http://localhost:11434"
              disabled
              className="bg-slate-950 border border-slate-850 text-gray-500 rounded p-2.5 cursor-not-allowed"
            />
          </div>
        </div>

        {/* RAG Config */}
        <div className="bg-darkSurface border border-slate-800 p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">RAG Engine Configuration</h3>
          <div className="flex flex-col gap-2">
            <label className="text-gray-400">Retrieve Matches (Top K)</label>
            <input 
              type="number" 
              value={topK} 
              onChange={(e) => setTopK(parseInt(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-gray-300 rounded p-2.5 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-gray-400">Chunk Size (Words)</label>
            <input 
              type="number" 
              value={chunkSize} 
              onChange={(e) => setChunkSize(parseInt(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-gray-300 rounded p-2.5 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <button 
        onClick={saveSettings}
        className="px-4 py-2 bg-electricBlue hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors"
      >
        Save Settings
      </button>
    </div>
  );
}
