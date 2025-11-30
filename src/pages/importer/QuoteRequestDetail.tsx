import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Quote, Product } from '@/types/database';
import { Loader2, Calculator, Award, ExternalLink, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function QuoteRequestDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState<any>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    const { data: requestData } = await supabase
      .from('quote_requests')
      .select(`
        *,
        product:products(*, product_images(*))
      `)
      .eq('id', id)
      .single();

    if (requestData) {
      setRequest(requestData);
    }

    const { data: quotesData } = await supabase
      .from('quotes')
      .select('*')
      .eq('quote_request_id', id)
      .order('price_per_unit_usd', { ascending: true });

    setQuotes((quotesData || []) as Quote[]);
    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="importer">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout requiredRole="importer">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Pedido não encontrado</p>
        </div>
      </DashboardLayout>
    );
  }

  const product = request.product as Product;
  const mainImage = product.images?.find((img) => img.is_main) || product.images?.[0];
  const bestPrice = quotes[0];

  return (
    <DashboardLayout requiredRole="importer">
      <PageHeader
        title="Detalhes do Pedido de Cotação"
        description={`Pedido criado em ${format(new Date(request.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Status do Pedido</CardTitle>
                <StatusBadge status={request.status} />
              </div>
            </CardHeader>
            <CardContent>
              {request.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Instruções enviadas</p>
                  <p className="whitespace-pre-wrap">{request.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cotações Recebidas ({quotes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {quotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma cotação recebida ainda</p>
                  <p className="text-sm mt-1">Os exportadores estão analisando seu pedido</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((quote, index) => (
                    <div
                      key={quote.id}
                      className={`p-4 rounded-lg border ${
                        index === 0 ? 'border-success bg-success/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{quote.factory_name}</h4>
                            {index === 0 && (
                              <Badge className="bg-success text-success-foreground">
                                <Award className="w-3 h-3 mr-1" />
                                Melhor preço
                              </Badge>
                            )}
                          </div>
                          {quote.factory_location && (
                            <p className="text-sm text-muted-foreground">
                              {quote.factory_location}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={quote.status} />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Preço Unitário</p>
                          <p className="font-semibold text-lg">
                            US$ {Number(quote.price_per_unit_usd).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">MOQ</p>
                          <p className="font-medium">{quote.moq} un.</p>
                        </div>
                        {quote.incoterm && (
                          <div>
                            <p className="text-xs text-muted-foreground">Incoterm</p>
                            <p className="font-medium">{quote.incoterm}</p>
                          </div>
                        )}
                        {quote.lead_time_days && (
                          <div>
                            <p className="text-xs text-muted-foreground">Lead Time</p>
                            <p className="font-medium">{quote.lead_time_days} dias</p>
                          </div>
                        )}
                      </div>

                      {quote.certifications && (
                        <p className="text-sm mb-2">
                          <span className="text-muted-foreground">Certificações:</span> {quote.certifications}
                        </p>
                      )}

                      {quote.remarks && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {quote.remarks}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Link to={`/importer/quotes/${quote.id}/simulate`}>
                          <Button size="sm">
                            <Calculator className="w-4 h-4 mr-2" />
                            Simular Custo
                          </Button>
                        </Link>
                        {quote.competitor_links && (
                          <a href={quote.competitor_links} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Ver Link
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mainImage && (
                <img
                  src={mainImage.url}
                  alt={product.name}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.category}</p>
              </div>
              {product.target_price_usd && (
                <div>
                  <p className="text-sm text-muted-foreground">Preço alvo</p>
                  <p className="font-medium">US$ {product.target_price_usd.toFixed(2)}</p>
                </div>
              )}
              {product.reference_link && (
                <a
                  href={product.reference_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  Ver referência
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <Link to={`/importer/products/${product.id}`}>
                <Button variant="outline" className="w-full">
                  Ver produto completo
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
