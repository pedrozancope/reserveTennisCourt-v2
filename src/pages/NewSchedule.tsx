import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Calendar, Clock, Bell, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  DAY_NAMES_PT,
  DAY_NAMES_PT_SHORT,
  getNextExecutionDates,
  generateCronExpression,
  getTriggerDayOfWeek,
} from "@/lib/cron"
import { TIME_SLOTS, FREQUENCY_OPTIONS } from "@/lib/constants"
import type { ScheduleFormData } from "@/types"

export default function NewSchedule() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ScheduleFormData>({
    name: "",
    timeSlotHour: 7,
    reservationDayOfWeek: 0,
    frequency: "weekly",
    notifyOnSuccess: true,
    notifyOnFailure: true,
  })

  // Calculate preview data
  const nextDates = getNextExecutionDates(formData.reservationDayOfWeek, 3)
  const triggerDay = getTriggerDayOfWeek(formData.reservationDayOfWeek)
  const cronExpression = generateCronExpression(formData.reservationDayOfWeek)
  const selectedTimeSlot = TIME_SLOTS.find(
    (s) => s.hour === formData.timeSlotHour
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Digite um nome para o agendamento")
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Implement actual API call to create schedule
      // This will:
      // 1. Create EventBridge rule with cron expression
      // 2. Save schedule to Supabase

      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call

      toast.success("Agendamento criado com sucesso!")
      navigate("/schedules")
    } catch (error) {
      toast.error("Erro ao criar agendamento")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Novo Agendamento
          </h1>
          <p className="text-muted-foreground">
            Configure sua reserva recorrente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome do agendamento</Label>
                <Input
                  id="name"
                  placeholder="Ex: Tênis Domingo Manhã"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <Separator />

              {/* Day of Week */}
              <div className="space-y-3">
                <Label>Dia da reserva</Label>
                <div className="grid grid-cols-7 gap-2">
                  {DAY_NAMES_PT_SHORT.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          reservationDayOfWeek: index,
                        }))
                      }
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.reservationDayOfWeek === index
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slot */}
              <div className="space-y-2">
                <Label>Horário</Label>
                <Select
                  value={formData.timeSlotHour.toString()}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      timeSlotHour: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot.hour} value={slot.hour.toString()}>
                        {slot.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Frequency */}
              <div className="space-y-3">
                <Label>Frequência</Label>
                <RadioGroup
                  value={formData.frequency}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      frequency: value as typeof formData.frequency,
                    }))
                  }
                  className="flex gap-4"
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Separator />

              {/* Notifications */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificações
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Sucesso</p>
                      <p className="text-xs text-muted-foreground">
                        Notificar quando a reserva for confirmada
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifyOnSuccess}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          notifyOnSuccess: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Falha</p>
                      <p className="text-xs text-muted-foreground">
                        Notificar quando houver erro na reserva
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifyOnFailure}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          notifyOnFailure: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <h4 className="font-medium mb-2">Resumo do agendamento</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Reserva:</span>{" "}
                    <span className="font-medium">
                      {DAY_NAMES_PT[formData.reservationDayOfWeek]} às{" "}
                      {selectedTimeSlot?.displayName}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Disparo:</span>{" "}
                    <span className="font-medium">
                      {DAY_NAMES_PT[triggerDay]} às 00:01
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Frequência:</span>{" "}
                    <span className="font-medium capitalize">
                      {formData.frequency}
                    </span>
                  </p>
                </div>
              </div>

              {/* Cron Expression */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  Cron Expression (AWS EventBridge)
                </Label>
                <code className="block p-3 rounded-lg bg-muted text-sm font-mono">
                  {cronExpression}
                </code>
              </div>

              {/* Next Executions */}
              <div className="space-y-3">
                <Label>Próximas execuções</Label>
                <div className="space-y-2">
                  {nextDates.map((date, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-warning/10 text-warning">
                          <span className="text-[10px] font-medium">
                            {DAY_NAMES_PT_SHORT[date.triggerDate.getDay()]}
                          </span>
                          <span className="text-sm font-bold">
                            {date.triggerDate.getDate()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            🔔 Disparo:{" "}
                            {date.triggerDate.toLocaleDateString("pt-BR")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            00:01 BRT
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="success">
                          🎾{" "}
                          {date.reservationDate.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedTimeSlot?.displayName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                <p>
                  ℹ️ O sistema dispara 10 dias antes da reserva, às 00:01 (logo
                  após a abertura das vagas).
                </p>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Criar Agendamento
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
