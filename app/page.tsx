"use client"

import { Suspense } from "react"
import BoatSimulation from "@/components/boat-simulation"

export default function Home() {
  return (
    <main className="w-full h-screen">
      <Suspense fallback={<div className="w-full h-screen flex items-center justify-center">Cargando...</div>}>
        <BoatSimulation />
      </Suspense>
    </main>
  )
}
