// Modern Design System Utilities
export const modernDesign = {
  // Color system
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },

  // Animation utilities
  animations: {
    // Easing functions
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
    
    // Duration scales
    duration: {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.6s',
      slower: '1s',
    },

    // Keyframes
    keyframes: `
      @keyframes modernFadeIn {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes modernSlideIn {
        0% { opacity: 0; transform: translateX(-20px); }
        100% { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes modernScale {
        0% { opacity: 0; transform: scale(0.95); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes modernPulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
      
      @keyframes modernFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }
      
      @keyframes modernShimmer {
        0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
        100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
      }
      
      @keyframes modernGlow {
        0% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
        100% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
      }
      
      @keyframes modernRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes modernGradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `
  },

  // Glass morphism styles
  glass: {
    card: {
      background: 'rgba(31, 41, 55, 0.6)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    },
    
    light: {
      background: 'rgba(55, 65, 81, 0.4)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(75, 85, 99, 0.2)',
      borderRadius: '12px',
    },
    
    dark: {
      background: 'rgba(17, 24, 39, 0.8)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(59, 130, 246, 0.1)',
      borderRadius: '20px',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
    }
  },

  // Button styles
  buttons: {
    primary: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '12px',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
    },
    
    secondary: {
      background: 'transparent',
      color: '#60a5fa',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      padding: '12px 24px',
      borderRadius: '12px',
      fontWeight: '500',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    ghost: {
      background: 'rgba(59, 130, 246, 0.1)',
      color: '#60a5fa',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      fontWeight: '500',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }
  },

  // Input styles
  inputs: {
    modern: {
      background: 'rgba(55, 65, 81, 0.5)',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      borderRadius: '12px',
      padding: '12px 16px',
      color: 'white',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(8px)',
    }
  },

  // Badge styles
  badges: {
    success: {
      background: 'rgba(34, 197, 94, 0.2)',
      color: '#22c55e',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
    },
    
    warning: {
      background: 'rgba(245, 158, 11, 0.2)',
      color: '#f59e0b',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
    },
    
    error: {
      background: 'rgba(239, 68, 68, 0.2)',
      color: '#ef4444',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
    },
    
    info: {
      background: 'rgba(59, 130, 246, 0.2)',
      color: '#60a5fa',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
    }
  },

  // Typography
  typography: {
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: 'white',
      margin: '0',
      background: 'linear-gradient(135deg, #ffffff 0%, #60a5fa 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    
    subtitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#d1d5db',
      margin: '0',
    },
    
    body: {
      fontSize: '14px',
      color: '#9ca3af',
      lineHeight: '1.5',
    }
  },

  // Background gradients
  backgrounds: {
    primary: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #1f1f1f 100%)',
    secondary: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)',
    card: 'linear-gradient(135deg, rgba(31, 41, 55, 0.6) 0%, rgba(55, 65, 81, 0.4) 100%)',
    button: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    accent: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
  }
}

// Helper functions for hover effects
export const createHoverEffect = (baseStyle: React.CSSProperties, hoverStyle: React.CSSProperties) => {
  // Performance optimized version - use CSS classes instead of inline event handlers
  return {
    ...baseStyle,
    className: 'hover-optimized',
    // Fallback for critical effects only
    onMouseEnter: undefined,
    onMouseLeave: undefined
  }
}

// Animation delay utility
export const getAnimationDelay = (index: number, baseDelay = 0.1) => {
  return `${baseDelay * index}s`
}

// Status color mapping
export const getStatusColor = (status: string) => {
  const statusColors: { [key: string]: string } = {
    'active': '#22c55e',
    'inactive': '#6b7280',
    'pending': '#f59e0b',
    'completed': '#22c55e',
    'failed': '#ef4444',
    'passed': '#22c55e',
    'registered': '#60a5fa',
    'validated': '#22c55e',
    'interviewed': '#8b5cf6',
    'quiz_completed': '#06b6d4',
  }
  return statusColors[status.toLowerCase()] || '#6b7280'
}

// Gradient text utility
export const gradientText = (text: string, gradient = 'linear-gradient(135deg, #ffffff 0%, #60a5fa 100%)') => ({
  background: gradient,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
})
