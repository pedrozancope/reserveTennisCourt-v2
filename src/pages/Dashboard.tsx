import { Calendar, CheckCircle2, Clock, Key } from "lucide-react"
import { StatCard } from "@/components/dashboard/StatCard"
import { UpcomingReservations } from "@/components/dashboard/UpcomingReservations"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { getNextExecutionDates } from "@/lib/cron"
import type { ExecutionLog } from "@/types"

// Mock data - will be replaced with real data from Supabase
const mockSchedules = [
  {
    id: "1",
    name: "Tênis Domingo Manhã",
    dayOfWeek: 0, // domingo
    time: "07:00",
  },
  {
    id: "2",
    name: "Tênis Quarta Noite",
    dayOfWeek: 3, // quarta
    time: "19:00",
  },
]

const mockLogs: ExecutionLog[] = [
  {
    id: "1",
    scheduleId: "1",
    schedule: {
      id: "1",
      name: "Tênis Domingo Manhã",
      timeSlotId: "1",
      reservationDayOfWeek: 0,
      triggerDayOfWeek: 4,
      triggerTime: "00:01:00",
      cronExpression: "cron(1 3 ? * THU *)",
      frequency: "weekly",
      isActive: true,
      notifyOnSuccess: true,
      notifyOnFailure: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    status: "success",
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "2",
    scheduleId: "2",
    schedule: {
      id: "2",
      name: "Tênis Quarta Noite",
      timeSlotId: "2",
      reservationDayOfWeek: 3,
      triggerDayOfWeek: 0,
      triggerTime: "00:01:00",
      cronExpression: "cron(1 3 ? * SUN *)",
      frequency: "weekly",
      isActive: true,
      notifyOnSuccess: true,
      notifyOnFailure: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    status: "success",
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "3",
    scheduleId: "1",
    schedule: {
      id: "1",
      name: "Tênis Domingo Manhã",
      timeSlotId: "1",
      reservationDayOfWeek: 0,
      triggerDayOfWeek: 4,
      triggerTime: "00:01:00",
      cronExpression: "cron(1 3 ? * THU *)",
      frequency: "weekly",
      isActive: true,
      notifyOnSuccess: true,
      notifyOnFailure: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    status: "error",
    message: "Horário indisponível",
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
]

export default function Dashboard() {
  // Calculate upcoming reservations from schedules
  const upcomingReservations = mockSchedules
    .flatMap((schedule) => {
      const dates = getNextExecutionDates(schedule.dayOfWeek, 2)
      return dates.map((date, index) => ({
        id: `${schedule.id}-${index}`,
        scheduleName: schedule.name,
        triggerDate: date.triggerDate,
        reservationDate: date.reservationDate,
        time: schedule.time,
        dayOfWeek: schedule.dayOfWeek,
      }))
    })
    .sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime())

  // Calculate success rate
  const totalLogs = mockLogs.length
  const successLogs = mockLogs.filter((l) => l.status === "success").length
  const successRate =
    totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Gerencie suas reservas de tênis
          </p>
        </div>
        <Link to="/schedules/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Agendamento</span>
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Agendamentos"
          value={mockSchedules.length}
          icon={Calendar}
          description="Ativos"
          variant="default"
        />
        <StatCard
          title="Taxa de Sucesso"
          value={`${successRate}%`}
          icon={CheckCircle2}
          description={`${successLogs}/${totalLogs} execuções`}
          variant="success"
        />
        <StatCard
          title="Próxima Reserva"
          value={upcomingReservations[0]?.time || "-"}
          icon={Clock}
          description={
            upcomingReservations[0]
              ? `Em ${Math.ceil(
                  (upcomingReservations[0].triggerDate.getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )} dias`
              : "Nenhuma"
          }
          variant="warning"
        />
        <StatCard
          title="Token"
          value="OK"
          icon={Key}
          description="Válido"
          variant="success"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <UpcomingReservations reservations={upcomingReservations.slice(0, 4)} />
        <RecentActivity logs={mockLogs} />
      </div>
    </div>
  )
}
