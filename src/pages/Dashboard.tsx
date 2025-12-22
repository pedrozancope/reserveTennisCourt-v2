import { Calendar, CheckCircle2, Clock, Key } from "lucide-react"
import { StatCard } from "@/components/dashboard/StatCard"
import { UpcomingReservations } from "@/components/dashboard/UpcomingReservations"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { useSchedules } from "@/hooks/useSchedules"
import { useLogStats, useRecentLogs } from "@/hooks/useLogs"
import { useTokenStatus } from "@/hooks/useConfig"
import { Skeleton } from "@/components/ui/skeleton"

export default function Dashboard() {
  const { data: schedules = [], isLoading: loadingSchedules } = useSchedules()
  const { data: stats, isLoading: loadingStats } = useLogStats()
  const { data: recentLogs = [], isLoading: loadingLogs } = useRecentLogs(5)
  const { hasToken, lastUpdated, isLoading: loadingToken } = useTokenStatus()

  const activeSchedules = schedules.filter((s) => s.isActive).length
  const successRate = stats?.success_rate || 0
  const totalExecutions = stats?.total_executions || 0
  const successfulExecutions = stats?.successful_executions || 0

  // Próximo agendamento ativo
  const nextSchedule = schedules.find((s) => s.isActive)
  const nextTime = nextSchedule?.timeSlot?.displayName || "-"

  const isLoading = loadingSchedules || loadingStats || loadingToken

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral dos seus agendamentos
          </p>
        </div>
        <Link to="/schedules/new">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Novo Agendamento
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Agendamentos"
              value={activeSchedules}
              icon={Calendar}
              description="Ativos"
              variant="default"
            />
            <StatCard
              title="Taxa de Sucesso"
              value={`${successRate.toFixed(1)}%`}
              icon={CheckCircle2}
              description={`${successfulExecutions}/${totalExecutions} execuções`}
              variant="success"
            />
            <StatCard
              title="Próxima Reserva"
              value={nextTime}
              icon={Clock}
              description={nextSchedule ? nextSchedule.name : "Nenhuma"}
              variant="warning"
            />
            <StatCard
              title="Token"
              value={hasToken ? "OK" : "Pendente"}
              icon={Key}
              description={
                hasToken && lastUpdated
                  ? `Atualizado ${new Date(lastUpdated).toLocaleDateString()}`
                  : "Configure seu token"
              }
              variant={hasToken ? "success" : "default"}
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <UpcomingReservations
          reservations={schedules
            .filter((s) => s.isActive)
            .slice(0, 4)
            .map((schedule) => ({
              id: schedule.id,
              scheduleName: schedule.name,
              triggerDate: new Date(), // TODO: calcular próxima data
              reservationDate: new Date(), // TODO: calcular data de reserva
              time: schedule.timeSlot?.displayName || "",
              dayOfWeek: schedule.reservationDayOfWeek,
            }))}
          isLoading={loadingSchedules}
        />
        <RecentActivity logs={recentLogs} isLoading={loadingLogs} />
      </div>
    </div>
  )
}
