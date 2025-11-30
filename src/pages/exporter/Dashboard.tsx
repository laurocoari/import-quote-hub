import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessageSquare, Eye, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ExporterDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    pendingRequests: 0,
    quotesSubmitted: 0,
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData();
    }
  }, [profile?.id]);

  const fetchDashboardData = async () => {
    if (!profile?.id) return;

    const [requestsRes, quotesRes] = await Promise.all([
      supabase
        .from('quote_requests')
        .select(`
          id,
          status,
          created_at,
          notes,
          product:products(id, name, category),
          requester:profiles!quote_requests_requested_by_id_fkey(name)
        `)
        .or(`assigned_to_id.is.null,assigned_to_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('quotes')
        .select('id')
        .eq('created_by_id', profile.id),
    ]);

    const requests = requestsRes.data || [];
    const pendingRequests = requests.filter(
      (r) => r.status === 'pending' || r.status === 'in_progress'
    ).length;

    setStats({
      pendingRequests,
      quotesSubmitted: quotesRes.data?.length || 0,
    });

    setRecentRequests(requests);
    setLoading(false);
  };

  return (
    <DashboardLayout requiredRole="exporter">
      <PageHeader
        title={`Olá, ${profile?.name || 'Exportador'}`}
        description="Visualize pedidos de cotação e responda aos importadores"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Pedidos Pendentes"
          value={stats.pendingRequests}
          icon={<Clock className="w-6 h-6" />}
          description="Aguardando sua cotação"
        />
        <StatCard
          title="Cotações Enviadas"
          value={stats.quotesSubmitted}
          icon={<MessageSquare className="w-6 h-6" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Pedidos de Cotação Recentes</CardTitle>
          <Link to="/exporter/quote-requests">
            <Button variant="ghost" size="sm">
              Ver todos
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pedido de cotação disponível</p>
              <p className="text-sm mt-1">Novos pedidos aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{request.product?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.product?.category} • {request.requester?.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(request.created_at), "d 'de' MMM", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <StatusBadge status={request.status} />
                    <Link to={`/exporter/quote-requests/${request.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Responder
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
