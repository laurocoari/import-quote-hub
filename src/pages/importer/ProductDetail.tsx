import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product, QuoteRequest } from '@/types/database';
import { Edit, ExternalLink, Plus, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProductDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    const { data: productData } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('id', id)
      .single();

    if (productData) {
      setProduct(productData as Product);
    }

    const { data: requestsData } = await supabase
      .from('quote_requests')
      .select('*, quotes(id)')
      .eq('product_id', id)
      .order('created_at', { ascending: false });

    setQuoteRequests((requestsData || []) as QuoteRequest[]);
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

  if (!product) {
    return (
      <DashboardLayout requiredRole="importer">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Produto não encontrado</p>
        </div>
      </DashboardLayout>
    );
  }

  const mainImage = product.images?.find((img) => img.is_main) || product.images?.[0];

  return (
    <DashboardLayout requiredRole="importer">
      <PageHeader
        title={product.name}
        description={product.category}
        action={
          <div className="flex gap-2">
            <Link to={`/importer/products/${product.id}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </Link>
            <Link to={`/importer/quote-requests/new?productId=${product.id}`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Solicitar Cotação
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informações do Produto</CardTitle>
                <StatusBadge status={product.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {product.internal_code && (
                  <div>
                    <p className="text-sm text-muted-foreground">Código Interno</p>
                    <p className="font-medium">{product.internal_code}</p>
                  </div>
                )}
                {product.target_price_usd && (
                  <div>
                    <p className="text-sm text-muted-foreground">Preço Alvo</p>
                    <p className="font-medium">US$ {product.target_price_usd.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {product.reference_link && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Link de Referência</p>
                  <a
                    href={product.reference_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {product.reference_link}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {product.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descrição Técnica</p>
                  <p className="whitespace-pre-wrap">{product.description}</p>
                </div>
              )}

              {product.usage_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Observações de Uso</p>
                  <p className="whitespace-pre-wrap">{product.usage_notes}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Criado em {format(new Date(product.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pedidos de Cotação</CardTitle>
            </CardHeader>
            <CardContent>
              {quoteRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum pedido de cotação para este produto</p>
                  <Link to={`/importer/quote-requests/new?productId=${product.id}`}>
                    <Button className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Pedido
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {quoteRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={request.status} />
                          <span className="text-sm text-muted-foreground">
                            {(request as any).quotes?.length || 0} cotações
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.created_at), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Link to={`/importer/quote-requests/${request.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalhes
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Imagens</CardTitle>
            </CardHeader>
            <CardContent>
              {product.images && product.images.length > 0 ? (
                <div className="space-y-3">
                  {mainImage && (
                    <img
                      src={mainImage.url}
                      alt={product.name}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  )}
                  {product.images.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {product.images.map((img) => (
                        <img
                          key={img.id}
                          src={img.url}
                          alt={product.name}
                          className={`aspect-square object-cover rounded-lg border-2 ${
                            img.is_main ? 'border-primary' : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Sem imagens</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
