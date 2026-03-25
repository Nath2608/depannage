'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Star,
  MapPin,
  Wrench,
  Key,
  Zap,
  Ban,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { professionalsApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Professional {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  tradeType: string;
  status: string;
  rating: number;
  completedJobs: number;
  totalEarnings: number;
  serviceRadius: number;
  createdAt: string;
  documents: {
    type: string;
    url: string;
    verified: boolean;
  }[];
}

const tradeIcons: Record<string, React.ElementType> = {
  PLUMBING: Wrench,
  LOCKSMITH: Key,
  ELECTRICAL: Zap,
};

export default function ProfessionalsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tradeFilter, setTradeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['professionals', { status: statusFilter, tradeType: tradeFilter, page }],
    queryFn: () =>
      professionalsApi.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        tradeType: tradeFilter !== 'all' ? tradeFilter : undefined,
        page,
        limit: 10,
      }),
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['professionals-pending'],
    queryFn: professionalsApi.getPending,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => professionalsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      queryClient.invalidateQueries({ queryKey: ['professionals-pending'] });
      setDetailOpen(false);
      setSelectedPro(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      professionalsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      queryClient.invalidateQueries({ queryKey: ['professionals-pending'] });
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedPro(null);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      professionalsApi.suspend(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
  });

  // Mock data
  const mockPros: Professional[] = [
    {
      id: '1',
      email: 'pierre.plombier@email.com',
      firstName: 'Pierre',
      lastName: 'Durand',
      phone: '06 11 22 33 44',
      tradeType: 'PLUMBING',
      status: 'APPROVED',
      rating: 4.8,
      completedJobs: 45,
      totalEarnings: 12500,
      serviceRadius: 15,
      createdAt: '2024-01-10',
      documents: [
        { type: 'ID_CARD', url: '/docs/id.pdf', verified: true },
        { type: 'INSURANCE', url: '/docs/insurance.pdf', verified: true },
        { type: 'CERTIFICATION', url: '/docs/cert.pdf', verified: true },
      ],
    },
    {
      id: '2',
      email: 'marc.serrurier@email.com',
      firstName: 'Marc',
      lastName: 'Lefebvre',
      phone: '06 55 66 77 88',
      tradeType: 'LOCKSMITH',
      status: 'APPROVED',
      rating: 4.5,
      completedJobs: 32,
      totalEarnings: 8900,
      serviceRadius: 20,
      createdAt: '2024-02-15',
      documents: [
        { type: 'ID_CARD', url: '/docs/id.pdf', verified: true },
        { type: 'INSURANCE', url: '/docs/insurance.pdf', verified: true },
      ],
    },
    {
      id: '3',
      email: 'sophie.elec@email.com',
      firstName: 'Sophie',
      lastName: 'Bernard',
      phone: '06 99 88 77 66',
      tradeType: 'ELECTRICAL',
      status: 'PENDING_VALIDATION',
      rating: 0,
      completedJobs: 0,
      totalEarnings: 0,
      serviceRadius: 10,
      createdAt: '2024-03-20',
      documents: [
        { type: 'ID_CARD', url: '/docs/id.pdf', verified: false },
        { type: 'INSURANCE', url: '/docs/insurance.pdf', verified: false },
      ],
    },
  ];

  const mockPending = mockPros.filter((p) => p.status === 'PENDING_VALIDATION');

  const professionals = data?.data || mockPros;
  const pendingPros = pendingData || mockPending;
  const totalPages = data?.meta?.totalPages || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approuvé</Badge>;
      case 'PENDING_VALIDATION':
        return <Badge variant="warning">En attente</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejeté</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive">Suspendu</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTradeBadge = (tradeType: string) => {
    const Icon = tradeIcons[tradeType] || Wrench;
    const labels: Record<string, string> = {
      PLUMBING: 'Plomberie',
      LOCKSMITH: 'Serrurerie',
      ELECTRICAL: 'Électricité',
    };
    return (
      <Badge variant="outline" className="gap-1">
        <Icon className="h-3 w-3" />
        {labels[tradeType] || tradeType}
      </Badge>
    );
  };

  const handleViewDetails = (pro: Professional) => {
    setSelectedPro(pro);
    setDetailOpen(true);
  };

  const handleReject = (pro: Professional) => {
    setSelectedPro(pro);
    setRejectDialogOpen(true);
  };

  return (
    <AdminLayout title="Gestion des professionnels">
      <div className="space-y-6">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              En attente
              {pendingPros.length > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {pendingPros.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom ou email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={tradeFilter} onValueChange={setTradeFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Métier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les métiers</SelectItem>
                        <SelectItem value="PLUMBING">Plomberie</SelectItem>
                        <SelectItem value="LOCKSMITH">Serrurerie</SelectItem>
                        <SelectItem value="ELECTRICAL">Électricité</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="APPROVED">Approuvé</SelectItem>
                        <SelectItem value="PENDING_VALIDATION">En attente</SelectItem>
                        <SelectItem value="REJECTED">Rejeté</SelectItem>
                        <SelectItem value="SUSPENDED">Suspendu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professionals Table */}
            <Card>
              <CardHeader>
                <CardTitle>Professionnels ({data?.meta?.total || professionals.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Professionnel</TableHead>
                        <TableHead>Métier</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Missions</TableHead>
                        <TableHead>Gains</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {professionals.map((pro: Professional) => (
                        <TableRow key={pro.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white text-sm font-medium">
                                {pro.firstName.charAt(0)}
                                {pro.lastName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {pro.firstName} {pro.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">{pro.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getTradeBadge(pro.tradeType)}</TableCell>
                          <TableCell>{getStatusBadge(pro.status)}</TableCell>
                          <TableCell>
                            {pro.rating > 0 ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{pro.rating.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{pro.completedJobs}</TableCell>
                          <TableCell>{formatCurrency(pro.totalEarnings)}</TableCell>
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
                                <DropdownMenuItem onClick={() => handleViewDetails(pro)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Voir documents
                                </DropdownMenuItem>
                                {pro.status === 'PENDING_VALIDATION' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-success"
                                      onClick={() => approveMutation.mutate(pro.id)}
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approuver
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => handleReject(pro)}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Rejeter
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {pro.status === 'APPROVED' && (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                      suspendMutation.mutate({ id: pro.id, reason: 'Admin suspension' })
                                    }
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Suspendre
                                  </DropdownMenuItem>
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
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Professionnels en attente de validation</CardTitle>
                <CardDescription>
                  Vérifiez les documents et approuvez ou rejetez les demandes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : pendingPros.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-success mb-4" />
                    <p className="text-lg font-medium">Aucune demande en attente</p>
                    <p className="text-sm text-muted-foreground">
                      Toutes les demandes ont été traitées
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPros.map((pro: Professional) => (
                      <Card key={pro.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white font-medium">
                                {pro.firstName.charAt(0)}
                                {pro.lastName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {pro.firstName} {pro.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">{pro.email}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  {getTradeBadge(pro.tradeType)}
                                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {pro.serviceRadius} km
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(pro)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Détails
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(pro)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Rejeter
                              </Button>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => approveMutation.mutate(pro.id)}
                                loading={approveMutation.isPending}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approuver
                              </Button>
                            </div>
                          </div>

                          {/* Documents */}
                          <div className="mt-4 border-t pt-4">
                            <p className="text-sm font-medium mb-2">Documents soumis</p>
                            <div className="flex gap-2">
                              {pro.documents.map((doc, i) => (
                                <Badge key={i} variant={doc.verified ? 'success' : 'secondary'}>
                                  <FileText className="mr-1 h-3 w-3" />
                                  {doc.type === 'ID_CARD' && "Pièce d'identité"}
                                  {doc.type === 'INSURANCE' && 'Assurance'}
                                  {doc.type === 'CERTIFICATION' && 'Certification'}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du professionnel</DialogTitle>
          </DialogHeader>
          {selectedPro && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white text-xl font-medium">
                  {selectedPro.firstName.charAt(0)}
                  {selectedPro.lastName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedPro.firstName} {selectedPro.lastName}
                  </h3>
                  <p className="text-muted-foreground">{selectedPro.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {getTradeBadge(selectedPro.tradeType)}
                    {getStatusBadge(selectedPro.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{selectedPro.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Zone d'intervention</p>
                  <p className="font-medium">{selectedPro.serviceRadius} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Note moyenne</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">
                      {selectedPro.rating > 0 ? selectedPro.rating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Missions terminées</p>
                  <p className="font-medium">{selectedPro.completedJobs}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gains totaux</p>
                  <p className="font-medium">{formatCurrency(selectedPro.totalEarnings)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inscription</p>
                  <p className="font-medium">{formatDate(selectedPro.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Documents</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPro.documents.map((doc, i) => (
                    <Button key={i} variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      {doc.type === 'ID_CARD' && "Pièce d'identité"}
                      {doc.type === 'INSURANCE' && 'Assurance'}
                      {doc.type === 'CERTIFICATION' && 'Certification'}
                      {doc.verified && <CheckCircle className="ml-2 h-4 w-4 text-success" />}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedPro.status === 'PENDING_VALIDATION' && (
                <DialogFooter>
                  <Button variant="destructive" onClick={() => handleReject(selectedPro)}>
                    Rejeter
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => approveMutation.mutate(selectedPro.id)}
                    loading={approveMutation.isPending}
                  >
                    Approuver
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du rejet pour{' '}
              <strong>
                {selectedPro?.firstName} {selectedPro?.lastName}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Raison du rejet</label>
            <Input
              className="mt-2"
              placeholder="Documents incomplets, non conformes..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedPro && rejectMutation.mutate({ id: selectedPro.id, reason: rejectReason })
              }
              loading={rejectMutation.isPending}
              disabled={!rejectReason}
            >
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
