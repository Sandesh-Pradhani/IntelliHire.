import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import './index.css'

import AuthProvider from './context/AuthContext.jsx'
import { SidebarProvider } from './context/SidebarContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(

  <React.StrictMode>

    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>

          <App />

        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>

  </React.StrictMode>
)
