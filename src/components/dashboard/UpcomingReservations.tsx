import { Calendar, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DAY_NAMES_PT_SHORT } from "@/lib/cron"

interface UpcomingReservation {
  id: string
  scheduleName: string
  triggerDate: Date
  reservationDate: Date
  time: string
  dayOfWeek: number
}

interface UpcomingReservationsProps {
  reservations: UpcomingReservation[]
  isLoading?: boolean
}

export function UpcomingReservations({
  reservations,
  isLoading,
}: UpcomingReservationsProps) {
  const getDaysUntil = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(date)
    target.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas Reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (reservations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas Reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma reserva agendada</p>
            <p className="text-sm">Crie um agendamento para começar</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Próximas Reservas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reservations.map((reservation) => {
            const daysUntilTrigger = getDaysUntil(reservation.triggerDate)
            const daysUntilReservation = getDaysUntil(
              reservation.reservationDate
            )

            return (
              <div
                key={reservation.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                    <span className="text-xs font-medium">
                      {DAY_NAMES_PT_SHORT[reservation.dayOfWeek]}
                    </span>
                    <span className="text-lg font-bold">
                      {reservation.reservationDate.getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{reservation.scheduleName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {reservation.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={daysUntilTrigger <= 1 ? "warning" : "outline"}
                  >
                    {daysUntilTrigger === 0
                      ? "Hoje!"
                      : daysUntilTrigger === 1
                      ? "Amanhã"
                      : `${daysUntilTrigger} dias`}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reserva em {daysUntilReservation} dias
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
