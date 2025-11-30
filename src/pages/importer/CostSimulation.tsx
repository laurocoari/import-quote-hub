import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Quote, QuoteCostSimulation } from '@/types/database';
import { Loader2, TrendingUp, DollarSign, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CostSimulation() {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [simulations, setSimulations] = useState<QuoteCostSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<QuoteCostSimulation | null>(null);

  const [formData, setFormData] = useState({
    quantity: '',
    freight_usd: '0',
    insurance_usd: '0',
    other_costs_usd: '0',
    tax_rate_percent: '0',
    exchange_rate: '5.00',
  });

  useEffect(() => {
    if (quoteId) {
      fetchData();
    }
  }, [quoteId]);

  const fetchData = async () => {
    const { data: quoteData } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteData) {
      setQuote(quoteData as Quote);
      setFormData((prev) => ({
        ...prev,
        quantity: quoteData.moq.toString(),
      }));
    }

    const { data: simulationsData } = await supabase
      .from('quote_cost_simulations')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: false });

    setSimulations((simulationsData || []) as QuoteCostSimulation[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) return;

    setCalculating(true);

    const quantity = parseInt(formData.quantity);
    const freight = parseFloat(formData.freight_usd);
    const insurance = parseFloat(formData.insurance_usd);
    const otherCosts = parseFloat(formData.other_costs_usd);
    const taxRate = parseFloat(formData.tax_rate_percent);
    const exchangeRate = parseFloat(formData.exchange_rate);
    const pricePerUnit = Number(quote.price_per_unit_usd);

    // Calculate costs
    const subtotal = pricePerUnit * quantity;
    const totalBeforeTax = subtotal + freight + insurance + otherCosts;
    const estimatedTotalUsd = totalBeforeTax * (1 + taxRate / 100);
    const estimatedTotalBrl = estimatedTotalUsd * exchangeRate;
    const estimatedUnitUsd = estimatedTotalUsd / quantity;
    const estimatedUnitBrl = estimatedTotalBrl / quantity;

    const { data, error } = await supabase
      .from('quote_cost_simulations')
      .insert({
        quote_id: quoteId,
        quantity,
        freight_usd: freight,
        insurance_usd: insurance,
        other_costs_usd: otherCosts,
        tax_rate_percent: taxRate,
        exchange_rate: exchangeRate,
        estimated_total_cost_usd: estimatedTotalUsd,
        estimated_total_cost_brl: estimatedTotalBrl,
        estimated_unit_cost_usd: estimatedUnitUsd,
        estimated_unit_cost_brl: estimatedUnitBrl,
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao salvar simulação');
    } else {
      setResult(data as QuoteCostSimulation);
      setSimulations((prev) => [data as QuoteCostSimulation, ...prev]);
      toast.success('Simulação calculada!');
    }

    setCalculating(false);
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

  if (!quote) {
    return (
      <DashboardLayout requiredRole="importer">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cotação não encontrada</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="importer">
      <PageHeader
        title="Simulação de Custo"
        description={`Calcule o custo total de importação para a cotação de ${quote.factory_name}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros da Simulação</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={quote.moq}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">MOQ: {quote.moq} unidades</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exchange_rate">Taxa de Câmbio (USD → BRL) *</Label>
                    <Input
                      id="exchange_rate"
                      type="number"
                      step="0.01"
                      value={formData.exchange_rate}
                      onChange={(e) => setFormData({ ...formData, exchange_rate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="freight_usd">Frete (USD)</Label>
                    <Input
                      id="freight_usd"
                      type="number"
                      step="0.01"
                      value={formData.freight_usd}
                      onChange={(e) => setFormData({ ...formData, freight_usd: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insurance_usd">Seguro (USD)</Label>
                    <Input
                      id="insurance_usd"
                      type="number"
                      step="0.01"
                      value={formData.insurance_usd}
                      onChange={(e) => setFormData({ ...formData, insurance_usd: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="other_costs_usd">Outros Custos (USD)</Label>
                    <Input
                      id="other_costs_usd"
                      type="number"
                      step="0.01"
                      value={formData.other_costs_usd}
                      onChange={(e) => setFormData({ ...formData, other_costs_usd: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_rate_percent">Taxa de Impostos (%)</Label>
                  <Input
                    id="tax_rate_percent"
                    type="number"
                    step="0.1"
                    value={formData.tax_rate_percent}
                    onChange={(e) => setFormData({ ...formData, tax_rate_percent: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentual estimado de impostos totais (II, IPI, ICMS, PIS, COFINS)
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    Voltar
                  </Button>
                  <Button type="submit" disabled={calculating}>
                    {calculating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Calculator className="w-4 h-4 mr-2" />
                    Calcular
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {result && (
            <Card className="border-primary animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Resultado da Simulação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-lg bg-primary/10">
                    <p className="text-sm text-muted-foreground mb-1">Custo Total (USD)</p>
                    <p className="text-2xl font-bold">
                      US$ {Number(result.estimated_total_cost_usd).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-success/10">
                    <p className="text-sm text-muted-foreground mb-1">Custo Total (BRL)</p>
                    <p className="text-2xl font-bold">
                      R$ {Number(result.estimated_total_cost_brl).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground mb-1">Custo Unitário (USD)</p>
                    <p className="text-xl font-semibold">
                      US$ {Number(result.estimated_unit_cost_usd).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground mb-1">Custo Unitário (BRL)</p>
                    <p className="text-xl font-semibold">
                      R$ {Number(result.estimated_unit_cost_brl).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {simulations.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Simulações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {simulations.slice(1).map((sim) => (
                    <div key={sim.id} className="p-3 rounded-lg border text-sm">
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">
                          {format(new Date(sim.created_at), "d 'de' MMM, HH:mm", { locale: ptBR })}
                        </span>
                        <span>{sim.quantity} un.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>US$ {Number(sim.estimated_unit_cost_usd).toFixed(2)}/un</span>
                        <span className="font-medium">
                          R$ {Number(sim.estimated_total_cost_brl).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Dados da Cotação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Fábrica</p>
                <p className="font-medium">{quote.factory_name}</p>
                {quote.factory_location && (
                  <p className="text-sm text-muted-foreground">{quote.factory_location}</p>
                )}
              </div>
              <div className="p-4 rounded-lg bg-primary/10">
                <p className="text-sm text-muted-foreground">Preço Unitário</p>
                <p className="text-xl font-bold">
                  US$ {Number(quote.price_per_unit_usd).toFixed(2)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">MOQ</p>
                  <p className="font-medium">{quote.moq} un.</p>
                </div>
                {quote.incoterm && (
                  <div>
                    <p className="text-sm text-muted-foreground">Incoterm</p>
                    <p className="font-medium">{quote.incoterm}</p>
                  </div>
                )}
              </div>
              {quote.lead_time_days && (
                <div>
                  <p className="text-sm text-muted-foreground">Lead Time</p>
                  <p className="font-medium">{quote.lead_time_days} dias</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
