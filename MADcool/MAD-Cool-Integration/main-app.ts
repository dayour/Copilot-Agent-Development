// src/App.tsx
import React, { useEffect, useState } from 'react';
import { MsalProvider, useIsAuthenticated, useMsal, useAccount } from '@azure/msal-react';
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from '@azure/msal-browser';
import { QueryClient, QueryClientProvider } from 'react-query';

import { msalConfig, loginRequest } from './config/auth';
import { GraphService, MSALAuthenticationProvider } from './services/GraphService';
import AgentOrchestrator from './services/AgentOrchestrator';
import { useBookingStore, setupStateSubscriptions } from './store/useBookingStore';

// UI Components
import Dashboard from './components/Dashboard/Dashboard';
import BookingInterface from './components/Booking/BookingInterface';
import CalendarView from './components/Calendar/CalendarView';
import AnalyticsView from './components/Analytics/AnalyticsView';
import SettingsView from './components/Settings/SettingsView';
import AuthenticationFlow from './components/Auth/AuthenticationFlow';
import NavigationSidebar from './components/Navigation/NavigationSidebar';
import NotificationCenter from './components/Notifications/NotificationCenter';
import AgentStatusPanel from './components/Agents/AgentStatusPanel';
import LoadingOverlay from './components/UI/LoadingOverlay';

import './App.css';

/**
 * Initialize MSAL Instance
 * 
 * This creates our authentication provider that handles all the complex
 * OAuth flows with Microsoft's identity platform. Think of this as our
 * "digital passport office" that manages secure access to Microsoft services.
 */
const msalInstance = new PublicClientApplication(msalConfig);

// Set up MSAL event handling for better user experience
msalInstance.addEventCallback((event: EventMessage) => {
  if (event.eventType === EventType.LOGIN_SUCCESS) {
    console.log('Login successful:', event);
  } else if (event.eventType === EventType.LOGIN_FAILURE) {
    console.error('Login failed:', event);
  } else if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
    console.log('Token acquired successfully');
  }
});

/**
 * React Query Client
 * 
 * This provides intelligent caching and synchronization for our API calls.
 * Think of it as a "smart memory system" that remembers previous requests
 * and keeps our data fresh without unnecessary network calls.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Main App Component
 * 
 * This is the entry point of our entire application. It orchestrates
 * authentication, service initialization, and the overall user experience.
 */
function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <AppContent />
        </div>
      </QueryClientProvider>
    </MsalProvider>
  );
}

/**
 * App Content Component
 * 
 * This handles the authenticated vs non-authenticated states and manages
 * the overall application layout and flow.
 */
function AppContent() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || null);
  
  // Global application state
  const { 
    user, 
    graphService, 
    orchestrator, 
    ui,
    setUser, 
    setAuthenticated, 
    initializeServices,
    setLoading 
  } = useBookingStore();

  const [servicesInitialized, setServicesInitialized] = useState(false);

  /**
   * Initialize application services when user authenticates
   * 
   * This is where our sophisticated backend springs to life - we initialize
   * the Graph service, start up our agent orchestrator, and connect all
   * the intelligent systems together.
   */
  useEffect(() => {
    const initializeAppServices = async () => {
      if (!isAuthenticated || !account || servicesInitialized) return;

      setLoading(true, 'Initializing intelligent booking system...');

      try {
        // Create authentication provider for Microsoft Graph
        const authProvider = new MSALAuthenticationProvider(async () => {
          const request = {
            ...loginRequest,
            account: account,
          };

          try {
            const response = await instance.acquireTokenSilent(request);
            return response.accessToken;
          } catch (error) {
            // If silent acquisition fails, try interactive
            const response = await instance.acquireTokenPopup(request);
            return response.accessToken;
          }
        });

        // Initialize Graph Service
        const graph = new GraphService(authProvider);
        await graph.initialize(account);

        // Initialize Agent Orchestrator
        const agents = new AgentOrchestrator(graph);
        
        // Initialize services in the store
        await initializeServices(graph, agents);

        // Update user information
        const userProfile = await graph.getCurrentUser();
        setUser(userProfile);
        setAuthenticated(true);

        setServicesInitialized(true);

        console.log(' Intelligent Booking System initialized successfully!');
        console.log(' Graph Service:', !!graph);
        console.log(' Agent Orchestrator:', !!agents);
        console.log(' User Profile:', userProfile.displayName);

      } catch (error) {
        console.error('Failed to initialize app services:', error);
        // Handle initialization failure gracefully
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAppServices();
  }, [isAuthenticated, account, servicesInitialized]);

  /**
   * Set up real-time state subscriptions
   * 
   * This activates our "nervous system" - all the automatic reactions
   * and coordination between different parts of our application.
   */
  useEffect(() => {
    if (servicesInitialized) {
      setupStateSubscriptions();
    }
  }, [servicesInitialized]);

  // Show authentication flow if not authenticated
  if (!isAuthenticated) {
    return <AuthenticationFlow />;
  }

  // Show loading overlay during service initialization
  if (!servicesInitialized || ui.isLoading) {
    return (
      <LoadingOverlay 
        isLoading={true} 
        message={ui.loadingMessage || 'Initializing intelligent booking system...'} 
      />
    );
  }

  // Main application interface
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <NavigationSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header with Agent Status */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Intelligent Booking System
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered scheduling across Microsoft, Google, and Zoom
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <AgentStatusPanel />
              <NotificationCenter />
              
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.displayName?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.displayName || 'User'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <AppRouter />
        </main>
      </div>
    </div>
  );
}

/**
 * Application Router Component
 * 
 * This renders the appropriate view based on the current navigation state.
 * Think of it as the "traffic controller" that shows users the right interface
 * for their current task.
 */
function AppRouter() {
  const { currentView } = useBookingStore(state => ({ currentView: state.ui.currentView }));

  switch (currentView) {
    case 'dashboard':
      return <Dashboard />;
    case 'booking':
      return <BookingInterface />;
    case 'calendar':
      return <CalendarView />;
    case 'analytics':
      return <AnalyticsView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <Dashboard />;
  }
}

export default App;