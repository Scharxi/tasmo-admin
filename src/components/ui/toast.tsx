'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, X, Zap } from 'lucide-react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message: string
  duration?: number
  onClose?: (id: string) => void
}

export function Toast({ id, type, title, message, duration = 7000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.(id)
    }, 300)
  }

  if (!isVisible) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        }
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        }
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: <Zap className="w-6 h-6 text-blue-600" />,
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md w-full transform transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div className={`rounded-lg border shadow-lg backdrop-blur-sm p-4 ${styles.bg}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {styles.icon}
          </div>
          <div className="ml-3 w-full">
            <h3 className={`text-sm font-semibold ${styles.titleColor}`}>
              {title}
            </h3>
            <p className={`mt-1 text-sm ${styles.messageColor}`}>
              {message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="ml-4 inline-flex text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void
  showWorkflowSuccess: (workflowName: string, message?: string) => void
  showWorkflowError: (workflowName: string, error: string) => void
  showWorkflowExecuting: (workflowName: string) => void
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast
    }
    setToasts(prev => [...prev, newToast])
  }

  const showWorkflowSuccess = (workflowName: string, message?: string) => {
    showToast({
      type: 'success',
      title: 'Workflow erfolgreich ausgeführt!',
      message: message || `Workflow "${workflowName}" wurde erfolgreich abgeschlossen.`,
      duration: 5000
    })
  }

  const showWorkflowError = (workflowName: string, error: string) => {
    showToast({
      type: 'error',
      title: 'Workflow fehlgeschlagen',
      message: `Workflow "${workflowName}" konnte nicht ausgeführt werden: ${error}`,
      duration: 8000
    })
  }

  const showWorkflowExecuting = (workflowName: string) => {
    showToast({
      type: 'info',
      title: 'Workflow wird ausgeführt...',
      message: `Workflow "${workflowName}" wird gestartet.`,
      duration: 3000
    })
  }

  // Expose functions globally for easy access
  useEffect(() => {
    ;(window as any).workflowToast = {
      showToast,
      showWorkflowSuccess,
      showWorkflowError,
      showWorkflowExecuting
    }

    // Listen for custom toast events
    const handleToastEvent = (event: CustomEvent) => {
      showToast(event.detail);
    };

    window.addEventListener('show-toast', handleToastEvent as EventListener);
    
    return () => {
      window.removeEventListener('show-toast', handleToastEvent as EventListener);
    };
  }, [showToast])

  return (
    <>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </>
  )
} 