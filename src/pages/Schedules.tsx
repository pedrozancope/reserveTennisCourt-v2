import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Calendar, Clock, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DAY_NAMES_PT, getNextExecutionDates } from "@/lib/cron"
import { TIME_SLOTS } from "@/lib/constants"
import type { Schedule } from "@/types"

// Mock data
const mockSchedules: Schedule[] = [
  {
    id: "1",
    name: "Tênis Domingo Manhã",
    timeSlotId: "440",
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
  {
    id: "2",
    name: "Tênis Quarta Noite",
    timeSlotId: "452",
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
]

export default function Schedules() {
  const [schedules, setSchedules] = useState(mockSchedules)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(
    null
  )

  const getTimeSlotDisplay = (externalId: string) => {
    const slot = TIME_SLOTS.find((s) => s.externalId === externalId)
    return slot?.displayName || "-"
  }

  const toggleScheduleActive = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    )
  }

  const handleDeleteClick = (schedule: Schedule) => {
    setScheduleToDelete(schedule)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (scheduleToDelete) {
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleToDelete.id))
    }
    setDeleteDialogOpen(false)
    setScheduleToDelete(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Agendamentos
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus triggers de reserva
          </p>
        </div>
        <Link to="/schedules/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo</span>
          </Button>
        </Link>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">
                Nenhum agendamento criado
              </h3>
              <p className="text-sm mb-4">
                Crie seu primeiro agendamento para começar a reservar
                automaticamente.
              </p>
              <Link to="/schedules/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Agendamento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => {
            const nextDates = getNextExecutionDates(
              schedule.reservationDayOfWeek,
              2
            )
            const timeDisplay = getTimeSlotDisplay(schedule.timeSlotId)

            return (
              <Card
                key={schedule.id}
                className={!schedule.isActive ? "opacity-60" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold truncate">
                          {schedule.name}
                        </h3>
                        <Badge
                          variant={schedule.isActive ? "success" : "outline"}
                        >
                          {schedule.isActive ? "Ativo" : "Pausado"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {DAY_NAMES_PT[schedule.reservationDayOfWeek]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {timeDisplay}
                        </span>
                        <span className="capitalize">{schedule.frequency}</span>
                      </div>

                      {/* Next executions */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {nextDates.slice(0, 2).map((date, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-muted px-2 py-1 rounded-md"
                          >
                            <span className="text-muted-foreground">
                              Disparo:{" "}
                            </span>
                            <span className="font-medium">
                              {date.triggerDate.toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </span>
                            <span className="text-muted-foreground"> → </span>
                            <span className="font-medium">
                              {date.reservationDate.toLocaleDateString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={schedule.isActive}
                        onCheckedChange={() =>
                          toggleScheduleActive(schedule.id)
                        }
                      />
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/schedules/${schedule.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(schedule)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir agendamento?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o agendamento "
              {scheduleToDelete?.name}"? Esta ação não pode ser desfeita e o
              trigger será removido da AWS.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
