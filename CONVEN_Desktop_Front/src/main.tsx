import React, { Component, ErrorInfo, ReactNode } from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CONVEN Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#080C17',
          color: '#F8FAFC',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#38BDF8' }}>
            CONVEN - Sistema de Gestión de Condominios
          </h2>
          <p style={{ maxWidth: '500px', color: '#94A3B8', marginBottom: '1.5rem' }}>
            Se detectó una versión previa en la memoria del navegador. Presione el botón a continuación para actualizar los datos automáticamente.
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563EB',
              color: '#FFF',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
            }}
          >
            Actualizar y Cargar Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
  document.getElementById('root')
)
