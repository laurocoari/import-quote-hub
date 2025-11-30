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
import { Package, FileText, MessageSquare, Plus, Eye } from 'lucide-react';

export default function ImporterDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    quoteRequestsSent: 0,
    quotesReceived: 0,
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

    const [productsRes, requestsRes] = await Promise.all([
      supabase.from('products').select('id').eq('owner_id', profile.id),
      supabase
        .from('quote_requests')
        .select(`
          id,
          status,
          created_at,
          product:products(id, name, category),
          quotes(id)
        `)
        .eq('requested_by_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const totalProducts = productsRes.data?.length || 0;
    const requests = requestsRes.data || [];
    const totalQuotes = requests.reduce((acc, req) => acc + (req.quotes?.length || 0), 0);

    setStats({
      totalProducts,
      quoteRequestsSent: requests.length,
      quotesReceived: totalQuotes,
    });

    setRecentRequests(requests);
    setLoading(false);
  };

  return (
    <DashboardLayout requiredRole="importer">
      <PageHeader
        title={`Olá, ${profile?.name || 'Importador'}`}
        description="Gerencie seus produtos e acompanhe suas cotações"
        action={
          <Link to="/importer/products/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total de Produtos"
          value={stats.totalProducts}
          icon={<Package className="w-6 h-6" />}
        />
        <StatCard
          title="Pedidos de Cotação"
          value={stats.quoteRequestsSent}
          icon={<FileText className="w-6 h-6" />}
        />
        <StatCard
          title="Cotações Recebidas"
          value={stats.quotesReceived}
          icon={<MessageSquare className="w-6 h-6" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Últimos Pedidos de Cotação</CardTitle>
          <Link to="/importer/quote-requests">
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
              <p>Nenhum pedido de cotação ainda</p>
              <p className="text-sm mt-1">Cadastre produtos e envie para cotação</p>
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
                      {request.product?.category} • {request.quotes?.length || 0} cotações
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <StatusBadge status={request.status} />
                    <Link to={`/importer/quote-requests/${request.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
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
