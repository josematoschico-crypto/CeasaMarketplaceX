import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Truck, CheckCircle2, Clock, ChevronRight, 
  MapPin, Phone, Circle, ArrowLeft, Zap, Info, MessageCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

import { MOCK_ORDERS } from '../data/mock';
import { Order } from '../types';

interface OrdersPageProps {
  orders: Order[];
}

export default function OrdersPage({ orders }: OrdersPageProps) {
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'shipped': return { label: 'Em Rota', color: 'bg-blue-100 text-blue-600', icon: Truck };
      case 'delivered': return { label: 'Entregue', color: 'bg-green-100 text-green-600', icon: CheckCircle2 };
      default: return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-600', icon: Clock };
    }
  };

  if (trackingOrder) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-2xl mx-auto space-y-6 pb-20"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setTrackingOrder(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Rastreamento {trackingOrder.id}</h1>
        </div>

        {/* Status Card */}
        <Card className="border-none shadow-xl bg-white rounded-[40px] overflow-hidden">
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center gap-6">
              <div className="bg-green-50 p-5 rounded-3xl">
                <Truck className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Pedido a caminho!</h2>
                <p className="text-slate-500 font-medium">Previsão de entrega: 14:30 - 15:00</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              <div className="flex gap-6 relative">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center z-10 shadow-lg shadow-green-200">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Pedido Confirmado</h3>
                  <p className="text-slate-400 text-sm">10:45</p>
                </div>
              </div>

              <div className="flex gap-6 relative">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center z-10 shadow-lg shadow-green-200">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Separação na Barraca</h3>
                  <p className="text-slate-400 text-sm">11:10</p>
                </div>
              </div>

              <div className="flex gap-6 relative">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center z-10 shadow-lg shadow-green-200">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-green-600">Motorista Coletou Carga</h3>
                  <p className="text-slate-400 text-sm">11:30</p>
                </div>
              </div>

              <div className="flex gap-6 relative">
                <div className="w-10 h-10 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center z-10">
                  <div className="w-4 h-4 rounded-full bg-slate-200" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Entrega no Destino</h3>
                  <p className="text-slate-400 text-sm">---</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real Google Maps Integration with Live Overlay */}
        <div className="relative h-96 bg-slate-100 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl group">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps Tracking"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3658.106653140656!2d-46.73602512373059!3d-23.53225886043136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce56425333798f%3A0x86877296067769!2sCEAGESP!5e0!3m2!1spt-BR!2sbr!4v1711990000000!5m2!1spt-BR!2sbr"
          />
          
          {/* Live Simulation Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center"
              >
                <div className="w-4 h-4 bg-green-600 rounded-full border-2 border-white shadow-lg" />
              </motion.div>
            </div>

            {/* Live Status Badge */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Ao Vivo</span>
            </div>

            {/* Distance Info Overlay */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-xl">
                  <Truck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Status</p>
                  <p className="text-sm font-bold text-slate-900">{trackingOrder.driver?.name || 'Motorista'} está a caminho</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Distância</p>
                <p className="text-sm font-black text-green-600">2.4 km</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Driver Card */}
        <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100">
                <img 
                  src={trackingOrder.driver?.photo || "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Truckdriver.jpg/800px-Truckdriver.jpg"} 
                  alt={trackingOrder.driver?.name || "Motorista"} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900">{trackingOrder.driver?.name || 'Motorista'}</h4>
                <p className="text-slate-500 text-sm">{trackingOrder.driver?.truck || 'Caminhão em Rota'}</p>
              </div>
            </div>
            <Button 
              className="bg-[#25D366] text-white hover:bg-[#128C7E] rounded-2xl px-6 h-12 font-bold shadow-lg shadow-[#25D366]/20 transition-all active:scale-[0.98] flex items-center gap-2"
              onClick={() => {
                const phone = trackingOrder.driver?.phone || '0000000000';
                window.open(`https://wa.me/55${phone}`, '_blank');
              }}
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20"
    >
      <h1 className="text-3xl font-bold">Meus Pedidos</h1>

      <div className="space-y-6">
        {orders.map((order) => {
          const status = getStatusInfo(order.status);
          return (
            <Card key={order.id} className="border-none shadow-lg bg-white rounded-[32px] overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl">
                        <Package className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xl text-slate-900">{order.id}</h3>
                          <Badge className={`${status.color} border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">{order.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-8">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Total Pago</p>
                        <p className="font-black text-2xl text-green-600">R$ {order.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-50" />

                  {/* Detailed Items */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Itens do Pedido</h4>
                    <div className="grid gap-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                              <Zap className="w-5 h-5 text-yellow-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 text-[15px]">{item.name}</p>
                                {item.subclassification && (
                                  <Badge variant="outline" className="text-[10px] border-green-200 text-green-700 bg-green-50 px-1.5 py-0">
                                    {item.subclassification}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[13px] text-slate-500 mt-0.5">Vendido por: <span className="font-semibold text-green-600">{item.stall}</span></p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900 text-[15px]">{item.quantity}</p>
                            <p className="text-[13px] text-slate-400 mt-0.5">R$ {item.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    onClick={() => setTrackingOrder(order)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-100 transition-all active:scale-[0.98]"
                  >
                    <Truck className="w-5 h-5 mr-2" />
                    Acompanhamento
                  </Button>
                </div>

                {order.status === 'shipped' && (
                  <div className="bg-green-600 p-4 px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      <p className="text-sm text-white font-bold">
                        Pedido em rota de entrega!
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/50" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}
