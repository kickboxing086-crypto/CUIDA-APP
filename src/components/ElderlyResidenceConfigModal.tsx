import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ShieldCheck,
  LocateFixed,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  Sliders,
  Navigation,
  Info,
  Compass,
} from 'lucide-react';
import { api } from '../services/api';
import { User, Family, ElderlyProfile } from '../types';

interface ElderlyResidenceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  familyId?: string | null;
  familyName?: string | null;
  currentElderly?: ElderlyProfile | null;
  onSaved: (updatedElderly: ElderlyProfile, updatedFamily?: Family) => void;
}

export const ElderlyResidenceConfigModal: React.FC<ElderlyResidenceConfigModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  familyId,
  familyName,
  currentElderly,
  onSaved,
}) => {
  const [address, setAddress] = useState('');
  const [cep, setCep] = useState('');
  const [lat, setLat] = useState<number | string>('');
  const [lng, setLng] = useState<number | string>('');
  const [radiusMeters, setRadiusMeters] = useState<number>(150);
  const [notes, setNotes] = useState('');

  const [isLoadingGps, setIsLoadingGps] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pre-fill with existing data when opening
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      if (currentElderly) {
        setAddress(currentElderly.residence_address || '');
        if (currentElderly.residence_lat) setLat(currentElderly.residence_lat);
        if (currentElderly.residence_long) setLng(currentElderly.residence_long);
        if (currentElderly.allowed_radius_meters) setRadiusMeters(currentElderly.allowed_radius_meters);
      }
    }
  }, [isOpen, currentElderly]);

  if (!isOpen) return null;

  // Capture current administrator device GPS
  const handleCaptureCurrentGps = () => {
    setErrorMessage(null);
    if (!navigator.geolocation) {
      setErrorMessage('Geolocalização não é suportada neste navegador.');
      return;
    }

    setIsLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const capturedLat = parseFloat(pos.coords.latitude.toFixed(6));
        const capturedLng = parseFloat(pos.coords.longitude.toFixed(6));
        setLat(capturedLat);
        setLng(capturedLng);
        setIsLoadingGps(false);
        setSuccessMessage(`Coordenadas GPS capturadas com sucesso! [Lat: ${capturedLat}, Lng: ${capturedLng}]`);
      },
      (err) => {
        setIsLoadingGps(false);
        setErrorMessage(
          `Falha ao obter GPS: ${err.message}. Permita o acesso à localização no navegador ou digite as coordenadas manualmente.`
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search coordinates via Nominatim OpenStreetMap (free, no API key needed)
  const handleSearchCoordinates = async () => {
    if (!address.trim() && !cep.trim()) {
      setErrorMessage('Digite o endereço ou CEP para buscar as coordenadas.');
      return;
    }

    setErrorMessage(null);
    setIsSearchingAddress(true);

    try {
      const query = [address, cep, 'Brasil'].filter(Boolean).join(', ');
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const foundLat = parseFloat(parseFloat(data[0].lat).toFixed(6));
          const foundLng = parseFloat(parseFloat(data[0].lon).toFixed(6));
          setLat(foundLat);
          setLng(foundLng);
          if (!address && data[0].display_name) {
            setAddress(data[0].display_name);
          }
          setSuccessMessage(`Localização localizada no mapa: [${foundLat}, ${foundLng}]`);
        } else {
          setErrorMessage('Endereço não localizado pelo mapa. Use o botão "Capturar Meu GPS Atual" ou insira as coordenadas.');
        }
      }
    } catch {
      setErrorMessage('Erro ao consultar serviço de mapas. Digite as coordenadas ou capture pelo GPS.');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!address.trim()) {
      setErrorMessage('Por favor, informe o endereço da residência do idoso.');
      return;
    }

    const numLat = Number(lat);
    const numLng = Number(lng);

    if (!lat || !lng || isNaN(numLat) || isNaN(numLng)) {
      setErrorMessage('As coordenadas GPS (Latitude e Longitude) são obrigatórias para ativar o perímetro anti-fraude de ponto.');
      return;
    }

    setIsSaving(true);
    try {
      const activeFamilyId = familyId || currentUser.family_id;

      let savedFamily: Family | undefined;
      let savedElderly: ElderlyProfile;

      if (activeFamilyId) {
        const res = await api.updateFamilyResidence(activeFamilyId, {
          residence_address: address.trim(),
          residence_lat: numLat,
          residence_long: numLng,
          allowed_radius_meters: radiusMeters,
          residence_cep: cep.trim(),
          notes: notes.trim(),
          requesting_user_id: currentUser.id,
        });
        savedFamily = res.family;
        savedElderly = res.elderly;
      } else {
        const res = await api.updateElderlyResidence({
          residence_address: address.trim(),
          residence_lat: numLat,
          residence_long: numLng,
          allowed_radius_meters: radiusMeters,
          family_id: activeFamilyId,
          requesting_user_id: currentUser.id,
        });
        savedElderly = res.elderly;
      }

      setSuccessMessage('Residência cadastrada e perímetro de segurança ativado com sucesso!');
      setTimeout(() => {
        onSaved(savedElderly, savedFamily);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar residência.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <MapPin className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-blue-300">
                  Controle Anti-Fraude · Perímetro de Ponto
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Inviolável
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Cadastrar Residência do Idoso & Geofence
              </h2>
              <p className="text-xs text-blue-200/80 mt-0.5">
                {familyName ? `Família: ${familyName}` : 'Configuração de Presença Obrigatória'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 sm:p-7 space-y-6">
          {/* Security Banner */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-950">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm text-blue-900 mb-0.5">
                Poder Exclusivo do Administrador Familiar
              </span>
              <p className="text-blue-800 leading-relaxed">
                Ao cadastrar a localização exata da residência, os cuidadores{' '}
                <strong>só conseguirão bater ponto (entrada e saída) quando estiverem presencialmente no local cadastrado</strong>.
                Qualquer tentativa fora do raio será bloqueada automaticamente pelo sistema com auditoria de GPS.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Address and CEP */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Endereço da Residência do Idoso
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Endereço Completo (Rua, Número, Bairro, Cidade - UF) *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Av. Higienópolis, 1050, Apto 82 - Higienópolis, São Paulo - SP"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CEP (Opcional)
                </label>
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="01238-000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium text-slate-900 bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSearchCoordinates}
              disabled={isSearchingAddress}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <Search className={`w-4 h-4 ${isSearchingAddress ? 'animate-spin' : 'text-blue-600'}`} />
              <span>{isSearchingAddress ? 'Buscando no mapa...' : 'Buscar Coordenadas pelo Endereço / CEP'}</span>
            </button>
          </div>

          {/* GPS Coordinates and Capture Tool */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                Coordenadas GPS de Validação (Inviolável)
              </h3>

              <button
                type="button"
                onClick={handleCaptureCurrentGps}
                disabled={isLoadingGps}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <LocateFixed className={`w-4 h-4 ${isLoadingGps ? 'animate-spin' : ''}`} />
                <span>{isLoadingGps ? 'Obtendo GPS...' : '📍 Capturar Meu GPS Atual na Casa'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="Ex: -23.550520"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-mono text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="Ex: -46.633308"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-mono text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Allowed Radius Perimeter Slider */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                Raio Máximo de Tolerância de Presença
              </label>
              <span className="font-mono font-extrabold text-sm px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl">
                {radiusMeters} metros
              </span>
            </div>

            <input
              type="range"
              min="50"
              max="500"
              step="25"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>50m (Muito estrito)</span>
              <span>150m (Recomendado para casas/prédios)</span>
              <span>300m</span>
              <span>500m (Máximo)</span>
            </div>

            <p className="text-[11px] text-slate-600">
              💡 <strong>Como funciona:</strong> Se o cuidador estiver a uma distância superior a <strong>{radiusMeters} metros</strong> das coordenadas da residência, o botão de bater ponto será <strong>bloqueado</strong> e o servidor rejeitará o registro com alerta de segurança.
            </p>
          </div>

          {/* Observations */}
          <div className="space-y-1 pt-2">
            <label className="block text-xs font-bold text-slate-700">
              Instruções de Acesso / Ponto de Referência (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Interfone 82, portaria 24 horas, portão azul."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium text-slate-900 bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSaving ? 'Salvando Perímetro...' : 'Salvar Residência e Ativar Perímetro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
