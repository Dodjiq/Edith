import { Search, HelpCircle, Bell, Settings, Bell as BellIcon, MessageSquare, Calendar, Users, LayoutGrid, GitBranch, FileText, ChevronsLeft } from 'lucide-react';
import { EdithGirlIcon } from '@/components/shared/edith-girl-icon';

export const DashboardMockup: React.FC = () => (
  <div className="relative w-full overflow-hidden rounded-t-3xl border border-white/8 border-b-0 bg-[#0a0a0a]">
    {/* Top bar */}
    <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
      <div className="flex items-center gap-2">
        <EdithGirlIcon className="size-4 text-edith-accent" />
        <span className="text-sm font-semibold text-white">Edith</span>
        <div className="size-1 rounded-full bg-white/20" />
      </div>

      <div className="hidden flex-1 max-w-md md:flex items-center gap-2 mx-6 rounded-full border border-white/8 bg-white/3 px-4 py-2">
        <Search className="size-3.5 text-white/30" />
        <span className="text-xs text-white/30">Search</span>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/30">
          <span>PROJECTS</span>
          <span className="text-white/15">/</span>
          <span>STELLAR</span>
          <span className="text-white/15">/</span>
          <span className="text-white/60">FLOW</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="hidden md:flex size-7 items-center justify-center rounded-full border border-white/8 text-white/40">
          <HelpCircle className="size-3.5" />
        </button>
        <button className="hidden md:flex size-7 items-center justify-center rounded-full border border-white/8 text-white/40">
          <Bell className="size-3.5" />
        </button>
        <button className="hidden md:flex size-7 items-center justify-center rounded-full border border-white/8 text-white/40">
          <Settings className="size-3.5" />
        </button>
        <button className="flex h-7 items-center gap-1 rounded-full bg-edith-accent px-3 text-[11px] font-semibold text-edith-bg">
          <ChevronsLeft className="size-3" />
        </button>
      </div>
    </div>

    {/* Body */}
    <div className="grid grid-cols-[180px_1fr] min-h-[400px]">
      {/* Sidebar */}
      <aside className="border-r border-white/5 p-4 space-y-1.5">
        {[
          { icon: BellIcon, label: 'Notification' },
          { icon: MessageSquare, label: 'Messages' },
          { icon: Calendar, label: 'Calendar' },
          { icon: Users, label: 'Users' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-white/45">
            <Icon className="size-3.5" strokeWidth={1.5} />
            <span className="text-xs">{label}</span>
          </div>
        ))}
      </aside>

      {/* Main */}
      <div className="p-5 space-y-5">
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-white/5 pb-3">
          {[
            { icon: LayoutGrid, label: 'Overview', active: false },
            { icon: GitBranch, label: 'Schematic', active: true },
            { icon: FileText, label: 'Logs', active: false },
          ].map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 pb-2.5 -mb-3 ${
                active
                  ? 'border-b border-edith-accent text-white'
                  : 'text-white/35'
              }`}
            >
              <Icon className="size-3.5" strokeWidth={1.5} />
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>

        {/* Project Timeline */}
        <div className="rounded-xl border border-white/5 bg-white/2 p-4">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded bg-edith-accent/15">
              <GitBranch className="size-3 text-edith-accent" />
            </div>
            <span className="text-xs font-semibold text-white">Project Timeline</span>
          </div>

          <div className="grid grid-cols-13 gap-px relative mb-2">
            {['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DEC', 'JAN'].map((m) => (
              <div key={m} className="text-center text-[8px] tracking-wider text-white/25">{m}</div>
            ))}
          </div>

          <div className="relative h-[88px]">
            <div className="absolute left-0 top-0 w-[42%] rounded-md border border-white/8 bg-white/4 px-2.5 py-2 flex items-center gap-2">
              <div className="h-6 w-0.5 rounded-full bg-amber-400/70" />
              <div>
                <p className="text-[10px] font-semibold text-white/80">Design & Development</p>
                <p className="text-[8px] text-white/30">Jan 01 to June 01</p>
              </div>
            </div>
            <div className="absolute left-[18%] top-9 w-[36%] rounded-md border border-white/8 bg-white/4 px-2.5 py-2 flex items-center gap-2">
              <div className="h-6 w-0.5 rounded-full bg-rose-400/70" />
              <div>
                <p className="text-[10px] font-semibold text-white/80">Prototyping & Testing</p>
                <p className="text-[8px] text-white/30">Mar 01 to Aug 01</p>
              </div>
            </div>
            <div className="absolute right-0 top-0 w-[36%] rounded-md border border-white/8 bg-white/4 px-2.5 py-2 flex items-center gap-2">
              <div className="h-6 w-0.5 rounded-full bg-amber-400/70" />
              <div>
                <p className="text-[10px] font-semibold text-white/80">Design & Development</p>
                <p className="text-[8px] text-white/30">Oct 01 to Mar 01</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="rounded-xl border border-white/5 bg-white/2 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded bg-edith-accent/15">
                <FileText className="size-3 text-edith-accent" />
              </div>
              <span className="text-xs font-semibold text-white">Analytics</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-white/40">
              <div className="size-1 rounded-full bg-edith-accent" />
              2025
            </div>
          </div>
          <div className="h-12 w-full">
            <svg viewBox="0 0 400 48" className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M0,40 Q40,35 80,32 T160,28 T240,22 T320,15 T400,8"
                stroke="rgb(92,235,190)"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
);
