'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MoreHorizontal, Star, Flag, Trash2, Eye } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { reviewsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string;
  flagged: boolean;
  flagReason: string | null;
  client: { firstName: string; lastName: string };
  professional: { firstName: string; lastName: string };
  jobId: string;
  createdAt: string;
}

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [showFlagged, setShowFlagged] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', { flagged: showFlagged, page }],
    queryFn: () =>
      reviewsApi.getAll({
        flagged: showFlagged || undefined,
        page,
        limit: 10,
      }),
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      reviewsApi.flag(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setFlagDialogOpen(false);
      setFlagReason('');
      setSelectedReview(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      reviewsApi.remove(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setDeleteDialogOpen(false);
      setSelectedReview(null);
    },
  });

  const mockReviews: Review[] = [
    {
      id: '1',
      rating: 5,
      comment: 'Excellent travail, très professionnel et rapide. Je recommande vivement!',
      flagged: false,
      flagReason: null,
      client: { firstName: 'Jean', lastName: 'Dupont' },
      professional: { firstName: 'Pierre', lastName: 'Martin' },
      jobId: 'JOB-123',
      createdAt: '2024-03-20',
    },
    {
      id: '2',
      rating: 2,
      comment: 'Travail bâclé, je suis très déçu. Le professionnel était en retard et impoli.',
      flagged: true,
      flagReason: 'Langage inapproprié',
      client: { firstName: 'Marie', lastName: 'Bernard' },
      professional: { firstName: 'Marc', lastName: 'Lefebvre' },
      jobId: 'JOB-456',
      createdAt: '2024-03-19',
    },
    {
      id: '3',
      rating: 4,
      comment: 'Bon service, quelques petits retards mais travail bien fait.',
      flagged: false,
      flagReason: null,
      client: { firstName: 'Sophie', lastName: 'Petit' },
      professional: { firstName: 'Luc', lastName: 'Moreau' },
      jobId: 'JOB-789',
      createdAt: '2024-03-18',
    },
  ];

  const reviews = data?.data || mockReviews;
  const totalPages = data?.meta?.totalPages || 1;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleFlag = (review: Review) => {
    setSelectedReview(review);
    setFlagDialogOpen(true);
  };

  const handleDelete = (review: Review) => {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  };

  return (
    <AdminLayout title="Avis">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">4.6</p>
                  <p className="text-sm text-muted-foreground">Note moyenne</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reviews.length}</p>
                  <p className="text-sm text-muted-foreground">Total avis</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <Flag className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {reviews.filter((r: Review) => r.flagged).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Signalés</p>
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
                <Input placeholder="Rechercher..." className="pl-10" />
              </div>
              <Button
                variant={showFlagged ? 'default' : 'outline'}
                onClick={() => setShowFlagged(!showFlagged)}
                className="gap-2"
              >
                <Flag className="h-4 w-4" />
                {showFlagged ? 'Tous les avis' : 'Signalés uniquement'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Avis ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Professionnel</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="w-[300px]">Commentaire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review: Review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        {review.client.firstName} {review.client.lastName}
                      </TableCell>
                      <TableCell>
                        {review.professional.firstName} {review.professional.lastName}
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[300px]">{review.comment}</p>
                      </TableCell>
                      <TableCell>
                        {review.flagged ? (
                          <Badge variant="destructive" className="gap-1">
                            <Flag className="h-3 w-3" />
                            Signalé
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(review.createdAt)}</TableCell>
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
                            {!review.flagged && (
                              <DropdownMenuItem onClick={() => handleFlag(review)}>
                                <Flag className="mr-2 h-4 w-4" />
                                Signaler
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(review)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
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

      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler l'avis</DialogTitle>
            <DialogDescription>
              Indiquez la raison du signalement
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Raison du signalement..."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() =>
                selectedReview && flagMutation.mutate({ id: selectedReview.id, reason: flagReason })
              }
              loading={flagMutation.isPending}
              disabled={!flagReason}
            >
              Signaler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'avis</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L'avis sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedReview &&
                removeMutation.mutate({ id: selectedReview.id, reason: 'Admin removal' })
              }
              loading={removeMutation.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
