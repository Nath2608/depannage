'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpCircle,
  MessageSquare,
  Euro,
  Eye,
} from 'lucide-react';
import { AdminLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { disputesApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Dispute {
  id: string;
  jobId: string;
  reason: string;
  description: string;
  status: string;
  priority: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  job: {
    id: string;
    title: string;
    amount: number;
  };
  messages: {
    id: string;
    sender: string;
    content: string;
    createdAt: string;
  }[];
  createdAt: string;
  resolvedAt: string | null;
  resolution: string | null;
}

export default function DisputesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [penaltyToPro, setPenaltyToPro] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['disputes', { status: statusFilter, page }],
    queryFn: () =>
      disputesApi.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: 10,
      }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      resolution,
      refundAmount,
      penaltyToPro,
    }: {
      id: string;
      resolution: string;
      refundAmount?: number;
      penaltyToPro?: boolean;
    }) => disputesApi.resolve(id, { resolution, refundAmount, penaltyToPro }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      setResolveOpen(false);
      setResolution('');
      setRefundAmount('');
      setPenaltyToPro(false);
      setSelectedDispute(null);
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (id: string) => disputesApi.escalate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });

  // Mock data
  const mockDisputes: Dispute[] = [
    {
      id: 'DSP-001',
      jobId: 'JOB-123',
      reason: 'QUALITY_ISSUE',
      description: 'Le travail effectué présente des défauts. Fuite toujours présente après intervention.',
      status: 'OPEN',
      priority: 'HIGH',
      client: {
        id: '1',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean@email.com',
      },
      professional: {
        id: '2',
        firstName: 'Pierre',
        lastName: 'Martin',
        email: 'pierre@email.com',
      },
      job: {
        id: 'JOB-123',
        title: 'Réparation fuite robinet',
        amount: 150,
      },
      messages: [
        {
          id: '1',
          sender: 'CLIENT',
          content: 'Le robinet fuit toujours après votre passage.',
          createdAt: '2024-03-20T10:00:00',
        },
        {
          id: '2',
          sender: 'PROFESSIONAL',
          content: 'Je suis disponible pour revenir vérifier.',
          createdAt: '2024-03-20T11:30:00',
        },
      ],
      createdAt: '2024-03-20T09:00:00',
      resolvedAt: null,
      resolution: null,
    },
    {
      id: 'DSP-002',
      jobId: 'JOB-456',
      reason: 'LATE_ARRIVAL',
      description: 'Le professionnel est arrivé avec 2 heures de retard sans prévenir.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      client: {
        id: '3',
        firstName: 'Marie',
        lastName: 'Bernard',
        email: 'marie@email.com',
      },
      professional: {
        id: '4',
        firstName: 'Marc',
        lastName: 'Lefebvre',
        email: 'marc@email.com',
      },
      job: {
        id: 'JOB-456',
        title: 'Changement de serrure',
        amount: 200,
      },
      messages: [],
      createdAt: '2024-03-19T14:00:00',
      resolvedAt: null,
      resolution: null,
    },
    {
      id: 'DSP-003',
      jobId: 'JOB-789',
      reason: 'OVERCHARGE',
      description: 'Le prix final est bien supérieur au devis initial sans justification.',
      status: 'RESOLVED',
      priority: 'LOW',
      client: {
        id: '5',
        firstName: 'Sophie',
        lastName: 'Petit',
        email: 'sophie@email.com',
      },
      professional: {
        id: '6',
        firstName: 'Luc',
        lastName: 'Moreau',
        email: 'luc@email.com',
      },
      job: {
        id: 'JOB-789',
        title: 'Installation chauffe-eau',
        amount: 450,
      },
      messages: [],
      createdAt: '2024-03-15T09:00:00',
      resolvedAt: '2024-03-18T16:00:00',
      resolution: 'Remboursement partiel de 50€ accordé au client.',
    },
  ];

  const disputes = data?.data || mockDisputes;
  const totalPages = data?.meta?.totalPages || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Ouvert
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            En cours
          </Badge>
        );
      case 'RESOLVED':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Résolu
          </Badge>
        );
      case 'ESCALATED':
        return (
          <Badge variant="destructive" className="gap-1">
            <ArrowUpCircle className="h-3 w-3" />
            Escaladé
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge variant="destructive">Haute</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">Moyenne</Badge>;
      case 'LOW':
        return <Badge variant="secondary">Basse</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      QUALITY_ISSUE: 'Problème de qualité',
      LATE_ARRIVAL: 'Retard',
      OVERCHARGE: 'Surfacturation',
      NO_SHOW: 'Non présentation',
      DAMAGE: 'Dommage',
      OTHER: 'Autre',
    };
    return labels[reason] || reason;
  };

  const handleViewDetails = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setDetailOpen(true);
  };

  const handleResolve = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setResolveOpen(true);
  };

  const openDisputes = disputes.filter((d: Dispute) => d.status === 'OPEN').length;

  return (
    <AdminLayout title="Gestion des litiges">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{openDisputes}</p>
                  <p className="text-sm text-muted-foreground">Litiges ouverts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {disputes.filter((d: Dispute) => d.status === 'IN_PROGRESS').length}
                  </p>
                  <p className="text-sm text-muted-foreground">En traitement</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {disputes.filter((d: Dispute) => d.status === 'RESOLVED').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Résolus ce mois</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Euro className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">250€</p>
                  <p className="text-sm text-muted-foreground">Remboursés ce mois</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Rechercher par ID ou nom..." className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="OPEN">Ouvert</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="RESOLVED">Résolu</SelectItem>
                  <SelectItem value="ESCALATED">Escaladé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Disputes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Litiges ({data?.meta?.total || disputes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Professionnel</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((dispute: Dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell className="font-mono text-sm">{dispute.id}</TableCell>
                      <TableCell>{getReasonLabel(dispute.reason)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {dispute.client.firstName} {dispute.client.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{dispute.client.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {dispute.professional.firstName} {dispute.professional.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dispute.professional.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(dispute.job.amount)}</TableCell>
                      <TableCell>{getPriorityBadge(dispute.priority)}</TableCell>
                      <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                      <TableCell>{formatDate(dispute.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewDetails(dispute)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Messages ({dispute.messages.length})
                            </DropdownMenuItem>
                            {dispute.status !== 'RESOLVED' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-success"
                                  onClick={() => handleResolve(dispute)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Résoudre
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => escalateMutation.mutate(dispute.id)}
                                >
                                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                                  Escalader
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails du litige {selectedDispute?.id}</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedDispute.status)}
                  {getPriorityBadge(selectedDispute.priority)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Ouvert le {formatDate(selectedDispute.createdAt)}
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-1">{getReasonLabel(selectedDispute.reason)}</p>
                <p className="text-sm text-muted-foreground">{selectedDispute.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Client</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">
                      {selectedDispute.client.firstName} {selectedDispute.client.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedDispute.client.email}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Professionnel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">
                      {selectedDispute.professional.firstName} {selectedDispute.professional.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDispute.professional.email}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Mission concernée</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{selectedDispute.job.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Montant: {formatCurrency(selectedDispute.job.amount)}
                  </p>
                </CardContent>
              </Card>

              {selectedDispute.messages.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Messages</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedDispute.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`rounded-lg p-3 ${
                          msg.sender === 'CLIENT' ? 'bg-primary/10 ml-4' : 'bg-muted mr-4'
                        }`}
                      >
                        <p className="text-xs font-medium mb-1">
                          {msg.sender === 'CLIENT' ? 'Client' : 'Professionnel'}
                        </p>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(msg.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDispute.resolution && (
                <div className="rounded-lg border-2 border-success p-4">
                  <p className="text-sm font-medium text-success mb-1">Résolution</p>
                  <p className="text-sm">{selectedDispute.resolution}</p>
                </div>
              )}

              {selectedDispute.status !== 'RESOLVED' && (
                <DialogFooter>
                  <Button variant="outline" onClick={() => escalateMutation.mutate(selectedDispute.id)}>
                    Escalader
                  </Button>
                  <Button onClick={() => handleResolve(selectedDispute)}>Résoudre</Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résoudre le litige</DialogTitle>
            <DialogDescription>
              Indiquez la résolution pour le litige {selectedDispute?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Description de la résolution</label>
              <Input
                className="mt-2"
                placeholder="Décrivez la résolution..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Montant du remboursement (optionnel)</label>
              <div className="relative mt-2">
                <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-10"
                  type="number"
                  placeholder="0.00"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="penalty"
                checked={penaltyToPro}
                onChange={(e) => setPenaltyToPro(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="penalty" className="text-sm">
                Appliquer une pénalité au professionnel
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() =>
                selectedDispute &&
                resolveMutation.mutate({
                  id: selectedDispute.id,
                  resolution,
                  refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
                  penaltyToPro,
                })
              }
              loading={resolveMutation.isPending}
              disabled={!resolution}
            >
              Confirmer la résolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
