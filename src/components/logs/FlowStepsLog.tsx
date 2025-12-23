import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  type FlowStep,
  type ExecutionResult,
  RESERVATION_FLOW_STEPS,
  TEST_FLOW_STEPS,
  PREFLIGHT_FLOW_STEPS,
  STEP_NAMES,
} from "@/lib/flowSteps"

interface FlowStepsLogProps {
  result: ExecutionResult | null
  isTest?: boolean
  isLoading?: boolean
  title?: string
  subtitle?: string
  compact?: boolean
  executionType?: "reservation" | "preflight" | "test"
}

export function FlowStepsLog({
  result,
  isTest = false,
  isLoading = false,
  title = "Fluxo de Execução",
  subtitle,
  compact = false,
  executionType = "reservation",
}: FlowStepsLogProps) {
  // Seleciona os steps apropriados baseado no modo
  const flowSteps =
    executionType === "preflight"
      ? PREFLIGHT_FLOW_STEPS
      : isTest || executionType === "test"
      ? TEST_FLOW_STEPS
      : getVisibleSteps(result)

  // Determina o status de cada etapa baseado no log
  const getStepStatus = (
    stepId: string
  ): "pending" | "running" | "success" | "error" | "skipped" => {
    if (isLoading) {
      const logEntry = result?.log?.find((l) => l.step === stepId)
      if (logEntry) return "success"

      const lastLogStep = result?.log?.[result.log.length - 1]?.step
      const stepIndex = flowSteps.findIndex((s) => s.id === stepId)
      const lastStepIndex = flowSteps.findIndex((s) => s.id === lastLogStep)

      if (stepIndex === lastStepIndex + 1) return "running"
      return "pending"
    }

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
    const stepIndex = flowSteps.findIndex((s) => s.id === stepId)
    const lastLogStep = result.log?.[result.log.length - 1]?.step
    const lastStepIndex = flowSteps.findIndex((s) => s.id === lastLogStep)

    if (stepIndex < lastStepIndex) {
      return "success"
    }

    return "pending"
  }

  const getStatusIcon = (status: string, StepIcon: React.ElementType) => {
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
        return "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
      case "error":
        return "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
      case "running":
        return "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
      default:
        return "border-muted bg-muted/30"
    }
  }

  const getLogEntryForStep = (stepId: string) => {
    return result?.log?.find((l) => l.step === stepId)
  }

  const defaultSubtitle = result
    ? result.success
      ? "Todas as etapas concluídas com sucesso"
      : `Erro na etapa: ${STEP_NAMES[result.step || ""] || result.step}`
    : "Aguardando execução"

  if (compact) {
    return (
      <div className="space-y-2">
        {flowSteps.map((step) => {
          const status = getStepStatus(step.id)

          return (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full ${
                  status === "success"
                    ? "bg-green-100"
                    : status === "error"
                    ? "bg-red-100"
                    : status === "running"
                    ? "bg-blue-100"
                    : "bg-muted"
                }`}
              >
                {getStatusIcon(status, step.icon)}
              </div>
              <span
                className={`text-sm ${
                  status === "pending" ? "text-muted-foreground" : ""
                }`}
              >
                {step.name}
              </span>
              {status === "success" && (
                <Badge variant="success" className="text-xs h-5">
                  OK
                </Badge>
              )}
              {status === "error" && (
                <Badge variant="destructive" className="text-xs h-5">
                  ERRO
                </Badge>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {result?.success ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : result?.success === false ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          ) : (
            <Clock className="h-5 w-5 text-muted-foreground" />
          )}
          {title}
        </CardTitle>
        <CardDescription>{subtitle || defaultSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {flowSteps.map((step, index) => {
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
                          ? "bg-green-100 dark:bg-green-900/50"
                          : status === "error"
                          ? "bg-red-100 dark:bg-red-900/50"
                          : status === "running"
                          ? "bg-blue-100 dark:bg-blue-900/50"
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
                        {status === "running" && (
                          <Badge variant="secondary" className="text-xs">
                            EXECUTANDO
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
                    <div className="mt-3 p-2 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                        {result.error}
                      </p>
                      {result.details &&
                        Object.keys(result.details).length > 0 && (
                          <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                    </div>
                  )}

                  {/* Detalhes do log */}
                  {logEntry?.details &&
                    !isErrorStep &&
                    Object.keys(logEntry.details).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          Ver detalhes
                        </summary>
                        <pre className="mt-1 p-2 rounded bg-background/50 text-xs overflow-x-auto max-h-32">
                          {JSON.stringify(logEntry.details, null, 2)}
                        </pre>
                      </details>
                    )}
                </div>

                {/* Linha conectora */}
                {index < flowSteps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div
                      className={`w-0.5 h-3 ${
                        status === "success"
                          ? "bg-green-300 dark:bg-green-700"
                          : status === "error"
                          ? "bg-red-300 dark:bg-red-700"
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
  )
}

// Função auxiliar para determinar quais steps são visíveis baseado no resultado
function getVisibleSteps(result: ExecutionResult | null): FlowStep[] {
  if (!result?.log || result.log.length === 0) {
    // Retorna steps básicos quando não há log
    return RESERVATION_FLOW_STEPS.filter((step) =>
      [
        "parsing_payload",
        "getting_schedule",
        "getting_refresh_token",
        "authenticating_superlogica",
        "updating_refresh_token",
        "making_reservation",
        "processing_response",
        "success",
      ].includes(step.id)
    )
  }

  // Identifica quais steps aparecem nos logs
  const logStepIds = new Set(result.log.map((l) => l.step))

  // Adiciona step de teste se test_mode está nos logs
  const hasTestMode = logStepIds.has("test_mode")

  // Filtra steps relevantes
  return RESERVATION_FLOW_STEPS.filter((step) => {
    // Sempre exclui getting_schedule se for modo de teste
    if (hasTestMode && step.id === "getting_schedule") return false

    // Inclui steps que aparecem nos logs ou são esperados
    if (logStepIds.has(step.id)) return true

    // Inclui steps básicos do fluxo
    const basicSteps = [
      "parsing_payload",
      "getting_refresh_token",
      "authenticating_superlogica",
      "updating_refresh_token",
      "making_reservation",
      "processing_response",
      "success",
    ]

    if (!hasTestMode) {
      basicSteps.push("getting_schedule")
    } else {
      basicSteps.push("test_mode")
    }

    return basicSteps.includes(step.id)
  })
}

export default FlowStepsLog
