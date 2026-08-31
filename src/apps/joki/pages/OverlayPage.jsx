import React, { useState, useEffect, useContext } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { JokiContext, JokiProvider, useJoki } from '../contexts/JokiContext';
import OverlayActiveSlots from '../components/overlay/OverlayActiveSlots';
import OverlayQueue from '../components/overlay/OverlayQueue';
import OverlayLeaderboard from '../components/overlay/OverlayLeaderboard';
import OverlayTicker from '../components/overlay/OverlayTicker';
import OverlaySplitSidebar from '../components/overlay/OverlaySplitSidebar';

const OverlayPageContent = () => {
  const { workspaceId: pathWsId } = useParams();
  const [searchParams] = useSearchParams();

  const { 
    customers, 
    queue, 
    activeWorkspace, 
    activeWorkspaceId, 
    changeWorkspace,
    configuredSlots 
  } = useJoki();

  const [now, setNow] = useState(Date.now());

  // Parse Query Parameters
  const paramWs = searchParams.get('ws') || searchParams.get('workspace') || pathWsId || activeWorkspaceId || 'mygameon';
  const mode = (searchParams.get('mode') || 'active').toLowerCase();
  const theme = (searchParams.get('theme') || 'gold').toLowerCase();
  const scale = (searchParams.get('scale') || 'xl').toLowerCase();
  const layout = (searchParams.get('layout') || (mode === 'split' ? 'list' : 'grid')).toLowerCase();
  const cols = parseInt(searchParams.get('cols') || '3', 10);
  const defaultTotal = (configuredSlots && configuredSlots.length > 0) ? configuredSlots.length : 6;
  const totalSlots = parseInt(searchParams.get('totalSlots') || defaultTotal.toString(), 10);
  const showEmpty = searchParams.get('showEmpty') !== 'false' && searchParams.get('empty') !== 'false';
  const rotateSec = Math.max(5, parseInt(searchParams.get('rotateSec') || '15', 10));

  // Auto-Rotating State for 'rotating' or 'all_in_one' mode
  // Steps: 0 = Active Slots, 1 = Queue, 2 = Leaderboard Sultan
  const [activeStep, setActiveStep] = useState(0);

  // Sync workspace if param differs from active workspace
  useEffect(() => {
    if (paramWs && paramWs !== activeWorkspaceId) {
      changeWorkspace(paramWs);
    }
  }, [paramWs, activeWorkspaceId, changeWorkspace]);

  // 1-second countdown interval
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotating timer
  useEffect(() => {
    if (mode !== 'rotating' && mode !== 'all_in_one') return;

    const rotTimer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 3);
    }, rotateSec * 1000);

    return () => clearInterval(rotTimer);
  }, [mode, rotateSec]);

  // Remove default body background & scrollbar when on overlay page + High-DPI text crispness
  useEffect(() => {
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
      document.body.style.overflow = '';
    };
  }, []);

  const wsName = activeWorkspace?.name || 'Live Joki Stream';
  const isFullWidthLayout = layout === 'grid' || mode === 'ticker';

  return (
    <div 
      className="w-full min-h-screen bg-transparent p-2.5 flex flex-col justify-start items-start select-none"
      style={{
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
      }}
    >
      {/* High-DPI Crisp Styles */}
      <style>{`
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
      `}</style>

      {/* 1. RUNNING TICKER MODE */}
      {mode === 'ticker' && (
        <OverlayTicker 
          customers={customers} 
          queue={queue} 
          now={now} 
          theme={theme} 
          workspaceName={wsName} 
        />
      )}

      {/* 2. SPLIT 3-IN-1 SIDEBAR MODE */}
      {mode === 'split' && (
        <OverlaySplitSidebar 
          customers={customers} 
          queue={queue} 
          now={now} 
          theme={theme} 
          scale={scale} 
          workspaceName={wsName} 
        />
      )}

      {/* 3. ACTIVE SLOTS ONLY MODE */}
      {mode === 'active' && (
        <div className={`w-full ${isFullWidthLayout ? '' : 'max-w-[440px]'}`}>
          <OverlayActiveSlots 
            customers={customers} 
            now={now} 
            theme={theme} 
            scale={scale} 
            layout={layout}
            cols={cols}
            totalSlots={totalSlots}
            showEmpty={showEmpty}
            title={`${wsName} • SLOTS`} 
          />
        </div>
      )}

      {/* 4. QUEUE ONLY MODE */}
      {mode === 'queue' && (
        <div className={`w-full ${isFullWidthLayout ? '' : 'max-w-[440px]'}`}>
          <OverlayQueue 
            queue={queue} 
            theme={theme} 
            scale={scale} 
            maxItems={8} 
            title={`${wsName} • ANTRIAN`} 
          />
        </div>
      )}

      {/* 5. LEADERBOARD SULTAN ONLY MODE */}
      {mode === 'leaderboard' && (
        <div className={`w-full ${isFullWidthLayout ? '' : 'max-w-[440px]'}`}>
          <OverlayLeaderboard 
            customers={customers} 
            theme={theme} 
            scale={scale} 
            maxItems={7} 
            showPodium={true} 
            title={`${wsName} • SULTAN`} 
          />
        </div>
      )}

      {/* 6. ALL-IN-ONE ROTATING MODE */}
      {(mode === 'rotating' || mode === 'all_in_one') && (
        <div className={`w-full ${isFullWidthLayout ? '' : 'max-w-[440px]'} transition-all duration-500 ease-in-out`}>
          {activeStep === 0 && (
            <div className="animate-[fadeIn_0.4s_ease]">
              <OverlayActiveSlots 
                customers={customers} 
                now={now} 
                theme={theme} 
                scale={scale} 
                layout={layout}
                cols={cols}
                totalSlots={totalSlots}
                showEmpty={showEmpty}
                title={`${wsName} • SLOTS`} 
              />
            </div>
          )}

          {activeStep === 1 && (
            <div className="animate-[fadeIn_0.4s_ease]">
              <OverlayQueue 
                queue={queue} 
                theme={theme} 
                scale={scale} 
                maxItems={6} 
                title={`${wsName} • ANTRIAN`} 
              />
            </div>
          )}

          {activeStep === 2 && (
            <div className="animate-[fadeIn_0.4s_ease]">
              <OverlayLeaderboard 
                customers={customers} 
                theme={theme} 
                scale={scale} 
                maxItems={5} 
                showPodium={true} 
                title={`${wsName} • TOP SULTAN`} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OverlayPage = () => {
  const existingContext = useContext(JokiContext);
  if (existingContext) {
    return <OverlayPageContent />;
  }
  return (
    <JokiProvider>
      <OverlayPageContent />
    </JokiProvider>
  );
};

export default OverlayPage;
