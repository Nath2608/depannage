'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MoreHorizontal, MapPin, Clock, Eye, XCircle } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { requestsApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface ServiceRequest {
  id: string;
  tradeType: string;
  urgency: string;
  status: string;
  description: string;
  address: string;
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
  quotesCount: number;
  createdAt: string;
}

export default function RequestsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [tradeFilter, setTradeFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['requests', { status: statusFilter, tradeType: tradeFilter, page }],
    queryFn: () =>
      requestsApi.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        tradeType: tradeFilter !== 'all' ? tradeFilter : undefined,
        page,
        limit: 10,
      }),
  });

  // Mock data
  const mockRequests: ServiceRequest[] = [
    {
      id: 'REQ-001',
      tradeType: 'PLUMBING',
      urgency: 'URGENT',
      status: 'PENDING',
      description: 'Fuite importante sous évier',
      address: '12 rue de la Paix, 75001 Paris',
      client: { firstName: 'Jean', lastName: 'Dupont', email: 'jean@email.com' },
      quotesCount: 3,
      createdAt: '2024-03-20T10:30:00',
    },
    {
      id: 'REQ-002',
      tradeType: 'LOCKSMITH',
      urgency: 'EMERGENCY',
      status: 'ACCEPTED',
      description: 'Porte claquée, clés à l\'intérieur',
      address: '45 avenue Victor Hugo, 75016 Paris',
      client: { firstName: 'Marie', lastName: 'Martin', email: 'marie@email.com' },
      quotesCount: 1,
      createdAt: '2024-03-20T09:15:00',
    },
    {
      id: 'REQ-003',
      tradeType: 'PLUMBING',
      urgency: 'NORMAL',
      status: 'COMPLETED',
      description: 'Installation robinet cuisine',
      address: '8 boulevard Saint-Michel, 75005 Paris',
      client: { firstName: 'Pierre', lastName: 'Bernard', email: 'pierre@email.com' },
      quotesCount: 5,
      createdAt: '2024-03-19T14:00:00',
    },
  ];

  const requests = data?.data || mockRequests;
  const totalPages = data?.meta?.totalPages || 1;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: 'warning', label: 'En attente' },
      ACCEPTED: { variant: 'success', label: 'Acceptée' },
      IN_PROGRESS: { variant: 'default', label: 'En cours' },
      COMPLETED: { variant: 'success', label: 'Terminée' },
      CANCELLED: { variant: 'destructive', label: 'Annulée' },
    };
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants: Record<string, any> = {
      EMERGENCY: { variant: 'destructive', label: 'Urgence' },
      URGENT: { variant: 'warning', label: 'Urgent' },
      NORMAL: { variant: 'secondary', label: 'Normal' },
      SCHEDULED: { variant: 'outline', label: 'Planifié' },
    };
    const config = variants[urgency] || { variant: 'secondary', label: urgency };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <AdminLayout title="Demandes de service">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Rechercher..." className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Select value={tradeFilter} onValueChange={setTradeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Métier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="PLUMBING">Plomberie</SelectItem>
                    <SelectItem value="LOCKSMITH">Serrurerie</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="ACCEPTED">Acceptée</SelectItem>
                    <SelectItem value="COMPLETED">Terminée</SelectItem>
                    <SelectItem value="CANCELLED">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Demandes ({requests.length})</CardTitle>
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
                    <TableHead>Description</TableHead>
                    <TableHead>Urgence</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Devis</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req: ServiceRequest) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-sm">{req.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {req.client.firstName} {req.client.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {req.address.substring(0, 30)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{req.description}</TableCell>
                      <TableCell>{getUrgencyBadge(req.urgency)}</TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell>{req.quotesCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(req.createdAt)}
                        </div>
                      </TableCell>
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
                            {req.status === 'PENDING' && (
                              <DropdownMenuItem className="text-destructive">
                                <XCircle className="mr-2 h-4 w-4" />
                                Annuler
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
    </AdminLayout>
  );
}
