import { Outlet } from "react-router-dom"
import { Header } from "./Header"
import { MobileNav } from "./MobileNav"

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 page-container">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
