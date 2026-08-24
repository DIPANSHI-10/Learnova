import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Bell,
  BookOpenText,
  BrainCircuit,
  CalendarDays,
  CheckSquare2,
  ChevronLeft,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  NotebookPen,
  Settings2,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: MessageSquareText, label: "AI Assistant", path: "/app/assistant" },
  { icon: ClipboardList, label: "Study planner", path: "/app/planner" },
  { icon: CheckSquare2, label: "Tasks", path: "/app/tasks" },
  { icon: NotebookPen, label: "Notes", path: "/app/notes" },
  { icon: FileText, label: "Documents", path: "/app/documents" },
  { icon: GraduationCap, label: "Quiz studio", path: "/app/quiz" },
  { icon: BrainCircuit, label: "Flashcards", path: "/app/flashcards" },
  { icon: BookOpenText, label: "Summarize", path: "/app/summarize" },
  { icon: CalendarDays, label: "Calendar", path: "/app/calendar" },
  { icon: BarChart3, label: "Analytics", path: "/app/analytics" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { data: overview } = trpc.dashboard.overview.useQuery(undefined, { enabled: Boolean(user) });

  if (loading) {
    return <div className="min-h-screen bg-[#080a1b] grid place-items-center"><div className="nova-loader" /></div>;
  }
  if (!user) {
    return (
      <div className="min-h-screen nova-app-backdrop grid place-items-center p-6">
        <div className="nova-glass max-w-md rounded-[2rem] p-9 text-center shadow-2xl">
          <div className="nova-mark mx-auto mb-6"><Sparkles size={22} /></div>
          <h1 className="text-2xl font-semibold">Your learning space is protected.</h1>
          <p className="mt-3 text-sm text-muted-foreground">Sign in to access your plans, learning history, documents, and personal productivity data.</p>
          <button className="nova-button mt-7 w-full" onClick={() => startLogin()}>Continue securely</button>
        </div>
      </div>
    );
  }

  const initials = (user.name || "NovaMind User").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const changePage = (path: string) => { navigate(path); setMobileOpen(false); };

  return (
    <div className="min-h-screen bg-background text-foreground nova-app-backdrop">
      <aside className={`nova-sidebar ${mobileOpen ? "nova-sidebar-open" : ""}`}>
        <div className="flex items-center justify-between px-5 pb-7 pt-6">
          <button className="flex items-center gap-3" onClick={() => changePage("/dashboard")} aria-label="Go to dashboard">
            <span className="nova-mark"><Sparkles size={18} /></span>
            <span className="font-semibold tracking-tight">NovaMind <em className="not-italic text-cyan-300">AI</em></span>
          </button>
          <button className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="px-3">
          <p className="nova-nav-label">Workspace</p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const active = location === item.path;
              return <button key={item.path} onClick={() => changePage(item.path)} className={`nova-nav-item ${active ? "nova-nav-active" : ""}`}><item.icon size={17} /><span>{item.label}</span></button>;
            })}
          </nav>
          <p className="nova-nav-label mt-7">Personal</p>
          <button onClick={() => changePage("/app/settings")} className={`nova-nav-item ${location === "/app/settings" ? "nova-nav-active" : ""}`}><Settings2 size={17} /><span>Settings</span></button>
        </div>
        <div className="mt-auto border-t border-white/10 p-4">
          <div className="nova-upgrade-card mb-4">
            <Sparkles size={15} className="text-cyan-200" />
            <p>Make the next study session count.</p>
          </div>
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-xs font-bold text-white">{initials}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user.name || "NovaMind learner"}</p><p className="truncate text-xs text-muted-foreground">{user.email || "Personal workspace"}</p></div>
            <button onClick={logout} className="rounded-lg p-2 text-muted-foreground transition hover:bg-white/10 hover:text-rose-300" aria-label="Sign out"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      {mobileOpen && <button onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-[#060717]/70 backdrop-blur-sm lg:hidden" aria-label="Close navigation overlay" />}
      <main className="min-h-screen lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-white/7 bg-background/75 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3"><button className="rounded-xl border border-border bg-card p-2.5 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={18} /></button><div><p className="text-xs text-muted-foreground">Your focused workspace</p><p className="text-sm font-medium">Learn with momentum</p></div></div>
          <div className="flex items-center gap-2"><button onClick={toggleTheme} className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition hover:text-foreground" aria-label="Switch visual preference">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button><div className="relative"><button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition hover:text-foreground" aria-label="Notifications"><Bell size={17} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-300" /></button>{notificationsOpen && <div className="nova-notifications"><div className="flex items-center justify-between"><strong>Notifications</strong><button onClick={() => setNotificationsOpen(false)}><X size={15} /></button></div><p className="mt-1 text-xs text-muted-foreground">Your learning pulse, right now.</p><div className="mt-3 space-y-2">{[...(overview?.tasks || []).map((task) => ({ key: `task-${task.id}`, title: task.title, text: task.deadline ? `Task deadline · ${new Date(task.deadline).toLocaleDateString([], { month: "short", day: "numeric" })}` : "Task ready for your next focus block", icon: CheckSquare2 })), ...(overview?.deadlines || []).map((event) => ({ key: `event-${event.id}`, title: event.title, text: `${event.category} · ${new Date(event.startsAt).toLocaleDateString([], { month: "short", day: "numeric" })}`, icon: CalendarDays }))].slice(0, 4).map((notice) => <div className="nova-notification-row" key={notice.key}><span><notice.icon size={14} /></span><div><p>{notice.title}</p><small>{notice.text}</small></div></div>) || <p className="py-5 text-center text-xs text-muted-foreground">You are all caught up.</p>}</div></div>}</div></div>
        </header>
        <div className="mx-auto max-w-[1540px] px-5 py-7 sm:px-8 sm:py-9">{children}</div>
      </main>
    </div>
  );
}
