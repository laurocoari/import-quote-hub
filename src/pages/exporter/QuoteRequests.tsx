import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, FileText, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ExporterQuoteRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchRequests();
    }
  }, [profile?.id]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('quote_requests')
      .select(`
        *,
        product:products(id, name, category, target_price_usd),
        requester:profiles!quote_requests_requested_by_id_fkey(name),
        quotes(id, created_by_id)
      `)
      .or(`assigned_to_id.is.null,assigned_to_id.eq.${profile?.id}`)
      .order('created_at', { ascending: false });

    setRequests(data || []);
    setLoading(false);
  };

  return (
    <DashboardLayout requiredRole="exporter">
      <PageHeader
        title="Pedidos de Cotação"
        description="Visualize e responda aos pedidos dos importadores"
      />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido de cotação</h3>
            <p className="text-muted-foreground">
              Novos pedidos dos importadores aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => {
            const myQuotes = request.quotes?.filter(
              (q: any) => q.created_by_id === profile?.id
            );
            const hasResponded = myQuotes?.length > 0;

            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">
                          {request.product?.name}
                        </h3>
                        <StatusBadge status={request.status} />
                        {hasResponded && (
                          <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                            Respondido
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>{request.product?.category}</span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {request.requester?.name}
                        </span>
                        <span>
                          {format(new Date(request.created_at), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      {request.product?.target_price_usd && (
                        <p className="text-sm mt-2">
                          <span className="text-muted-foreground">Preço alvo:</span>{' '}
                          <span className="font-medium">
                            US$ {request.product.target_price_usd.toFixed(2)}
                          </span>
                        </p>
                      )}
                      {request.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                          {request.notes}
                        </p>
                      )}
                    </div>
                    <Link to={`/exporter/quote-requests/${request.id}`}>
                      <Button variant={hasResponded ? 'outline' : 'default'}>
                        <Eye className="w-4 h-4 mr-2" />
                        {hasResponded ? 'Ver / Editar' : 'Responder'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
