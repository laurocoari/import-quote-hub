import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/types/database';
import { Plus, Eye, Edit, Package, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Products() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchProducts();
    }
  }, [profile?.id]);

  const fetchProducts = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false });

    setProducts((data || []) as Product[]);
    setLoading(false);
  };

  return (
    <DashboardLayout requiredRole="importer">
      <PageHeader
        title="Produtos"
        description="Gerencie seus produtos para cotação"
        action={
          <Link to="/importer/products/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto cadastrado</h3>
            <p className="text-muted-foreground mb-6">
              Comece cadastrando um produto para solicitar cotações
            </p>
            <Link to="/importer/products/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Produto
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                      <StatusBadge status={product.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{product.category}</span>
                      {product.internal_code && <span>Cód: {product.internal_code}</span>}
                      <span>
                        Criado em {format(new Date(product.created_at), "d 'de' MMM", { locale: ptBR })}
                      </span>
                    </div>
                    {product.target_price_usd && (
                      <p className="text-sm mt-2">
                        <span className="text-muted-foreground">Preço alvo:</span>{' '}
                        <span className="font-medium">US$ {product.target_price_usd.toFixed(2)}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {product.reference_link && (
                      <a href={product.reference_link} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="icon">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    <Link to={`/importer/products/${product.id}`}>
                      <Button variant="outline" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to={`/importer/products/${product.id}/edit`}>
                      <Button variant="outline" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
