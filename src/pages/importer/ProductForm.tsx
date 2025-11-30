import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Product } from '@/types/database';

const categories = [
  'Eletrônicos',
  'Têxteis',
  'Móveis',
  'Brinquedos',
  'Automotivo',
  'Casa e Decoração',
  'Ferramentas',
  'Embalagens',
  'Outros',
];

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<{ url: string; is_main: boolean }[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    internal_code: '',
    category: '',
    reference_link: '',
    target_price_usd: '',
    description: '',
    usage_notes: '',
  });

  useEffect(() => {
    if (isEditing && id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    const { data: product } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('id', id)
      .single();

    if (product) {
      setFormData({
        name: product.name,
        internal_code: product.internal_code || '',
        category: product.category,
        reference_link: product.reference_link || '',
        target_price_usd: product.target_price_usd?.toString() || '',
        description: product.description || '',
        usage_notes: product.usage_notes || '',
      });
      setImages((product.product_images || []).map((img: any) => ({
        url: img.url,
        is_main: img.is_main,
      })));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${profile?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        toast.error('Erro ao fazer upload da imagem');
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setImages((prev) => [...prev, { url: publicUrl, is_main: prev.length === 0 }]);
    }

    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      if (newImages.length > 0 && !newImages.some((img) => img.is_main)) {
        newImages[0].is_main = true;
      }
      return newImages;
    });
  };

  const setMainImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, is_main: i === index }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setLoading(true);

    const productData = {
      owner_id: profile.id,
      name: formData.name,
      internal_code: formData.internal_code || null,
      category: formData.category,
      reference_link: formData.reference_link || null,
      target_price_usd: formData.target_price_usd ? parseFloat(formData.target_price_usd) : null,
      description: formData.description || null,
      usage_notes: formData.usage_notes || null,
    };

    let productId = id;

    if (isEditing) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id);

      if (error) {
        toast.error('Erro ao atualizar produto');
        setLoading(false);
        return;
      }

      // Delete old images
      await supabase.from('product_images').delete().eq('product_id', id);
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        toast.error('Erro ao criar produto');
        setLoading(false);
        return;
      }

      productId = data.id;
    }

    // Insert images
    if (images.length > 0 && productId) {
      await supabase.from('product_images').insert(
        images.map((img) => ({
          product_id: productId,
          url: img.url,
          is_main: img.is_main,
        }))
      );
    }

    toast.success(isEditing ? 'Produto atualizado!' : 'Produto criado!');
    navigate('/importer/products');
    setLoading(false);
  };

  return (
    <DashboardLayout requiredRole="importer">
      <PageHeader
        title={isEditing ? 'Editar Produto' : 'Novo Produto'}
        description={isEditing ? 'Atualize as informações do produto' : 'Cadastre um novo produto para cotação'}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Fone Bluetooth"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="internal_code">Código Interno</Label>
                    <Input
                      id="internal_code"
                      value={formData.internal_code}
                      onChange={(e) => setFormData({ ...formData, internal_code: e.target.value })}
                      placeholder="Ex: SKU-001"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_price_usd">Preço Alvo (USD)</Label>
                    <Input
                      id="target_price_usd"
                      type="number"
                      step="0.01"
                      value={formData.target_price_usd}
                      onChange={(e) => setFormData({ ...formData, target_price_usd: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference_link">Link de Referência</Label>
                  <Input
                    id="reference_link"
                    type="url"
                    value={formData.reference_link}
                    onChange={(e) => setFormData({ ...formData, reference_link: e.target.value })}
                    placeholder="https://alibaba.com/produto..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição Técnica</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Especificações técnicas, materiais, dimensões..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage_notes">Observações de Uso</Label>
                  <Textarea
                    id="usage_notes"
                    value={formData.usage_notes}
                    onChange={(e) => setFormData({ ...formData, usage_notes: e.target.value })}
                    placeholder="Para que será utilizado, público alvo..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Imagens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {images.map((img, index) => (
                        <div
                          key={index}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                            img.is_main ? 'border-primary' : 'border-border'
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={`Imagem ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="flex-1 text-xs"
                                onClick={() => setMainImage(index)}
                                disabled={img.is_main}
                              >
                                {img.is_main ? 'Principal' : 'Definir'}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => removeImage(index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading ? (
                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Clique para adicionar
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/importer/products')}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading || !formData.name || !formData.category}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
