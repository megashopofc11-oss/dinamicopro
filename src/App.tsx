import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigation, ActivePage } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { GenerateBatch } from './pages/GenerateBatch';
import { MyBatches } from './pages/MyBatches';
import { ManageQRCodes } from './pages/ManageQRCodes';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { RedirectHandler } from './pages/RedirectHandler';

function MainApp() {
  const { currentUser, loading } = useAuth();
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [navigationData, setNavigationData] = useState<any>(null);

  // Check URL pathname for direct public redirection /q/:code
  const pathname = window.location.pathname;
  const matchRedirect = pathname.match(/^\/q\/([^/?#]+)/i);

  if (matchRedirect) {
    const code = matchRedirect[1];
    return <RedirectHandler code={code} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl border-2 border-red-500 border-t-transparent animate-spin mb-4" />
        <p className="text-red-400 font-mono text-sm">Iniciando sistema...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  const handleNavigate = (page: ActivePage, data?: any) => {
    setActivePage(page);
    setNavigationData(data);
  };

  return (
    <div className="min-h-screen bg-[#050507] text-gray-100 flex flex-col selection:bg-red-600 selection:text-white">
      {/* Navigation Topbar */}
      <Navigation
        activePage={activePage}
        setActivePage={(page) => handleNavigate(page, null)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activePage === 'dashboard' && (
          <Dashboard onNavigate={handleNavigate} />
        )}

        {activePage === 'generate' && (
          <GenerateBatch onNavigate={handleNavigate} />
        )}

        {activePage === 'batches' && (
          <MyBatches
            onNavigate={handleNavigate}
            initialBatchId={navigationData?.selectedBatchId}
          />
        )}

        {activePage === 'qrcodes' && (
          <ManageQRCodes
            initialBatchFilter={navigationData?.filterBatch}
          />
        )}

        {activePage === 'settings' && (
          <Settings />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-[#070709] py-6 text-center text-xs text-gray-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DINÂMICO PRO • Plaquinhas 10 × 10 cm</span>
          <span className="text-red-500/80">Cloud Firestore &amp; Firebase Auth</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
