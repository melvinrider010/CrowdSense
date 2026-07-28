"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Wifi, 
  WifiOff, 
  Rss, 
  Compass, 
  AlertTriangle, 
  History, 
  Activity, 
  MapPin, 
  Bell, 
  ShieldAlert, 
  HardDrive,
  User,
  Lock,
  Mail,
  Shield,
  LogOut,
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  BarChart3,
  Cpu,
  Plus,
  Edit2,
  Trash2,
  Clock,
  X,
  Check,
  Volume2,
  VolumeX,
  BrainCircuit,
  AlertCircle,
  FileText,
  Download,
  Printer,
  Calendar,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "../components/GlassCard";
import { StatusBadge } from "../components/StatusBadge";
import { LiveChart } from "../components/LiveChart";
import { 
  HourlyDensityChart, 
  DailyActivityChart, 
  WeeklyDistributionChart, 
  MonthlyTrendChart 
} from "../components/AnalyticsCharts";

interface EventData {
  id?: number;
  device_id: string;
  distance: number;
  status: string;
  location: string;
  timestamp: string;
}

interface NotificationData {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  device_id?: number;
  event_id?: number;
  created_at: string;
}

interface DeviceData {
  id: number;
  device_id: string;
  status: string;
  location: string;
  created_at: string;
  updated_at: string;
  last_seen: string | null;
  ping: string;
}

