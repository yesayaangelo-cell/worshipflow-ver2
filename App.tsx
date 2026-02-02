import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Search, 
  Clock, 
  Mic2, 
  LogOut, 
  Plus, 
  X, 
  Trash2, 
  Edit3, 
  UserPlus, 
  ListMusic, 
  Lock, 
  PanelLeftClose, 
  PanelLeftOpen, 
  AlertTriangle, 
  Share2, 
  Check, 
  User, 
  Music, 
  Settings, 
  Church, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Menu, 
  ChevronRight, 
  MoreVertical, 
  StickyNote,
  Command,
  Phone,
  Power,
  Heart,
  Copy,
  ExternalLink,
  Zap,
  Sparkles
} from 'lucide-react';
import { STORAGE_KEYS, DEFAULTS, STANDARD_ROLES, MEMBER_LIMIT, EVENT_LIMIT } from './constants';
import { Member, Event, Assignment, Song, AppTab, Role, AdminProfile } from './types';
import { geminiService } from './geminiService';

// --- BRANDING COMPONENTS ---

const WorshipFlowLogo = ({ size = "md", showText = false, className = "", collapsed = false }: { size?: "sm" | "md" | "lg" | "xl", showText?: boolean, className?: string, collapsed?: boolean }) => {
  const dimensions = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-24 h-24",
    xl: "w-48 h-48"
  };

  return (
    <div className={`flex flex-col items-center justify-center transition-all duration-300 ${className}`}>
      <div className={`${dimensions[size]} relative group`}>
        <div className="absolute inset-0 bg-[#C0FF00] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-full scale-150"></div>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-full h-full drop-shadow-xl">
          <path 
            d="M50 5C25.1472 5 5 25.1472 5 50C5 74.8528 25.1472 95 50 95C74.8528 95 95 74.8528 95 50" 
            stroke="#C0FF00" 
            strokeWidth="2" 
            strokeLinecap="round"
            className="opacity-20"
          />
          <path 
            d="M50 85C65 85 75 75 75 60C75 45 60 40 50 20C40 40 25 45 25 60C25 75 35 85 50 85Z" 
            fill="#C0FF00" 
          />
          <path 
            d="M50 85C58 85 64 80 64 72C64 64 56 62 50 50C44 62 36 64 36 72C36 80 42 85 50 85Z" 
            fill="black" 
            className="opacity-40"
          />
        </svg>
      </div>
      {showText && !collapsed && (
        <div className="mt-6 text-center animate-in fade-in duration-500">
          <h1 className="text-4xl font-black tracking-tighter text-[#FFFFFF] leading-none">
            Worship<span className="text-[#C0FF00]">Flow</span>
          </h1>
          <p className="mt-2 text-[10px] font-bold text-[#888888] uppercase tracking-[0.4em]">Your Tech Worship Partner</p>
        </div>
      )}
    </div>
  );
};

