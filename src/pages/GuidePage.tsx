export default function GuidePage() {
  const sections = [
    {
      title: 'Workout Tracker',
      color: 'indigo',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      description: 'Log every workout session in real time. Start a session, add exercises, and record each set with reps, weight, rest time, and notes.',
      features: [
        'Start a timed workout session — duration is tracked automatically',
        'Add any exercise from your personal library',
        'Log sets with reps, weight (kg), rest time, and optional remarks',
        'Reorder exercises within a session',
        'View completed sessions with full set-level details',
      ],
    },
    {
      title: 'Exercise Library',
      color: 'violet',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      description: 'Build and manage your own exercise library. Add any movement you do in the gym and use it across all your sessions.',
      features: [
        'Create custom exercises with a name and optional description',
        'Edit or delete exercises at any time',
        'Search through your library quickly',
        'Exercises are personal — only you can see yours',
      ],
    },
    {
      title: 'Progress Tracking',
      color: 'blue',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'See how you are improving over time for each exercise. Charts and session comparisons show whether you are progressing.',
      features: [
        'Select any exercise to view its full history',
        'Line and bar charts for total volume and max weight over time',
        'Click any session to see the exact sets, reps, rest, and remarks logged',
        'Spot trends and identify plateaus at a glance',
      ],
    },
    {
      title: 'Workout History',
      color: 'cyan',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Browse every workout you have ever logged, grouped by month. Never lose track of what you did and when.',
      features: [
        'All sessions listed chronologically',
        'See date, duration, and exercises at a glance',
        'Click into any session for full details',
      ],
    },
    {
      title: 'Nutrition Tracker',
      color: 'green',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      description: 'Track your daily food intake with calorie and macro breakdowns. Build a personal food library and log meals by grams.',
      features: [
        'Add foods with calories per 100g and optional carbs, protein, fat',
        'Log any food for any day by entering grams eaten — macros are calculated automatically',
        'Daily totals show calories, carbs, protein, and fat at a glance',
        'Navigate between days to review past intake',
        'History tab shows all logged days with macro summaries',
      ],
    },
    {
      title: 'Weight Tracker',
      color: 'orange',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
      description: 'Log your body weight daily and watch your trend over time. See whether you are cutting, bulking, or maintaining.',
      features: [
        'Log weight for any date with optional notes',
        'Trend chart shows your last 30 entries',
        'Stats row shows latest weight, change vs previous entry, and total entries',
        'History table with day-by-day change column',
        'One entry per day — updating the same date overwrites the previous value',
      ],
    },
  ]

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  }

  const dotMap: Record<string, string> = {
    indigo: 'bg-indigo-500',
    violet: 'bg-violet-500',
    blue: 'bg-blue-500',
    cyan: 'bg-cyan-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">App Guide</h1>
        <p className="text-gray-400">
          fiTrack is an all-in-one personal fitness tracker. Log workouts, monitor your progress, track nutrition, and keep an eye on your weight — all in one place, just for you.
        </p>
      </div>

      {/* Feature cards */}
      <div className="space-y-4">
        {sections.map(section => (
          <div key={section.title} className="card p-5">
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-lg border flex-shrink-0 ${colorMap[section.color]}`}>
                {section.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-white text-lg mb-1">{section.title}</h2>
                <p className="text-gray-400 text-sm mb-3">{section.description}</p>
                <ul className="space-y-1.5">
                  {section.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dotMap[section.color]}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="card p-5 mt-6">
        <h2 className="font-semibold text-white mb-3">Tips</h2>
        <ul className="space-y-2">
          {[
            'Start a workout from the New Workout page — it begins a live timer immediately.',
            'Build your food library first before logging meals — add your commonly eaten foods once.',
            'Log your weight first thing in the morning for consistent readings.',
            'Use the Progress page after a few sessions to see if you are improving on each exercise.',
            'Add remarks to sets when something felt different — injury, fatigue, PR attempt, etc.',
          ].map(tip => (
            <li key={tip} className="flex items-start gap-2 text-sm text-gray-400">
              <span className="text-indigo-400 mt-0.5 flex-shrink-0">—</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
