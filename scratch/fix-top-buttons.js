import pathlib

filepath = pathlib.Path("src/routes/reports.tsx")
content = filepath.read_text(encoding="utf-8")

old_filter_btn = """        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <SlidersHorizontal className="size-4" />
          </div>"""

new_filter_btn = """        <div className="flex items-center gap-3">
          <button type="button" onClick={() => toast.info("Advanced filtering coming soon")} className="grid size-9 place-items-center rounded-lg border border-zinc-800 bg-[#0c0c0e] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
            <SlidersHorizontal className="size-4" />
          </button>"""

old_date_range = """          <div className="relative flex items-center">
            <Calendar className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground" />
            <select
              aria-label="Select date range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="cursor-pointer rounded-xl border border-border bg-card pl-9 pr-8 py-2 text-xs font-semibold text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40"
            >"""

new_date_range = """          <div className="relative flex items-center shadow-lg">
            <Calendar className="pointer-events-none absolute left-3 size-3.5 text-slate-400" />
            <select
              aria-label="Select date range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="cursor-pointer rounded-full border border-zinc-700/80 bg-[#15151a] pl-9 pr-8 py-2 text-xs font-semibold text-zinc-200 outline-none transition-all hover:border-zinc-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 appearance-none shadow-md"
            >"""

content = content.replace(old_filter_btn, new_filter_btn)
content = content.replace(old_date_range, new_date_range)

# Also fix the missing closing tag for date range icon since we replaced only the opening
# Actually, wait. I can just inject the SVG before `</div>` right after `</select>`
old_select_end = """              <option value="this-month">This Month</option>
              <option value="this-week">This Week</option>
            </select>
          </div>"""

new_select_end = """              <option value="this-month">This Month</option>
              <option value="this-week">This Week</option>
            </select>
            <div className="pointer-events-none absolute right-3">
               <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M1 1L5 5L9 1" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
            </div>
          </div>"""
content = content.replace(old_select_end, new_select_end)

filepath.write_text(content, encoding="utf-8")
print("Python patch applied!")
