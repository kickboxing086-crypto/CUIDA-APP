import React, { useState, useEffect } from 'react';
import { HeaderNav, AppTabType } from './components/HeaderNav';
import { OfficialClockBadge } from './components/OfficialClockBadge';
import { CaregiverDashboardView } from './components/CaregiverDashboardView';
import { DailyMissionsAdminView } from './components/DailyMissionsAdminView';
import { DailyIncidentReportView } from './components/DailyIncidentReportView';
import { FamilyActivityHistoryView } from './components/FamilyActivityHistoryView';
import { TimeClockView } from './components/TimeClockView';
import { HealthLogsView } from './components/HealthLogsView';
import { MedicationTrackerView } from './components/MedicationTrackerView';
import { FamilyBoardView } from './components/FamilyBoardView';
import { TimesheetReportView } from './components/TimesheetReportView';
import { TechSpecView } from './components/TechSpecView';
import { FamilyLoginsAdminView } from './components/FamilyLoginsAdminView';
import { OnboardingWelcomeModal } from './components/OnboardingWelcomeModal';
import { LoginPanel } from './components/LoginPanel';
import { AddPresenceModal } from './components/AddPresenceModal';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { ElderlyResidenceConfigModal } from './components/ElderlyResidenceConfigModal';
import { FamilyAdminInvitesModal } from './components/FamilyAdminInvitesModal';
import { NotificationsDropdown } from './components/NotificationsDropdown';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useNotifications } from './hooks/useNotifications';
import { api } from './services/api';
import { ElderlyProfile, User } from './types';
import { ElderCaneLogo } from './components/ElderCaneLogo';
import { ShieldCheck } from 'lucide-react';
import { ResidenceAddressNotice } from './components/ResidenceAddressNotice';
import { FacialBiometricAlert } from './components/FacialBiometricAlert';
import { FacialRegistrationModal } from './components/FacialRegistrationModal';
import { FooterBranding } from './components/FooterBranding';

