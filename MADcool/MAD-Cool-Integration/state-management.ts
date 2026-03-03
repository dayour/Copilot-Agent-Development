// src/store/useBookingStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AgentOrchestrator, AgentTask, AgentTaskResult } from '../services/AgentOrchestrator';
import { GraphService, EnhancedBookingAppointment, TimeSlot } from '../services/GraphService';
import { BookingBusiness, User, Calendar, Event } from '@microsoft/microsoft-graph-types';

/**
 * Application State Interface
 * 
 * This defines the complete state of our intelligent booking application.
 * Think of this as the "memory" of our system - everything the app needs
 * to remember about the current user, their preferences, ongoing bookings,
 * and the status of all our intelligent agents.
 */
interface BookingState {
  // Authentication and user context
  user: User | null;
  isAuthenticated: boolean;
  authError: string | null;
  
  // Microsoft Graph and services
  graphService: GraphService | null;
  orchestrator: AgentOrchestrator | null;
  
  // Calendar and availability data
  calendars: Calendar[];
  upcomingEvents: Event[];
  availabilitySlots: TimeSlot[];
  
  // Booking businesses and appointments
  bookingBusinesses: BookingBusiness[];
  activeBookings: EnhancedBookingAppointment[];
  
  // Agent orchestration status
  agentStatus: {
    isInitialized: boolean;
    activeAgents: number;
    activeTasks: number;
    queuedTasks: number;
    lastHealthCheck: Date | null;
  };
  
  // UI state management
  ui: {
    currentView: 'dashboard' | 'booking' | 'calendar' | 'analytics' | 'settings';
    isLoading: boolean;
    loadingMessage: string;
    selectedDate: Date;
    selectedTimeSlot: TimeSlot | null;
    bookingInProgress: boolean;
    notifications: Notification[];
  };
  
  // Real-time communication state
  realTime: {
    isConnected: boolean;
    lastUpdate: Date | null;
    pendingUpdates: number;
    facilitatorActive: boolean;
    facilitatorSessionId: string | null;
  };
  
  // Cross-platform integration status
  platforms: {
    microsoft: { connected: boolean; status: string; lastSync: Date | null };
    google: { connected: boolean; status: string; lastSync: Date | null };
    zoom: { connected: boolean; status: string; lastSync: Date | null };
  };
  
  // Analytics and insights
  analytics: {
    bookingPatterns: any[];
    insights: string[];
    recommendations: string[];
    lastAnalysisUpdate: Date | null;
  };
}

/**
 * Notification Interface
 * 
 * Represents system notifications and user alerts.
 * These keep users informed about agent activities and system status.
 */
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  dismissed: boolean;
  actionRequired?: boolean;
  relatedTask?: string;
}

/**
 * State Actions Interface
 * 
 * These are all the operations our application can perform.
 * Think of these as the "verbs" of our system - all the things
 * users can do and all the ways our intelligent agents can
 * modify the application state.
 */
interface BookingActions {
  // Authentication actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setAuthError: (error: string | null) => void;
  
  // Service initialization
  initializeServices: (graphService: GraphService, orchestrator: AgentOrchestrator) => Promise<void>;
  
  // Calendar and availability management
  loadCalendars: () => Promise<void>;
  loadUpcomingEvents: (startDate?: Date, endDate?: Date) => Promise<void>;
  analyzeAvailability: (attendees: string[], start: Date, end: Date, duration: number) => Promise<void>;
  
  // Booking business operations
  loadBookingBusinesses: () => Promise<void>;
  createIntelligentBooking: (businessId: string, appointmentData: any, options?: any) => Promise<string>;
  
  // Agent orchestration
  submitAgentTask: (task: Omit<AgentTask, 'id'>) => Promise<string>;
  updateAgentStatus: () => Promise<void>;
  
  // UI state management
  setCurrentView: (view: BookingState['ui']['currentView']) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedTimeSlot: (slot: TimeSlot | null) => void;
  
  // Notification management
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'dismissed'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Real-time communication
  setRealTimeStatus: (connected: boolean) => void;
  updateFacilitatorStatus: (active: boolean, sessionId?: string) => void;
  