// --- CUSTOM HOOKS ---

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue((prev: T) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.error(`Error saving localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

// --- COMPONENTS ---

const Toast = ({ message, show }: { message: string, show: boolean }) => (
  <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
    <div className="bg-[#1A1A1A] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#262626] backdrop-blur-xl">
      <div className="bg-[#C0FF00]/20 text-[#C0FF00] p-1.5 rounded-lg shrink-0">
        <Check size={18} strokeWidth={3} />
      </div>
      <span className="font-bold text-sm tracking-tight whitespace-nowrap">{message}</span>
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClose={onClose} />
      <div className="bg-[#1A1A1A] rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-[#262626] flex flex-col max-h-[90vh] relative z-10">
        <div className="px-8 py-6 border-b border-[#262626] flex justify-between items-center shrink-0">
          <h3 className="font-black text-[#FFFFFF] text-xl tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-[#888888] hover:text-[#C0FF00] transition-all p-2 hover:bg-[#C0FF00]/10 rounded-full">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 overflow-y-auto bg-[#1A1A1A] custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="bg-[#1A1A1A] rounded-[2rem] shadow-2xl w-full max-sm:max-w-xs max-w-sm p-8 animate-in zoom-in-95 duration-200 relative z-10 border border-[#262626]">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#C0FF00]/10 text-[#C0FF00] rounded-[1.5rem] flex items-center justify-center mb-6">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-black text-[#FFFFFF] mb-2">{title}</h3>
          <p className="text-sm text-[#888888] leading-relaxed mb-8">{message}</p>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 px-6 py-4 bg-[#262626] text-[#FFFFFF] font-bold rounded-2xl hover:bg-[#333333] transition-all">Cancel</button>
            <button onClick={onConfirm} className="flex-1 px-6 py-4 bg-red-600/20 text-red-500 border border-red-500/20 font-bold rounded-2xl hover:bg-red-600 hover:text-white transition-all">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP CONTENT ---

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage(STORAGE_KEYS.IS_LOGGED_IN, false);
  const [profile, setProfile] = useLocalStorage<AdminProfile>(STORAGE_KEYS.PROFILE, DEFAULTS.PROFILE);
  const [members, setMembers] = useLocalStorage(STORAGE_KEYS.MEMBERS, DEFAULTS.MEMBERS);
  const [events, setEvents] = useLocalStorage(STORAGE_KEYS.EVENTS, DEFAULTS.EVENTS);
  const [assignments, setAssignments] = useLocalStorage(STORAGE_KEYS.ASSIGNMENTS, DEFAULTS.ASSIGNMENTS);
  const [eventSongs, setEventSongs] = useLocalStorage(STORAGE_KEYS.SONGS, DEFAULTS.SONGS);
  const [activeTab, setActiveTab] = useLocalStorage<AppTab>('wf_active_tab_persistent', 'dashboard');

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const [modalType, setModalType] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [toast, setToast] = useState({ show: false, message: '' });
  
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<any>({});
  const [newSong, setNewSong] = useState({ title: '', key: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [aiTheme, setAiTheme] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Auto-close sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(true); }
      if (e.key === 'Escape') { setIsSearchOpen(false); setModalType(null); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const selectedEvent = useMemo(() => events.find(e => e.id === selectedEventId), [events, selectedEventId]);

  const adminInitials = useMemo(() => {
    return profile.adminName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'AD';
  }, [profile.adminName]);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPass === (profile.password || 'admin123')) {
      setIsLoggedIn(true);
      setLoginError(false);
      setLoginPass('');
    } else {
      setLoginError(true);
    }
  };

  const shareContent = async (title: string, text: string) => {
    if (navigator.share) {
      try { await navigator.share({ title, text }); showToast("Shared successfully"); } catch {}
    } else {
      navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard!"));
    }
  };

  const handleShareSchedule = (event: Event) => {
    const team = assignments.filter(a => a.eventId === event.id);
    const songs = eventSongs.filter(s => s.eventId === event.id);
    const dateStr = new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
    let text = `🗓️ *WORSHIP SCHEDULE*\n*${event.name}*\n📅 ${dateStr} • ⏰ ${event.time}\n\n🎵 *SETLIST:*\n`;
    songs.forEach((s, idx) => { text += `${idx + 1}. ${s.title} (${s.key})\n`; });
    text += `\n🎸 *TEAM:*\n`;
    team.forEach(a => {
      const member = members.find(m => m.id === a.memberId);
      text += `• ${a.role}: ${member ? member.name : '-'}\n`;
    });
    shareContent(`Worship Schedule - ${event.name}`, text);
  };

  const handleShareAllSchedules = () => {
    if (events.length === 0) return showToast("No schedules");
    let text = `🗓️ *ALL WORSHIP SCHEDULES*\n============================\n\n`;
    sortedEvents.forEach(ev => {
        const team = assignments.filter(a => a.eventId === ev.id);
        const songs = eventSongs.filter(s => s.eventId === ev.id);
        text += `*${ev.name}*\n📅 ${new Date(ev.date).toLocaleDateString()} • ${ev.time}\n🎵 Setlist: ${songs.length} songs\n🎸 Team: ${team.length} assigned\n\n`;
    });
    shareContent("All Worship Schedules", text);
  };

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSong.title || !newSong.key || !selectedEventId) return;
    setEventSongs(prev => [...prev, { id: `s${Date.now()}`, eventId: selectedEventId, title: newSong.title, key: newSong.key, notes: '' }]);
    setNewSong({ title: '', key: '' });
    showToast("Song added");
  };

  const handleUpdateSongNotes = (songId: string, notes: string) => {
    setEventSongs(prev => prev.map(s => s.id === songId ? { ...s, notes } : s));
  };

  const handleSuggestSetlist = async () => {
    if (!aiTheme || !selectedEventId) return;
    setIsAiLoading(true);
    const suggestions = await geminiService.suggestSetlist(aiTheme);
    if (suggestions.length > 0) {
      const newSongs: Song[] = suggestions.map((s: any) => ({
        id: `s${Math.random().toString(36).substr(2, 9)}`,
        eventId: selectedEventId,
        title: s.title,
        key: s.key,
        notes: s.reason
      }));
      setEventSongs(prev => [...prev, ...newSongs]);
      showToast(`${suggestions.length} songs added via AI!`);
      setAiTheme('');
    } else {
      showToast("Could not generate suggestions");
    }
    setIsAiLoading(false);
  };

  const handleAssignMember = (role: Role, memberId: string) => {
    if (!selectedEventId) return;
    setAssignments(prev => {
      const filtered = prev.filter(a => !(a.eventId === selectedEventId && a.role === role));
      if (!memberId) return filtered;
      return [...filtered, { id: `a${Date.now()}`, eventId: selectedEventId, role, memberId }];
    });
    showToast(`Role updated`);
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (events.length >= EVENT_LIMIT) { showToast("Limit reached!"); return; }
    const newEvent = { ...formData, id: `e${Date.now()}`, category: 'Sunday Service' };
    setEvents(prev => [...prev, newEvent]);
    setModalType(null);
    showToast("Event created");
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalType === 'add_member') {
      if (members.length >= MEMBER_LIMIT) { showToast("Team limit reached!"); return; }
      const initials = formData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
      setMembers(prev => [...prev, { id: `m${Date.now()}`, ...formData, avatar: initials, status: formData.status || 'active' }]);
      showToast("Member added");
    } else {
      setMembers(prev => prev.map(m => m.id === selectedMemberId ? { ...m, ...formData } : m));
      showToast("Member updated");
    }
    setModalType(null);
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return [];
    return members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [members, searchQuery]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return [];
    return events.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [events, searchQuery]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center p-6 selection:bg-[#C0FF00] selection:text-black">
        <div className="bg-[#1A1A1A] p-12 sm:p-16 rounded-[3rem] border border-[#262626] w-full max-w-lg animate-in fade-in zoom-in-95 duration-700 flex flex-col items-center relative overflow-hidden">
          <WorshipFlowLogo size="xl" showText={true} className="mb-14" />
          <form onSubmit={handleLogin} className="w-full space-y-8 relative z-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-[#888888] uppercase tracking-[0.4em] px-1 block text-center">Authorized Access Only</label>
              <div className="relative group">
                <Lock className={`absolute left-6 top-1/2 -translate-y-1/2 transition-all duration-300 ${loginError ? 'text-red-500' : 'text-[#888888] group-focus-within:text-[#C0FF00]'}`} size={22} />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full pl-16 pr-16 py-6 bg-[#0B0B0B] border rounded-3xl outline-none transition-all duration-300 font-black text-2xl tracking-widest text-center ${loginError ? 'border-red-500 text-red-500' : 'border-[#262626] focus:border-[#C0FF00] text-[#FFFFFF]'}`}
                  value={loginPass}
                  onChange={(e) => { setLoginPass(e.target.value); if(loginError) setLoginError(false); }}
                  required
                />
              </div>
              {loginError && <p className="text-[11px] font-black text-red-500 px-1 text-center font-bold">Access key denied.</p>}
            </div>
            <button type="submit" className="w-full bg-[#C0FF00] text-black font-black py-6 rounded-3xl transition-all flex items-center justify-center gap-4 active:scale-95 text-lg neon-glow">
              <KeyRound size={24} /> Unlock Platform
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0B0B0B] text-[#FFFFFF] overflow-hidden selection:bg-[#C0FF00] selection:text-black">
      <Toast message={toast.message} show={toast.show} />
      <ConfirmModal 
        isOpen={confirmState.isOpen} 
        onClose={() => setConfirmState(p => ({...p, isOpen: false}))} 
        onConfirm={() => { confirmState.onConfirm(); setConfirmState(p => ({...p, isOpen: false})); }} 
        title={confirmState.title} message={confirmState.message} 
      />

      {/* Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-20">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="bg-[#1A1A1A] w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative z-10 border border-[#262626]">
            <div className="p-6 border-b border-[#262626] flex items-center gap-4">
              <Search className="text-[#888888]" size={24} />
              <input 
                autoFocus
                type="text" 
                placeholder="Search team or events..." 
                className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-white placeholder:text-[#333333]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
              {searchQuery ? (
                <div className="space-y-6">
                  {filteredMembers.length > 0 && (
                    <div>
                      <h4 className="px-4 text-[10px] font-black text-[#888888] uppercase tracking-widest mb-3">Members</h4>
                      {filteredMembers.map(m => (
                        <button key={m.id} onClick={() => { setActiveTab('team'); setIsSearchOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#262626] flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#C0FF00] text-black flex items-center justify-center text-[10px] font-black">{m.avatar}</div>
                          <span className="font-bold text-white">{m.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {filteredEvents.length > 0 && (
                    <div>
                      <h4 className="px-4 text-[10px] font-black text-[#888888] uppercase tracking-widest mb-3">Events</h4>
                      {filteredEvents.map(e => (
                        <button key={e.id} onClick={() => { setActiveTab('schedule'); setIsSearchOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#262626] flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#262626] text-[#C0FF00] flex items-center justify-center"><Calendar size={14} /></div>
                          <span className="font-bold text-white">{e.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : <div className="p-10 text-center text-[#333333] font-black uppercase text-xs tracking-widest italic">Start typing to search...</div>}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Backdrop - Minimizes sidebar when clicking outside on mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 xl:hidden animate-in fade-in duration-300" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar - Collapsible functionality */}
      <aside className={`fixed inset-y-0 left-0 z-[60] flex flex-col transition-all duration-300 bg-[#1A1A1A] border-r border-[#262626] ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full xl:w-20 xl:translate-x-0 overflow-hidden'}`}>
        <div className={`px-6 py-8 flex items-center transition-all duration-300 gap-3 ${!isSidebarOpen && 'justify-center'}`}>
          <WorshipFlowLogo size="sm" collapsed={!isSidebarOpen} />
          {isSidebarOpen && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden">
              <h1 className="font-black text-sm text-white tracking-tight uppercase truncate max-w-[150px]">{profile.churchName}</h1>
              <p className="text-[8px] text-[#C0FF00] font-black tracking-widest uppercase">TECH PARTNER</p>
            </div>
          )}
        </div>
        
        <nav className="flex-1 mt-6 px-4 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'schedule', icon: Calendar, label: 'Schedules' },
            { id: 'team', icon: Users, label: 'Worship Team' },
          ].map(m => (
            <button 
              key={m.id} 
              onClick={() => { setActiveTab(m.id as AppTab); if(window.innerWidth < 1280) setIsSidebarOpen(false); }} 
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${activeTab === m.id ? 'bg-[#C0FF00] text-black font-black shadow-[0_0_15px_rgba(192,255,0,0.2)]' : 'text-[#888888] hover:text-[#FFFFFF] hover:bg-[#262626]'} ${!isSidebarOpen && 'justify-center'}`}
            >
              <m.icon size={22} strokeWidth={activeTab === m.id ? 3 : 2} className="shrink-0" />
              {isSidebarOpen && <span className="text-xs uppercase tracking-widest whitespace-nowrap animate-in fade-in duration-300">{m.label}</span>}
              {!isSidebarOpen && (
                 <div className="absolute left-full ml-4 px-3 py-2 bg-[#262626] text-[#C0FF00] text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-[#C0FF00]/20 shadow-xl">
                   {m.label}
                 </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 mb-4">
          {isSidebarOpen ? (
            <div className="bg-[#262626] p-4 rounded-3xl border border-[#333333] animate-in fade-in zoom-in-95 duration-300">
               <div className="flex items-center gap-2 mb-2">
                 <Heart size={14} className="text-[#C0FF00]" fill="currentColor" />
                 <p className="text-[10px] font-black uppercase text-white tracking-widest">Support Us</p>
               </div>
               <button onClick={() => setModalType('donate')} className="w-full bg-[#C0FF00] text-black py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Donate</button>
            </div>
          ) : (
            <button onClick={() => setModalType('donate')} className="w-full flex justify-center p-3 text-[#C0FF00] hover:bg-[#262626] rounded-2xl transition-all group relative">
               <Heart size={20} fill="currentColor" />
               <div className="absolute left-full ml-4 px-3 py-2 bg-[#262626] text-[#C0FF00] text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-[#C0FF00]/20">
                 Donate
               </div>
            </button>
          )}
        </div>
      </aside>

      <main className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? 'xl:pl-72' : 'xl:pl-20'}`}>
        {/* Header */}
        <header className="h-24 bg-[#0B0B0B] border-b border-[#262626] flex items-center justify-between px-6 xl:px-12 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-3 bg-[#1A1A1A] border border-[#262626] rounded-2xl text-[#C0FF00] hover:bg-[#262626] transition-all hover:scale-110 active:scale-95 shadow-lg"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <div className="transition-all duration-300">
              <h2 className="text-xl lg:text-2xl font-black text-[#FFFFFF] uppercase tracking-tighter">{activeTab}</h2>
              <p className="text-[10px] text-[#888888] font-bold uppercase tracking-widest hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSearchOpen(true)} className="hidden md:flex items-center gap-3 bg-[#1A1A1A] border border-[#262626] px-4 py-2 rounded-xl text-[#888888] hover:text-[#C0FF00] transition-all">
               <Search size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Search (⌘K)</span>
            </button>
            <button onClick={() => { setFormData(profile); setModalType('edit_profile'); }} className="flex items-center gap-3 bg-[#1A1A1A] border border-[#262626] p-2 rounded-2xl hover:border-[#C0FF00] transition-all active:scale-95">
              <div className="w-10 h-10 rounded-xl bg-[#C0FF00] text-black flex items-center justify-center font-black text-xs">{adminInitials}</div>
              <div className="hidden sm:block text-left">
                <p className="text-[10px] font-black text-white uppercase tracking-tight leading-tight">{profile.adminName}</p>
                <p className="text-[8px] font-bold text-[#888888] uppercase tracking-widest leading-none mt-1">Director</p>
              </div>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 xl:px-12 py-12 custom-scrollbar bg-[#0B0B0B]">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-500">
                {[
                  { val: events.length, label: 'Services', icon: Calendar, accent: '#C0FF00' },
                  { val: members.length, label: 'Worship Team', icon: Users, accent: '#C0FF00' },
                  { val: eventSongs.length, label: 'Library', icon: Music, accent: '#C0FF00' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#1A1A1A] p-10 rounded-[2rem] border border-[#262626] group hover:border-[#C0FF00]/30 transition-all shadow-xl">
                    <stat.icon className="text-[#C0FF00] mb-6 group-hover:scale-110 transition-transform" size={32} />
                    <h3 className="text-5xl font-black text-white mb-2 tracking-tighter">{stat.val}</h3>
                    <p className="text-[11px] font-black text-[#888888] uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'schedule' && (
              <section className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Smart Schedule</h3>
                    <p className="text-[11px] font-black text-[#888888] uppercase tracking-widest mt-1">Upcoming services: {events.length} / {EVENT_LIMIT}</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={handleShareAllSchedules} className="flex-1 sm:flex-none bg-[#1A1A1A] border border-[#262626] text-white px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#262626] hover:border-[#333333] transition-all flex items-center gap-2">
                      <Share2 size={14} /> Share All
                    </button>
                    <button onClick={() => { setFormData({ date: new Date().toISOString().split('T')[0], time: '09:00' }); setModalType('add_event'); }} className="flex-1 sm:flex-none bg-[#C0FF00] text-black px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest neon-glow active:scale-95 transition-all flex items-center gap-2">
                      <Plus size={16} strokeWidth={3} /> New Service
                    </button>
                  </div>
                </div>

                {/* Modern Card Feed */}
                <div className="flex flex-col gap-6">
                  {sortedEvents.map(ev => {
                    const eventDate = new Date(ev.date);
                    const eventAssignments = assignments.filter(a => a.eventId === ev.id);
                    const eventSongsList = eventSongs.filter(s => s.eventId === ev.id);
                    
                    // Group assignments by category
                    const worshipLeader = eventAssignments.find(a => a.role === 'WL');
                    const singers = eventAssignments.filter(a => a.role === 'Singer');
                    const musicians = eventAssignments.filter(a => !['WL', 'Singer'].includes(a.role));
                    
                    const wlMember = worshipLeader ? members.find(m => m.id === worshipLeader.memberId) : null;

                    return (
                      <div key={ev.id} className="bg-[#1A1A1A] rounded-3xl border border-[#262626] hover:border-[#C0FF00]/40 transition-all group shadow-xl overflow-hidden">
                        {/* Card Header - Date & Service Name */}
                        <div className="bg-gradient-to-r from-[#0B0B0B] to-[#1A1A1A] px-6 py-5 border-b border-[#262626]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                              {/* Date Badge */}
                              <div className="bg-[#C0FF00]/10 border border-[#C0FF00]/30 px-4 py-3 rounded-2xl flex flex-col items-center min-w-[70px]">
                                <span className="text-[10px] font-black text-[#C0FF00] uppercase tracking-wider">{eventDate.toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-2xl font-black text-white leading-none mt-0.5">{eventDate.getDate()}</span>
                                <span className="text-[8px] font-bold text-[#888888] uppercase mt-1">{eventDate.toLocaleString('default', { weekday: 'short' })}</span>
                              </div>
                              {/* Service Info */}
                              <div>
                                <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-[#C0FF00] transition-colors">{ev.name}</h4>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-[9px] font-black text-[#888888] bg-[#0B0B0B] border border-[#262626] px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock size={10} className="text-[#C0FF00]" /> {ev.time}
                                  </span>
                                  <span className="text-[9px] font-black text-[#C0FF00] bg-[#C0FF00]/10 border border-[#C0FF00]/20 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                    {ev.category || 'Sunday Service'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => setConfirmState({ isOpen: true, title: 'Delete Schedule?', message: 'This action cannot be undone.', onConfirm: () => setEvents(prev => prev.filter(e => e.id !== ev.id)) })} 
                                className="p-2.5 text-[#888888] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Team Quick-View Grid */}
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {/* Worship Leader */}
                            <div className="bg-[#0B0B0B] p-4 rounded-2xl border border-[#262626] hover:border-[#C0FF00]/20 transition-all">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-lg bg-[#C0FF00]/20 flex items-center justify-center">
                                  <Mic2 size={12} className="text-[#C0FF00]" />
                                </div>
                                <span className="text-[9px] font-black text-[#C0FF00] uppercase tracking-widest">Worship Leader</span>
                              </div>
                              {wlMember ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-[#C0FF00] text-black flex items-center justify-center font-black text-[10px]">
                                    {wlMember.avatar}
                                  </div>
                                  <span className="text-sm font-bold text-white">{wlMember.name}</span>
                                </div>
                              ) : (
                                <p className="text-[11px] font-bold text-[#333333] italic">Not assigned</p>
                              )}
                            </div>

                            {/* Singers */}
                            <div className="bg-[#0B0B0B] p-4 rounded-2xl border border-[#262626] hover:border-[#C0FF00]/20 transition-all">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-lg bg-[#C0FF00]/20 flex items-center justify-center">
                                  <Music size={12} className="text-[#C0FF00]" />
                                </div>
                                <span className="text-[9px] font-black text-[#C0FF00] uppercase tracking-widest">Singers</span>
                                {singers.length > 0 && <span className="text-[9px] font-black text-[#888888]">({singers.length})</span>}
                              </div>
                              {singers.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {singers.map(a => {
                                    const member = members.find(m => m.id === a.memberId);
                                    return member ? (
                                      <div key={a.id} className="flex items-center gap-2 bg-[#1A1A1A] px-2.5 py-1.5 rounded-lg border border-[#262626]">
                                        <div className="w-5 h-5 rounded-md bg-[#262626] text-white flex items-center justify-center font-black text-[7px]">
                                          {member.avatar}
                                        </div>
                                        <span className="text-[10px] font-bold text-white">{member.name.split(' ')[0]}</span>
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              ) : (
                                <p className="text-[11px] font-bold text-[#333333] italic">Not assigned</p>
                              )}
                            </div>

                            {/* Musicians */}
                            <div className="bg-[#0B0B0B] p-4 rounded-2xl border border-[#262626] hover:border-[#C0FF00]/20 transition-all">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-lg bg-[#C0FF00]/20 flex items-center justify-center">
                                  <Users size={12} className="text-[#C0FF00]" />
                                </div>
                                <span className="text-[9px] font-black text-[#C0FF00] uppercase tracking-widest">Musicians</span>
                                {musicians.length > 0 && <span className="text-[9px] font-black text-[#888888]">({musicians.length})</span>}
                              </div>
                              {musicians.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {musicians.map(a => {
                                    const member = members.find(m => m.id === a.memberId);
                                    return member ? (
                                      <div key={a.id} className="flex items-center gap-2 bg-[#1A1A1A] px-2.5 py-1.5 rounded-lg border border-[#262626]">
                                        <div className="w-5 h-5 rounded-md bg-[#262626] text-white flex items-center justify-center font-black text-[7px]">
                                          {member.avatar}
                                        </div>
                                        <span className="text-[10px] font-bold text-white">{member.name.split(' ')[0]}</span>
                                        <span className="text-[8px] font-bold text-[#888888] uppercase">{a.role}</span>
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              ) : (
                                <p className="text-[11px] font-bold text-[#333333] italic">Not assigned</p>
                              )}
                            </div>
                          </div>

                          {/* Setlist Preview */}
                          {eventSongsList.length > 0 && (
                            <div className="bg-[#0B0B0B] p-4 rounded-2xl border border-[#262626] mb-6">
                              <div className="flex items-center gap-2 mb-3">
                                <ListMusic size={14} className="text-[#C0FF00]" />
                                <span className="text-[9px] font-black text-[#C0FF00] uppercase tracking-widest">Setlist</span>
                                <span className="text-[9px] font-black text-[#888888]">({eventSongsList.length} songs)</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {eventSongsList.map((s, idx) => (
                                  <span key={s.id} className="text-[10px] font-bold text-white bg-[#1A1A1A] px-3 py-1.5 rounded-lg border border-[#262626]">
                                    {idx + 1}. {s.title} <span className="text-[#C0FF00]">({s.key})</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                              onClick={() => { setSelectedEventId(ev.id); setModalType('assign_team'); }} 
                              className="flex-1 bg-[#C0FF00] text-black py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#d4ff4d] transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                              <UserPlus size={14} /> Manage Team
                            </button>
                            <button 
                              onClick={() => { setSelectedEventId(ev.id); setModalType('manage_songs'); }} 
                              className="flex-1 bg-[#262626] text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#333333] transition-all flex items-center justify-center gap-2"
                            >
                              <ListMusic size={14} className="text-[#C0FF00]" /> Edit Setlist
                            </button>
                            <button 
                              onClick={() => handleShareSchedule(ev)} 
                              className="flex-1 sm:flex-none bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] py-3.5 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#25D366]/20 transition-all flex items-center justify-center gap-2"
                            >
                              <Copy size={14} /> Copy for WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Empty State */}
                  {events.length === 0 && (
                    <div className="bg-[#1A1A1A] rounded-3xl border border-[#262626] p-12 text-center">
                      <Calendar size={48} className="text-[#333333] mx-auto mb-4" />
                      <h4 className="text-lg font-black text-white uppercase mb-2">No Services Scheduled</h4>
                      <p className="text-[11px] font-bold text-[#888888] uppercase tracking-wider mb-6">Create your first service schedule to get started</p>
                      <button 
                        onClick={() => { setFormData({ date: new Date().toISOString().split('T')[0], time: '09:00' }); setModalType('add_event'); }} 
                        className="bg-[#C0FF00] text-black px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest neon-glow"
                      >
                        <Plus size={14} className="inline mr-2" /> Create First Service
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'team' && (
              <section className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Worship Team</h3>
                    <p className="text-[11px] font-black text-[#888888] uppercase tracking-widest mt-1">Roster size: {members.length} / {MEMBER_LIMIT}</p>
                  </div>
                  <button onClick={() => { setFormData({ roles: [], status: 'active' }); setModalType('add_member'); }} className="bg-[#C0FF00] text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest neon-glow active:scale-95 transition-all flex items-center gap-2 shadow-lg">
                    <UserPlus size={18} strokeWidth={3} /> Add Personnel
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {members.map(m => (
                    <div key={m.id} className="bg-[#1A1A1A] p-8 rounded-[2rem] border border-[#262626] hover:border-[#C0FF00]/30 transition-all flex flex-col justify-between group shadow-xl">
                      <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 ${m.status === 'active' ? 'bg-[#C0FF00] text-black' : 'bg-[#262626] text-[#888888]'} rounded-2xl flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform shadow-lg`}>{m.avatar}</div>
                          <div>
                            <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-[#C0FF00] transition-colors">{m.name}</h4>
                            <p className="text-[9px] font-bold text-[#888888] uppercase tracking-widest flex items-center gap-2"><Phone size={10} /> {m.phone}</p>
                          </div>
                        </div>
                        <button onClick={() => { setSelectedMemberId(m.id); setFormData(m); setModalType('edit_member'); }} className="text-[#888888] hover:text-[#C0FF00] transition-colors"><Edit3 size={18} /></button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-8 min-h-[1.5rem]">
                        {m.roles.map(r => (
                          <span key={r} className={`text-[8px] font-black ${m.status === 'active' ? 'text-[#C0FF00] bg-[#C0FF00]/10 border border-[#C0FF00]/20' : 'text-[#888888] bg-[#0B0B0B] border-[#262626]'} px-3 py-1 rounded-lg uppercase tracking-widest`}>{r}</span>
                        ))}
                      </div>
                      <div className="pt-6 border-t border-[#262626] flex items-center justify-between">
                         <span className={`text-[9px] font-black uppercase flex items-center gap-2 tracking-widest ${m.status === 'active' ? 'text-[#C0FF00]' : 'text-red-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-[#C0FF00] shadow-[0_0_8px_#C0FF00]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} /> {m.status}
                         </span>
                         <button onClick={() => setConfirmState({ isOpen: true, title: 'Remove Member?', message: `Remove ${m.name} from roster?`, onConfirm: () => setMembers(prev => prev.filter(item => item.id !== m.id)) })} className="text-[#888888] hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Modals Styled for Neon Dark */}
      <Modal isOpen={!!modalType} onClose={() => setModalType(null)} title={
        modalType === 'add_event' ? 'New Service' : 
        modalType === 'manage_songs' ? 'Service Setlist' : 
        modalType === 'add_member' ? 'Add Personnel' :
        modalType === 'edit_member' ? 'Edit Personnel' :
        modalType === 'edit_profile' ? 'Director Settings' :
        modalType === 'assign_team' ? 'Assign Team' : 
        modalType === 'donate' ? 'Support Flow' : 'Details'
      }>
        {modalType === 'add_event' && (
          <form onSubmit={handleEventSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#888888] uppercase tracking-[0.3em]">Service Name</label>
              <input required type="text" placeholder="e.g. Christmas Eve Service" className="w-full px-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] transition-all font-bold placeholder:text-[#333333]" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] block mb-3">Date</label>
                  <input required type="date" className="w-full px-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] font-bold" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] block mb-3">Time</label>
                  <input required type="time" className="w-full px-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] font-bold" value={formData.time || ''} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#C0FF00] text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs neon-glow active:scale-95 transition-all">Publish Service</button>
          </form>
        )}

        {modalType === 'manage_songs' && (
          <div className="space-y-10">
            {/* Manual Entry */}
            <div className="bg-[#0B0B0B] p-8 rounded-3xl border border-[#262626]">
              <form onSubmit={handleAddSong} className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Song Title</label>
                  <input required type="text" placeholder="Title..." className="w-full px-6 py-5 bg-[#1A1A1A] text-white border border-[#262626] rounded-2xl text-sm font-bold outline-none focus:border-[#C0FF00] transition-all placeholder:text-[#333333]" value={newSong.title} onChange={e => setNewSong({...newSong, title: e.target.value})} />
                </div>
                <div className="w-full sm:w-28">
                  <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Key</label>
                  <input required type="text" placeholder="Key" className="w-full px-4 py-5 bg-[#1A1A1A] text-white border border-[#262626] rounded-2xl text-sm text-center uppercase font-black outline-none focus:border-[#C0FF00] transition-all placeholder:text-[#333333]" value={newSong.key} onChange={e => setNewSong({...newSong, key: e.target.value})} />
                </div>
                <button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white p-5 rounded-2xl shadow-xl active:scale-95 transition-all"><Plus size={24} strokeWidth={3} /></button>
              </form>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] px-4">Current Setlist ({eventSongs.filter(s => s.eventId === selectedEventId).length})</h4>
              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
                {eventSongs.filter(s => s.eventId === selectedEventId).map((s, idx) => (
                  <div key={s.id} className="bg-[#0B0B0B] rounded-[2rem] border border-[#262626] p-8 group animate-in slide-in-from-bottom-2 duration-300 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-6">
                        <span className="text-[11px] font-black text-[#C0FF00] w-12 h-12 rounded-[1.25rem] border border-[#C0FF00]/20 flex items-center justify-center bg-[#C0FF00]/5">{idx + 1}</span>
                        <div>
                          <p className="font-black text-white text-lg uppercase tracking-tight leading-tight">{s.title}</p>
                          <p className="text-[10px] text-[#C0FF00] font-black uppercase tracking-[0.2em] mt-2">Key of {s.key}</p>
                        </div>
                      </div>
                      <button onClick={() => setEventSongs(prev => prev.filter(item => item.id !== s.id))} className="p-3 text-[#333333] hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20"><Trash2 size={20} /></button>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Add performance notes..." 
                        className="w-full px-6 py-4 bg-[#1A1A1A] border border-[#262626] rounded-[1.5rem] text-[11px] font-medium text-[#888888] outline-none focus:border-[#C0FF00] focus:text-white placeholder:text-[#333333] transition-all" 
                        value={s.notes || ''} 
                        onChange={(e) => handleUpdateSongNotes(s.id, e.target.value)} 
                    />
                  </div>
                ))}
                {eventSongs.filter(s => s.eventId === selectedEventId).length === 0 && (
                  <div className="py-24 text-center bg-[#0B0B0B] rounded-[3rem] border border-dashed border-[#262626]">
                    <Music className="mx-auto text-[#262626] mb-6" size={56} />
                    <p className="text-[#333333] font-black uppercase tracking-[0.3em] text-xs italic">Setlist is empty</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(modalType === 'add_member' || modalType === 'edit_member') && (
          <form onSubmit={handleMemberSubmit} className="space-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Status</label>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, status: 'active'})}
                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.status === 'active' || !formData.status ? 'bg-[#C0FF00] border-[#C0FF00] text-black shadow-[0_0_10px_rgba(192,255,0,0.2)]' : 'bg-[#0B0B0B] border-[#262626] text-[#888888]'}`}
                  >
                    Active
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, status: 'inactive'})}
                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.status === 'inactive' ? 'bg-[#262626] border-red-500/50 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'bg-[#0B0B0B] border-[#262626] text-[#888888]'}`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Full Name</label>
                <div className="relative">
                   <User className="absolute left-6 top-1/2 -translate-y-1/2 text-[#333333]" size={18} />
                   <input required type="text" placeholder="John Doe" className="w-full pl-14 pr-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] font-bold transition-all" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Roles</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STANDARD_ROLES.map(role => (
                    <button key={role} type="button" onClick={() => {
                      const current = formData.roles || [];
                      setFormData({...formData, roles: current.includes(role) ? current.filter((r: Role) => r !== role) : [...current, role]});
                    }} className={`px-2 py-3 rounded-xl text-[8px] font-black transition-all border uppercase tracking-widest ${formData.roles?.includes(role) ? 'bg-[#C0FF00] border-[#C0FF00] text-black shadow-[0_0_10px_rgba(192,255,0,0.2)]' : 'bg-[#0B0B0B] border-[#262626] text-[#888888]'}`}>{role}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Contact</label>
                <div className="relative">
                   <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-[#333333]" size={18} />
                   <input required type="text" placeholder="08..." className="w-full pl-14 pr-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] font-bold transition-all" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#C0FF00] text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs neon-glow transition-all shadow-lg">Confirm Personnel</button>
          </form>
        )}

        {modalType === 'assign_team' && (
          <div className="space-y-6">
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar px-1">
              {(() => {
                // Get all member IDs already assigned to this event
                const assignedMemberIds = assignments
                  .filter(a => a.eventId === selectedEventId)
                  .map(a => a.memberId);

                return STANDARD_ROLES.map(role => {
                  const currentAssignment = assignments.find(a => a.eventId === selectedEventId && a.role === role);
                  
                  // Filter members: exclude those assigned to OTHER roles, but keep the one assigned to THIS role
                  const availableMembers = members.filter(m => 
                    !assignedMemberIds.includes(m.id) || m.id === currentAssignment?.memberId
                  );

                  return (
                    <div key={role} className="flex items-center justify-between p-6 bg-[#0B0B0B] rounded-2xl border border-[#262626] group hover:border-[#C0FF00]/20 transition-all shadow-md">
                      <div className="flex-1">
                        <p className="text-[8px] font-black text-[#888888] uppercase tracking-[0.3em] mb-1">{role}</p>
                        <p className="font-black text-white text-sm uppercase truncate tracking-tight">
                          {currentAssignment ? members.find(m => m.id === currentAssignment.memberId)?.name : <span className="text-[#333333]">VACANT</span>}
                        </p>
                      </div>
                      <select 
                        className="bg-[#1A1A1A] text-[#C0FF00] border border-[#262626] rounded-xl px-4 py-2 text-[10px] font-black outline-none focus:border-[#C0FF00] cursor-pointer" 
                        value={currentAssignment?.memberId || ''} 
                        onChange={(e) => handleAssignMember(role, e.target.value)}
                      >
                        <option value="">- SELECT -</option>
                        {availableMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  );
                });
              })()}
            </div>
            <button onClick={() => setModalType(null)} className="w-full bg-[#C0FF00] text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs shadow-lg">Save Roster</button>
          </div>
        )}

        {modalType === 'donate' && (
          <div className="text-center space-y-8 py-4">
            <div className="relative inline-block">
               <div className="absolute inset-0 bg-[#C0FF00] blur-xl opacity-20 animate-pulse rounded-full"></div>
               <Heart size={48} className="text-[#C0FF00] relative z-10 mx-auto" fill="currentColor" />
            </div>
            <div>
               <h4 className="text-2xl font-black text-white uppercase mb-2 tracking-tight">Support Flow</h4>
               <p className="text-[#888888] text-sm font-medium tracking-tight">Empowering digital worship tech worldwide.</p>
            </div>
            <div className="bg-[#0B0B0B] p-8 rounded-[2rem] border border-[#C0FF00]/20 space-y-6 shadow-xl">
              <div>
                <p className="text-[10px] font-black text-[#888888] uppercase tracking-[0.4em] mb-4">BCA TRANSFER</p>
                <div className="flex items-center justify-between bg-[#1A1A1A] px-6 py-5 rounded-2xl border border-[#262626] group hover:border-[#C0FF00]/50 transition-all">
                   <span className="text-xl sm:text-2xl font-black text-[#C0FF00] tracking-[0.2em]">8800487863</span>
                   <button onClick={() => { navigator.clipboard.writeText('8800487863'); showToast("Account number copied!"); }} className="text-[#888888] hover:text-[#C0FF00] transition-colors"><Copy size={18} /></button>
                </div>
              </div>
              <p className="text-[11px] font-black text-white uppercase tracking-[0.2em]">A.N. YESAYA ANGELO</p>
            </div>
            <button onClick={() => setModalType(null)} className="w-full bg-[#262626] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Done</button>
          </div>
        )}

        {modalType === 'edit_profile' && (
          <form onSubmit={(e) => { e.preventDefault(); setProfile(formData); setModalType(null); showToast("Settings updated"); }} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Church Brand</label>
                <div className="relative">
                   <Church className="absolute left-6 top-1/2 -translate-y-1/2 text-[#333333]" size={18} />
                   <input required type="text" className="w-full pl-14 pr-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] font-bold transition-all" value={formData.churchName || ''} onChange={e => setFormData({...formData, churchName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Admin Name</label>
                <div className="relative">
                   <User className="absolute left-6 top-1/2 -translate-y-1/2 text-[#333333]" size={18} />
                   <input required type="text" className="w-full pl-14 pr-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] font-bold transition-all" value={formData.adminName || ''} onChange={e => setFormData({...formData, adminName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Master Key</label>
                <div className="relative">
                   <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-[#333333]" size={18} />
                   <input required type="text" placeholder="Change password..." className="w-full pl-14 pr-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] font-bold transition-all" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="pt-4 space-y-3">
              <button type="submit" className="w-full bg-[#C0FF00] text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs neon-glow shadow-lg transition-all active:scale-95">Apply Updates</button>
              <button type="button" onClick={() => setIsLoggedIn(false)} className="w-full bg-red-600/10 text-red-500 font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg">Lock Session</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
