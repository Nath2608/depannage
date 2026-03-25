'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Percent, Euro, Clock, Bell, Shield } from 'lucide-react';
import { AdminLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { settingsApi } from '@/lib/api';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  // Commission settings
  const [commissionRate, setCommissionRate] = useState('15');
  const [emergencyFee, setEmergencyFee] = useState('20');
  const [minJobAmount, setMinJobAmount] = useState('50');
  const [maxRadius, setMaxRadius] = useState('50');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [disputeAlerts, setDisputeAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const handleSaveCommission = () => {
    updateMutation.mutate({
      commissionRate: parseFloat(commissionRate),
      emergencyFee: parseFloat(emergencyFee),
      minJobAmount: parseFloat(minJobAmount),
      maxRadius: parseFloat(maxRadius),
    });
  };

  const handleSaveNotifications = () => {
    updateMutation.mutate({
      emailNotifications,
      smsNotifications,
      disputeAlerts,
      paymentAlerts,
    });
  };

  return (
    <AdminLayout title="Paramètres">
      <div className="space-y-6">
        <Tabs defaultValue="commission">
          <TabsList>
            <TabsTrigger value="commission">Commission & Tarifs</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
          </TabsList>

          <TabsContent value="commission" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Taux de commission
                </CardTitle>
                <CardDescription>
                  Configurez les taux de commission prélevés sur chaque transaction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Commission standard (%)</label>
                    <div className="relative mt-2">
                      <Input
                        type="number"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        min="0"
                        max="100"
                        step="0.5"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Commission prélevée sur chaque mission
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Supplément urgence (%)</label>
                    <div className="relative mt-2">
                      <Input
                        type="number"
                        value={emergencyFee}
                        onChange={(e) => setEmergencyFee(e.target.value)}
                        min="0"
                        max="100"
                        step="0.5"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supplément pour les interventions urgentes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Montants & Limites
                </CardTitle>
                <CardDescription>
                  Configurez les montants minimum et les limites de la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Montant minimum (€)</label>
                    <div className="relative mt-2">
                      <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        value={minJobAmount}
                        onChange={(e) => setMinJobAmount(e.target.value)}
                        min="0"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Montant minimum pour une intervention
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Rayon maximum (km)</label>
                    <div className="relative mt-2">
                      <Input
                        type="number"
                        value={maxRadius}
                        onChange={(e) => setMaxRadius(e.target.value)}
                        min="1"
                        max="100"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        km
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rayon maximum d'intervention des professionnels
                    </p>
                  </div>
                </div>

                <Button onClick={handleSaveCommission} loading={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer les modifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Préférences de notifications
                </CardTitle>
                <CardDescription>
                  Configurez les notifications que vous souhaitez recevoir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Notifications par email</p>
                      <p className="text-sm text-muted-foreground">
                        Recevoir les notifications par email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Notifications SMS</p>
                      <p className="text-sm text-muted-foreground">
                        Recevoir les notifications par SMS
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Alertes litiges</p>
                      <p className="text-sm text-muted-foreground">
                        Être notifié lors de l'ouverture d'un litige
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={disputeAlerts}
                        onChange={(e) => setDisputeAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Alertes paiements</p>
                      <p className="text-sm text-muted-foreground">
                        Être notifié lors d'un problème de paiement
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentAlerts}
                        onChange={(e) => setPaymentAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                <Button onClick={handleSaveNotifications} loading={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer les préférences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité du compte
                </CardTitle>
                <CardDescription>
                  Gérez la sécurité de votre compte administrateur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Mot de passe actuel</label>
                  <Input type="password" className="mt-2" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-sm font-medium">Nouveau mot de passe</label>
                  <Input type="password" className="mt-2" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-sm font-medium">Confirmer le mot de passe</label>
                  <Input type="password" className="mt-2" placeholder="••••••••" />
                </div>

                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Changer le mot de passe
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentification à deux facteurs</CardTitle>
                <CardDescription>
                  Ajoutez une couche de sécurité supplémentaire à votre compte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">2FA désactivé</p>
                    <p className="text-sm text-muted-foreground">
                      Activez l'authentification à deux facteurs pour sécuriser votre compte
                    </p>
                  </div>
                  <Button variant="outline">Activer 2FA</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
