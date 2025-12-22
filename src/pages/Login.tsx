import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Chrome } from "lucide-react"

export default function Login() {
  const { signInWithGoogle, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Se já estiver autenticado, redirecionar para home
    if (isAuthenticated) {
      navigate("/")
    }
  }, [isAuthenticated, navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-4" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-primary rounded-2xl shadow-lg">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-primary">
            Tennis Scheduler
          </CardTitle>
          <CardDescription className="text-base">
            Gerencie suas reservas de quadras de tênis de forma automatizada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>✅ Agendamentos automáticos</p>
            <p>✅ Notificações em tempo real</p>
            <p>✅ Histórico completo de reservas</p>
          </div>

          <Button
            onClick={signInWithGoogle}
            className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            <Chrome className="mr-2 h-5 w-5" />
            Entrar com Google
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao continuar, você concorda com nossos Termos de Serviço e Política
            de Privacidade
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