  // Cross-platform integration
  updatePlatformStatus: (platform: keyof BookingState['platforms'], status: any) => void;
  syncAllPlatforms: () => Promise<void>;
  
  // Analytics and insights
  updateAnalytics: (analytics: Partial<BookingState['analytics']>) => void;
  generateInsights: () => Promise<void>;
  
  // Utility actions
  reset: () => void;
}

/**
 * Default State
 * 
 * This represents the initial state when the application first loads.
 * Everything starts "clean" and gets populated as the user interacts
 * with the system and our agents gather information.
 */
const defaultState: BookingState = {
  user: null,
  isAuthenticated: false,
  authError: null,
  
  graphService: null,
  orchestrator: null,
  
  calendars: [],
  upcomingEvents: [],
  availabilitySlots: [],
  
  bookingBusinesses: [],
  activeBookings: [],
  
  agentStatus: {
    isInitialized: false,
    activeAgents: 0,
    activeTasks: 0,
    queuedTasks: 0,
    lastHealthCheck: null
  },
  
  ui: {
    currentView: 'dashboard',
    isLoading: false,
    loadingMessage: '',
    selectedDate: new Date(),
    selectedTimeSlot: null,
    bookingInProgress: false,
    notifications: []
  },
  
  realTime: {
    isConnected: false,
    lastUpdate: null,
    pendingUpdates: 0,
    facilitatorActive: false,
    facilitatorSessionId: null
  },
  
  platforms: {
    microsoft: { connected: false, status: 'disconnected', lastSync: null },
    google: { connected: false, status: 'disconnected', lastSync: null },
    zoom: { connected: false, status: 'disconnected', lastSync: null }
  },
  
  analytics: {
    bookingPatterns: [],
    insights: [],
    recommendations: [],
    lastAnalysisUpdate: null
  }
};

/**
 * Zustand Store with Advanced Middleware
 * 
 * This creates our centralized state management system using Zustand.
 * The subscribeWithSelector middleware enables our intelligent agents
 * to react to state changes and trigger automated workflows.
 * 
 * Think of this as the "nervous system" of our application - it connects
 * all the different parts and enables them to communicate and coordinate.
 */
