"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Clock, CheckCircle2, AlertCircle, User, Phone } from "lucide-react"
import Link from "next/link"

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

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/tickets")
      const data = await response.json()
      setTickets(data.data || [])
    } catch (error) {
      console.error("Erro ao buscar tickets:", error)
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
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
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

    return <Badge variant={variantMap[garantia] || "secondary"}>Garantia: {garantia}</Badge>
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.client_name.toLowerCase().includes(searchTerm.toLowerCase()) || ticket.id.toString().includes(searchTerm)

    const matchesFilter = filterStatus === "all" || ticket.status_ticket === filterStatus

    return matchesSearch && matchesFilter
  })

  const statusOptions = ["all", "Novo", "Em Análise", "Aguardando análise de atendente", "Resolvido"]

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
          <p className="text-center text-muted-foreground mt-2">Sistema de Gerenciamento de Tickets</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do cliente ou ID do ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status === "all" ? "Todos" : status}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Novos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {tickets.filter((t) => t.status_ticket === "Novo").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Em Análise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.filter((t) => t.status_ticket === "Em Análise").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolvidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {tickets.filter((t) => t.status_ticket === "Resolvido").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum ticket encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTickets.map((ticket) => (
              <Link key={ticket.id} href={`/ticket/${ticket.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">Ticket #{ticket.id}</CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(ticket.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </CardDescription>
                      </div>
                      {getStatusBadge(ticket.status_ticket)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{ticket.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{ticket.client_contact}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{ticket.raw_description}</p>
                    <div className="flex gap-2 flex-wrap pt-2">
                      {getGarantiaBadge(ticket.status_garantia)}
                      <Badge variant="outline" className="text-xs">
                        {ticket.atendimento_tipo}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
