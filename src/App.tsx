import { useEffect } from 'react'
import { GameCanvas } from './game/GameCanvas'
import { startClock } from './state/clock'
import { useGame } from './state/gameStore'
import { useRealtimeSync } from './state/realtimeSync'
import { TopBar } from './ui/hud/TopBar'
import { SeedBar } from './ui/hud/SeedBar'
import { PlotInfo } from './ui/hud/PlotInfo'
import { ToastView } from './ui/hud/ToastView'
import { BarnPanel } from './ui/panels/BarnPanel'
import { ParcelInfo } from './ui/panels/ParcelInfo'
import { NeighboursPanel } from './ui/panels/NeighboursPanel'
import { LoginScreen } from './ui/screens/LoginScreen'
import { CreateFarmScreen } from './ui/screens/CreateFarmScreen'

function Screen() {
  const status = useGame((s) => s.status)

  if (status === 'loading') {
    return <div className="flex h-full items-center justify-center bg-[#BFE6FF] font-bold">Đang tải làng…</div>
  }
  if (status === 'signed_out') return <LoginScreen />
  if (status === 'needs_farm') return <CreateFarmScreen />

  return (
    <>
      <GameCanvas />
      <TopBar />
      <PlotInfo />
      <ParcelInfo />
      <SeedBar />
      <BarnPanel />
      <NeighboursPanel />
    </>
  )
}

function App() {
  const init = useGame((s) => s.init)
  const ready = useGame((s) => s.status === 'ready')
  useRealtimeSync(ready)

  useEffect(() => startClock(), [])
  useEffect(() => init(), [init])

  return (
    <div className="relative h-full w-full select-none font-sans text-[#3B2F2A]">
      <Screen />
      <ToastView />
    </div>
  )
}

export default App