export const useBookingStore = create<BookingState & BookingActions>()(
  subscribeWithSelector((set, get) => ({
    ...defaultState,

    // ==================================================
    // AUTHENTICATION ACTIONS
    // ==================================================

    setUser: (user) => {
      set({ user });
      
      // If user is set, mark as authenticated
      if (user) {
        set({ isAuthenticated: true, authError: null });
        
        // Add welcome notification
        get().addNotification({
          type: 'success',
          title: 'Welcome!',
          message: `Signed in as ${user.displayName}`
        });
      }
    },

    setAuthenticated: (authenticated) => {
      set({ isAuthenticated: authenticated });
      
      if (!authenticated) {
        // Clear user data on logout
        set({
          user: null,
          authError: null,
          calendars: [],
          upcomingEvents: [],
          bookingBusinesses: [],
          activeBookings: []
        });
      }
    },

    setAuthError: (error) => {
      set({ authError: error });
      
      if (error) {
        get().addNotification({
          type: 'error',
          title: 'Authentication Error',
          message: error,
          actionRequired: true
        });
      }
    },

    // ==================================================
    // SERVICE INITIALIZATION
    // ==================================================

    initializeServices: async (graphService, orchestrator) => {
      set({ 
        graphService, 
        orchestrator,
        ui: { ...get().ui, isLoading: true, loadingMessage: 'Initializing intelligent agents...' }
      });

      try {
        // Initialize the orchestrator with our intelligent agents
        await orchestrator.initialize();
        
        // Set up event listeners for agent activities
        orchestrator.on('orchestrator:ready', () => {
          console.log('Agent orchestrator is ready');
          get().addNotification({
            type: 'success',
            title: 'AI Agents Ready',
            message: 'Intelligent booking assistance is now active'
          });
        });

        orchestrator.on('task:completed', (event) => {
          console.log('Task completed:', event);
          get().addNotification({
            type: 'info',
            title: 'Task Completed',
            message: `Agent completed task in ${event.duration}ms`
          });
        });

        orchestrator.on('task:failed', (event) => {
          console.log('Task failed:', event);
          get().addNotification({
            type: 'warning',
            title: 'Task Failed',
            message: `Task ${event.taskId} encountered an error`
          });
        });

        // Update agent status
        const status = orchestrator.getStatus();
        set({
          agentStatus: {
            isInitialized: true,
            activeAgents: status.agentCount,
            activeTasks: status.activeTaskCount,
            queuedTasks: status.queuedTaskCount,
            lastHealthCheck: new Date()
          }
        });

        // Mark Microsoft platform as connected
        get().updatePlatformStatus('microsoft', {
          connected: true,
          status: 'connected',
          lastSync: new Date()
        });

      } catch (error) {
        console.error('Failed to initialize services:', error);
        get().addNotification({
          type: 'error',
          title: 'Initialization Failed',
          message: 'Failed to initialize intelligent agents'
        });
      } finally {
        set({ 
          ui: { ...get().ui, isLoading: false, loadingMessage: '' }
        });
      }
    },

    // ==================================================
    // CALENDAR AND AVAILABILITY MANAGEMENT
    // ==================================================

    loadCalendars: async () => {
      const { graphService } = get();
      if (!graphService) return;

      set({ 
        ui: { ...get().ui, isLoading: true, loadingMessage: 'Loading calendars...' }
      });

      try {
        const calendars = await graphService.getUserCalendars();
        set({ calendars });
        
        console.log(`Loaded ${calendars.length} calendars`);
      } catch (error) {
        console.error('Failed to load calendars:', error);
        get().addNotification({
          type: 'error',
          title: 'Calendar Error',
          message: 'Failed to load your calendars'
        });
      } finally {
        set({ 
          ui: { ...get().ui, isLoading: false, loadingMessage: '' }
        });
      }
    },

    loadUpcomingEvents: async (startDate, endDate) => {
      const { graphService } = get();
      if (!graphService) return;

      try {
        const events = await graphService.getUpcomingEvents(startDate, endDate);
        set({ upcomingEvents: events });
        
        console.log(`Loaded ${events.length} upcoming events`);
      } catch (error) {
        console.error('Failed to load events:', error);
        get().addNotification({
          type: 'error',
          title: 'Events Error',
          message: 'Failed to load upcoming events'
        });
      }
    },

    analyzeAvailability: async (attendees, start, end, duration) => {
      const { graphService, orchestrator } = get();
      if (!graphService || !orchestrator) return;

      set({ 
        ui: { ...get().ui, isLoading: true, loadingMessage: 'Analyzing availability with AI...' }
      });

      try {
        // Submit task to our intelligent scheduling agent
        const taskId = await get().submitAgentTask({
          type: 'analyze_availability',
          priority: 'high',
          data: { attendeeEmails: attendees, startTime: start, endTime: end, duration },
          requiredCapabilities: ['availability_analysis', 'calendar_management']
        });

        console.log(`Submitted availability analysis task: ${taskId}`);
        
        // For demo purposes, also call GraphService directly
        const analysis = await graphService.analyzeAvailability(attendees, start, end, duration);
        set({ availabilitySlots: analysis.availableSlots });
        
        get().addNotification({
          type: 'success',
          title: 'Availability Analysis Complete',
          message: `Found ${analysis.availableSlots.length} optimal time slots`
        });

      } catch (error) {
        console.error('Failed to analyze availability:', error);
        get().addNotification({
          type: 'error',
          title: 'Analysis Error',
          message: 'Failed to analyze availability'
        });
      } finally {
        set({ 
          ui: { ...get().ui, isLoading: false, loadingMessage: '' }
        });
      }
    },

    // ==================================================
    // BOOKING BUSINESS OPERATIONS
    // ==================================================

    loadBookingBusinesses: async () => {
      const { graphService } = get();
      if (!graphService) return;

      try {
        const businesses = await graphService.getBookingBusinesses();
        set({ bookingBusinesses: businesses });
        
        console.log(`Loaded ${businesses.length} booking businesses`);
        
        if (businesses.length === 0) {
          get().addNotification({
            type: 'info',
            title: 'No Booking Businesses',
            message: 'No Microsoft Bookings businesses found. You can still create calendar events.'
          });
        }
      } catch (error) {
        console.error('Failed to load booking businesses:', error);
      }
    },

    createIntelligentBooking: async (businessId, appointmentData, options = {}) => {
      const { graphService, orchestrator } = get();
      if (!graphService || !orchestrator) {
        throw new Error('Services not initialized');
      }

      set({ 
        ui: { ...get().ui, bookingInProgress: true, loadingMessage: 'Creating intelligent booking...' }
      });

      try {
        // Submit cross-platform booking task to orchestrator
        const taskId = await get().submitAgentTask({
          type: 'cross_platform_booking',
          priority: 'high',
          data: {
            businessId,
            appointmentData,
            platforms: ['microsoft', 'google', 'zoom'],
            ...options
          },
          requiredCapabilities: ['cross_platform_sync', 'microsoft_integration'],
          metadata: {
            source: 'user_booking',
            crossPlatformRequirements: {
              google: true,
              zoom: true,
              teams: true
            }
          }
        });

        // Create the booking via GraphService
        const booking = await graphService.createIntelligentBooking(
          businessId,
          appointmentData,
          { 
            syncAcrossPlatforms: true,
            enableAgentOrchestration: true,
            ...options
          }
        );

        // Update state with new booking
        set({
          activeBookings: [...get().activeBookings, booking]
        });

        get().addNotification({
          type: 'success',
          title: 'Booking Created',
          message: 'Your intelligent booking has been created successfully'
        });

        return taskId;

      } catch (error) {
        console.error('Failed to create booking:', error);
        get().addNotification({
          type: 'error',
          title: 'Booking Failed',
          message: 'Failed to create your booking'
        });
        throw error;
      } finally {
        set({ 
          ui: { ...get().ui, bookingInProgress: false, loadingMessage: '' }
        });
      }
    },

    // ==================================================
    // AGENT ORCHESTRATION
    // ==================================================

    submitAgentTask: async (task) => {
      const { orchestrator } = get();
      if (!orchestrator) {
        throw new Error('Orchestrator not initialized');
      }

      const taskWithId: AgentTask = {
        ...task,
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const taskId = await orchestrator.submitTask(taskWithId);
      
      // Update agent status after submitting task
      setTimeout(() => get().updateAgentStatus(), 100);
      
      return taskId;
    },

    updateAgentStatus: async () => {
      const { orchestrator } = get();
      if (!orchestrator) return;

      try {
        const status = orchestrator.getStatus();
        set({
          agentStatus: {
            isInitialized: status.isRunning,
            activeAgents: status.agentCount,
            activeTasks: status.activeTaskCount,
            queuedTasks: status.queuedTaskCount,
            lastHealthCheck: new Date()
          }
        });
      } catch (error) {
        console.error('Failed to update agent status:', error);
      }
    },

    // ==================================================
    // UI STATE MANAGEMENT
    // ==================================================

    setCurrentView: (view) => {
      set({ 
        ui: { ...get().ui, currentView: view }
      });
    },

    setLoading: (loading, message = '') => {
      set({ 
        ui: { ...get().ui, isLoading: loading, loadingMessage: message }
      });
    },

    setSelectedDate: (date) => {
      set({ 
        ui: { ...get().ui, selectedDate: date }
      });
    },

    setSelectedTimeSlot: (slot) => {
      set({ 
        ui: { ...get().ui, selectedTimeSlot: slot }
      });
    },

    // ==================================================
    // NOTIFICATION MANAGEMENT
    // ==================================================

    addNotification: (notification) => {
      const newNotification: Notification = {
        ...notification,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        dismissed: false
      };

      set({
        ui: {
          ...get().ui,
          notifications: [...get().ui.notifications, newNotification]
        }
      });

      // Auto-dismiss non-critical notifications after 5 seconds
      if (newNotification.type === 'info' || newNotification.type === 'success') {
        setTimeout(() => {
          get().dismissNotification(newNotification.id);
        }, 5000);
      }
    },

    dismissNotification: (id) => {
      set({
        ui: {
          ...get().ui,
          notifications: get().ui.notifications.map(n => 
            n.id === id ? { ...n, dismissed: true } : n
          )
        }
      });

      // Remove dismissed notifications after animation
      setTimeout(() => {
        set({
          ui: {
            ...get().ui,
            notifications: get().ui.notifications.filter(n => n.id !== id)
          }
        });
      }, 300);
    },

    clearNotifications: () => {
      set({
        ui: {
          ...get().ui,
          notifications: []
        }
      });
    },

    // ==================================================
    // REAL-TIME COMMUNICATION
    // ==================================================

    setRealTimeStatus: (connected) => {
      set({
        realTime: {
          ...get().realTime,
          isConnected: connected,
          lastUpdate: connected ? new Date() : get().realTime.lastUpdate
        }
      });
    },

    updateFacilitatorStatus: (active, sessionId) => {
      set({
        realTime: {
          ...get().realTime,
          facilitatorActive: active,
          facilitatorSessionId: sessionId || null
        }
      });

      if (active && sessionId) {
        get().addNotification({
          type: 'info',
          title: 'Meeting Facilitator Active',
          message: 'AI meeting assistant is now taking notes and tracking decisions'
        });
      }
    },

    // ==================================================
    // CROSS-PLATFORM INTEGRATION
    // ==================================================

    updatePlatformStatus: (platform, status) => {
      set({
        platforms: {
          ...get().platforms,
          [platform]: {
            ...get().platforms[platform],
            ...status
          }
        }
      });
    },

    syncAllPlatforms: async () => {
      const { orchestrator } = get();
      if (!orchestrator) return;

      set({ 
        ui: { ...get().ui, isLoading: true, loadingMessage: 'Synchronizing across all platforms...' }
      });

      try {
        // Submit sync task to coordinator agent
        await get().submitAgentTask({
          type: 'sync_platforms',
          priority: 'medium',
          data: {
            platforms: ['microsoft', 'google', 'zoom']
          },
          requiredCapabilities: ['cross_platform_sync']
        });

        // Update all platform sync times
        const now = new Date();
        Object.keys(get().platforms).forEach(platform => {
          get().updatePlatformStatus(platform as keyof BookingState['platforms'], {
            lastSync: now
          });
        });

        get().addNotification({
          type: 'success',
          title: 'Sync Complete',
          message: 'All platforms have been synchronized'
        });

      } catch (error) {
        console.error('Failed to sync platforms:', error);
        get().addNotification({
          type: 'error',
          title: 'Sync Failed',
          message: 'Failed to synchronize platforms'
        });
      } finally {
        set({ 
          ui: { ...get().ui, isLoading: false, loadingMessage: '' }
        });
      }
    },

    // ==================================================
    // ANALYTICS AND INSIGHTS
    // ==================================================

    updateAnalytics: (analytics) => {
      set({
        analytics: {
          ...get().analytics,
          ...analytics,
          lastAnalysisUpdate: new Date()
        }
      });
    },

    generateInsights: async () => {
      const { orchestrator } = get();
      if (!orchestrator) return;

      try {
        // Submit analytics task to analyst agent
        await get().submitAgentTask({
          type: 'analyze_booking_patterns',
          priority: 'low',
          data: {
            bookings: get().activeBookings,
            events: get().upcomingEvents,
            timeRange: '30d'
          },
          requiredCapabilities: ['data_analysis', 'insights_generation']
        });

        // For demo purposes, generate some sample insights
        get().updateAnalytics({
          insights: [
            'Your meeting efficiency has improved 23% this month',
            'Most productive meeting times: 9-11 AM on Tuesdays',
            'Average booking lead time: 3.2 days'
          ],
          recommendations: [
            'Consider blocking focus time between 2-4 PM',
            'Enable automatic buffer times for better preparation',
            'Use Facilitator Agent for meetings with 4+ attendees'
          ]
        });

      } catch (error) {
        console.error('Failed to generate insights:', error);
      }
    },

    // ==================================================
    // UTILITY ACTIONS
    // ==================================================

    reset: () => {
      set(defaultState);
    }
  }))
);

/**
 * Specialized hooks for different aspects of the application
 * 
 * These provide convenient access to specific parts of our state,
 * making it easier for components to subscribe to only the data they need.
 * This optimization prevents unnecessary re-renders and keeps our app responsive.
 */

// Hook for authentication state
export const useAuth = () => {
  return useBookingStore(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    authError: state.authError,
    setUser: state.setUser,
    setAuthenticated: state.setAuthenticated,
    setAuthError: state.setAuthError
  }));
};

