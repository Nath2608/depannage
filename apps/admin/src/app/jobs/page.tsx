'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MoreHorizontal, Eye, MapPin, Clock, Euro, Wrench, Key } from 'lucide-react';
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
import { jobsApi } from '@/lib/api';
import { formatDateTime, formatCurrency } from '@/lib/utils';

interface Job {
  id: string;
  tradeType: string;
  status: string;
  description: string;
  amount: number;
  client: { firstName: string; lastName: string };
  professional: { firstName: string; lastName: string };
  startedAt: string;
  completedAt: string | null;
}

export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', { status: statusFilter, page }],
    queryFn: () =>
      jobsApi.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: 10,
      }),
  });

  const mockJobs: Job[] = [
    {
      id: 'JOB-001',
      tradeType: 'PLUMBING',
      status: 'IN_PROGRESS',
      description: 'Réparation fuite sous évier',
      amount: 150,
      client: { firstName: 'Jean', lastName: 'Dupont' },
      professional: { firstName: 'Pierre', lastName: 'Martin' },
      startedAt: '2024-03-20T10:30:00',
      completedAt: null,
    },
    {
      id: 'JOB-002',
      tradeType: 'LOCKSMITH',
      status: 'COMPLETED',
      description: 'Changement serrure porte entrée',
      amount: 220,
      client: { firstName: 'Marie', lastName: 'Bernard' },
      professional: { firstName: 'Marc', lastName: 'Lefebvre' },
      startedAt: '2024-03-19T14:00:00',
      completedAt: '2024-03-19T15:30:00',
    },
    {
      id: 'JOB-003',
      tradeType: 'PLUMBING',
      status: 'EN_ROUTE',
      description: 'Débouchage canalisation',
      amount: 180,
      client: { firstName: 'Sophie', lastName: 'Petit' },
      professional: { firstName: 'Luc', lastName: 'Moreau' },
      startedAt: '2024-03-20T11:00:00',
      completedAt: null,
    },
  ];

  const jobs = data?.data || mockJobs;
  const totalPages = data?.meta?.totalPages || 1;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      ACCEPTED: { variant: 'secondary', label: 'Acceptée' },
      EN_ROUTE: { variant: 'warning', label: 'En route' },
      ARRIVED: { variant: 'warning', label: 'Arrivé' },
      IN_PROGRESS: { variant: 'default', label: 'En cours' },
      COMPLETED: { variant: 'success', label: 'Terminée' },
      CANCELLED: { variant: 'destructive', label: 'Annulée' },
    };
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTradeBadge = (tradeType: string) => {
    const Icon = tradeType === 'PLUMBING' ? Wrench : Key;
    const label = tradeType === 'PLUMBING' ? 'Plomberie' : 'Serrurerie';
    return (
      <Badge variant="outline" className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  return (
    <AdminLayout title="Missions">
      <div className="space-y-6">
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
                  <SelectItem value="EN_ROUTE">En route</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="COMPLETED">Terminée</SelectItem>
                  <SelectItem value="CANCELLED">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Missions ({jobs.length})</CardTitle>
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
                    <TableHead>Métier</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Professionnel</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job: Job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-sm">{job.id}</TableCell>
                      <TableCell>{getTradeBadge(job.tradeType)}</TableCell>
                      <TableCell>
                        {job.client.firstName} {job.client.lastName}
                      </TableCell>
                      <TableCell>
                        {job.professional.firstName} {job.professional.lastName}
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(job.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(job.startedAt)}
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
