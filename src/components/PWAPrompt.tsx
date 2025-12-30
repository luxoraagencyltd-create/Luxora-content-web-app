import React, { useState, useEffect } from 'react';

const PWAPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra nếu là iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIphone = /iphone|ipad|ipod/.test(userAgent);
    
    // Kiểm tra xem đã chạy ở chế độ standalone (đã cài) chưa
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if (isIphone && !isStandalone) {
      setIsIOS(true);
      // Với iOS, hiện popup sau 3 giây để khách không bị choáng
      setTimeout(() => setShowPrompt(true), 3000);
    }

    // 2. Kiểm tra sự kiện cài đặt trên Android/Desktop (Chrome/Edge)
    const handler = (e: any) => {
      e.preventDefault(); // Chặn thanh thông báo mặc định xấu xí của Chrome
      setDeferredPrompt(e);
      setShowPrompt(true); // Hiện popup đẹp của mình
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const closePrompt = () => setShowPrompt(false);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 right-6 z-[1000] w-80 animate-in slide-in-from-bottom-10 fade-in duration-500">
      {/* HUD Container */}
      <div className="bg-[#0f1115]/95 backdrop-blur-md border border-[#00f3ff] shadow-[0_0_20px_rgba(0,243,255,0.2)] p-1 rounded-sm relative overflow-hidden">
        
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00f3ff]"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00f3ff]"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00f3ff]"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00f3ff]"></div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-microchip text-[#00f3ff] animate-pulse"></i>
              <h3 className="headline-font text-white font-bold tracking-widest text-sm">SYSTEM UPGRADE</h3>
            </div>
            <button onClick={closePrompt} className="text-[#888] hover:text-[#c41e3a] transition-colors">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <p className="code-font text-[10px] text-[#e0e0e0] leading-relaxed">
            {isIOS 
              ? "Install Luxora Protocol Core to your device for instant access and offline capabilities."
              : "Install Luxora Protocol App for better performance and fullscreen experience."}
          </p>

          {isIOS ? (
            // Hướng dẫn cho iOS
            <div className="bg-[#00f3ff]/10 border border-[#00f3ff]/30 p-3 rounded text-[10px] code-font text-[#00f3ff]">
              <div className="flex items-center gap-2 mb-1">
                <span>1. Tap</span>
                <i className="fa-solid fa-share-from-square text-white"></i>
                <span>(Share) button</span>
              </div>
              <div className="flex items-center gap-2">
                <span>2. Select</span>
                <span className="font-bold text-white border border-white/20 px-1 rounded">Add to Home Screen</span>
              </div>
            </div>
          ) : (
            // Nút cài đặt cho Android/Desktop
            <button 
              onClick={handleInstallClick}
              className="w-full bg-[#00f3ff] hover:bg-white text-black headline-font font-bold text-xs py-3 uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(0,243,255,0.4)] hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] flex items-center justify-center gap-2 clip-path-slant"
            >
              <i className="fa-solid fa-download"></i>
              INITIALIZE INSTALL
            </button>
          )}
        </div>

        {/* Scanline Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00f3ff]/5 to-transparent h-1 w-full animate-[scanline_3s_linear_infinite] pointer-events-none"></div>
      </div>
    </div>
  );
};

export default PWAPrompt;