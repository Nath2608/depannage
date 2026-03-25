'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Briefcase,
  Wrench,
  Euro,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AdminLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboardApi } from '@/lib/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  loading?: boolean;
}

function StatCard({ title, value, change, icon: Icon, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="mt-4 h-8 w-24" />
          <Skeleton className="mt-2 h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {change !== undefined && (
            <div
              className={`flex items-center gap-1 text-sm ${
                change >= 0 ? 'text-success' : 'text-destructive'
              }`}
            >
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: dashboardApi.getRecentActivity,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-charts', 'week'],
    queryFn: () => dashboardApi.getChartData('week'),
  });

  // Mock data for demo
  const mockStats = {
    totalUsers: 1250,
    totalProfessionals: 185,
    activeJobs: 42,
    monthlyRevenue: 28500,
    userGrowth: 12,
    proGrowth: 8,
    jobGrowth: -5,
    revenueGrowth: 15,
  };

  const mockChartData = {
    revenue: [
      { name: 'Lun', value: 4200 },
      { name: 'Mar', value: 3800 },
      { name: 'Mer', value: 5100 },
      { name: 'Jeu', value: 4600 },
      { name: 'Ven', value: 5800 },
      { name: 'Sam', value: 6200 },
      { name: 'Dim', value: 3100 },
    ],
    jobsByTrade: [
      { name: 'Plomberie', value: 45 },
      { name: 'Serrurerie', value: 35 },
      { name: 'Électricité', value: 12 },
      { name: 'Autre', value: 8 },
    ],
    jobsByStatus: [
      { name: 'Terminées', value: 156, color: '#10B981' },
      { name: 'En cours', value: 42, color: '#3B82F6' },
      { name: 'En attente', value: 28, color: '#F59E0B' },
      { name: 'Annulées', value: 12, color: '#EF4444' },
    ],
  };

  const mockActivity = [
    {
      id: 1,
      type: 'new_user',
      message: 'Nouveau client inscrit: Jean Dupont',
      time: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: 2,
      type: 'pro_pending',
      message: 'Professionnel en attente de validation: Pierre Martin',
      time: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      id: 3,
      type: 'job_completed',
      message: 'Mission terminée: Réparation fuite - 150€',
      time: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: 4,
      type: 'dispute',
      message: 'Nouveau litige ouvert: #DSP-1234',
      time: new Date(Date.now() - 60 * 60 * 1000),
    },
    {
      id: 5,
      type: 'payment',
      message: 'Paiement reçu: 280€ pour mission #JOB-5678',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ];

  const displayStats = stats || mockStats;
  const displayChartData = chartData || mockChartData;
  const displayActivity = activity || mockActivity;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_user':
        return <Users className="h-4 w-4 text-primary" />;
      case 'pro_pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'job_completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'dispute':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'payment':
        return <Euro className="h-4 w-4 text-success" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Utilisateurs totaux"
            value={displayStats.totalUsers.toLocaleString()}
            change={displayStats.userGrowth}
            icon={Users}
            loading={statsLoading}
          />
          <StatCard
            title="Professionnels actifs"
            value={displayStats.totalProfessionals.toLocaleString()}
            change={displayStats.proGrowth}
            icon={Briefcase}
            loading={statsLoading}
          />
          <StatCard
            title="Missions en cours"
            value={displayStats.activeJobs.toLocaleString()}
            change={displayStats.jobGrowth}
            icon={Wrench}
            loading={statsLoading}
          />
          <StatCard
            title="Revenu mensuel"
            value={formatCurrency(displayStats.monthlyRevenue)}
            change={displayStats.revenueGrowth}
            icon={Euro}
            loading={statsLoading}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenus</CardTitle>
              <CardDescription>Évolution des revenus sur la semaine</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="week">
                <TabsList>
                  <TabsTrigger value="week">Semaine</TabsTrigger>
                  <TabsTrigger value="month">Mois</TabsTrigger>
                  <TabsTrigger value="year">Année</TabsTrigger>
                </TabsList>
                <TabsContent value="week" className="mt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={displayChartData.revenue}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(value) => `${value}€`} />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Revenu']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.2)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Jobs by Trade */}
          <Card>
            <CardHeader>
              <CardTitle>Missions par métier</CardTitle>
              <CardDescription>Répartition des missions par type de service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={displayChartData.jobsByTrade}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {displayChartData.jobsByTrade.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} missions`, '']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {displayChartData.jobsByTrade.map((entry: any, index: number) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">
                      {entry.name} ({entry.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Jobs by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Statut des missions</CardTitle>
              <CardDescription>Répartition actuelle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayChartData.jobsByStatus.map((status: any) => (
                  <div key={status.name} className="flex items-center gap-4">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="flex-1 text-sm">{status.name}</span>
                    <span className="font-medium">{status.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>Dernières actions sur la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayActivity.map((item: any) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{item.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(item.time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