export default function App() {
  // Session User (Null indicates login screen)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cuida_session_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null; // Start on login panel so user authenticates with username and password
  });

  const [usersList, setUsersList] = useState<User[]>(api.getUsers());
  const [elderly, setElderly] = useState<ElderlyProfile>({
    id: 'eld-01',
    full_name: 'Dona Maria Silveira',
    birth_date: '1945-05-12',
    blood_type: 'O+',
    allergies: ['Dipirona'],
    residence_address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    residence_lat: -23.5505,
    residence_long: -46.6333,
    allowed_radius_meters: 300,
    emergency_contacts: [],
    created_at: new Date().toISOString(),
  });
  const [activeTab, setActiveTab] = useState<AppTabType>('caregiver_dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Notifications State & Real-time Hook
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const {
    logs: activityLogs,
    unreadLogs,
    unreadIds,
    unreadCount,
    categoryUnreadCounts,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications(currentUser?.id, currentUser?.family_id || 'fam-01');

  // Presence Modals
  const [isAddPresenceModalOpen, setIsAddPresenceModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isResidenceModalOpen, setIsResidenceModalOpen] = useState(false);
  const [isFamilyInvitesOpen, setIsFamilyInvitesOpen] = useState(false);
  const [isFacialRegistrationOpen, setIsFacialRegistrationOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'check_in' | 'check_out'>('check_in');

  // Load Elderly Profile and Users on refresh
  useEffect(() => {
    async function loadData() {
      try {
        const [eldData, usersData] = await Promise.all([
          api.getElderlyProfile(),
          api.fetchUsers(),
        ]);
        if (eldData && eldData.full_name) {
          setElderly(eldData);
        }
        if (usersData && usersData.length > 0) {
          setUsersList(usersData);
        }
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      }
    }
    loadData();
  }, [refreshTrigger]);

  const handleRefreshHistory = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('cuida_session_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    // If user is client, default to caregiver dashboard or their designated tab
    if (user.role !== 'admin_geral') {
      setActiveTab('caregiver_dashboard');
    }
    handleRefreshHistory();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('cuida_session_user');
    } catch {
      // ignore
    }
  };

  const handleOnboardingComplete = async (
    updatedData: Partial<User>,
    residenceData?: {
      address: string;
      lat?: number;
      long?: number;
      radius?: number;
    }
  ) => {
    if (!currentUser) return;
    try {
      const updatedUser = await api.completeOnboarding(currentUser.id, updatedData);
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('cuida_session_user', JSON.stringify(updatedUser));
      } catch {
        // ignore
      }

      if (residenceData && residenceData.address) {
        try {
          await api.updateElderlyResidence({
            residence_address: residenceData.address,
            residence_lat: residenceData.lat || -23.5505,
            residence_long: residenceData.long || -46.6333,
            allowed_radius_meters: residenceData.radius || 150,
            family_id: updatedUser.family_id || null,
            requesting_user_id: updatedUser.id,
          });
        } catch (resErr) {
          console.warn('Erro ao atualizar residência no onboarding:', resErr);
        }
      }

      handleRefreshHistory();
    } catch (err) {
      console.error('Erro no onboarding:', err);
      throw err;
    }
  };

  const handleOpenLiveCamera = (mode: 'check_in' | 'check_out' = 'check_in') => {
    setCameraMode(mode);
    setIsCameraModalOpen(true);
  };

  const handleFacialRegistrationSuccess = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('cuida_session_user', JSON.stringify(updatedUser));
    } catch {
      // ignore
    }
    handleRefreshHistory();
  };

  const handleCameraPhotoCaptured = async (params: {
    photoBase64: string;
    locationLat?: number;
    locationLong?: number;
  }) => {
    if (!elderly || !currentUser) return;
    try {
      if (cameraMode === 'check_in') {
        await api.checkIn({
          userId: currentUser.id,
          elderlyId: elderly.id,
          photoBase64: params.photoBase64,
          locationLat: params.locationLat,
          locationLong: params.locationLong,
          notes: 'Registro biométrico facial confirmado via câmera frontal com geolocalização.',
        });
      } else {
        const active = await api.getActiveEntry(currentUser.id);
        if (active) {
          await api.checkOut({
            entryId: active.id,
            photoBase64: params.photoBase64,
            locationLat: params.locationLat,
            locationLong: params.locationLong,
            notes: 'Encerramento de plantão validado com selfie facial e geolocalização.',
          });
        }
      }
      handleRefreshHistory();
    } catch (err: any) {
      console.error('Erro ao validar ponto:', err);
      alert(`⚠️ Erro na validação de ponto:\n\n${err.message || 'Falha ao registrar ponto.'}`);
    }
  };

  // 1. Se não estiver autenticado, exibe o Painel de Login
  if (!currentUser) {
    return <LoginPanel onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Se for a Conta de Administrador Geral (Samuel_02), exibe APENAS o painel de logins e gestão master (sem o painel do usuário)
  // Atende: "Eu quero que nessa minha conta de administrador geral, tenha somente o painel de login, sem aparecer o painel do usuário."
  if (currentUser.role === 'admin_geral') {
    return (
      <FamilyLoginsAdminView
        currentUser={currentUser}
        onRefreshDirectory={handleRefreshHistory}
        onLogout={handleLogout}
      />
    );
  }

  // 3. Se for um usuário cliente que ainda não completou o cadastro obrigatório, exibe o Onboarding com Boas-Vindas
  // Atende: "Quero que assim que o usuário entre na sua conta e ainda não tenha entrado, apareça uma situações obrigatórias, como: nome, sobrenome, foto do perfil, etc... Quero que adicione uma animação de boas vindas, etc..."
  if (!currentUser.first_login_completed) {
    return (
      <OnboardingWelcomeModal
        user={currentUser}
        elderly={elderly}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Loading state when elderly profile is not yet ready
  if (!elderly) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <ElderCaneLogo size="lg" />
          <p className="text-sm font-semibold text-slate-600 animate-pulse">
            Carregando sistema seguro CUIDA...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900 font-sans">
      <OfflineIndicator />
      {/* Navigation Header with '+ Adicionar Presença', User Tag, Logout & Notifications */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        users={usersList}
        onSelectUser={setCurrentUser}
        onOpenAddPresence={() => setIsAddPresenceModalOpen(true)}
        onOpenResidenceConfig={() => setIsResidenceModalOpen(true)}
        onOpenFamilyInvites={() => setIsFamilyInvitesOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenFacialModal={() => setIsFacialRegistrationOpen(true)}
        unreadCount={unreadCount}
        categoryUnreadCounts={categoryUnreadCounts}
        onLogout={handleLogout}
      />

      {/* Notifications Dropdown / Central de Notificações */}
      <NotificationsDropdown
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        logs={activityLogs}
        unreadIds={unreadIds}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsNotificationsOpen(false);
        }}
        currentUserName={currentUser.name}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-3.5 sm:space-y-6">
        {/* Real-time Official Server Clock Banner (Always visible in all operations) */}
        <div className="print:hidden">
          <OfficialClockBadge />
        </div>

        {/* Aviso Obrigatório de Endereço da Residência Pendente */}
        <ResidenceAddressNotice
          currentUser={currentUser}
          elderly={elderly}
          onOpenResidenceModal={() => setIsResidenceModalOpen(true)}
        />

        {/* Alerta de Biometria Facial Pendente (Pode ser feito depois) */}
        <FacialBiometricAlert
          currentUser={currentUser}
          onOpenFacialModal={() => setIsFacialRegistrationOpen(true)}
        />

        {/* Tab View Routing */}
        {activeTab === 'caregiver_dashboard' && (
          <CaregiverDashboardView
            currentUser={currentUser}
            elderly={elderly}
            onNavigateTab={setActiveTab}
            onOpenAddPresence={() => setIsAddPresenceModalOpen(true)}
            onOpenLiveCamera={handleOpenLiveCamera}
            onOpenResidenceConfig={() => setIsResidenceModalOpen(true)}
            onOpenInvites={() => setIsFamilyInvitesOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            unreadCount={unreadCount}
            unreadLogs={unreadLogs}
          />
        )}

        {/* Histórico Compartilhado de Alterações da Família */}
        {activeTab === 'family_history' && (
          <FamilyActivityHistoryView
            currentUser={currentUser}
            familyId={currentUser.family_id || undefined}
            familyName={currentUser.family_name || undefined}
          />
        )}

        {activeTab === 'missions' && (
          <DailyMissionsAdminView
            currentUser={currentUser}
            elderly={elderly}
          />
        )}

        {activeTab === 'incidents' && (
          <DailyIncidentReportView
            currentUser={currentUser}
            elderly={elderly}
          />
        )}

        {activeTab === 'clock' && (
          <TimeClockView
            currentUser={currentUser}
            elderly={elderly}
            onRefreshHistory={handleRefreshHistory}
            onOpenAddPresence={() => setIsAddPresenceModalOpen(true)}
            onOpenResidenceConfig={() => setIsResidenceModalOpen(true)}
          />
        )}

        {activeTab === 'health' && (
          <HealthLogsView currentUser={currentUser} />
        )}

        {activeTab === 'meds' && (
          <MedicationTrackerView currentUser={currentUser} />
        )}

        {activeTab === 'family' && (
          <FamilyBoardView currentUser={currentUser} />
        )}

        {activeTab === 'timesheet' && (
          <TimesheetReportView
            elderly={elderly}
            onOpenAddPresence={() => setIsAddPresenceModalOpen(true)}
          />
        )}

        {activeTab === 'tech' && (
          <TechSpecView />
        )}
      </main>

      {/* Rodapé com Assinatura */}
      <FooterBranding className="mt-auto" />

      {/* Modal: Adicionar Presença / Lançar Plantão */}
      <AddPresenceModal
        isOpen={isAddPresenceModalOpen}
        onClose={() => setIsAddPresenceModalOpen(false)}
        onSuccess={handleRefreshHistory}
        onOpenLiveCamera={() => handleOpenLiveCamera('check_in')}
        elderly={elderly}
        users={usersList}
        currentUserId={currentUser.id}
      />

      {/* Modal: Configurar Residência do Idoso & Perímetro de Segurança */}
      <ElderlyResidenceConfigModal
        isOpen={isResidenceModalOpen}
        onClose={() => setIsResidenceModalOpen(false)}
        currentUser={currentUser}
        familyId={currentUser.family_id}
        familyName={currentUser.family_name}
        currentElderly={elderly}
        onSaved={(updatedElderly) => {
          setElderly(updatedElderly);
          handleRefreshHistory();
        }}
      />

      {/* Modal: Convidar Membros da Família & Cuidadores (Administrador Familiar) */}
      <FamilyAdminInvitesModal
        isOpen={isFamilyInvitesOpen}
        onClose={() => setIsFamilyInvitesOpen(false)}
        currentUser={currentUser}
        elderlyName={elderly?.full_name}
      />

      {/* Modal: Live Camera Selfie Capture */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraPhotoCaptured}
        title={cameraMode === 'check_in' ? 'Check-in de Entrada' : 'Check-out de Saída'}
        subtitle={
          cameraMode === 'check_in'
            ? 'Tire uma selfie frontal nítida para comprovar presença no endereço cadastrado'
            : 'Tire uma selfie frontal para validar e encerrar seu turno'
        }
        officialTimeStr={new Date().toLocaleTimeString('pt-BR')}
        userName={currentUser.name}
        elderly={elderly}
      />

      {/* Modal: Cadastro Posterior de Biometria Facial */}
      <FacialRegistrationModal
        isOpen={isFacialRegistrationOpen}
        onClose={() => setIsFacialRegistrationOpen(false)}
        currentUser={currentUser}
        onSuccess={handleFacialRegistrationSuccess}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ElderCaneLogo size="sm" showText={false} />
            <span className="font-bold text-slate-800">CUIDA</span>
            <span>· Controle Unificado de Idosos e Diário de Assistência</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-blue-700 font-medium">
              <ShieldCheck className="w-4 h-4" /> Horário Oficial NTP Auditado
            </span>
            <span>·</span>
            <span>Segurança Portaria MTE 671</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