export default function Dashboard() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics" | "devices" | "reports">("dashboard");

  // Authentication states
  const [token, setToken] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Operator");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Live dashboard states
  const [connected, setConnected] = useState(false);
  const [deviceData, setDeviceData] = useState<EventData>({
    device_id: "ESP001",
    distance: 150.0,
    status: "SAFE",
    location: "Temple Gate A",
    timestamp: new Date().toISOString()
  });
  
  const [history, setHistory] = useState<EventData[]>([]);
  const [distanceHistory, setDistanceHistory] = useState<number[]>([150, 142, 138, 120, 110, 95, 115, 125, 135, 150]);
  
  // Notification states
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDrawer, setShowDrawer] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Device Management states
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newDeviceLocation, setNewDeviceLocation] = useState("");
  const [newDeviceStatus, setNewDeviceStatus] = useState("ACTIVE");
  const [editLocation, setEditLocation] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [deviceActionError, setDeviceActionError] = useState<string | null>(null);

  // Reports states
  const [reportEvents, setReportEvents] = useState<EventData[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Check for existing token on mount and request browser notifications permission
  useEffect(() => {
    const savedToken = localStorage.getItem("crowdsense_token");
    if (savedToken) {
      setToken(savedToken);
    }
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("crowdsense_token");
    setToken(null);
    setConnected(false);
    setUsername("");
    setPassword("");
    setHistory([]);
    setNotifications([]);
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8000/api/notifications/", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const notifs: NotificationData[] = await res.json();
        setNotifications(notifs);
        const unread = notifs.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const fetchDevices = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8000/api/devices/", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data: DeviceData[] = await res.json();
        setDevices(data);
      }
    } catch (err) {
      console.error("Failed to fetch devices list:", err);
    }
  };

  // Fetch Reports list dynamically based on search filters
  const fetchReports = async () => {
    if (!token) return;
    setReportLoading(true);
    try {
      let url = "http://localhost:8000/api/events/";
      // We can reuse GET events but filter inside frontend if needed, or query from API.
      // Since GET /api/events/ returns all active events, we can load and filter locally for high speed,
      // or query. Let's load the list and apply dates/search query filter locally.
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data: EventData[] = await res.json();
        
        let filtered = data;
        if (startDate) {
          const startDt = new Date(startDate);
          filtered = filtered.filter(e => new Date(e.timestamp) >= startDt);
        }
        if (endDate) {
          const endDt = new Date(endDate);
          endDt.setHours(23, 59, 59, 999); // Inclusive
          filtered = filtered.filter(e => new Date(e.timestamp) <= endDt);
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(e => 
            e.device_id.toLowerCase().includes(q) ||
            e.location.toLowerCase().includes(q) ||
            e.status.toLowerCase().includes(q)
          );
        }
        setReportEvents(filtered);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setReportLoading(false);
    }
  };

  // Trigger loading report list when tab is activated or filters change
  useEffect(() => {
    if (activeTab === "reports") {
      fetchReports();
    }
  }, [activeTab, startDate, endDate, searchQuery]);

  // Export CSV File Download calling backend reports streaming API
  const handleExportCSV = async () => {
    if (!token) return;
    try {
      const url = `http://localhost:8000/api/reports/csv?start_date=${startDate}&end_date=${endDate}&search=${searchQuery}`;
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `crowdsense_incidents_report_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert("Failed to export report CSV.");
      }
    } catch (err) {
      console.error("CSV export operation failed:", err);
    }
  };

  // Trigger PDF Printing
  const handlePrintPDF = () => {
    window.print();
  };

  // Fetch initial event history & notifications via REST API
  useEffect(() => {
    if (!token) return;

    async function fetchInitialData() {
      try {
        const eventsRes = await fetch("http://localhost:8000/api/events/", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (eventsRes.ok) {
          const data: EventData[] = await eventsRes.json();
          if (data && data.length > 0) {
            setHistory(data.slice(0, 10));
            setDeviceData(data[0]);
            const distances = data.slice(0, 10).map((d) => d.distance).reverse();
            while (distances.length < 10) {
              distances.unshift(150);
            }
            setDistanceHistory(distances);
          }
        }
        fetchNotifications();
        fetchDevices();
      } catch (err) {
        console.error("Failed to fetch initial REST data:", err);
      }
    }

    fetchInitialData();
  }, [token]);

  const markNotificationAsRead = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8000/api/notifications/${id}/read`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Device CRUD Operations
  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeviceActionError(null);
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/api/devices/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ device_id: newDeviceId, location: newDeviceLocation, status: newDeviceStatus })
      });

      const data = await res.json();
      if (res.ok) {
        setShowRegModal(false);
        setNewDeviceId("");
        setNewDeviceLocation("");
        fetchDevices();
      } else {
        setDeviceActionError(data.detail || "Failed to register device.");
      }
    } catch (err) {
      setDeviceActionError("Could not connect to the server.");
    }
  };

  const handleEditDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeviceActionError(null);
    if (!token || !selectedDevice) return;

    try {
      const res = await fetch(`http://localhost:8000/api/devices/${selectedDevice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ location: editLocation, status: editStatus })
      });

      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        setSelectedDevice(null);
        fetchDevices();
      } else {
        setDeviceActionError(data.detail || "Failed to edit device parameters.");
      }
    } catch (err) {
      setDeviceActionError("Could not connect to the server.");
    }
  };

  const handleDeleteDevice = async (id: number) => {
    if (!token || !confirm("Are you sure you want to delete this device?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/devices/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDevices();
      } else {
        alert("Failed to delete device.");
      }
    } catch (err) {
      console.error("Failed to delete device:", err);
    }
  };

  // Synthetic Siren Sound Generator
  const playAlertSound = () => {
    if (!audioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(1000, audioCtx.currentTime + 0.25);
      oscillator.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("AudioContext failed to play alert sound:", e);
    }
  };

  // Dispatch Browser Notification
  const triggerBrowserPush = (title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico"
      });
    }
  };

  // WebSocket connection
  useEffect(() => {
    if (!token) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    function connectWS() {
      ws = new WebSocket(`ws://localhost:8000/ws/events?token=${token}`);
      
      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: EventData = JSON.parse(event.data);
          setDeviceData(data);
          setHistory((prev) => [data, ...prev.slice(0, 9)]);
          setDistanceHistory((prev) => [...prev.slice(1), data.distance]);

          if (data.status === "STAMPEDE_WARNING" || data.status === "STAMPEDE_RISK") {
            playAlertSound();
            triggerBrowserPush(
              `CrowdSense Alert: ${data.status.replace("_", " ")}`,
              `Node ${data.device_id} at ${data.location} reports critical distance: ${data.distance}cm.`
            );
            fetchNotifications();
            fetchDevices();
            if (activeTab === "reports") {
              fetchReports();
            }
          }
        } catch (err) {
          console.error("Failed to parse WebSocket event frame:", err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimeout = setTimeout(connectWS, 5000);
      };

      ws.onerror = (err) => {
        if (ws) ws.close();
      };

      wsRef.current = ws;
    }

    connectWS();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, [token, audioEnabled, activeTab]);

  // Auth operations
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (isLoginMode) {
        const res = await fetch("http://localhost:8000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem("crowdsense_token", data.access_token);
          setToken(data.access_token);
        } else {
          setAuthError(data.detail || "Authentication failed. Verify credentials.");
        }
      } else {
        const res = await fetch("http://localhost:8000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, role })
        });
        const data = await res.json();
        
        if (res.ok) {
          const loginRes = await fetch("http://localhost:8000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
          });
          const loginData = await loginRes.json();
          
          if (loginRes.ok) {
            localStorage.setItem("crowdsense_token", loginData.access_token);
            setToken(loginData.access_token);
          }
        } else {
          setAuthError(data.detail || "Registration failed. Verify details.");
        }
      }
    } catch (err) {
      setAuthError("Could not connect to the authentication server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const openEditModal = (device: DeviceData) => {
    setSelectedDevice(device);
    setEditLocation(device.location);
    setEditStatus(device.status);
    setShowEditModal(true);
  };

  // Auth screen
  if (!token) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              CROWDSENSE AI
            </h1>
            <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">
              Enterprise Crowd Monitoring Portal
            </p>
          </div>

          <GlassCard className="border-white/10 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-200 mb-6 text-center">
              {isLoginMode ? "Sign In to Console" : "Register Operator Account"}
            </h2>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input 
                    type="text" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 focus:border-blue-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none transition-all"
                    placeholder="operator_name"
                  />
                </div>
              </div>

              {!isLoginMode && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 focus:border-blue-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none transition-all"
                        placeholder="operator@crowdsense.ai"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">System Role</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <select 
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 focus:border-blue-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none transition-all appearance-none"
                      >
                        <option value="Admin">Admin (Full Control)</option>
                        <option value="Operator">Operator (Write/Read)</option>
                        <option value="Viewer">Viewer (Read Only)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Secret Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 focus:border-blue-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl py-2.5 font-bold text-sm transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] mt-4 flex items-center justify-center space-x-2"
              >
                <span>{authLoading ? "Verifying..." : isLoginMode ? "Enter Dashboard" : "Register User"}</span>
                {!authLoading && <ChevronRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-6 text-center border-t border-white/5 pt-4">
              <button 
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setAuthError(null);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                {isLoginMode ? "Create an operator account" : "Already registered? Sign in"}
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans relative overflow-hidden">
      {/* Dynamic CSS styles to apply cleaner layout when printing reports */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          aside, header, .no-print { display: none !important; }
          .print-layout { display: block !important; width: 100% !important; background: white !important; color: black !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; color: black !important; }
        }
      `}} />

      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-slate-950/60 backdrop-blur-md p-6 flex flex-col justify-between shrink-0 no-print">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? "bg-emerald-400" : "bg-rose-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connected ? "bg-emerald-500" : "bg-rose-500"}`}></span>
            </div>
            <h1 className="text-lg font-bold tracking-wider bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              CROWDSENSE AI
            </h1>
          </div>

          <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-full shrink-0 ${activeTab === "dashboard" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-slate-400 hover:bg-white/5 border border-transparent hover:text-slate-200"}`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Live Monitor</span>
            </button>

            <button 
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-full shrink-0 ${activeTab === "analytics" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-slate-400 hover:bg-white/5 border border-transparent hover:text-slate-200"}`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>System Analytics</span>
            </button>

            <button 
              onClick={() => { setActiveTab("devices"); fetchDevices(); }}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-full shrink-0 ${activeTab === "devices" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-slate-400 hover:bg-white/5 border border-transparent hover:text-slate-200"}`}
            >
              <Cpu className="h-4 w-4" />
              <span>Device Registry</span>
            </button>

            <button 
              onClick={() => { setActiveTab("reports"); fetchReports(); }}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-full shrink-0 ${activeTab === "reports" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-slate-400 hover:bg-white/5 border border-transparent hover:text-slate-200"}`}
            >
              <FileText className="h-4 w-4" />
              <span>Incidents Reports</span>
            </button>
          </nav>
        </div>

        <div className="hidden md:block pt-6 border-t border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
            <span className="font-semibold truncate">Operator Account</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all w-full"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto print-layout">
        <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30 no-print">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-extrabold">Console</span>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <span className="text-xs font-bold text-slate-300 capitalize">
              {activeTab === "dashboard" ? "Live Monitor" : activeTab === "analytics" ? "Analytics Console" : activeTab === "devices" ? "Devices Settings" : "System Reports"}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={() => setAudioEnabled(!audioEnabled)} className="p-2 hover:bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-slate-200 transition-all">
              {audioEnabled ? <Volume2 className="h-4 w-4 text-blue-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
            </button>

            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${connected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
              {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span className="hidden sm:inline">{connected ? "ACTIVE SECURE STREAM" : "DISCONNECTED"}</span>
            </div>

            <div className="relative">
              <button onClick={() => setShowDrawer(true)} className="p-2 hover:bg-white/5 rounded-xl transition-all border border-white/5 hover:border-white/10 relative">
                <Bell className="h-4 w-4 text-slate-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-600 text-[10px] text-white rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            
            <button onClick={handleLogout} className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl transition-all border border-white/5 md:hidden">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Views */}
        <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {activeTab === "dashboard" ? (
            /* Live Monitoring View */
            <>
              <AnimatePresence>
                {(deviceData.status === "STAMPEDE_WARNING" || deviceData.status === "STAMPEDE_RISK") && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-2xl border flex items-center space-x-4 shadow-[0_0_50px_rgba(239,68,68,0.1)] ${deviceData.status === "STAMPEDE_WARNING" ? "bg-rose-500/10 text-rose-200 border-rose-500/30" : "bg-amber-500/10 text-amber-200 border-amber-500/30"}`}
                  >
                    <div className={`p-3 rounded-xl ${deviceData.status === "STAMPEDE_WARNING" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"}`}>
                      <ShieldAlert className="h-6 w-6 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-base uppercase tracking-wider">
                        {deviceData.status.replace("_", " ")} Level Triggered
                      </h2>
                      <p className="text-xs opacity-80 mt-1">
                        Sensors at <strong>{deviceData.location}</strong> registered critical compression bounds. Distance: {deviceData.distance}cm. Deploy operator checks.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <GlassCard>
                  <div className="flex justify-between items-start text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Device Status</span>
                    <HardDrive className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="mt-4 flex flex-col">
                    <span className="text-2xl font-bold tracking-tight">{deviceData.device_id}</span>
                    <span className="text-xs text-slate-500 mt-1 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {deviceData.location}
                    </span>
                  </div>
                </GlassCard>

                <GlassCard>
                  <div className="flex justify-between items-start text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Live Distance</span>
                    <Rss className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="mt-4 flex flex-col">
                    <span className="text-3xl font-extrabold tracking-tight text-white">
                      {deviceData.distance} <span className="text-sm font-normal text-slate-400">cm</span>
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Trigger bounds: &lt; 20cm warning
                    </span>
                  </div>
                </GlassCard>

                <GlassCard>
                  <div className="flex justify-between items-start text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Crowd Level</span>
                    <Compass className="h-4 w-4 text-pink-400" />
                  </div>
                  <div className="mt-4 flex flex-col items-start">
                    <div className="h-9 flex items-center">
                      <StatusBadge status={deviceData.status} />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">
                      Real-time safety metric
                    </span>
                  </div>
                </GlassCard>

                <GlassCard>
                  <div className="flex justify-between items-start text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Network Latency</span>
                    <Activity className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="mt-4 flex flex-col">
                    <span className="text-2xl font-bold tracking-tight text-white">
                      {connected ? "0.2ms" : "--"}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Active websocket latency
                    </span>
                  </div>
                </GlassCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <GlassCard className="lg:col-span-2">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Distance Sparkline</h3>
                      <p className="text-xs text-slate-500">Trailing 10-point telemetry curves</p>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                      <span>Real-Time feed</span>
                    </div>
                  </div>
                  <div className="h-48 w-full mt-4 bg-slate-900/20 border border-white/5 rounded-xl p-4 overflow-hidden relative">
                    <LiveChart data={distanceHistory} color={deviceData.status === "STAMPEDE_WARNING" ? "#f43f5e" : "#3b82f6"} />
                  </div>
                </GlassCard>

                <GlassCard>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-2">Location Mapping</h3>
                  <p className="text-xs text-slate-500 mb-6">Spatial tracking points overview</p>
                  
                  <div className="h-48 border border-white/5 bg-slate-900/30 rounded-xl relative flex flex-col items-center justify-center text-slate-500 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="relative p-4 text-center">
                      <MapPin className="h-10 w-10 mx-auto text-blue-500/50 mb-3 animate-bounce" />
                      <span className="text-xs block font-bold text-slate-400">{deviceData.location}</span>
                      <span className="text-[10px] text-slate-600 mt-1 block">Active Zone Coordinates: Grid 3A</span>
                    </div>
                  </div>
                </GlassCard>
              </div>

              <GlassCard>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Newest Events</h3>
                    <p className="text-xs text-slate-500">Live events stream logged to database</p>
                  </div>
                  <History className="h-5 w-5 text-slate-600" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="pb-3">Timestamp</th>
                        <th className="pb-3">Device ID</th>
                        <th className="pb-3">Distance</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-600">
                            No logs collected. Waiting for telemetry reports...
                          </td>
                        </tr>
                      ) : (
                        history.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-all">
                            <td className="py-3.5 text-slate-400">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-3.5 font-semibold text-slate-200">{item.device_id}</td>
                            <td className="py-3.5 font-mono text-slate-300">{item.distance} cm</td>
                            <td className="py-3.5 text-slate-400">{item.location}</td>
                            <td className="py-3.5 text-right">
                              <StatusBadge status={item.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </>
          ) : activeTab === "analytics" ? (
            /* System Analytics View */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <GlassCard>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Telemetry Posts</span>
                  <div className="text-2xl font-bold mt-2 text-white">41,209</div>
                  <span className="text-[10px] text-emerald-400 mt-1 flex items-center font-bold">
                    <TrendingUp className="h-3 w-3 mr-1" /> +12% vs yesterday
                  </span>
                </GlassCard>

                <GlassCard>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Incident Count</span>
                  <div className="text-2xl font-bold mt-2 text-rose-400">18</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Critical compression triggers</span>
                </GlassCard>

                <GlassCard>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Sensors</span>
                  <div className="text-2xl font-bold mt-2 text-blue-400">6 Nodes</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Dynamic mesh channels</span>
                </GlassCard>

                <GlassCard>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Core Health</span>
                  <div className="text-2xl font-bold mt-2 text-emerald-400">99.8%</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">System uptime verification</span>
                </GlassCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-6">Hourly Traffic Density</h3>
                  <div className="h-40 w-full">
                    <HourlyDensityChart />
                  </div>
                </GlassCard>

                <GlassCard>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-6">Daily Activity Trends</h3>
                  <div className="h-40 w-full">
                    <DailyActivityChart />
                  </div>
                </GlassCard>

                <GlassCard>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-6">Weekly Distribution</h3>
                  <WeeklyDistributionChart />
                </GlassCard>

                <GlassCard>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-6">Monthly Volume Trends</h3>
                  <div className="h-40 w-full">
                    <MonthlyTrendChart />
                  </div>
                </GlassCard>
              </div>
            </div>
          ) : activeTab === "devices" ? (
            /* Device Registry Settings Tab View */
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">IoT Device Registry</h2>
                  <p className="text-xs text-slate-500">Manage hardware endpoints, locations, and sensor parameters</p>
                </div>
                <button
                  onClick={() => {
                    setDeviceActionError(null);
                    setShowRegModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center space-x-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register Node</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-slate-600">
                    <HardDrive className="h-10 w-10 mx-auto text-slate-700 mb-3" />
                    <p className="text-sm">No devices registered in mesh network.</p>
                  </div>
                ) : (
                  devices.map((device) => (
                    <GlassCard key={device.id} className="flex flex-col justify-between h-56 relative overflow-hidden">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <Cpu className="h-5 w-5 text-blue-400" />
                            <span className="font-bold text-sm text-slate-200">{device.device_id}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${device.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                            {device.status}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-400">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3.5 w-3.5 text-slate-500" />
                            <span>Location: <strong>{device.location}</strong></span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Activity className="h-3.5 w-3.5 text-slate-500" />
                            <span>Telemetry Latency: <strong className={device.ping === "Offline" ? "text-rose-400" : "text-emerald-400"}>{device.ping}</strong></span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            <span className="truncate">Last Seen: <strong>{device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : "Never"}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-3 mt-4 flex justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(device)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all border border-transparent hover:border-white/5"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDevice(device.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-all border border-transparent hover:border-rose-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* System Reports Settings Tab View */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 no-print">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Incidents Reports Console</h2>
                  <p className="text-xs text-slate-500">Query and export recorded telemetry history datasets</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleExportCSV}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center space-x-1.5"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={handlePrintPDF}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center space-x-1.5"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Filtering Panel */}
              <GlassCard className="no-print">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      <span>Start Date</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 focus:border-blue-500/50 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      <span>End Date</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 focus:border-blue-500/50 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center space-x-1">
                      <Search className="h-3 w-3 text-slate-500" />
                      <span>Search Query</span>
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 focus:border-blue-500/50 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none transition-all"
                      placeholder="Device, Location or Status"
                    />
                  </div>
                </div>
              </GlassCard>

              {/* Data Table */}
              <GlassCard className="print-layout">
                <div className="flex justify-between items-center mb-6 no-print">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Filtered Event Datasets</h3>
                  <span className="text-xs text-slate-500">Total matched: <strong>{reportEvents.length}</strong></span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="pb-3">Timestamp</th>
                        <th className="pb-3">Device ID</th>
                        <th className="pb-3">Distance</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {reportLoading ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500">
                            Querying datasets...
                          </td>
                        </tr>
                      ) : reportEvents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-600">
                            No logs matched the active filters.
                          </td>
                        </tr>
                      ) : (
                        reportEvents.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-all">
                            <td className="py-3.5 text-slate-400">
                              {new Date(item.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3.5 font-semibold text-slate-200">{item.device_id}</td>
                            <td className="py-3.5 font-mono text-slate-300">{item.distance} cm</td>
                            <td className="py-3.5 text-slate-400">{item.location}</td>
                            <td className="py-3.5 text-right">
                              <StatusBadge status={item.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Notification Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="absolute inset-0 bg-black z-40"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="absolute right-0 top-0 h-full w-full sm:w-96 bg-slate-950 border-l border-white/10 z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base tracking-wider text-slate-200">Alert Drawer</h2>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5">System Incident logs</p>
                </div>
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent hover:border-white/5 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-20 text-slate-600">
                    <Check className="h-8 w-8 mx-auto text-emerald-500/50 mb-3" />
                    <p className="text-xs">No alerts recorded in database.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between ${n.is_read ? "bg-white/2" : "bg-gradient-to-r from-slate-900 to-indigo-950/20"} ${n.title.toUpperCase().includes("WARNING") ? "border-rose-500/20" : "border-white/5"}`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${n.title.toUpperCase().includes("WARNING") ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                            {n.title}
                          </span>
                          <span className="text-[9px] text-slate-500 font-semibold">
                            {new Date(n.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs mt-2 leading-relaxed">{n.message}</p>
                      </div>

                      {!n.is_read && (
                        <button
                          onClick={() => markNotificationAsRead(n.id)}
                          className="mt-3 text-[10px] text-blue-400 hover:text-blue-300 font-bold self-end flex items-center space-x-1"
                        >
                          <Check className="h-3 w-3" />
                          <span>Acknowledge</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal - Register Device */}
      <AnimatePresence>
        {showRegModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setShowRegModal(false)} className="absolute inset-0 bg-black" />
            
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-sm">
              <GlassCard className="border-white/10 shadow-2xl p-6">
                <h3 className="text-base font-bold text-slate-200 mb-4 text-center">Register IoT Node</h3>
                
                {deviceActionError && (
                  <div className="mb-3 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
                    {deviceActionError}
                  </div>
                )}

                <form onSubmit={handleRegisterDevice} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Device ID / MAC</label>
                    <input
                      type="text"
                      required
                      value={newDeviceId}
                      onChange={(e) => setNewDeviceId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 focus:border-blue-500/50 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none transition-all"
                      placeholder="ESP004"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Installation Zone</label>
                    <input
                      type="text"
                      required
                      value={newDeviceLocation}
                      onChange={(e) => setNewDeviceLocation(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 focus:border-blue-500/50 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none transition-all"
                      placeholder="Exit Gate B"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Operational Status</label>
                    <select
                      value={newDeviceStatus}
                      onChange={(e) => setNewDeviceStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 focus:border-blue-500/50 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none transition-all appearance-none"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRegModal(false)}
                      className="w-1/2 border border-white/10 hover:bg-white/5 text-slate-400 rounded-xl py-2 text-xs font-bold transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 text-xs font-bold transition-all active:scale-95 shadow-md"
                    >
                      Register
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Edit Device */}
      <AnimatePresence>
        {showEditModal && selectedDevice && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-black" />
            
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-sm">
              <GlassCard className="border-white/10 shadow-2xl p-6">
                <h3 className="text-base font-bold text-slate-200 mb-4 text-center">Edit Node: {selectedDevice.device_id}</h3>
                
                {deviceActionError && (
                  <div className="mb-3 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
                    {deviceActionError}
                  </div>
                )}

                <form onSubmit={handleEditDevice} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Installation Zone</label>
                    <input
                      type="text"
                      required
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 focus:border-blue-500/50 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none transition-all"
                      placeholder="Exit Gate B"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Operational Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 focus:border-blue-500/50 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none transition-all appearance-none"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="w-1/2 border border-white/10 hover:bg-white/5 text-slate-400 rounded-xl py-2 text-xs font-bold transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 text-xs font-bold transition-all active:scale-95 shadow-md"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}