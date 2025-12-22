import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Key,
  Shield,
  RefreshCw,
  Calendar,
  FileCheck,
  Database,
} from "lucide-react"

// Horários disponíveis (6h às 21h)
const AVAILABLE_HOURS = Array.from({ length: 16 }, (_, i) => i + 6)

// Definição das etapas do fluxo
const FLOW_STEPS = [
  {
    id: "parsing_payload",
    name: "Receber Payload",
    icon: FileCheck,
    description: "Processar dados recebidos",
  },
  {
    id: "test_mode",
    name: "Modo de Teste",
    icon: PlayCircle,
    description: "Ativar modo de teste E2E",
  },
  {
    id: "getting_refresh_token",
    name: "Buscar Token",
    icon: Key,
    description: "Obter refresh token do banco",
  },
  {
    id: "authenticating_superlogica",
    name: "Autenticar",
    icon: Shield,
    description: "Autenticar na API SuperLogica",
  },
  {
    id: "updating_refresh_token",
    name: "Atualizar Token",
    icon: RefreshCw,
    description: "Salvar novo refresh token",
  },
  {
    id: "making_reservation",
    name: "Fazer Reserva",
    icon: Calendar,
    description: "Chamar API do Speed",
  },
  {
    id: "processing_response",
    name: "Processar Resposta",
    icon: Database,
    description: "Validar resposta da API",
  },
  {
    id: "success",
    name: "Sucesso",
    icon: CheckCircle2,
    description: "Reserva concluída!",
  },
]

interface LogEntry {
  step: string
  message: string
  details?: any
  timestamp: string
}

interface TestResult {
  success: boolean
  error?: string
  step?: string
  details?: any
  duration?: number
  data?: any
  log?: LogEntry[]
}

export default function TestReservationE2E() {
  const [hour, setHour] = useState<string>("7")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const handleTest = async () => {
    setLoading(true)
    setResult(null)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(
        `${supabaseUrl}/functions/v1/execute-reservation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            test: true,
            hour: parseInt(hour, 10),
          }),
        }
      )

      const data: TestResult = await res.json().catch(() => ({
        success: false,
        error: "Erro ao parsear resposta",
      }))

      setResult(data)

      if (data.success) {
        toast.success("Reserva executada com sucesso!")
      } else {
        toast.error(`Erro: ${data.error || "Falha desconhecida"}`)
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Erro inesperado ao testar reserva"
      setResult({
        success: false,
        error: errorMsg,
        log: [],
      })
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Determina o status de cada etapa baseado no log
  const getStepStatus = (
    stepId: string
  ): "pending" | "running" | "success" | "error" | "skipped" => {
    if (!result) return "pending"

    const logEntry = result.log?.find((l) => l.step === stepId)
    const errorStep = result.step

    if (stepId === "error") return "error"

    if (logEntry) {
      // Se esta é a etapa que falhou
      if (errorStep === stepId && !result.success) {
        return "error"
      }
      return "success"
    }

    // Se já passou desta etapa (há logs de etapas posteriores)
    const stepIndex = FLOW_STEPS.findIndex((s) => s.id === stepId)
    const lastLogStep = result.log?.[result.log.length - 1]?.step
    const lastStepIndex = FLOW_STEPS.findIndex((s) => s.id === lastLogStep)

    if (stepIndex < lastStepIndex) {
      return "success"
    }

    return "pending"
  }

  const getStatusIcon = (status: string, StepIcon: any) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <StepIcon className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
      case "running":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-muted bg-muted/30"
    }
  }

  const getLogEntryForStep = (stepId: string) => {
    return result?.log?.find((l) => l.step === stepId)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Teste de Reserva E2E
        </h1>
        <p className="text-muted-foreground">
          Execute uma reserva de teste para validar todo o fluxo
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Card de configuração */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Configuração
            </CardTitle>
            <CardDescription>Configure e execute o teste</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Horário da Reserva</label>
              <Select value={hour} onValueChange={setHour} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_HOURS.map((h) => (
                    <SelectItem key={h} value={h.toString()}>
                      {h.toString().padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Reserva para daqui a 10 dias
              </p>
            </div>

            <Separator />

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <strong>⚠️ Atenção:</strong> Este teste executa uma reserva real.
            </div>

            <Button
              onClick={handleTest}
              disabled={loading}
              className="w-full gap-2"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  Executar Teste
                </>
              )}
            </Button>

            {result && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={result.success ? "success" : "destructive"}>
                    {result.success ? "Sucesso" : "Erro"}
                  </Badge>
                </div>
                {result.duration && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Duração:
                    </span>
                    <span className="text-sm">{result.duration}ms</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fluxo visual das etapas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result?.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : result?.success === false ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground" />
              )}
              Fluxo de Execução
            </CardTitle>
            <CardDescription>
              {result
                ? result.success
                  ? "Todas as etapas concluídas com sucesso"
                  : `Erro na etapa: ${
                      FLOW_STEPS.find((s) => s.id === result.step)?.name ||
                      result.step
                    }`
                : "Execute o teste para ver o progresso"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {FLOW_STEPS.map((step, index) => {
                const status = getStepStatus(step.id)
                const logEntry = getLogEntryForStep(step.id)
                const isErrorStep = result?.step === step.id && !result?.success

                return (
                  <div key={step.id}>
                    <div
                      className={`p-3 rounded-lg border transition-all ${getStatusColor(
                        status
                      )} ${isErrorStep ? "ring-2 ring-red-500" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            status === "success"
                              ? "bg-green-100"
                              : status === "error"
                              ? "bg-red-100"
                              : "bg-muted"
                          }`}
                        >
                          {getStatusIcon(status, step.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{step.name}</span>
                            {status === "success" && (
                              <Badge variant="success" className="text-xs">
                                OK
                              </Badge>
                            )}
                            {status === "error" && (
                              <Badge variant="destructive" className="text-xs">
                                ERRO
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {logEntry?.message || step.description}
                          </p>
                        </div>
                        {logEntry?.timestamp && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(logEntry.timestamp).toLocaleTimeString(
                              "pt-BR"
                            )}
                          </span>
                        )}
                      </div>

                      {/* Detalhes do erro */}
                      {isErrorStep && result?.error && (
                        <div className="mt-3 p-2 rounded bg-red-100 border border-red-200">
                          <p className="text-sm text-red-800 font-medium">
                            {result.error}
                          </p>
                          {result.details &&
                            Object.keys(result.details).length > 0 && (
                              <pre className="mt-2 text-xs text-red-700 overflow-x-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            )}
                        </div>
                      )}

                      {/* Detalhes do log */}
                      {logEntry?.details && !isErrorStep && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            Ver detalhes
                          </summary>
                          <pre className="mt-1 p-2 rounded bg-background/50 text-xs overflow-x-auto">
                            {JSON.stringify(logEntry.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>

                    {/* Linha conectora */}
                    {index < FLOW_STEPS.length - 1 && (
                      <div className="flex justify-center py-1">
                        <div
                          className={`w-0.5 h-4 ${
                            status === "success"
                              ? "bg-green-300"
                              : status === "error"
                              ? "bg-red-300"
                              : "bg-muted"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dados da reserva (se sucesso) */}
      {result?.success && result?.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Dados da Reserva
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Log completo (debug) */}
      {result?.log && result.log.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Log Completo (Debug)</CardTitle>
            <CardDescription>
              Todos os eventos registrados durante a execução
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-muted text-xs overflow-x-auto max-h-96">
              {JSON.stringify(result.log, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
