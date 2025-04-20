import { useState, useEffect } from 'react';

export function useResponsiveModal() {
  const [modalSize, setModalSize] = useState({
    width: 'w-[95vw]',
    maxWidth: 'sm:max-w-lg',
    maxHeight: 'max-h-[85vh]',
  });

  useEffect(() => {
    const updateSize = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const isSmallScreen = window.innerWidth < 640;
      
      setModalSize({
        width: isSmallScreen ? 'w-[95vw]' : 'w-full',
        maxWidth: isSmallScreen ? 'max-w-[95vw]' : 'sm:max-w-lg',
        maxHeight: isLandscape ? 'max-h-[80vh]' : 'max-h-[85vh]',
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);
  
  return modalSize;
} 