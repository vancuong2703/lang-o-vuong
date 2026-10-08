import { useEffect } from 'react'
import { GameCanvas } from './game/GameCanvas'
import { startClock } from './state/clock'
import { TopBar } from './ui/hud/TopBar'
import { SeedBar } from './ui/hud/SeedBar'
import { PlotInfo } from './ui/hud/PlotInfo'
import { ToastView } from './ui/hud/ToastView'
import { BarnPanel } from './ui/panels/BarnPanel'

function App() {
  useEffect(() => startClock(), [])

  return (
    <div className="relative h-full w-full select-none font-sans text-[#3B2F2A]">
      <GameCanvas />
      <TopBar />
      <PlotInfo />
      <ToastView />
      <SeedBar />
      <BarnPanel />
    </div>
  )
}

export default App
