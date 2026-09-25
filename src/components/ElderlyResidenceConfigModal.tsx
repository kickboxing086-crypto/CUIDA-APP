import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { User, Family, ElderlyProfile } from '../types';
import { fetchAddressByCep, formatCep } from '../utils/cep';

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
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [cityState, setCityState] = useState('');
  const [fullAddress, setFullAddress] = useState('');

  const [lat, setLat] = useState<number | string>('');
  const [lng, setLng] = useState<number | string>('');
  const [radiusMeters, setRadiusMeters] = useState<number>(150);
  const [notes, setNotes] = useState('');

  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingGps, setIsLoadingGps] = useState(false);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cepFoundInfo, setCepFoundInfo] = useState<string | null>(null);

  const numberInputRef = useRef<HTMLInputElement | null>(null);

  const isFamilyAdmin =
    currentUser.role === 'admin_family' ||
    (Array.isArray(currentUser.roles) && currentUser.roles.includes('admin_family')) ||
    currentUser.role === 'admin_geral';

  // Pre-fill with existing data when opening
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setCepFoundInfo(null);
      if (currentElderly) {
        setFullAddress(currentElderly.residence_address || '');
        if (currentElderly.residence_lat) setLat(currentElderly.residence_lat);
        if (currentElderly.residence_long) setLng(currentElderly.residence_long);
        if (currentElderly.allowed_radius_meters) setRadiusMeters(currentElderly.allowed_radius_meters);
      }
    }
  }, [isOpen, currentElderly]);

  // When street, number, neighborhood, or cityState change, build the combined full address
  useEffect(() => {
    if (street || neighborhood || cityState) {
      const parts: string[] = [];
      const streetWithNum = number ? `${street}, nº ${number}` : street;
      if (streetWithNum) parts.push(streetWithNum);
      if (complement) parts.push(complement);
      if (neighborhood) parts.push(neighborhood);
      if (cityState) parts.push(cityState);
      if (cep) parts.push(`CEP ${cep}`);
      setFullAddress(parts.join(' - '));
    }
  }, [street, number, complement, neighborhood, cityState, cep]);

  if (!isOpen) return null;

  // Real-time GPS geocoding via OpenStreetMap Nominatim
  const geocodeAddress = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSearchingMap(true);
    try {
      const q = `${queryText}, Brasil`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const foundLat = parseFloat(parseFloat(data[0].lat).toFixed(6));
          const foundLng = parseFloat(parseFloat(data[0].lon).toFixed(6));
          setLat(foundLat);
          setLng(foundLng);
          return { lat: foundLat, lng: foundLng };
        }
      }
    } catch (err) {
      console.warn('[Geocoding] Falha ao consultar coordenadas:', err);
    } finally {
      setIsSearchingMap(false);
    }
    return null;
  };

  // Automated CEP handler: formats and fetches street name immediately
  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    setCep(formatted);
    setCepFoundInfo(null);
    setErrorMessage(null);

    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsLoadingCep(true);
      try {
        const result = await fetchAddressByCep(clean);
        if (result) {
          setStreet(result.street);
          setNeighborhood(result.neighborhood);
          setCityState(result.city && result.state ? `${result.city} - ${result.state}` : result.city);
          setCepFoundInfo(`✓ Rua identificada: ${result.street || 'Logradouro'} (${result.neighborhood}, ${result.city}/${result.state})`);

          // Focus on number input for fast typing
          setTimeout(() => {
            if (numberInputRef.current) {
              numberInputRef.current.focus();
            }
          }, 100);

          // Automatically find GPS coordinates from the retrieved address
          const searchQuery = [result.street, result.neighborhood, result.city, result.state].filter(Boolean).join(', ');
          await geocodeAddress(searchQuery);
        } else {
          setErrorMessage('CEP não encontrado. Digite o nome da rua manualmente ou verifique os dígitos.');
        }
      } catch {
        setErrorMessage('Erro ao consultar CEP. Preencha os campos de endereço manualmente.');
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

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
        setSuccessMessage(`Coordenadas GPS capturadas no local! [Lat: ${capturedLat}, Lng: ${capturedLng}]`);
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

  const handleManualSearchMap = async () => {
    const query = fullAddress || [street, number, neighborhood, cityState, cep].filter(Boolean).join(', ');
    if (!query.trim()) {
      setErrorMessage('Informe o CEP ou o endereço para buscar as coordenadas no mapa.');
      return;
    }
    setErrorMessage(null);
    const coords = await geocodeAddress(query);
    if (coords) {
      setSuccessMessage(`Coordenadas localizadas: [${coords.lat}, ${coords.lng}]`);
    } else {
      setErrorMessage('Endereço não localizado com precisão no mapa. Use o botão "Capturar Meu GPS Atual" ou insira as coordenadas.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const finalAddress = fullAddress.trim() || [street, number ? `nº ${number}` : '', neighborhood, cityState, cep ? `CEP ${cep}` : ''].filter(Boolean).join(', ');

    if (!isFamilyAdmin) {
      setErrorMessage('Somente o Administrador Familiar tem autorização para cadastrar ou alterar o endereço da residência.');
      return;
    }

    if (!finalAddress) {
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
          residence_address: finalAddress,
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
          residence_address: finalAddress,
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
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
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
          {!isFamilyAdmin ? (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm text-amber-900 mb-0.5">
                  Exclusividade do Administrador Familiar
                </span>
                <p className="text-amber-800 leading-relaxed">
                  Somente o Administrador Familiar pode cadastrar ou alterar o endereço oficial da residência.
                </p>
              </div>
            </div>
          ) : (
            /* Security Banner */
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-950">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm text-blue-900 mb-0.5">
                  Configuração Exclusiva do Administrador Familiar
                </span>
                <p className="text-blue-800 leading-relaxed">
                  Digite o <strong>CEP</strong> para que o <strong>nome da rua seja preenchido automaticamente</strong>. Os cuidadores <strong>só conseguirão bater ponto quando estiverem fisicamente no endereço cadastrado</strong>.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section: CEP com Autocompletação Automática de Rua */}
          <div className="space-y-4 bg-slate-50/80 border border-slate-200 p-4 sm:p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Busca Automática por CEP & Endereço
              </h3>
              <span className="text-[11px] text-blue-700 bg-blue-100 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                Preenchimento Automático
              </span>
            </div>

            {/* CEP Input Prominent */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  CEP do Idoso *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full px-3.5 py-2.5 pr-9 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden text-slate-900 bg-white"
                  />
                  {isLoadingCep && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Digite 8 números
                </span>
              </div>

              {/* Street Name (Filled automatically upon CEP input) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Nome da Rua / Avenida (Logradouro) *</span>
                  {street && (
                    <span className="text-[10px] text-emerald-700 font-bold">
                      ✓ Preenchido
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Aparece automaticamente ao digitar o CEP"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium text-slate-900 bg-white"
                />
              </div>
            </div>

            {cepFoundInfo && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{cepFoundInfo}</span>
              </div>
            )}

            {/* Number, Complement, Neighborhood, City/State */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número
                </label>
                <input
                  ref={numberInputRef}
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Ex: 1200"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Complemento / Apto
                </label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto 42, Bloco B"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bairro"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cidade - UF
                </label>
                <input
                  type="text"
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                  placeholder="São Paulo - SP"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Combined Address Preview */}
            {fullAddress && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Endereço Completo Formatado para o Ponto
                </label>
                <input
                  type="text"
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Section: GPS Coordinates and Capture Tool */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  Coordenadas GPS de Validação Presencial
                </h3>
                <p className="text-xs text-slate-500">
                  Preenchidas automaticamente via CEP/Mapa ou capturadas no local
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleManualSearchMap}
                  disabled={isSearchingMap}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Search className={`w-3.5 h-3.5 ${isSearchingMap ? 'animate-spin' : 'text-blue-600'}`} />
                  <span>{isSearchingMap ? 'Buscando...' : 'Atualizar pelo Mapa'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCaptureCurrentGps}
                  disabled={isLoadingGps}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <LocateFixed className={`w-3.5 h-3.5 ${isLoadingGps ? 'animate-spin' : ''}`} />
                  <span>{isLoadingGps ? 'Obtendo GPS...' : '📍 Capturar GPS no Local'}</span>
                </button>
              </div>
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-mono text-slate-900 bg-white font-bold"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-mono text-slate-900 bg-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section: Allowed Radius Perimeter Slider */}
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
              <span>150m (Recomendado)</span>
              <span>300m</span>
              <span>500m (Máximo)</span>
            </div>

            <p className="text-[11px] text-slate-600">
              💡 <strong>Regra de Segurança:</strong> O cuidador só poderá bater ponto se estiver dentro de <strong>{radiusMeters} metros</strong> deste endereço.
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
              {isFamilyAdmin ? 'Cancelar' : 'Fechar'}
            </button>

            {isFamilyAdmin ? (
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSaving ? 'Salvando Residência...' : 'Salvar Residência e Ativar Ponto'}</span>
              </button>
            ) : (
              <span className="text-xs font-semibold text-slate-500 italic">
                Apenas o Administrador Familiar pode salvar alterações no endereço.
              </span>
            )}
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-1">
            desenvolvido por <strong className="text-slate-600 font-bold">SF TECNOLOGIA</strong>
          </div>
        </form>
      </div>
    </div>
  );
};