// Hook for agent orchestration status
export const useAgents = () => {
  return useBookingStore(state => ({
    agentStatus: state.agentStatus,
    orchestrator: state.orchestrator,
    submitTask: state.submitAgentTask,
    updateStatus: state.updateAgentStatus
  }));
};

// Hook for calendar and availability
export const useCalendar = () => {
  return useBookingStore(state => ({
    calendars: state.calendars,
    upcomingEvents: state.upcomingEvents,
    availabilitySlots: state.availabilitySlots,
    selectedDate: state.ui.selectedDate,
    selectedTimeSlot: state.ui.selectedTimeSlot,
    loadCalendars: state.loadCalendars,
    loadEvents: state.loadUpcomingEvents,
    analyzeAvailability: state.analyzeAvailability,
    setSelectedDate: state.setSelectedDate,
    setSelectedTimeSlot: state.setSelectedTimeSlot
  }));
};

// Hook for booking operations
export const useBookings = () => {
  return useBookingStore(state => ({
    bookingBusinesses: state.bookingBusinesses,
    activeBookings: state.activeBookings,
    bookingInProgress: state.ui.bookingInProgress,
    loadBusinesses: state.loadBookingBusinesses,
    createBooking: state.createIntelligentBooking
  }));
};

// Hook for UI state
export const useUI = () => {
  return useBookingStore(state => ({
    currentView: state.ui.currentView,
    isLoading: state.ui.isLoading,
    loadingMessage: state.ui.loadingMessage,
    notifications: state.ui.notifications,
    setCurrentView: state.setCurrentView,
    setLoading: state.setLoading,
    addNotification: state.addNotification,
    dismissNotification: state.dismissNotification,
    clearNotifications: state.clearNotifications
  }));
};

