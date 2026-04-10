import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Camera, ArrowLeft, Edit2, CheckCircle2, XCircle, Store, Lock, Mail, Image as ImageIcon, Calendar, PackagePlus, Check, Search, Plus, Loader2, Phone, LogOut } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { STALL_PRODUCTS, PRODUCTS, STALLS, MOCK_SELLERS } from '../data/mock';
import { PRODUCT_TAXONOMY } from '../data/taxonomy';
import { useAuth } from '../context/AuthContext';
import { useStalls } from '../context/StallsContext';

// Currency Formatting Helpers
const formatToBRL = (value: string | number) => {
  if (typeof value === 'number') {
    value = Math.round(value * 100).toString();
  }
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const numberValue = parseInt(digits, 10) / 100;
  return numberValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseBRL = (formattedValue: string): number => {
  const digits = formattedValue.replace(/\D/g, '');
  return (parseInt(digits, 10) || 0) / 100;
};

export default function SellerDashboardPage() {
  const { user, login, logout, isAuthenticated } = useAuth();
  const { 
    stalls: allStalls, 
    stallProducts: allStallProducts, 
    addStallProduct, 
    updateStallProduct, 
    batchUpdateStallProducts,
    updateStall
  } = useStalls();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'stock' | 'add'>('stock');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormSaved, setIsFormSaved] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Form state
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');

  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    if (formatted.length <= 15) {
      setWhatsapp(formatted);
    }
  };

  // Route Protection & Auto-Redirection
  useEffect(() => {
    if (isAuthenticated && user?.barracaId) {
      if (!id) {
        // Redirect to their specific dashboard if they hit the base URL
        navigate(`/painel-vendedor/${user.barracaId}`, { replace: true });
      } else if (id !== user.barracaId) {
        // Security Guard: Redirect if trying to access another stall
        toast.error('Acesso negado. Redirecionando para sua barraca.');
        navigate(`/painel-vendedor/${user.barracaId}`, { replace: true });
      }
    }
  }, [isAuthenticated, user, id, navigate]);
  
  // Logged in seller info
  const sellerStallId = id || user?.barracaId || 's1'; 
  const stallInfo = allStalls.find(s => s.id === sellerStallId) || STALLS.find(s => s.id === sellerStallId);
  
  const [myProducts, setMyProducts] = useState<any[]>([]);

  useEffect(() => {
    if (sellerStallId) {
      const products = allStallProducts.filter(sp => sp.stallId === sellerStallId).map(sp => {
        const product = sp.product || PRODUCTS.find(p => p.id === sp.productId);
        if (!product) return null;
        return { 
          ...sp, 
          product,
          yesterdayPrice: sp.yesterdayPrice || sp.price,
          marketAverage: sp.marketAverage || sp.price * 1.05,
          photoDate: sp.photoDate || '03/04'
        };
      }).filter(Boolean) as any[];
      setMyProducts(products);
    }
  }, [sellerStallId, allStallProducts]);

  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Add Product State (Batch Selection)
  const [searchTerm, setSearchTerm] = useState('');
  const [categoria, setCategoria] = useState('');
  const [grupoBase, setGrupoBase] = useState('');
  const [selectedVariations, setSelectedVariations] = useState<string[]>([]);
  const [variationData, setVariationData] = useState<Record<string, { price: string, photo: string }>>({});

  // Custom Product State
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [customUnitOther, setCustomUnitOther] = useState('');
  const [customVariation, setCustomVariation] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customPhoto, setCustomPhoto] = useState('');
  const customPhotoInputRef = useRef<HTMLInputElement>(null);
  const stallPhotoInputRef = useRef<HTMLInputElement>(null);

  const categorias = Object.keys(PRODUCT_TAXONOMY).sort();

  const allProducts = useMemo(() => {
    return Object.entries(PRODUCT_TAXONOMY).flatMap(([cat, prods]) => 
      Object.values(prods).map(p => ({ ...p, categoria: cat }))
    ).sort((a, b) => a.nome_exibicao.localeCompare(b.nome_exibicao));
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return allProducts.filter(p => p.nome_exibicao.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, allProducts]);

  const produtoSelecionado = (categoria && grupoBase && !isCustomProduct && PRODUCT_TAXONOMY[categoria]) ? PRODUCT_TAXONOMY[categoria][grupoBase] : null;
  const subclassificacoes = produtoSelecionado ? produtoSelecionado.subclassificacoes : [];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      await login(whatsapp, password);
      toast.success(`Bem-vindo de volta!`);
      setIsLoggingIn(false);
      // The useEffect in AuthContext will handle the user state and navigation
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('WhatsApp ou senha incorretos. Verifique seus dados.');
      setIsLoggingIn(false);
    }
  };

  const handleStallPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && stallInfo) {
      const imageUrl = URL.createObjectURL(file);
      try {
        await updateStall({
          ...stallInfo,
          image: imageUrl
        });
        toast.success('Foto da barraca atualizada com sucesso!');
      } catch (error) {
        toast.error('Erro ao atualizar foto da barraca.');
      }
    }
  };

  const handleSaveEdit = async (updatedItem: any) => {
    setMyProducts(prev => prev.map(p => p.id === updatedItem.id ? updatedItem : p));
    await updateStallProduct(updatedItem);
    setEditingItem(null);
    toast.success('Lote do dia publicado com sucesso!');
    setActiveTab('add');
  };

  const toggleVariation = (id_suffix: string) => {
    setIsFormSaved(false);
    setSelectedVariations(prev => {
      if (prev.includes(id_suffix)) {
        const next = prev.filter(id => id !== id_suffix);
        const newData = { ...variationData };
        delete newData[id_suffix];
        setVariationData(newData);
        return next;
      } else {
        const finalProductId = `${produtoSelecionado?.id_prefix}_${id_suffix}`;
        const existingProduct = myProducts.find(p => p.product.id === finalProductId);
        const prefilledPrice = existingProduct ? existingProduct.price.toString() : '';
        
        setVariationData(d => ({ ...d, [id_suffix]: { price: prefilledPrice, photo: '' } }));
        return [...prev, id_suffix];
      }
    });
  };

  const updateVariationData = (id_suffix: string, field: 'price' | 'photo', value: string) => {
    setIsFormSaved(false);
    setVariationData(prev => ({
      ...prev,
      [id_suffix]: {
        ...prev[id_suffix],
        [field]: value
      }
    }));
  };

  const handleBatchSubmit = async () => {
    setIsSubmitting(true);
    setIsFormSaved(false);
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 800));

      if (isCustomProduct) {
        const finalUnit = customUnit === 'Outra...' ? customUnitOther : customUnit;
        const numericPrice = parseBRL(customPrice);
        if (!customName || !customCategory || !finalUnit || !numericPrice || !customPhoto) {
          toast.error('Preencha todos os campos obrigatórios, incluindo a foto do lote.');
          setIsSubmitting(false);
          return;
        }

        const newProduct = {
          id: `sp_new_${Date.now()}`,
          stallId: sellerStallId,
          productId: `PROD_CUSTOM_${Date.now()}`,
          price: numericPrice,
          stock: 100,
          updatedAt: new Date().toISOString(),
          yesterdayPrice: numericPrice,
          marketAverage: numericPrice,
          photoDate: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          product: {
            id: `PROD_CUSTOM_${Date.now()}`,
            grupo_base: customName.toLowerCase().replace(/\s+/g, '_'),
            nome_exibicao: customName,
            subclassificacao: customVariation || 'Padrão',
            categoria: customCategory,
            unidade_medida: finalUnit,
            image: customPhoto || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'
          }
        };

        setMyProducts(prev => [newProduct, ...prev]);
        addStallProduct(newProduct);
        
        toast.success(
          <div className="space-y-1">
            <p>✅ <strong>{customName} {customVariation}</strong> adicionada com sucesso.</p>
            <p>✅ Preço R$ {parseFloat(customPrice).toFixed(2)}/{customUnit === 'Outra...' ? customUnitOther : customUnit} atualizado.</p>
            <p className="mt-2 text-green-700 font-bold">🚀 Seu produto já está visível para os compradores.</p>
          </div>,
          { duration: 5000 }
        );
        
        setIsCustomProduct(false);
        setCustomName('');
        setCustomCategory('');
        setCustomUnit('');
        setCustomUnitOther('');
        setCustomVariation('');
        setCustomPrice('');
        setCustomPhoto('');
        setIsFormSaved(true);
        setActiveTab('add');
        return;
      }

      if (selectedVariations.length === 0) {
        toast.error('Selecione pelo menos uma variação.');
        return;
      }

      const newProducts: any[] = [];
      const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      for (const suffix of selectedVariations) {
        const data = variationData[suffix];
        const numericPrice = parseBRL(data.price);
        const subDef = subclassificacoes.find(s => s.id_suffix === suffix);
        
        if (!numericPrice || !data.photo) {
          toast.error(`Preencha o preço e tire uma foto para a variação ${subDef?.nome || suffix}.`);
          setIsSubmitting(false);
          return;
        }

        if (!subDef || !produtoSelecionado) continue;

        const finalProductId = `${produtoSelecionado.id_prefix}_${subDef.id_suffix}`;

        newProducts.push({
          id: `sp_new_${Date.now()}_${suffix}`,
          stallId: sellerStallId,
          productId: finalProductId,
          price: numericPrice,
          stock: 100, // Default active stock
          updatedAt: new Date().toISOString(),
          yesterdayPrice: numericPrice,
          marketAverage: numericPrice,
          photoDate: todayStr,
          product: {
            id: finalProductId,
            grupo_base: produtoSelecionado.grupo_base,
            nome_exibicao: produtoSelecionado.nome_exibicao,
            subclassificacao: subDef.nome,
            categoria,
            unidade_medida: produtoSelecionado.unidade_medida,
            image: data.photo || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'
          }
        });
      }

      const existingProductIds = newProducts.map(np => np.productId);
      const filteredPrev = myProducts.filter(p => !existingProductIds.includes(p.productId));
      const updated = [...newProducts, ...filteredPrev];
      
      setMyProducts(updated);
      
      // Update context in a single batch outside state setter
      await batchUpdateStallProducts(newProducts);
      
      toast.success(
        <div className="space-y-2">
          {newProducts.map(p => (
            <div key={p.id} className="border-b border-green-100 pb-2 last:border-0 last:pb-0">
              <p>✅ <strong>{p.product.nome_exibicao} {p.product.subclassificacao}</strong> adicionada com sucesso.</p>
              <p>✅ Preço R$ {p.price.toFixed(2)}/{p.product.unidade_medida} atualizado.</p>
            </div>
          ))}
          <p className="pt-1 text-green-700 font-bold">🚀 {newProducts.length === 1 ? 'Seu produto já está visível' : 'Seus produtos já estão visíveis'} para os compradores.</p>
        </div>,
        { duration: 5000 }
      );
      
      // Reset form
      setSearchTerm('');
      setCategoria('');
      setGrupoBase('');
      setSelectedVariations([]);
      setVariationData({});
      setIsFormSaved(true);
      setActiveTab('add');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group products by base product
  const groupedOffers = myProducts.reduce((acc, item) => {
    if (!item.product) return acc;
    const base = item.product.grupo_base;
    if (!acc[base]) acc[base] = [];
    acc[base].push(item);
    return acc;
  }, {} as Record<string, typeof myProducts>);

  if (!isAuthenticated) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 space-y-8"
      >
        <div className="text-center space-y-4 max-w-sm">
          <div className="bg-green-50 w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto shadow-sm">
            <Store className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Painel do Produtor</h1>
            <p className="text-slate-500 font-medium">Acesse sua barraca para atualizar os lotes do dia.</p>
          </div>
        </div>

        <Card className="w-full max-w-md border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] bg-white rounded-[48px] overflow-hidden">
          <CardContent className="p-10">
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-slate-700 font-black text-sm ml-1">WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <Input 
                      type="tel" 
                      inputMode="tel"
                      placeholder="(00) 00000-0000" 
                      value={whatsapp}
                      onChange={handleWhatsAppChange}
                      className="h-16 pl-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-green-500 transition-all text-lg font-medium"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-slate-700 font-black text-sm ml-1">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-16 pl-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-green-500 transition-all text-lg font-medium"
                      required
                    />
                  </div>
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isLoggingIn}
                className="w-full h-16 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-xl shadow-xl shadow-green-900/20 transition-all active:scale-[0.98] disabled:opacity-80"
              >
                {isLoggingIn ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Acessando...</span>
                  </div>
                ) : (
                  "Entrar na Barraca"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-6 pb-32"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="bg-white shadow-sm border border-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          
          {/* Stall Photo Change Field */}
          <div className="relative group">
            <div 
              onClick={() => stallPhotoInputRef.current?.click()}
              className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-white shadow-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
            >
              {stallInfo?.image ? (
                <img 
                  src={stallInfo.image} 
                  alt={stallInfo.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-slate-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={stallPhotoInputRef}
              onChange={handleStallPhotoChange}
            />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">Painel do Produtor</h1>
            <div className="flex flex-col">
              <p className="text-sm text-slate-500 font-medium">{stallInfo?.name}</p>
              <p className="text-xs text-green-600 font-bold">Bem-vindo, {user?.name}</p>
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={async () => {
            await logout();
            navigate('/painel-vendedor');
          }}
          className="text-slate-400 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl shadow-inner">
        <button
          className={`flex-1 py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'stock' ? 'bg-white text-green-700 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('stock')}
        >
          Repositório
        </button>
        <button
          className={`flex-1 py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'add' ? 'bg-white text-green-700 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('add')}
        >
          Deployer
        </button>
      </div>

      <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Status: Operacional</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">v2.4.0-stable</span>
      </div>

      {activeTab === 'stock' && (
        <div className="space-y-8">
          {Object.entries(groupedOffers).map(([grupoBase, itemsArray]) => {
          const items = itemsArray as typeof myProducts;
          const baseName = items[0].product.nome_exibicao;
          
          return (
            <div key={grupoBase} className="space-y-4">
              <h2 className="font-black text-slate-400 uppercase tracking-widest text-sm flex items-center gap-3">
                {baseName}
                <div className="h-px bg-slate-200 flex-1" />
              </h2>
              
              <div className="grid gap-4">
                {items.map(item => (
                  <StockItemCard key={item.id} item={item} onSave={handleSaveEdit} onEditFull={() => setEditingItem(item)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {activeTab === 'add' && (
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-2xl">
                  <PackagePlus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Deployer de Lotes</CardTitle>
                  <CardDescription className="text-slate-500 text-sm mt-1">
                    Publique novos lotes no marketplace em tempo real.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {!isCustomProduct && !produtoSelecionado && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold">1. Buscar Produto Base</Label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input 
                        type="text" 
                        placeholder="Ex: Batata, Maçã, Tomate..." 
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setIsFormSaved(false);
                        }}
                        className="h-14 pl-12 rounded-xl bg-slate-50 border-slate-200 text-lg"
                      />
                    </div>
                  </div>

                  {searchTerm && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-60 overflow-y-auto">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map(prod => (
                          <button
                            key={prod.grupo_base}
                            onClick={() => {
                              setCategoria(prod.categoria);
                              setGrupoBase(prod.grupo_base);
                              setSearchTerm('');
                            }}
                            className="w-full flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{prod.nome_exibicao}</p>
                              <p className="text-sm text-slate-500">{prod.categoria}</p>
                            </div>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                              {prod.unidade_medida}
                            </Badge>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-slate-500">
                          Nenhum produto encontrado.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      className="w-full h-14 rounded-xl border-dashed border-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      onClick={() => {
                        setIsCustomProduct(true);
                        if (searchTerm) setCustomName(searchTerm);
                      }}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      {searchTerm ? `Adicionar "${searchTerm}" como novo produto` : 'Adicionar produto não listado'}
                    </Button>
                  </div>
                </div>
              )}

              {isCustomProduct && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-slate-700 font-bold text-lg">Novo Produto Customizado</Label>
                    <Button variant="ghost" size="sm" onClick={() => setIsCustomProduct(false)} className="text-slate-500">
                      Cancelar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Nome do Produto</Label>
                    <Input 
                      value={customName}
                      onChange={e => {
                        setCustomName(e.target.value);
                        setIsFormSaved(false);
                      }}
                      placeholder="Ex: Pitaya Vermelha"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <select
                        value={customCategory}
                        onChange={e => {
                          setCustomCategory(e.target.value);
                          setIsFormSaved(false);
                        }}
                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                      >
                        <option value="" disabled>Selecione</option>
                        {categorias.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Unidade de Medida</Label>
                      <select
                        value={customUnit}
                        onChange={e => {
                          setCustomUnit(e.target.value);
                          setIsFormSaved(false);
                        }}
                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                      >
                        <option value="" disabled>Selecione</option>
                        <option value="Caixa 20kg">Caixa 20kg</option>
                        <option value="Saco 50kg">Saco 50kg</option>
                        <option value="Maço">Maço</option>
                        <option value="Unidade">Unidade</option>
                        <option value="Kg">Kg</option>
                        <option value="Outra...">Outra...</option>
                      </select>
                      {customUnit === 'Outra...' && (
                        <Input 
                          value={customUnitOther}
                          onChange={e => {
                            setCustomUnitOther(e.target.value);
                            setIsFormSaved(false);
                          }}
                          placeholder="Ex: Fardo 30kg"
                          className="h-12 rounded-xl mt-2"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Variação / Qualidade (Opcional)</Label>
                    <Input 
                      value={customVariation}
                      onChange={e => {
                        setCustomVariation(e.target.value);
                        setIsFormSaved(false);
                      }}
                      placeholder="Ex: Padrão, Extra, Tipo A"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preço Diário (R$)</Label>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      value={customPrice}
                      onChange={e => {
                        setCustomPrice(formatToBRL(e.target.value));
                        setIsFormSaved(false);
                      }}
                      placeholder="0,00"
                      className="h-14 text-xl font-bold rounded-xl"
                    />
                  </div>

                  {/* Photo Capture for Custom Product */}
                  <div className="space-y-2 pt-2">
                    <Label className="text-slate-500 font-bold text-xs uppercase tracking-wider">Foto do Lote (Obrigatório)</Label>
                    {customPhoto ? (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200">
                        <img src={customPhoto} alt="Preview" className="w-full h-full object-cover" />
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="absolute top-2 right-2 h-8 w-8 rounded-full p-0"
                          onClick={() => {
                            setCustomPhoto('');
                            setIsFormSaved(false);
                          }}
                        >
                          <XCircle className="w-5 h-5" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => customPhotoInputRef.current?.click()}
                        className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <Camera className="w-8 h-8 text-slate-400" />
                        <p className="text-xs font-bold text-slate-500">Tirar Foto do Lote</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="hidden" 
                      ref={customPhotoInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setCustomPhoto(url);
                          setIsFormSaved(false);
                        }
                      }}
                    />
                  </div>

                  <Button 
                    onClick={handleBatchSubmit}
                    disabled={isSubmitting}
                    className={`w-full h-14 rounded-xl font-black text-lg shadow-lg transition-all active:scale-[0.98] ${
                      isFormSaved 
                        ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100 text-white' 
                        : 'bg-green-600 hover:bg-green-700 shadow-green-100 text-white'
                    }`}
                  >
                    {isSubmitting ? 'Salvando...' : (isFormSaved ? 'PREÇO ATUALIZADO' : 'Salvar Novo Produto')}
                  </Button>
                </motion.div>
              )}

              {/* Passo 3: Variações em Lote */}
              <AnimatePresence>
                {produtoSelecionado && !isCustomProduct && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <p className="font-bold text-slate-900">{produtoSelecionado.nome_exibicao}</p>
                        <p className="text-sm text-slate-500">{categoria} • {produtoSelecionado.unidade_medida}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setGrupoBase(''); setCategoria(''); }} className="text-slate-500">
                        Trocar
                      </Button>
                    </div>

                    <Label className="text-slate-700 font-bold block mt-4">2. Quais variações você trouxe hoje?</Label>
                    <div className="flex flex-wrap gap-3">
                      {subclassificacoes.map(sub => {
                        const isSelected = selectedVariations.includes(sub.id_suffix);
                        return (
                          <button
                            key={sub.id_suffix}
                            type="button"
                            onClick={() => toggleVariation(sub.id_suffix)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                              isSelected 
                                ? 'bg-green-50 border-green-500 text-green-800 shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            {sub.nome}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Dynamic Quick Fill Cards */}
          <AnimatePresence>
            {selectedVariations.map(suffix => {
              const subDef = subclassificacoes.find(s => s.id_suffix === suffix);
              const data = variationData[suffix];
              if (!subDef || !data) return null;

              return (
                <motion.div
                  key={suffix}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <Card className="border-2 border-green-100 shadow-md bg-white rounded-[24px] overflow-hidden">
                    <CardHeader className="bg-green-50/50 border-b border-green-100 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-lg text-slate-900">{produtoSelecionado?.nome_exibicao}</h3>
                        <Badge variant="secondary" className="bg-green-200 text-green-900 font-black px-3 py-1">
                          {subDef.nome}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-6">
                      
                      {/* Photo Capture */}
                      <div className="space-y-2">
                        <Label className="text-slate-500 font-bold text-xs uppercase tracking-wider">Foto do Lote (Obrigatório)</Label>
                        {data.photo ? (
                          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200">
                            <img src={data.photo} alt="Preview" className="w-full h-full object-cover" />
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm"
                              onClick={() => updateVariationData(suffix, 'photo', '')}
                            >
                              Trocar Foto
                            </Button>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  updateVariationData(suffix, 'photo', URL.createObjectURL(file));
                                }
                              }}
                            />
                            <div className="w-full h-24 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-500 gap-2">
                              <Camera className="w-6 h-6" />
                              <span className="font-bold text-sm">Tirar Foto</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Price Input */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-slate-500 font-bold text-xs uppercase tracking-wider">Preço por {produtoSelecionado?.unidade_medida}</Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">R$</span>
                            <Input 
                              type="text" 
                              inputMode="numeric"
                              value={data.price}
                              onChange={(e) => updateVariationData(suffix, 'price', formatToBRL(e.target.value))}
                              placeholder="0,00"
                              className="h-16 pl-12 text-2xl font-black text-slate-900 rounded-xl border-slate-200 focus-visible:ring-green-500 bg-slate-50"
                            />
                          </div>
                        </div>

                        <Button 
                          onClick={() => {
                            if (!data.price || !data.photo) {
                              toast.error('Preencha o preço e tire uma foto para salvar.');
                              return;
                            }
                            // Call handleBatchSubmit but only for this variation
                            // Actually, it's easier to just call handleBatchSubmit and it will handle selectedVariations
                            // But if we want to save ONLY this one, we should temporarily filter selectedVariations
                            const originalSelected = [...selectedVariations];
                            setSelectedVariations([suffix]);
                            setTimeout(() => {
                              handleBatchSubmit();
                              // After submit, the form is reset, so we don't need to restore originalSelected
                            }, 0);
                          }}
                          disabled={isSubmitting}
                          className={`w-full h-12 rounded-xl font-bold shadow-md transition-all active:scale-[0.98] ${
                            isFormSaved 
                              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {isSubmitting ? 'Salvando...' : (isFormSaved ? 'PREÇO ATUALIZADO' : 'Salvar este Lote')}
                        </Button>
                      </div>

                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Sticky Bottom Action for Batch Submit */}
          <AnimatePresence>
            {(selectedVariations.length > 0 || isCustomProduct) && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
              >
                <div className="max-w-2xl mx-auto">
                  <Button 
                    className="w-full h-16 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-xl shadow-xl shadow-green-200 transition-all active:scale-[0.98]"
                    onClick={handleBatchSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Publicando...' : (isCustomProduct ? 'Publicar Novo Produto' : `Publicar ${selectedVariations.length} ${selectedVariations.length === 1 ? 'Produto' : 'Produtos'}`)}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Quick Edit Modal (Daily Focus) */}
      <AnimatePresence>
        {editingItem && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-slate-50 flex flex-col md:p-6 md:items-center md:justify-center md:bg-slate-900/40"
          >
            <div className="bg-slate-50 md:bg-white w-full h-full md:h-auto md:max-w-md md:rounded-[32px] md:shadow-2xl flex flex-col overflow-hidden relative">
              
              {/* Header */}
              <div className="bg-white p-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10">
                <div>
                  <h2 className="font-black text-lg text-slate-900 leading-tight">{editingItem.product.nome_exibicao}</h2>
                  <p className="text-sm font-bold text-green-600">{editingItem.product.subclassificacao || 'Padrão'}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setEditingItem(null)} className="h-12 w-12 bg-slate-100 rounded-full flex-shrink-0">
                  <XCircle className="w-6 h-6 text-slate-500" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                <DailyUpdateForm item={editingItem} onSave={handleSaveEdit} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const StockItemCard: React.FC<{ item: any, onSave: (item: any) => void, onEditFull: () => void }> = ({ item, onSave, onEditFull }) => {
  const [price, setPrice] = useState(formatToBRL(item.price));
  const [isAvailable, setIsAvailable] = useState(item.stock > 0);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setPrice(formatToBRL(item.price));
    setIsAvailable(item.stock > 0);
    setIsSaved(false);
  }, [item]);

  const handleSave = async () => {
    await onSave({
      ...item,
      price: parseBRL(price),
      stock: isAvailable ? (item.stock > 0 ? item.stock : 100) : 0,
      updatedAt: new Date().toISOString()
    });
    setIsSaved(true);
    toast.success(`Preço de ${item.product.nome_exibicao} atualizado!`);
  };

  return (
    <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[24px]">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Thumbnail with Date Stamp */}
          <div 
            className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100 shadow-inner cursor-pointer"
            onClick={onEditFull}
          >
            <img src={item.product.image} alt={item.product.nome_exibicao} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white drop-shadow-md" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-1 flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3 text-white/90" />
              <span className="text-[10px] font-bold text-white tracking-wider">{item.photoDate}</span>
            </div>
          </div>

          {/* Info & Actions */}
          <div className="flex-1 flex flex-col justify-between py-1">
            <div>
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 font-black text-xs px-2.5 py-0.5 border border-green-200">
                  {item.product.subclassificacao || 'Padrão'}
                </Badge>
                <button 
                  onClick={() => {
                  setIsAvailable(!isAvailable);
                  setIsSaved(false);
                }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${isAvailable ? 'bg-green-500' : 'bg-slate-200'}`}
                >
                  {isAvailable ? <Check className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-slate-400" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Preço Hoje (R$):</p>
              <div className="flex items-center gap-2 mt-1">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => {
                    setPrice(formatToBRL(e.target.value));
                    setIsSaved(false);
                  }}
                  disabled={!isAvailable}
                  className="h-10 text-lg font-black text-slate-900 rounded-lg border-slate-200 focus-visible:ring-green-500 disabled:bg-slate-50 disabled:text-slate-400 w-24 px-2"
                />
                <span className="text-xs text-slate-400 font-normal leading-tight">/ {item.product.unidade_medida}</span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button 
                onClick={onEditFull}
                variant="outline"
                className="flex-1 h-10 rounded-xl text-slate-600 font-bold border-slate-200"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button 
                onClick={handleSave}
                className={`flex-[3] h-10 rounded-xl font-bold shadow-md transition-all active:scale-[0.98] ${
                  isSaved 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isSaved ? 'PREÇO ATUALIZADO' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DailyUpdateForm({ item, onSave }: { item: any, onSave: (item: any) => void }) {
  const [isAvailable, setIsAvailable] = useState(item.stock > 0);
  const [price, setPrice] = useState<string>(formatToBRL(item.price));
  const [photoPreview, setPhotoPreview] = useState<string>(item.product.image);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  const adjustPrice = (amount: number) => {
    const currentPrice = parseBRL(price);
    const newPrice = Math.max(0, currentPrice + amount);
    setPrice(formatToBRL(newPrice));
    setIsSaved(false);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      setIsSaved(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Daily Photo */}
      <div className="space-y-3">
        <Label className="text-slate-500 font-bold uppercase tracking-widest text-xs">1. Foto do Lote do Dia (Obrigatório)</Label>
        
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            
            {/* Simulated Date Stamp Overlay */}
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/20">
              <Calendar className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white tracking-wider">Lote de hoje - {todayStr}</span>
            </div>
          </div>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={fileInputRef}
            onChange={handlePhotoCapture}
          />
          
          <Button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-14 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-bold text-base border-2 border-green-200 border-dashed"
          >
            <Camera className="w-5 h-5 mr-2" />
            Tirar Nova Foto do Lote
          </Button>
        </div>
      </div>

      {/* Section 2: Daily Price */}
      <div className={`space-y-3 transition-all duration-300 ${!isAvailable ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
        <Label className="text-slate-500 font-bold uppercase tracking-widest text-xs">2. Preço Diário ({item.product.unidade_medida})</Label>
        
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-2xl">R$</span>
            <Input 
              type="text" 
              inputMode="numeric"
              value={price}
              onChange={(e) => {
                setPrice(formatToBRL(e.target.value));
                setIsSaved(false);
              }}
              disabled={!isAvailable}
              className="h-20 pl-14 text-4xl font-black text-slate-900 rounded-2xl border-slate-200 focus-visible:ring-green-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div className="flex justify-between items-center px-2 bg-blue-50 p-3 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-blue-800 flex items-center gap-2">
              <Store className="w-4 h-4" />
              Média de mercado ontem: <span className="text-blue-900 text-sm">R$ {item.marketAverage.toFixed(2)}</span>
            </p>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <Button type="button" disabled={!isAvailable} variant="outline" className="h-14 bg-slate-50 text-slate-600 font-black text-lg rounded-xl" onClick={() => adjustPrice(-1)}>-1</Button>
            <Button type="button" disabled={!isAvailable} variant="outline" className="h-14 bg-slate-50 text-slate-600 font-black text-lg rounded-xl" onClick={() => adjustPrice(-0.5)}>-0.5</Button>
            <Button type="button" disabled={!isAvailable} variant="outline" className="h-14 bg-slate-50 text-slate-600 font-black text-lg rounded-xl" onClick={() => adjustPrice(0.5)}>+0.5</Button>
            <Button type="button" disabled={!isAvailable} variant="outline" className="h-14 bg-slate-50 text-slate-600 font-black text-lg rounded-xl" onClick={() => adjustPrice(1)}>+1</Button>
          </div>
        </div>
      </div>

      {/* Section 3: Availability Toggle */}
      <div className="space-y-3">
        <Label className="text-slate-500 font-bold uppercase tracking-widest text-xs">3. Disponibilidade</Label>
        <div 
          className={`relative flex items-center justify-between p-5 rounded-3xl cursor-pointer transition-all border-2 shadow-sm ${isAvailable ? 'bg-green-50 border-green-500' : 'bg-slate-100 border-slate-200'}`}
          onClick={() => {
            setIsAvailable(!isAvailable);
            setIsSaved(false);
          }}
        >
          <div className="flex items-center gap-4">
            {isAvailable ? <CheckCircle2 className="w-10 h-10 text-green-600" /> : <XCircle className="w-10 h-10 text-slate-400" />}
            <div>
              <p className={`font-black text-xl ${isAvailable ? 'text-green-800' : 'text-slate-600'}`}>
                {isAvailable ? 'Disponível' : 'Esgotado'}
              </p>
              <p className={`text-sm font-medium ${isAvailable ? 'text-green-600/80' : 'text-slate-500'}`}>
                {isAvailable ? 'Visível no catálogo' : 'Oculto para compradores'}
              </p>
            </div>
          </div>
          
          {/* Custom Giant Switch */}
          <div className={`w-20 h-12 rounded-full p-1.5 transition-colors ${isAvailable ? 'bg-green-500' : 'bg-slate-300'}`}>
            <motion.div 
              className="w-9 h-9 bg-white rounded-full shadow-md"
              animate={{ x: isAvailable ? 32 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 md:absolute md:rounded-b-[32px] z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <Button 
          className={`w-full h-16 rounded-2xl text-white font-black text-xl shadow-xl transition-all active:scale-[0.98] ${
            isSaved 
              ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' 
              : 'bg-green-600 hover:bg-green-700 shadow-green-200'
          }`}
          onClick={() => {
            onSave({
              ...item,
              price: parseBRL(price),
              stock: isAvailable ? (item.stock > 0 ? item.stock : 100) : 0,
              product: {
                ...item.product,
                image: photoPreview
              },
              photoDate: todayStr
            });
            setIsSaved(true);
          }}
        >
          {isSaved ? 'PREÇO ATUALIZADO' : 'Publicar Lote do Dia'}
        </Button>
      </div>
    </div>
  );
}
