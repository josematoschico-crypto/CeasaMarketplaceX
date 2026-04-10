import { motion } from 'framer-motion';
import { CreditCard, CheckCircle2, ArrowLeft, Loader2, Info, Zap, Package, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CartItem } from '../types';

import { MOCK_DRIVERS } from '../data/mock';

interface CheckoutPageProps {
  cart: CartItem[];
  clearCart: () => void;
  addOrder: (order: any) => void;
}

export default function CheckoutPage({ cart, clearCart, addOrder }: CheckoutPageProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const navigate = useNavigate();

  // Recalculate values (assuming standard 5% fee and a base freight for checkout if not passed)
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const fee = subtotal * 0.05;
  const freight = 25.00; // Default for checkout demo
  const total = subtotal + fee + freight;

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setIsFinished(true);
      
      const randomDriver = MOCK_DRIVERS[Math.floor(Math.random() * MOCK_DRIVERS.length)];
      
      // Create new order
      const newOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
        total: total,
        status: 'shipped',
        driver: randomDriver,
        items: cart.map(item => ({
          name: item.product.nome_exibicao,
          stall: item.stall.name,
          quantity: `${item.quantity} ${item.product.unidade_medida}`,
          price: item.price * item.quantity,
          subclassification: item.product.subclassificacao
        }))
      };
      
      addOrder(newOrder);
      clearCart();
      toast.success('Pagamento realizado com sucesso!');
    }, 2000);
  };

  if (isFinished) {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 space-y-6 text-center"
      >
        <div className="bg-green-100 p-8 rounded-full">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">Pedido Confirmado!</h2>
          <p className="text-slate-500 max-w-md">
            Seu pedido foi enviado para as barracas. Você receberá atualizações sobre a entrega em breve via AgroMarket Pay.
          </p>
        </div>
        <div className="flex gap-4">
          <Link to="/pedidos">
            <Button variant="outline" className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 hover:text-green-800">Ver Meus Pedidos</Button>
          </Link>
          <Link to="/">
            <Button className="bg-green-600 hover:bg-green-700">Voltar ao Início</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  const paymentMethods = [
    { id: 'pix', label: 'Pix (Confirmação Instantânea)', icon: Zap, color: 'text-purple-600' },
    { id: 'card', label: 'Cartão de Crédito (Até 12x)', icon: CreditCard, color: 'text-blue-600' },
    { id: 'boleto', label: 'Boleto Faturado', icon: Package, color: 'text-slate-600' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto space-y-8 pb-20"
    >
      <div className="flex items-center gap-4">
        <Link to="/carrinho">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Finalizar Compra</h1>
      </div>

      <div className="space-y-8">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex gap-4 items-start">
          <div className="bg-blue-500/10 p-2 rounded-full">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-blue-800 text-sm leading-relaxed">
            O pagamento é processado via <span className="font-bold">AgroMarket Pay</span>. O valor dos produtos será enviado diretamente para a conta da barraca após a confirmação.
          </p>
        </div>

        {/* Payment Methods Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-slate-700">Método de Pagamento</h2>
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="space-y-4">
                <button
                  onClick={() => setSelectedPayment(method.id)}
                  className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                    selectedPayment === method.id ? 'border-green-600' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl bg-slate-50 ${method.color}`}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    <span className={`font-bold text-lg ${selectedPayment === method.id ? 'text-slate-900' : 'text-slate-600'}`}>
                      {method.label}
                    </span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPayment === method.id ? 'border-green-600 bg-green-600' : 'border-slate-200'
                  }`}>
                    {selectedPayment === method.id && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </div>
                </button>

                {/* Pix Details */}
                {selectedPayment === 'pix' && method.id === 'pix' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 border border-slate-100 rounded-3xl p-8 flex flex-col items-center space-y-6"
                  >
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                      <div className="w-48 h-48 bg-slate-100 flex items-center justify-center rounded-xl">
                        <Zap className="w-24 h-24 text-purple-200" />
                        {/* In a real app, use a QR Code generator library here */}
                        <div className="absolute flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                          <span className="mb-2">QR CODE PIX</span>
                          <div className="grid grid-cols-4 gap-1">
                            {[...Array(16)].map((_, i) => (
                              <div key={i} className="w-2 h-2 bg-slate-300 rounded-sm" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full space-y-3">
                      <p className="text-center text-sm font-medium text-slate-500">Copie a chave abaixo para pagar no seu banco:</p>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-600 break-all">
                          00020126580014BR.GOV.BCB.PIX0136ceasamarket-pay-9922-4411-8833
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-auto py-3 rounded-xl border-slate-200 hover:bg-slate-50"
                          onClick={() => {
                            navigator.clipboard.writeText('00020126580014BR.GOV.BCB.PIX0136ceasamarket-pay-9922-4411-8833');
                            toast.success('Chave PIX copiada!');
                          }}
                        >
                          Copiar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-purple-600 font-medium bg-purple-50 px-4 py-2 rounded-full">
                      <Zap className="w-3 h-3" />
                      Confirmação instantânea após o pagamento
                    </div>
                  </motion.div>
                )}

                {/* Card Details */}
                {selectedPayment === 'card' && method.id === 'card' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-6"
                  >
                    <div className="space-y-3">
                      <Label htmlFor="cardNumber" className="text-slate-900 font-bold text-base">Número do Cartão</Label>
                      <Input 
                        id="cardNumber" 
                        placeholder="0000 0000 0000 0000" 
                        className="h-14 rounded-2xl border-slate-200 bg-white text-lg placeholder:text-slate-400"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="expiry" className="text-slate-900 font-bold text-base">Validade</Label>
                        <Input 
                          id="expiry" 
                          placeholder="MM/AA" 
                          className="h-14 rounded-2xl border-slate-200 bg-white text-lg placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="cvv" className="text-slate-900 font-bold text-base">CVV</Label>
                        <Input 
                          id="cvv" 
                          placeholder="123" 
                          className="h-14 rounded-2xl border-slate-200 bg-white text-lg placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Boleto Details */}
                {selectedPayment === 'boleto' && method.id === 'boleto' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 border border-slate-100 rounded-3xl p-6"
                  >
                    <div className="bg-white border border-slate-100 rounded-2xl p-6">
                      <p className="text-slate-600 text-lg leading-relaxed">
                        O boleto tem prazo de compensação de até 2 dias úteis. A entrega será agendada após a confirmação.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Final Summary Card */}
        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <h3 className="font-bold text-2xl text-slate-900">Resumo Final</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal Produtos</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Frete Dinâmico</span>
                <span>R$ {freight.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Taxa de Intermediação (5%)</span>
                <span>R$ {fee.toFixed(2)}</span>
              </div>
              
              <Separator className="bg-slate-100" />
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-xl font-bold text-slate-900">Total a Pagar</span>
                <span className="text-3xl font-black text-green-700 tracking-tight">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <Button 
              className="w-full bg-green-600 hover:bg-green-700 h-16 rounded-2xl text-xl font-bold shadow-lg shadow-green-200 transition-all active:scale-[0.98]"
              onClick={handlePayment}
              disabled={isProcessing || !selectedPayment}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-3" />
                  Processando Pagamento...
                </>
              ) : (
                'Finalizar e Pagar Agora'
              )}
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Pagamento 100% Seguro via AgroMarket Pay</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
