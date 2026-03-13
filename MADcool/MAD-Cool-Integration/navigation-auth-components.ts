// src/components/Navigation/NavigationSidebar.tsx
import React, { useState } from 'react';
import { 
  Home, 
  Calendar, 
  Bot, 
  BarChart3, 
  Settings, 
  Users, 
  Zap,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useMsal } from '@azure/msal-react';

import { useBookingStore, useAgents } from '../../store/useBookingStore';

/**
 * Navigation Sidebar Component
 * 
 * This creates a sophisticated navigation experience that adapts to the user's
 * current context and the status of our AI agent ecosystem. Think of it as
 * the "control panel" of our intelligent booking system - providing quick
 * access to all major features while showing real-time system status.
 */
const NavigationSidebar: React.FC = () => {
  const { instance } = useMsal();
  const { currentView, setCurrentView } = useBookingStore();
  const { agentStatus } = useAgents();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCopilotChat, setShowCopilotChat] = useState(false);

  /**
   * Navigation menu structure with intelligent status indicators
   * 
   * Each menu item can show different states based on agent activity,
   * data availability, and user permissions. This creates a dynamic
   * navigation experience that guides users to the most relevant features.
   */
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      badge: null,
      description: 'Overview and quick actions'
    },
    {
      id: 'booking',
      label: 'Intelligent Booking',
      icon: Zap,
      badge: agentStatus.activeTasks > 0 ? agentStatus.activeTasks.toString() : null,
      description: 'AI-powered scheduling'
    },
    {
      id: 'calendar',
      label: 'Calendar View',
      icon: Calendar,
      badge: null,
      description: 'Unified calendar management'
    },
    {
      id: 'analytics',
      label: 'Insights & Analytics',
      icon: BarChart3,
      badge: null,
      description: 'AI-generated insights'
    },
    {
      id: 'settings',
      label: 'Agent Settings',
      icon: Settings,
      badge: !agentStatus.isInitialized ? '!' : null,
      description: 'Configure AI behavior'
    }
  ];

  /**
   * Handle user logout with cleanup
   * 
   * When users sign out, we need to gracefully shut down all AI agents,
   * clear sensitive data, and reset the application state.
   */
  const handleLogout = async () => {
    try {
      // Clear application state
      useBookingStore.getState().reset();
      
      // Sign out from Microsoft
      await instance.logoutPopup();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Main Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } flex flex-col`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-gray-900">SmartBooking</h2>
                <p className="text-xs text-gray-600">AI-Powered Scheduling</p>
              </div>
            )}
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Agent Status Indicator */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bot className="w-6 h-6 text-blue-600" />
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                agentStatus.isInitialized ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
            </div>
            
            {!isCollapsed && (
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  AI Agents {agentStatus.isInitialized ? 'Active' : 'Starting'}
                </p>
                <p className="text-xs text-gray-600">
                  {agentStatus.activeAgents} agents • {agentStatus.activeTasks} tasks
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                
                {!isCollapsed && (
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Copilot Chat Toggle */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setShowCopilotChat(!showCopilotChat)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              showCopilotChat
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            {!isCollapsed && (
              <div className="flex-1 text-left">
                <p className="font-medium">MeetingAssist Chat</p>
                <p className="text-xs text-gray-500">Talk to your AI assistant</p>
              </div>
            )}
          </button>
        </div>

        {/* User Actions */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Copilot Chat Overlay */}
      {showCopilotChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 h-96 m-4">
            {/* Copilot Studio Integration would be rendered here */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">MeetingAssist</h3>
              <button
                onClick={() => setShowCopilotChat(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-4 text-center text-gray-500">
              <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Copilot Studio integration active</p>
              <p className="text-sm mt-1">Connected to your MeetingAssist agent</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ==================================================
// AUTHENTICATION FLOW COMPONENT
// ==================================================

/**
 * Authentication Flow Component
 * 
 * This creates a beautiful, welcoming experience for users who need to sign in.
 * The component explains the value proposition of our intelligent booking system
 * while guiding users through the authentication process.
 */
const AuthenticationFlow: React.FC = () => {
  const { instance } = useMsal();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  /**
   * Handle user sign-in with comprehensive error handling
   * 
   * This method initiates the OAuth flow with your specific Copilot Studio
   * environment, ensuring users get the right permissions for all features.
   */
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);

    try {
      // Use the updated login request with your environment configuration
      const loginRequest = {
        scopes: [
          'openid',
          'profile',
          'User.Read',
          'Calendars.ReadWrite',
          'Calendars.ReadWrite.Shared',
          'Bookings.ReadWrite.All',
          'https://service.powerapps.com/Copilot.Invoke'
        ],
        prompt: 'select_account' as const
      };

      await instance.loginPopup(loginRequest);
      
      // Success is handled by the main App component
      console.log('🎉 Successfully authenticated with Cypherdyne tenant');
      
    } catch (error: any) {
      console.error('Authentication failed:', error);
      
      // Provide user-friendly error messages
      if (error.errorCode === 'user_cancelled') {
        setAuthError('Sign-in was cancelled. Please try again to access your intelligent booking system.');
      } else if (error.errorCode === 'consent_required') {
        setAuthError('Additional permissions are required. Please contact your administrator.');
      } else {
        setAuthError('Authentication failed. Please check your network connection and try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
            <Bot className="w-8 h-8" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Intelligent Booking System
          </h1>
          
          <p className="text-gray-600">
            AI-powered scheduling across Microsoft, Google, and Zoom platforms
          </p>
        </div>

        {/* Features Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">What you'll get access to:</h2>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">AI-Powered Scheduling</p>
                <p className="text-sm text-gray-600">Intelligent time optimization and conflict resolution</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Multi-Agent Coordination</p>
                <p className="text-sm text-gray-600">Specialized AI agents working together seamlessly</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">MeetingAssist Integration</p>
                <p className="text-sm text-gray-600">Direct access to your Copilot Studio agent</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Advanced Analytics</p>
                <p className="text-sm text-gray-600">AI-generated insights and recommendations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Sign in to continue</h3>
            <p className="text-sm text-gray-600 mb-6">
              Connect to your Cypherdyne environment to access your MeetingAssist agent and intelligent scheduling features.
            </p>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{authError}</p>
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isSigningIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting to Copilot Studio...</span>
                </>
              ) : (
                <>
                  <span>Sign in with Microsoft</span>
                  <span className="text-blue-200">→</span>
                </>
              )}
            </button>

            <div className="mt-4 text-xs text-gray-500">
              <p>Connecting to environment: <strong>darbotlabs</strong></p>
              <p>Agent: <strong>MeetingAssist (dystudio_meetMaster)</strong></p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Secure authentication powered by Microsoft Entra ID
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Your data is protected with enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
};

// ==================================================
// LOADING OVERLAY COMPONENT
// ==================================================

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

/**
 * Loading Overlay Component
 * 
 * This provides visual feedback during system initialization and heavy operations.
 * The component shows the sophisticated process of connecting to your Copilot Studio
 * environment and initializing all AI agents.
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const initializationSteps = [
    'Connecting to Cypherdyne environment...',
    'Authenticating with Copilot Studio...',
    'Initializing AI agent orchestrator...',
    'Loading MeetingAssist agent...',
    'Synchronizing calendar integrations...',
    'Preparing intelligent booking interface...'
  ];

  React.useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % initializationSteps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center max-w-md mx-auto px-4">
        
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Bot className="w-10 h-10 text-white" />
          </div>
          
          {/* Pulsing Rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-pulse"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-blue-100 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>

        {/* Loading Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Initializing Intelligent Booking System
        </h2>
        
        <p className="text-gray-600 mb-6">
          {message || initializationSteps[currentStep]}
        </p>

        {/* Progress Steps */}
        <div className="space-y-2 mb-6">
          {initializationSteps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 text-sm ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              <span>{step}</span>
            </div>
          ))}
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Connecting to your MeetingAssist agent...
        </p>
      </div>
    </div>
  );
};

export default NavigationSidebar;
export { AuthenticationFlow, LoadingOverlay };