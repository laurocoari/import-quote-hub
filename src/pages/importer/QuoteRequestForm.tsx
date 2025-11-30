import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Package, ExternalLink } from 'lucide-react';
import { Product, Profile } from '@/types/database';

export default function QuoteRequestForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const { profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [exporters, setExporters] = useState<Profile[]>([]);
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
    fetchExporters();
  }, [productId]);

  const fetchProduct = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('id', productId)
      .single();

    if (data) {
      setProduct(data as Product);
    }
  };

  const fetchExporters = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'exporter');

    setExporters((data || []) as Profile[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !productId) return;

    setLoading(true);

    const { error } = await supabase.from('quote_requests').insert({
      product_id: productId,
      requested_by_id: profile.id,
      assigned_to_id: assignedTo || null,
      notes: notes || null,
      status: 'pending',
    });

    if (error) {
      toast.error('Erro ao criar pedido de cotação');
      setLoading(false);
      return;
    }

    // Update product status
    await supabase
      .from('products')
      .update({ status: 'sent_for_quote' })
      .eq('id', productId);

    toast.success('Pedido de cotação enviado!');
    navigate('/importer/quote-requests');
    setLoading(false);
  };

  const mainImage = product?.images?.find((img) => img.is_main) || product?.images?.[0];

  if (!productId) {
    return (
      <DashboardLayout requiredRole="importer">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Selecione um produto para solicitar cotação</p>
          <Button className="mt-4" onClick={() => navigate('/importer/products')}>
            Ver Produtos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="importer">
      <PageHeader
        title="Solicitar Cotação"
        description="Envie seu produto para cotação dos exportadores"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Instruções para o Exportador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações / Instruções</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Descreva detalhes específicos que o exportador deve considerar, como quantidade estimada, prazos, certificações necessárias..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exporter">Exportador Específico (opcional)</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Aberto para todos os exportadores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aberto para todos</SelectItem>
                      {exporters.map((exp) => (
                        <SelectItem key={exp.id} value={exp.id}>
                          {exp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para que qualquer exportador possa responder
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Enviar Pedido de Cotação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Produto Selecionado</CardTitle>
              </CardHeader>
              <CardContent>
                {product ? (
                  <div className="space-y-4">
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
                    {product.description && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                        <p className="text-sm line-clamp-4">{product.description}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mb-2" />
                    <p>Carregando produto...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
