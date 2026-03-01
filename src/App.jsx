import { useState, useEffect, useCallback } from "react";

import ErrorBoundary from "./components/common/ErrorBoundary";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";
import { ToastProvider } from "./components/shared/Toast";

import LoginScreen from "./components/auth/LoginScreen";
import ChangePasswordScreen from "./components/auth/ChangePasswordScreen";
import Header from "./components/layout/Header";
import BottomNav from "./components/layout/BottomNav";
import DesktopSidebar from "./components/layout/DesktopSidebar";
import Notification from "./components/common/Notification";
import Dashboard from "./components/requests/Dashboard";
import RequestDetail from "./components/requests/RequestDetail";
import NewRequestForm from "./components/requests/NewRequestForm";
import InventoryScreen from "./components/inventory/InventoryScreen";
import AnalyticsScreen from "./components/analytics/AnalyticsScreen";
import SettingsScreen from "./components/settings/SettingsScreen";
import UserManagementScreen from "./components/admin/UserManagementScreen";
import BudgetManagementScreen from "./components/admin/BudgetManagementScreen";
import ParametersScreen from "./components/admin/ParametersScreen";
import ApprovalConfigScreen from "./components/admin/ApprovalConfigScreen";
import GlobalSearch from "./components/shared/GlobalSearch";

// Lazy-loaded screens
let AnalysisScreen = null;
let SecurityDashboard = null;

// ============================================================
// YPOTI AGROPECUARIA — SISTEMA DE GESTION DE COMPRAS
// ============================================================