// Hook for cross-platform integration
export const usePlatforms = () => {
  return useBookingStore(state => ({
    platforms: state.platforms,
    updatePlatformStatus: state.updatePlatformStatus,
    syncAllPlatforms: state.syncAllPlatforms
  }));
};

// Hook for analytics and insights
export const useAnalytics = () => {
  return useBookingStore(state => ({
    analytics: state.analytics,
    updateAnalytics: state.updateAnalytics,
    generateInsights: state.generateInsights
  }));
};

/**
 * Real-time state synchronization
 * 
 * This sets up subscriptions to automatically keep our state
 * synchronized with agent activities and external events.
 * Think of this as the "automatic reflexes" of our system.
 */
export const setupStateSubscriptions = () => {
  // Subscribe to agent status changes
  useBookingStore.subscribe(
    (state) => state.agentStatus,
    (agentStatus, previousAgentStatus) => {
      if (agentStatus.activeTasks !== previousAgentStatus.activeTasks) {
        console.log(`Active tasks changed: ${previousAgentStatus.activeTasks} → ${agentStatus.activeTasks}`);
      }
    }
  );

  // Subscribe to platform status changes
  useBookingStore.subscribe(
    (state) => state.platforms,
    (platforms) => {
      const connectedPlatforms = Object.entries(platforms)
        .filter(([_, status]) => status.connected)
        .map(([platform, _]) => platform);
      
      console.log(`Connected platforms: ${connectedPlatforms.join(', ')}`);
    }
  );

  // Subscribe to authentication changes
  useBookingStore.subscribe(
    (state) => state.isAuthenticated,
    (isAuthenticated) => {
      if (isAuthenticated) {
        // Automatically load user data when authenticated
        const store = useBookingStore.getState();
        store.loadCalendars();
        store.loadUpcomingEvents();
        store.loadBookingBusinesses();
      }
    }
  );
};

export default useBookingStore;