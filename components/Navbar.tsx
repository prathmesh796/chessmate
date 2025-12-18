import { memo } from "react"

const Navbar = memo(({ selectedMode, setSelectedMode }: { selectedMode: string, setSelectedMode: (mode: 'rapid' | 'blitz' | 'bullet' | 'daily') => void }) => {
    return (
        <nav className="flex justify-start  p-3 pl-5 rounded-2xl bg-gradient-to-r from-profile_card/80 via-[#232323]/90 to-profile_card/75 mb-5 shadow-lg border border-gray-700/25 overflow-x-auto">
            <ul className="flex gap-3 sm:gap-5 font-medium">
                {['rapid', 'daily', 'blitz', 'bullet'].map((mode) => (
                    <li
                        key={mode}
                        onClick={() => setSelectedMode(mode as 'rapid' | 'blitz' | 'bullet' | 'daily')}
                        className={`cursor-pointer px-5 py-2 rounded-xl transition-all capitalize tracking-wide font-semibold border
                  ${selectedMode === mode
                                ? 'bg-gradient-to-r from-pawn to-[#9bc16a] text-white shadow-md border-pawn/60 scale-105'
                                : 'border-transparent text-gray-400 hover:text-white/95 hover:bg-gradient-to-r hover:from-gray-800/60 hover:to-gray-700/70 hover:border-pawn/30'
                            }`}
                        style={{ letterSpacing: '.05em' }}
                    >
                        {mode}
                    </li>
                ))}
            </ul>
        </nav>
    )
})

export default Navbar