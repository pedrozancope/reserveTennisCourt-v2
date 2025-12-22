import { useState } from "react"
import {
  Key,
  RefreshCw,
  Mail,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function Settings() {
  const [showToken, setShowToken] = useState(false)
  const [refreshToken, setRefreshToken] = useState("")
  const [isUpdatingToken, setIsUpdatingToken] = useState(false)
  const [email, setEmail] = useState("pedro@example.com")
  const [notifications, setNotifications] = useState({
    emailOnSuccess: true,
    emailOnFailure: true,
  })

  // Mock token status
  const tokenStatus = {
    isValid: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    maskedValue: "••••••••••••••••abcd1234",
  }

  const handleUpdateToken = async () => {
    if (!refreshToken.trim()) {
      toast.error("Digite o novo refresh token")
      return
    }

    setIsUpdatingToken(true)

    try {
      // TODO: Implement actual API call to update SSM parameter
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast.success("Token atualizado com sucesso!")
      setRefreshToken("")
    } catch (error) {
      toast.error("Erro ao atualizar token")
      console.error(error)
    } finally {
      setIsUpdatingToken(false)
    }
  }

  const handleSaveEmail = () => {
    toast.success("E-mail atualizado!")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie tokens e preferências</p>
      </div>

      <div className="grid gap-6">
        {/* Token Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Token de Autenticação
            </CardTitle>
            <CardDescription>
              Gerencie o refresh_token usado para autenticação no sistema Speed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Token Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    tokenStatus.isValid ? "bg-success/10" : "bg-destructive/10"
                  }`}
                >
                  {tokenStatus.isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Shield className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Status do Token</p>
                  <p className="text-sm text-muted-foreground">
                    Atualizado em{" "}
                    {new Date(tokenStatus.lastUpdated).toLocaleDateString(
                      "pt-BR"
                    )}
                  </p>
                </div>
              </div>
              <Badge variant={tokenStatus.isValid ? "success" : "error"}>
                {tokenStatus.isValid ? "Válido" : "Expirado"}
              </Badge>
            </div>

            {/* Current Token Value */}
            <div className="space-y-2">
              <Label>Token Atual</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 rounded-md bg-muted text-sm font-mono truncate">
                  {showToken
                    ? "real_token_value_here_12345"
                    : tokenStatus.maskedValue}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Update Token */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newToken">Novo Refresh Token</Label>
                <Input
                  id="newToken"
                  type="password"
                  placeholder="Cole o novo refresh_token aqui"
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  O token será criptografado e armazenado no AWS SSM Parameter
                  Store
                </p>
              </div>
              <Button
                onClick={handleUpdateToken}
                disabled={isUpdatingToken || !refreshToken.trim()}
                className="gap-2"
              >
                {isUpdatingToken ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Atualizar Token
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como você quer ser notificado sobre as reservas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail para notificações</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleSaveEmail}>
                  Salvar
                </Button>
              </div>
            </div>

            <Separator />

            {/* Notification Preferences */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Reserva confirmada</p>
                    <p className="text-sm text-muted-foreground">
                      Receber e-mail quando a reserva for bem sucedida
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.emailOnSuccess}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({
                      ...prev,
                      emailOnSuccess: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Falha na reserva</p>
                    <p className="text-sm text-muted-foreground">
                      Receber e-mail quando houver erro na reserva
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.emailOnFailure}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({
                      ...prev,
                      emailOnFailure: checked,
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Tennis Scheduler</strong> v1.0.0
              </p>
              <p>
                Sistema de reservas automáticas de quadras de tênis com
                integração AWS EventBridge.
              </p>
              <p className="pt-2">
                Desenvolvido com 🎾 por{" "}
                <a
                  href="https://github.com/pedrozancope"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @pedrozancope
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
