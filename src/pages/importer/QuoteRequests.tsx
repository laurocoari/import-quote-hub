import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, FileText, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function QuoteRequests() {
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
        product:products(id, name, category),
        quotes(id)
      `)
      .eq('requested_by_id', profile?.id)
      .order('created_at', { ascending: false });

    setRequests(data || []);
    setLoading(false);
  };

  return (
    <DashboardLayout requiredRole="importer">
      <PageHeader
        title="Pedidos de Cotação"
        description="Acompanhe todos os seus pedidos de cotação"
      />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido de cotação</h3>
            <p className="text-muted-foreground mb-6">
              Cadastre um produto e envie para cotação
            </p>
            <Link to="/importer/products">
              <Button>Ver Produtos</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg truncate">
                        {request.product?.name}
                      </h3>
                      <StatusBadge status={request.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{request.product?.category}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {request.quotes?.length || 0} cotações
                      </span>
                      <span>
                        {format(new Date(request.created_at), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    {request.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                        {request.notes}
                      </p>
                    )}
                  </div>
                  <Link to={`/importer/quote-requests/${request.id}`}>
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver detalhes
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
