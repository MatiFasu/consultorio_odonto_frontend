import React from 'react';
import type { EstadoDiente } from '../api/registroClinicoService';

interface Props {
  estados: EstadoDiente[];
  onChange?: (numero: number, posicion: string, nuevoEstado: string) => void;
  readOnly?: boolean;
}

const DIENTES_SUPERIORES = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const DIENTES_INFERIORES = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const Odontograma = ({ estados, onChange, readOnly = false }: Props) => {

  const getEstado = (numero: number, posicion: string) => {
    return estados.find(e => e.numeroDiente === numero && e.posicion === posicion)?.estado || 'sano';
  };

  const getColor = (estado: string) => {
    switch (estado) {
      case 'caries': return 'fill-rose-500';
      case 'restaurado': return 'fill-blue-500';
      case 'protesis': return 'fill-amber-500';
      case 'ausente': return 'fill-slate-300';
      default: return 'fill-white';
    }
  };

  const handleclick = (numero: number, posicion: string) => {
    if (readOnly || !onChange) return;
    const actual = getEstado(numero, posicion);
    const ciclos: Record<string, string> = { 'sano': 'caries', 'caries': 'restaurado', 'restaurado': 'protesis', 'protesis': 'sano' };
    onChange(numero, posicion, ciclos[actual] || 'sano');
  };

  const Diente = ({ numero }: { numero: number }) => (
    <div className="flex flex-col items-center gap-1 group">
      <span className="text-[10px] font-black text-slate-400 group-hover:text-primary-500 transition-colors">{numero}</span>
      <svg width="40" height="40" viewBox="0 0 100 100" className="cursor-pointer drop-shadow-sm">
        {/* Top */}
        <path d="M20 20 L80 20 L50 50 Z" stroke="#CBD5E1" strokeWidth="2" className={`${getColor(getEstado(numero, 'top'))} hover:opacity-80 transition-all`} onClick={() => handleclick(numero, 'top')} />
        {/* Right */}
        <path d="M80 20 L80 80 L50 50 Z" stroke="#CBD5E1" strokeWidth="2" className={`${getColor(getEstado(numero, 'right'))} hover:opacity-80 transition-all`} onClick={() => handleclick(numero, 'right')} />
        {/* Bottom */}
        <path d="M80 80 L20 80 L50 50 Z" stroke="#CBD5E1" strokeWidth="2" className={`${getColor(getEstado(numero, 'bottom'))} hover:opacity-80 transition-all`} onClick={() => handleclick(numero, 'bottom')} />
        {/* Left */}
        <path d="M20 80 L20 20 L50 50 Z" stroke="#CBD5E1" strokeWidth="2" className={`${getColor(getEstado(numero, 'left'))} hover:opacity-80 transition-all`} onClick={() => handleclick(numero, 'left')} />
        {/* Center */}
        <rect x="35" y="35" width="30" height="30" stroke="#CBD5E1" strokeWidth="2" className={`${getColor(getEstado(numero, 'center'))} hover:opacity-80 transition-all`} onClick={() => handleclick(numero, 'center')} />
      </svg>
    </div>
  );

  return (
    <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 overflow-x-auto">
      <div className="min-w-[800px] space-y-12">
        {/* Maxilar Superior */}
        <div className="flex justify-center gap-2">
          {DIENTES_SUPERIORES.map(n => <Diente key={n} numero={n} />)}
        </div>
        
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

        {/* Mandíbula Inferior */}
        <div className="flex justify-center gap-2">
          {DIENTES_INFERIORES.map(n => <Diente key={n} numero={n} />)}
        </div>
      </div>

      {!readOnly && (
        <div className="mt-8 flex justify-center gap-6">
           <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
             <div className="w-3 h-3 bg-white border border-slate-300 rounded"></div> Sano
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-rose-500">
             <div className="w-3 h-3 bg-rose-500 rounded"></div> Caries
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-blue-500">
             <div className="w-3 h-3 bg-blue-500 rounded"></div> Restaurado
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-amber-500">
             <div className="w-3 h-3 bg-amber-500 rounded"></div> Prótesis
           </div>
           <p className="text-[10px] text-slate-400 italic ml-4">* Haz clic en las caras del diente para cambiar estado</p>
        </div>
      )}
    </div>
  );
};

export default Odontograma;
