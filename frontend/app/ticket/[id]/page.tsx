"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  FileText,
  Package,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

interface Ticket {
  id: number
  client_name: string
  client_contact: string
  status_ticket: string
  status_garantia: string
  atendimento_tipo: string
  raw_description: string
  nf_url: string | null
  suggested_part_sku: string | null
  estimated_deadline_days: number | null
  created_at: string
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchTicket(params.id as string)
    }
  }, [params.id])

  const fetchTicket = async (id: string) => {
    try {
      const response = await fetch("http://localhost:3001/api/tickets")
      const data = await response.json()
      const foundTicket = data.data.find((t: Ticket) => t.id === Number.parseInt(id))
      setTicket(foundTicket || null)
    } catch (error) {
      console.error("Erro ao buscar ticket:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      Novo: { variant: "default", icon: AlertCircle },
      "Em Análise": { variant: "secondary", icon: Clock },
      "Aguardando análise de atendente": { variant: "outline", icon: Clock },
      Resolvido: { variant: "default", icon: CheckCircle2 },
    }

    const config = statusMap[status] || { variant: "outline" as const, icon: AlertCircle }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1 text-sm">
        <Icon className="h-4 w-4" />
        {status}
      </Badge>
    )
  }

  const getGarantiaBadge = (garantia: string) => {
    const variantMap: Record<string, "default" | "secondary" | "destructive"> = {
      Sim: "default",
      Não: "destructive",
      Pendente: "secondary",
    }

    return (
      <Badge variant={variantMap[garantia] || "secondary"} className="text-sm">
        {garantia}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando ticket...</p>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Ticket não encontrado.</p>
          <Button onClick={() => router.push("/")}>Voltar para lista</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-txA20zIbzL7z9KkkK6QADdqhAUldSY.png"
              alt="CAF Máquinas"
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-center mt-4 text-primary">CAF Connect</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para lista
        </Button>

        {/* Ticket Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-2xl">Ticket #{ticket.id}</CardTitle>
                <CardDescription className="mt-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Criado em{" "}
                  {new Date(ticket.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">{getStatusBadge(ticket.status_ticket)}</div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{ticket.client_name}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Contato</p>
                  <p className="font-medium">{ticket.client_contact}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status do Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status Atual</p>
                {getStatusBadge(ticket.status_ticket)}
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Garantia</p>
                {getGarantiaBadge(ticket.status_garantia)}
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tipo de Atendimento</p>
                <Badge variant="outline">{ticket.atendimento_tipo}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Descrição do Problema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{ticket.raw_description}</p>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {/* Part Information */}
          {ticket.suggested_part_sku && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Peça Sugerida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-lg font-semibold">{ticket.suggested_part_sku}</p>
              </CardContent>
            </Card>
          )}

          {/* Deadline */}
          {ticket.estimated_deadline_days && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Prazo Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{ticket.estimated_deadline_days} dias</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Invoice */}
        {ticket.nf_url && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Nota Fiscal</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <a href={ticket.nf_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visualizar Nota Fiscal
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
