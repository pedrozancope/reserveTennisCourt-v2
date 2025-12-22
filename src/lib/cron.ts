// Day of week names
export const DAY_NAMES = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
] as const

export const DAY_NAMES_PT = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const

export const DAY_NAMES_PT_SHORT = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const

/**
 * Calcula o dia de disparo (10 dias antes da reserva)
 * @param reservationDayOfWeek - Dia da semana da reserva (0=Dom, 6=Sáb)
 * @returns Dia da semana do disparo (0-6)
 */
export function getTriggerDayOfWeek(reservationDayOfWeek: number): number {
  // 10 dias antes = mesmo dia da semana - 3 dias
  // (10 mod 7 = 3, então voltar 3 dias)
  return (reservationDayOfWeek + 7 - 3) % 7
}

/**
 * Gera a cron expression para EventBridge
 * Dispara às 00:01 BRT (03:01 UTC) no dia correto
 *
 * @param reservationDayOfWeek - Dia da reserva (0=Dom, 6=Sáb)
 * @returns Cron expression para AWS EventBridge
 */
export function generateCronExpression(reservationDayOfWeek: number): string {
  const triggerDay = getTriggerDayOfWeek(reservationDayOfWeek)
  const dayName = DAY_NAMES[triggerDay]

  // 00:01 BRT = 03:01 UTC (considerando UTC-3)
  // Formato EventBridge: cron(minutos hora dia-do-mês mês dia-da-semana ano)
  return `cron(1 3 ? * ${dayName} *)`
}

/**
 * Calcula as próximas N datas de execução
 */
export function getNextExecutionDates(
  reservationDayOfWeek: number,
  count: number = 3
): { triggerDate: Date; reservationDate: Date }[] {
  const results: { triggerDate: Date; reservationDate: Date }[] = []
  const today = new Date()
  const triggerDayOfWeek = getTriggerDayOfWeek(reservationDayOfWeek)

  // Encontra o próximo dia de disparo
  const nextTrigger = new Date(today)
  const currentDay = today.getDay()
  let daysUntilTrigger = (triggerDayOfWeek - currentDay + 7) % 7

  // Se for hoje mas já passou da meia-noite, pega a próxima semana
  if (daysUntilTrigger === 0) {
    const now = new Date()
    if (now.getHours() > 0 || now.getMinutes() > 1) {
      daysUntilTrigger = 7
    }
  }

  nextTrigger.setDate(today.getDate() + daysUntilTrigger)
  nextTrigger.setHours(0, 1, 0, 0)

  for (let i = 0; i < count; i++) {
    const triggerDate = new Date(nextTrigger)
    triggerDate.setDate(triggerDate.getDate() + i * 7)

    const reservationDate = new Date(triggerDate)
    reservationDate.setDate(reservationDate.getDate() + 10)

    results.push({ triggerDate, reservationDate })
  }

  return results
}

/**
 * Formata cron expression para exibição legível
 */
export function formatCronDescription(reservationDayOfWeek: number): string {
  const triggerDay = getTriggerDayOfWeek(reservationDayOfWeek)
  return `Toda ${DAY_NAMES_PT[triggerDay]} às 00:01`
}
