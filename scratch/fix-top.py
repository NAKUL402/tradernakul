import sys

def main():
    with open('src/routes/reports.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add toast import
    if 'import { toast }' not in content:
        content = content.replace(
            'import { cn } from "@/lib/utils";',
            'import { cn } from "@/lib/utils";\nimport { toast } from "sonner";'
        )

    # 2. Fix Filter Button
    old_filter = '''          <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <SlidersHorizontal className="size-4" />
          </div>'''
    new_filter = '''          <button type="button" onClick={() => toast.info("Advanced filtering coming soon")} className="grid size-9 place-items-center rounded-lg border border-zinc-800 bg-[#0c0c0e] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
            <SlidersHorizontal className="size-4" />
          </button>'''
    content = content.replace(old_filter, new_filter)

    # 3. Fix Date Range
    old_date = '''          <div className="relative flex items-center">
            <Calendar className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground" />
            <select
              aria-label="Select date range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="cursor-pointer rounded-xl border border-border bg-card pl-9 pr-8 py-2 text-xs font-semibold text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="this-month">This Month</option>
              <option value="this-week">This Week</option>
            </select>
          </div>'''
    new_date = '''          <div className="relative flex items-center shadow-lg">
            <Calendar className="pointer-events-none absolute left-3 size-3.5 text-slate-400" />
            <select
              aria-label="Select date range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="cursor-pointer rounded-full border border-zinc-700/80 bg-[#15151a] pl-9 pr-8 py-2 text-xs font-semibold text-zinc-200 outline-none transition-all hover:border-zinc-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 appearance-none shadow-md"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="this-month">This Month</option>
              <option value="this-week">This Week</option>
            </select>
            <div className="pointer-events-none absolute right-3">
               <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M1 1L5 5L9 1" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
            </div>
          </div>'''
    content = content.replace(old_date, new_date)

    with open('src/routes/reports.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
