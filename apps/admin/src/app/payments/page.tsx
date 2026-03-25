'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MoreHorizontal, Eye, RotateCcw, Euro, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import { AdminLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { paymentsApi } from '@/lib/api';
import { formatDateTime, formatCurrency } from '@/lib/utils';

interface Payment {
  id: string;
  jobId: string;
  amount: number;
  platformFee: number;
  professionalAmount: number;
  status: string;
  paymentMethod: string;
  client: { firstName: string; lastName: string };
  professional: { firstName: string; lastName: string };
  createdAt: string;
}

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payments', { status: statusFilter, page }],
    queryFn: () =>
      paymentsApi.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: 10,
      }),
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount?: number }) =>
      paymentsApi.refund(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setRefundOpen(false);
      setRefundAmount('');
      setSelectedPayment(null);
    },
  });

  const mockPayments: Payment[] = [
    {
      id: 'PAY-001',
      jobId: 'JOB-123',
      amount: 150,
      platformFee: 22.5,
      professionalAmount: 127.5,
      status: 'COMPLETED',
      paymentMethod: 'CARD',
      client: { firstName: 'Jean', lastName: 'Dupont' },
      professional: { firstName: 'Pierre', lastName: 'Martin' },
      createdAt: '2024-03-20T10:30:00',
    },
    {
      id: 'PAY-002',
      jobId: 'JOB-456',
      amount: 220,
      platformFee: 33,
      professionalAmount: 187,
      status: 'PENDING',
      paymentMethod: 'CARD',
      client: { firstName: 'Marie', lastName: 'Bernard' },
      professional: { firstName: 'Marc', lastName: 'Lefebvre' },
      createdAt: '2024-03-20T09:15:00',
    },
    {
      id: 'PAY-003',
      jobId: 'JOB-789',
      amount: 180,
      platformFee: 27,
      professionalAmount: 153,
      status: 'REFUNDED',
      paymentMethod: 'CARD',
      client: { firstName: 'Sophie', lastName: 'Petit' },
      professional: { firstName: 'Luc', lastName: 'Moreau' },
      createdAt: '2024-03-19T14:00:00',
    },
  ];

  const payments = data?.data || mockPayments;
  const totalPages = data?.meta?.totalPages || 1;

  const totalRevenue = payments.reduce((sum: number, p: Payment) => sum + p.platformFee, 0);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: 'warning', label: 'En attente', icon: Clock },
      COMPLETED: { variant: 'success', label: 'Complété', icon: CheckCircle },
      FAILED: { variant: 'destructive', label: 'Échoué', icon: XCircle },
      REFUNDED: { variant: 'secondary', label: 'Remboursé', icon: RotateCcw },
    };
    const config = variants[status] || { variant: 'secondary', label: status, icon: Clock };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleRefund = (payment: Payment) => {
    setSelectedPayment(payment);
    setRefundAmount(payment.amount.toString());
    setRefundOpen(true);
  };

  return (
    <AdminLayout title="Paiements">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Euro className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                  <p className="text-sm text-muted-foreground">Commission totale</p>
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
                    {payments.filter((p: Payment) => p.status === 'COMPLETED').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Complétés</p>
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
                    {payments.filter((p: Payment) => p.status === 'PENDING').length}
                  </p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <RotateCcw className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {payments.filter((p: Payment) => p.status === 'REFUNDED').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Remboursés</p>
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
                <Input placeholder="Rechercher par ID..." className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="COMPLETED">Complété</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="FAILED">Échoué</SelectItem>
                  <SelectItem value="REFUNDED">Remboursé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions ({payments.length})</CardTitle>
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
                    <TableHead>Client</TableHead>
                    <TableHead>Professionnel</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: Payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                      <TableCell>
                        {payment.client.firstName} {payment.client.lastName}
                      </TableCell>
                      <TableCell>
                        {payment.professional.firstName} {payment.professional.lastName}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-success">
                        {formatCurrency(payment.platformFee)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            {payment.status === 'COMPLETED' && (
                              <DropdownMenuItem onClick={() => handleRefund(payment)}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Rembourser
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

      {/* Refund Dialog */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rembourser le paiement</DialogTitle>
            <DialogDescription>
              Entrez le montant à rembourser pour le paiement {selectedPayment?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Montant du remboursement</label>
            <div className="relative mt-2">
              <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                max={selectedPayment?.amount}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Maximum: {formatCurrency(selectedPayment?.amount || 0)}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() =>
                selectedPayment &&
                refundMutation.mutate({
                  id: selectedPayment.id,
                  amount: parseFloat(refundAmount),
                })
              }
              loading={refundMutation.isPending}
            >
              Rembourser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
