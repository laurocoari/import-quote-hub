import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Quote, Product } from '@/types/database';
import { Loader2, ExternalLink, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ExporterQuoteRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [request, setRequest] = useState<any>(null);
  const [myQuotes, setMyQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  const [formData, setFormData] = useState({
    factory_name: '',
    factory_location: '',
    incoterm: '',
    price_per_unit_usd: '',
    moq: '',
    available_stock: '',
    lead_time_days: '',
    competitor_links: '',
    certifications: '',
    remarks: '',
  });

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
        product:products(*, product_images(*)),
        requester:profiles!quote_requests_requested_by_id_fkey(name)
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
      .eq('created_by_id', profile?.id)
      .order('created_at', { ascending: false });

    setMyQuotes((quotesData || []) as Quote[]);
    setLoading(false);
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      factory_name: quote.factory_name,
      factory_location: quote.factory_location || '',
      incoterm: quote.incoterm || '',
      price_per_unit_usd: quote.price_per_unit_usd.toString(),
      moq: quote.moq.toString(),
      available_stock: quote.available_stock?.toString() || '',
      lead_time_days: quote.lead_time_days?.toString() || '',
      competitor_links: quote.competitor_links || '',
      certifications: quote.certifications || '',
      remarks: quote.remarks || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (quoteId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta cotação?')) return;

    const { error } = await supabase.from('quotes').delete().eq('id', quoteId);

    if (error) {
      toast.error('Erro ao excluir cotação');
    } else {
      toast.success('Cotação excluída');
      setMyQuotes((prev) => prev.filter((q) => q.id !== quoteId));
    }
  };

  const resetForm = () => {
    setFormData({
      factory_name: '',
      factory_location: '',
      incoterm: '',
      price_per_unit_usd: '',
      moq: '',
      available_stock: '',
      lead_time_days: '',
      competitor_links: '',
      certifications: '',
      remarks: '',
    });
    setEditingQuote(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setSaving(true);

    const quoteData = {
      quote_request_id: id,
      created_by_id: profile.id,
      factory_name: formData.factory_name,
      factory_location: formData.factory_location || null,
      incoterm: formData.incoterm || null,
      price_per_unit_usd: parseFloat(formData.price_per_unit_usd),
      moq: parseInt(formData.moq),
      available_stock: formData.available_stock ? parseInt(formData.available_stock) : null,
      lead_time_days: formData.lead_time_days ? parseInt(formData.lead_time_days) : null,
      competitor_links: formData.competitor_links || null,
      certifications: formData.certifications || null,
      remarks: formData.remarks || null,
      status: 'submitted' as const,
    };

    if (editingQuote) {
      const { data, error } = await supabase
        .from('quotes')
        .update(quoteData)
        .eq('id', editingQuote.id)
        .select()
        .single();

      if (error) {
        toast.error('Erro ao atualizar cotação');
      } else {
        toast.success('Cotação atualizada!');
        setMyQuotes((prev) =>
          prev.map((q) => (q.id === editingQuote.id ? (data as Quote) : q))
        );
        resetForm();
      }
    } else {
      const { data, error } = await supabase
        .from('quotes')
        .insert(quoteData)
        .select()
        .single();

      if (error) {
        toast.error('Erro ao criar cotação');
      } else {
        toast.success('Cotação enviada!');
        setMyQuotes((prev) => [data as Quote, ...prev]);
        resetForm();

        // Update request status
        await supabase
          .from('quote_requests')
          .update({ status: 'completed' })
          .eq('id', id);
      }
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="exporter">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout requiredRole="exporter">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Pedido não encontrado</p>
        </div>
      </DashboardLayout>
    );
  }

  const product = request.product as Product;
  const mainImage = product.images?.find((img) => img.is_main) || product.images?.[0];

  return (
    <DashboardLayout requiredRole="exporter">
      <PageHeader
        title="Responder Pedido de Cotação"
        description={`Pedido de ${request.requester?.name} • ${format(new Date(request.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Request Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informações do Pedido</CardTitle>
                <StatusBadge status={request.status} />
              </div>
            </CardHeader>
            <CardContent>
              {request.notes ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Instruções do importador</p>
                  <p className="whitespace-pre-wrap">{request.notes}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Sem instruções adicionais</p>
              )}
            </CardContent>
          </Card>

          {/* My Quotes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Minhas Cotações ({myQuotes.length})</CardTitle>
              {!showForm && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Cotação
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {showForm && (
                <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium">
                    {editingQuote ? 'Editar Cotação' : 'Nova Cotação'}
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="factory_name">Nome da Fábrica *</Label>
                      <Input
                        id="factory_name"
                        value={formData.factory_name}
                        onChange={(e) => setFormData({ ...formData, factory_name: e.target.value })}
                        placeholder="Ex: Shenzhen Electronics Co."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="factory_location">Localização</Label>
                      <Input
                        id="factory_location"
                        value={formData.factory_location}
                        onChange={(e) => setFormData({ ...formData, factory_location: e.target.value })}
                        placeholder="Ex: Guangzhou, China"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="price_per_unit_usd">Preço Unitário (USD) *</Label>
                      <Input
                        id="price_per_unit_usd"
                        type="number"
                        step="0.01"
                        value={formData.price_per_unit_usd}
                        onChange={(e) => setFormData({ ...formData, price_per_unit_usd: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="moq">MOQ (unidades) *</Label>
                      <Input
                        id="moq"
                        type="number"
                        value={formData.moq}
                        onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                        placeholder="1000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="incoterm">Incoterm</Label>
                      <Select
                        value={formData.incoterm}
                        onValueChange={(v) => setFormData({ ...formData, incoterm: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXW">EXW</SelectItem>
                          <SelectItem value="FOB">FOB</SelectItem>
                          <SelectItem value="CIF">CIF</SelectItem>
                          <SelectItem value="DDP">DDP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="lead_time_days">Lead Time (dias)</Label>
                      <Input
                        id="lead_time_days"
                        type="number"
                        value={formData.lead_time_days}
                        onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                        placeholder="30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="available_stock">Estoque Disponível</Label>
                      <Input
                        id="available_stock"
                        type="number"
                        value={formData.available_stock}
                        onChange={(e) => setFormData({ ...formData, available_stock: e.target.value })}
                        placeholder="5000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="competitor_links">Links de Referência</Label>
                    <Input
                      id="competitor_links"
                      value={formData.competitor_links}
                      onChange={(e) => setFormData({ ...formData, competitor_links: e.target.value })}
                      placeholder="https://1688.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certifications">Certificações</Label>
                    <Input
                      id="certifications"
                      value={formData.certifications}
                      onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                      placeholder="CE, FCC, RoHS..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks">Observações</Label>
                    <Textarea
                      id="remarks"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Informações adicionais sobre a cotação..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving || !formData.factory_name || !formData.price_per_unit_usd || !formData.moq}
                    >
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingQuote ? 'Atualizar' : 'Enviar Cotação'}
                    </Button>
                  </div>
                </form>
              )}

              {myQuotes.length === 0 && !showForm ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Você ainda não enviou cotações para este pedido</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myQuotes.map((quote) => (
                    <div key={quote.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h4 className="font-semibold">{quote.factory_name}</h4>
                          {quote.factory_location && (
                            <p className="text-sm text-muted-foreground">
                              {quote.factory_location}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={quote.status} />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(quote)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(quote.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Preço Unitário</p>
                          <p className="font-semibold">
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
                <div className="p-3 rounded-lg bg-warning/10">
                  <p className="text-sm text-muted-foreground">Preço alvo do importador</p>
                  <p className="font-semibold text-lg">
                    US$ {product.target_price_usd.toFixed(2)}
                  </p>
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
                  <p className="text-sm">{product.description}</p>
                </div>
              )}
              {product.usage_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Uso pretendido</p>
                  <p className="text-sm">{product.usage_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
