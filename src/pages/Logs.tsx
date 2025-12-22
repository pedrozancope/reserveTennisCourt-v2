import { useState } from "react"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ExecutionLog } from "@/types"

// Mock data
const mockLogs: ExecutionLog[] = [
  {
    id: "1",
    scheduleId: "1",
    schedule: {
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
    status: "success",
    message: "Reserva confirmada com sucesso",
    reservationDate: "2025-01-05",
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    durationMs: 2340,
    responsePayload: { reservationId: "12345", status: "confirmed" },
  },
  {
    id: "2",
    scheduleId: "2",
    schedule: {
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
    status: "success",
    message: "Reserva confirmada com sucesso",
    reservationDate: "2025-01-01",
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    durationMs: 1890,
  },
  {
    id: "3",
    scheduleId: "1",
    schedule: {
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
    status: "error",
    message: "Horário indisponível - já reservado por outro usuário",
    reservationDate: "2024-12-29",
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    durationMs: 3200,
    responsePayload: { error: "SLOT_UNAVAILABLE" },
  },
  {
    id: "4",
    scheduleId: "2",
    schedule: {
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
    status: "success",
    message: "Reserva confirmada com sucesso",
    reservationDate: "2024-12-25",
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    durationMs: 2100,
  },
]

export default function Logs() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  const filteredLogs =
    statusFilter === "all"
      ? mockLogs
      : mockLogs.filter((log) => log.status === statusFilter)

  const getStatusIcon = (status: ExecutionLog["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-success" />
      case "error":
        return <XCircle className="h-5 w-5 text-destructive" />
      case "pending":
        return <Clock className="h-5 w-5 text-warning" />
    }
  }

  const getStatusBadge = (status: ExecutionLog["status"]) => {
    switch (status) {
      case "success":
        return <Badge variant="success">Sucesso</Badge>
      case "error":
        return <Badge variant="error">Erro</Badge>
      case "pending":
        return <Badge variant="warning">Pendente</Badge>
    }
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const toggleExpanded = (id: string) => {
    setExpandedLog(expandedLog === id ? null : id)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
          <p className="text-muted-foreground">
            Histórico de execuções das reservas
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredLogs.length} registro(s)
        </p>
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">
                Nenhum log encontrado
              </h3>
              <p className="text-sm">
                {statusFilter !== "all"
                  ? "Tente mudar o filtro de status"
                  : "As execuções aparecerão aqui"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-0">
                {/* Main row */}
                <button
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpanded(log.id)}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <p className="font-medium">{log.schedule?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(log.executedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(log.status)}
                    {expandedLog === log.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {expandedLog === log.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-border animate-fade-in">
                    <div className="mt-4 space-y-3">
                      {/* Message */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Mensagem
                        </p>
                        <p className="text-sm">{log.message || "-"}</p>
                      </div>

                      {/* Reservation Date */}
                      {log.reservationDate && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Data da Reserva
                          </p>
                          <p className="text-sm">
                            {new Date(log.reservationDate).toLocaleDateString(
                              "pt-BR",
                              {
                                weekday: "long",
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      )}

                      {/* Duration */}
                      {log.durationMs && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Duração
                          </p>
                          <p className="text-sm">{log.durationMs}ms</p>
                        </div>
                      )}

                      {/* Response */}
                      {log.responsePayload && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Response
                          </p>
                          <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                            {JSON.stringify(log.responsePayload, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