function AppContent() {
  const { currentUser, isAuthenticated, loading, can, forcePasswordChange } = useAuth();
  const {
    requests, notification, statusCounts, pendingApprovals, showNotif,
    addRequest, confirmRequest, approveStep, rejectRequest, sendForRevision,
    advanceStatus, updateRequest, dataLoading,
  } = useApp();

  const [screen, setScreen] = useState("dashboard");
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const selectedRequest = selectedRequestId ? requests.find(r => r.id === selectedRequestId) : null;
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEstablishment, setFilterEstablishment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Cmd+K global search shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Lazy load analysis/security screens
  useEffect(() => {
    if (screen === 'analysis' && !AnalysisScreen) {
      import('./components/analysis/AnalysisScreen.jsx').then(m => {
        AnalysisScreen = m.default;
        setScreen('analysis');
      }).catch(() => {});
    }
    if (screen === 'security' && !SecurityDashboard) {
      import('./components/admin/SecurityDashboard.jsx').then(m => {
        SecurityDashboard = m.default;
        setScreen('security');
      }).catch(() => {});
    }
  }, [screen]);

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 inline-flex items-center justify-center mb-4 shadow-lg shadow-emerald-600/20">
            <span className="text-white text-xl font-bold">Y</span>
          </div>
          <p className="text-slate-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;
  if (forcePasswordChange) return <ChangePasswordScreen />;

  // Data loading
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 inline-flex items-center justify-center mb-4 shadow-lg shadow-emerald-600/20">
            <span className="text-white text-xl font-bold">Y</span>
          </div>
          <p className="text-slate-400 text-sm mb-1">Cargando datos...</p>
          <p className="text-slate-600 text-xs">Conectando con el servidor</p>
        </div>
      </div>
    );
  }

  // Filter requests based on role
  const visibleRequests = can("view_all_requests")
    ? requests
    : requests.filter(r => r.requester === currentUser.name || r.assignee === currentUser.name);

  const filtered = visibleRequests.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterEstablishment !== "all" && r.establishment !== filterEstablishment) return false;
    if (searchQuery && !r.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !r.id?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleNavigate = (target, requestId) => {
    if (target === 'request' && requestId) {
      setSelectedRequestId(requestId);
      setScreen('dashboard');
    } else {
      setScreen(target);
      setSelectedRequestId(null);
      setShowNewForm(false);
    }
  };

  const handleNewRequest = () => {
    setScreen("dashboard");
    setShowNewForm(true);
  };

  const handleAddRequest = (form) => {
    addRequest(form);
    setShowNewForm(false);
  };

  const renderContent = () => {
    if (showNewForm && can("create_request")) {
      return (
        <NewRequestForm
          onSubmit={handleAddRequest}
          onCancel={() => setShowNewForm(false)}
        />
      );
    }

    if (selectedRequest) {
      const currentIdx = filtered.findIndex(r => r.id === selectedRequestId);
      const hasPrev = currentIdx > 0;
      const hasNext = currentIdx >= 0 && currentIdx < filtered.length - 1;
      return (
        <RequestDetail
          request={selectedRequest}
          onBack={() => setSelectedRequestId(null)}
          onAdvance={can("advance_status") ? advanceStatus : null}
          onUpdateRequest={updateRequest}
          canManageQuotations={can("manage_quotations")}
          onConfirm={can("create_request") ? confirmRequest : null}
          onApprove={approveStep}
          onReject={rejectRequest}
          onRevision={sendForRevision}
          onPrev={hasPrev ? () => setSelectedRequestId(filtered[currentIdx - 1].id) : null}
          onNext={hasNext ? () => setSelectedRequestId(filtered[currentIdx + 1].id) : null}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      );
    }

    if (screen === "inventory" && can("view_inventory")) {
      return <InventoryScreen onBack={() => setScreen("dashboard")} />;
    }

    if (screen === "analytics" && can("view_analytics")) {
      return (
        <AnalyticsScreen
          requests={visibleRequests}
          statusCounts={statusCounts}
          onBack={() => setScreen("dashboard")}
        />
      );
    }

    if (screen === "analysis" && can("view_analytics") && AnalysisScreen) {
      return <AnalysisScreen onBack={() => setScreen("dashboard")} />;
    }

    if (screen === "security" && can("manage_users") && SecurityDashboard) {
      return <SecurityDashboard onBack={() => setScreen("dashboard")} />;
    }

    if (screen === "users" && can("manage_users")) {
      return <UserManagementScreen onBack={() => setScreen("settings")} />;
    }

    if (screen === "budgets" && can("view_analytics")) {
      return <BudgetManagementScreen onBack={() => setScreen("settings")} />;
    }

    if (screen === "parameters" && can("manage_settings")) {
      return <ParametersScreen onBack={() => setScreen("settings")} />;
    }

    if (screen === "approvalConfig" && can("manage_settings")) {
      return <ApprovalConfigScreen onBack={() => setScreen("settings")} />;
    }

    if (screen === "settings") {
      return (
        <SettingsScreen
          onBack={() => setScreen("dashboard")}
          onNavigate={handleNavigate}
        />
      );
    }

    return (
      <Dashboard
        requests={visibleRequests}
        filtered={filtered}
        statusCounts={statusCounts}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterEstablishment={filterEstablishment}
        setFilterEstablishment={setFilterEstablishment}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectRequest={(r) => setSelectedRequestId(r.id)}
      />
    );
  };

  const newRequestHandler = can("create_request") ? handleNewRequest : () => showNotif("Sin permiso", "error");

  return (
    <div className="min-h-screen bg-[#0a0b0f]">
      <DesktopSidebar
        screen={screen}
        onNavigate={handleNavigate}
        onNewRequest={newRequestHandler}
        currentUser={currentUser.name}
        canViewAnalytics={can("view_analytics")}
        canManageUsers={can("manage_users")}
      />

      <div className="app-main-content max-w-[480px] mx-auto relative min-h-screen">
        <Notification notification={notification} />

        <div className="mobile-header">
          <Header currentUser={currentUser.name} />
        </div>

        {renderContent()}

        {!showNewForm && !selectedRequest && (
          <div className="mobile-bottom-nav">
            <BottomNav
              screen={screen}
              onNavigate={handleNavigate}
              onNewRequest={newRequestHandler}
              onNotify={showNotif}
              canViewAnalytics={can("view_analytics")}
            />
          </div>
        )}
      </div>

      {/* Global search modal */}
      {showSearch && (
        <GlobalSearch
          onNavigate={handleNavigate}
          requests={visibleRequests}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
