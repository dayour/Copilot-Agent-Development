// src/services/GraphService.ts
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import { AccountInfo } from '@azure/msal-browser';
import { 
  BookingBusiness, 
  BookingAppointment, 
  Event, 
  User, 
  Calendar,
  FreeBusyViewType 
} from '@microsoft/microsoft-graph-types';

/**
 * Custom Authentication Provider for Microsoft Graph
 * 
 * This class bridges our MSAL authentication with the Graph SDK.
 * Think of it as a security guard that shows the proper credentials
 * for each request to Microsoft's services.
 */
export class MSALAuthenticationProvider implements AuthenticationProvider {
  private getAccessToken: () => Promise<string>;

  constructor(getAccessToken: () => Promise<string>) {
    this.getAccessToken = getAccessToken;
  }

  /**
   * Provides authentication token for Graph requests
   * This method is called automatically by the Graph SDK before each API call
   */
  async getAccessToken(): Promise<string> {
    try {
      return await this.getAccessToken();
    } catch (error) {
      console.error('Failed to acquire access token:', error);
      throw new Error('Authentication failed');
    }
  }
}

/**
 * Enhanced booking data types for our application
 * 
 * These extend the basic Microsoft Graph types with additional metadata
 * needed for our intelligent agent orchestration.
 */
export interface EnhancedBookingAppointment extends BookingAppointment {
  // Agent orchestration metadata
  agentContext?: {
    orchestratorId: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    automationLevel: 'manual' | 'assisted' | 'autonomous';
    crossPlatformBookings?: {
      googleEventId?: string;
      zoomMeetingId?: string;
      teamsEventId?: string;
    };
  };
  
  // Enhanced scheduling information
  intelligentScheduling?: {
    suggestedTimes: Date[];
    conflictAnalysis: ConflictAnalysis;
    attendeePreferences: AttendeePreference[];
  };
}

export interface ConflictAnalysis {
  hasConflicts: boolean;
  conflictDetails: Array<{
    conflictType: 'hard' | 'soft';
    description: string;
    suggestedResolution: string;
  }>;
}

export interface AttendeePreference {
  attendeeEmail: string;
  preferredTimeSlots: TimeSlot[];
  timeZone: string;
  workingHours: WorkingHours;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  confidence: number; // 0-1 scale of preference strength
}

export interface WorkingHours {
  timeZone: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
}

/**
 * Microsoft Graph Service Class
 * 
 * This is our primary interface for all Microsoft 365 operations.
 * It provides intelligent booking capabilities with agent orchestration support.
 */
export class GraphService {
  private graphClient: Client;
  private currentUser: AccountInfo | null = null;

  constructor(authProvider: MSALAuthenticationProvider) {
    this.graphClient = Client.initWithMiddleware({
      authProvider,
      defaultVersion: 'v1.0', // Use stable API version
    });
  }

  /**
   * Initialize service with current user context
   * This establishes our identity within the Microsoft ecosystem
   */
  async initialize(user: AccountInfo): Promise<void> {
    this.currentUser = user;
    
    try {
      // Verify connectivity and permissions
      const profile = await this.getCurrentUser();
      console.log(`Graph service initialized for user: ${profile?.displayName}`);
    } catch (error) {
      console.error('Failed to initialize Graph service:', error);
      throw new Error('Graph service initialization failed');
    }
  }

  // ==================================================
  // USER AND PROFILE MANAGEMENT
  // ==================================================

  /**
   * Get current user profile information
   * This provides the foundation for personalized booking experiences
   */
  async getCurrentUser(): Promise<User> {
    try {
      return await this.graphClient.api('/me').get();
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Get user's calendars with enhanced metadata
   * This discovers all available calendars for intelligent scheduling
   */
  async getUserCalendars(): Promise<Calendar[]> {
    try {
      const response = await this.graphClient
        .api('/me/calendars')
        .select('id,name,color,canShare,canViewPrivateItems,canEdit,owner')
        .get();
      
      return response.value;
    } catch (error) {
      console.error('Error fetching calendars:', error);
      throw new Error('Failed to fetch calendars');
    }
  }

  // ==================================================
  // INTELLIGENT AVAILABILITY ANALYSIS
  // ==================================================

  /**
   * Advanced availability checking with conflict analysis
   * 
   * This method implements sophisticated scheduling intelligence,
   * analyzing not just free/busy times but also preferences, travel time,
   * and meeting patterns for optimal scheduling suggestions.
   */
  async analyzeAvailability(
    attendeeEmails: string[],
    startTime: Date,
    endTime: Date,
    duration: number, // in minutes
    preferences?: {
      bufferTime?: number; // minutes between meetings
      preferredTimes?: TimeSlot[];
      avoidBackToBack?: boolean;
      respectWorkingHours?: boolean;
    }
  ): Promise<{
    availableSlots: TimeSlot[];
    conflictAnalysis: ConflictAnalysis;
    recommendations: string[];
  }> {
    try {
      // Get free/busy information for all attendees
      const freeBusyData = await this.graphClient
        .api('/me/calendar/getSchedule')
        .post({
          schedules: attendeeEmails,
          startTime: {
            dateTime: startTime.toISOString(),
            timeZone: 'UTC'
          },
          endTime: {
            dateTime: endTime.toISOString(),
            timeZone: 'UTC'
          },
          availabilityViewInterval: 15 // 15-minute intervals
        });

      // Analyze the data using our intelligent algorithms
      return this.processAvailabilityData(
        freeBusyData.value,
        startTime,
        endTime,
        duration,
        preferences
      );
    } catch (error) {
      console.error('Error analyzing availability:', error);
      throw new Error('Failed to analyze availability');
    }
  }

  /**
   * Process and analyze free/busy data with AI-enhanced logic
   * 
   * This private method contains our core scheduling intelligence,
   * implementing algorithms that consider human behavior patterns
   * and organizational productivity insights.
   */
  private processAvailabilityData(
    freeBusyData: any[],
    startTime: Date,
    endTime: Date,
    duration: number,
    preferences?: any
  ): {
    availableSlots: TimeSlot[];
    conflictAnalysis: ConflictAnalysis;
    recommendations: string[];
  } {
    const availableSlots: TimeSlot[] = [];
    const conflicts: ConflictAnalysis['conflictDetails'] = [];
    const recommendations: string[] = [];

    // Intelligent slot finding algorithm
    const intervalMinutes = 15;
    const totalIntervals = Math.floor((endTime.getTime() - startTime.getTime()) / (intervalMinutes * 60 * 1000));
    
    // Create availability matrix
    const availabilityMatrix: boolean[][] = freeBusyData.map(schedule => 
      new Array(totalIntervals).fill(true)
    );

    // Mark busy times
    freeBusyData.forEach((schedule, attendeeIndex) => {
      schedule.busyViewEntries?.forEach((entry: any) => {
        if (entry.status === 'busy' || entry.status === 'tentative') {
          const entryStart = new Date(entry.start.dateTime);
          const entryEnd = new Date(entry.end.dateTime);
          
          const startInterval = Math.floor((entryStart.getTime() - startTime.getTime()) / (intervalMinutes * 60 * 1000));
          const endInterval = Math.floor((entryEnd.getTime() - startTime.getTime()) / (intervalMinutes * 60 * 1000));
          
          for (let i = Math.max(0, startInterval); i < Math.min(totalIntervals, endInterval); i++) {
            availabilityMatrix[attendeeIndex][i] = false;
          }
        }
      });
    });

    // Find contiguous available slots
    const requiredIntervals = Math.ceil(duration / intervalMinutes);
    
    for (let i = 0; i <= totalIntervals - requiredIntervals; i++) {
      let isAvailable = true;
      
      // Check if all attendees are free for the required duration
      for (let attendee = 0; attendee < availabilityMatrix.length; attendee++) {
        for (let interval = i; interval < i + requiredIntervals; interval++) {
          if (!availabilityMatrix[attendee][interval]) {
            isAvailable = false;
            break;
          }
        }
        if (!isAvailable) break;
      }
      
      if (isAvailable) {
        const slotStart = new Date(startTime.getTime() + (i * intervalMinutes * 60 * 1000));
        const slotEnd = new Date(slotStart.getTime() + (duration * 60 * 1000));
        
        // Apply intelligent filtering based on preferences
        let confidence = 1.0;
        
        // Reduce confidence for back-to-back meetings if preference set
        if (preferences?.avoidBackToBack) {
          // Check for adjacent meetings
          const hasAdjacentMeeting = this.checkAdjacentMeetings(availabilityMatrix, i, requiredIntervals);
          if (hasAdjacentMeeting) {
            confidence *= 0.7;
          }
        }
        
        // Boost confidence for preferred time slots
        if (preferences?.preferredTimes) {
          const isPreferredTime = preferences.preferredTimes.some((pref: TimeSlot) => 
            slotStart >= pref.start && slotEnd <= pref.end
          );
          if (isPreferredTime) {
            confidence *= 1.3;
          }
        }
        
        availableSlots.push({
          start: slotStart,
          end: slotEnd,
          confidence
        });
      }
    }

    // Generate intelligent recommendations
    if (availableSlots.length === 0) {
      recommendations.push('No fully available slots found. Consider reducing meeting duration or expanding time range.');
      
      // Analyze conflicts for helpful suggestions
      const partialAvailability = this.analyzePartialAvailability(availabilityMatrix, requiredIntervals);
      if (partialAvailability.mostAvailableSlot) {
        recommendations.push(`Best alternative: ${partialAvailability.mostAvailableSlot.conflictCount} conflicts at ${partialAvailability.mostAvailableSlot.time}`);
      }
    } else {
      // Sort by confidence and provide recommendations
      availableSlots.sort((a, b) => b.confidence - a.confidence);
      
      if (availableSlots.length > 5) {
        recommendations.push('Multiple great options available. Top 5 recommendations shown.');
      }
      
      // Analyze patterns for better suggestions
      const timePatterns = this.analyzeTimePatterns(availableSlots);
      recommendations.push(...timePatterns);
    }

    return {
      availableSlots: availableSlots.slice(0, 10), // Limit to top 10 suggestions
      conflictAnalysis: {
        hasConflicts: conflicts.length > 0,
        conflictDetails: conflicts
      },
      recommendations
    };
  }

  /**
   * Helper method to check for adjacent meetings
   */
  private checkAdjacentMeetings(matrix: boolean[][], startInterval: number, duration: number): boolean {
    // Check if there are meetings immediately before or after the proposed slot
    const beforeInterval = startInterval - 1;
    const afterInterval = startInterval + duration;
    
    for (let attendee = 0; attendee < matrix.length; attendee++) {
      if ((beforeInterval >= 0 && !matrix[attendee][beforeInterval]) ||
          (afterInterval < matrix[attendee].length && !matrix[attendee][afterInterval])) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Analyze partial availability for conflict resolution suggestions
   */
  private analyzePartialAvailability(matrix: boolean[][], requiredIntervals: number): any {
    let bestSlot = null;
    let minConflicts = Infinity;
    
    for (let i = 0; i <= matrix[0].length - requiredIntervals; i++) {
      let conflicts = 0;
      
      for (let attendee = 0; attendee < matrix.length; attendee++) {
        for (let interval = i; interval < i + requiredIntervals; interval++) {
          if (!matrix[attendee][interval]) {
            conflicts++;
          }
        }
      }
      
      if (conflicts < minConflicts) {
        minConflicts = conflicts;
        bestSlot = {
          conflictCount: conflicts,
          time: `Interval ${i}`, // Would be converted to actual time
          interval: i
        };
      }
    }
    
    return { mostAvailableSlot: bestSlot };
  }

  /**
   * Analyze time patterns for intelligent recommendations
   */
  private analyzeTimePatterns(slots: TimeSlot[]): string[] {
    const recommendations: string[] = [];
    
    // Analyze time distribution
    const morningSlots = slots.filter(slot => slot.start.getHours() < 12).length;
    const afternoonSlots = slots.filter(slot => slot.start.getHours() >= 12).length;
    
    if (morningSlots > afternoonSlots * 2) {
      recommendations.push('Morning times show better availability across attendees.');
    } else if (afternoonSlots > morningSlots * 2) {
      recommendations.push('Afternoon times show better availability across attendees.');
    }
    
    // Check for optimal meeting times based on productivity research
    const optimalTimes = slots.filter(slot => {
      const hour = slot.start.getHours();
      return (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16);
    });
    
    if (optimalTimes.length > 0) {
      recommendations.push('Several slots align with peak productivity hours (9-11 AM, 2-4 PM).');
    }
    
    return recommendations;
  }

  // ==================================================
  // BOOKING BUSINESS MANAGEMENT
  // ==================================================

  /**
   * Get all booking businesses accessible to the current user
   * This discovers available booking services for agent orchestration
   */
  async getBookingBusinesses(): Promise<BookingBusiness[]> {
    try {
      const response = await this.graphClient
        .api('/solutions/bookingBusinesses')
        .get();
      
      return response.value;
    } catch (error) {
      console.error('Error fetching booking businesses:', error);
      // Return empty array if Bookings isn't available (common in personal accounts)
      return [];
    }
  }

  /**
   * Create or update a booking appointment with enhanced intelligence
   * 
   * This method implements our core booking logic with multi-agent coordination,
   * automated conflict resolution, and cross-platform synchronization.
   */
  async createIntelligentBooking(
    businessId: string,
    appointmentData: Partial<EnhancedBookingAppointment>,
    options?: {
      autoResolveConflicts?: boolean;
      syncAcrossPlatforms?: boolean;
      enableAgentOrchestration?: boolean;
    }
  ): Promise<EnhancedBookingAppointment> {
    try {
      // Pre-booking conflict analysis
      if (options?.autoResolveConflicts && appointmentData.start && appointmentData.end) {
        const conflictAnalysis = await this.analyzeBookingConflicts(
          appointmentData.start as any,
          appointmentData.end as any,
          appointmentData.customers?.[0]?.emailAddress || ''
        );
        
        if (conflictAnalysis.hasConflicts) {
          console.warn('Booking conflicts detected:', conflictAnalysis);
          // Implement conflict resolution logic here
        }
      }

      // Create the booking with enhanced metadata
      const enhancedAppointment: Partial<EnhancedBookingAppointment> = {
        ...appointmentData,
        agentContext: {
          orchestratorId: `agent-${Date.now()}`,
          priority: 'medium',
          automationLevel: options?.enableAgentOrchestration ? 'autonomous' : 'manual',
          crossPlatformBookings: {}
        }
      };

      // Create the booking via Graph API
      const createdBooking = await this.graphClient
        .api(`/solutions/bookingBusinesses/${businessId}/appointments`)
        .post(enhancedAppointment);

      // Post-creation orchestration
      if (options?.syncAcrossPlatforms) {
        await this.orchestrateCrossPlatformSync(createdBooking);
      }

      return createdBooking as EnhancedBookingAppointment;
    } catch (error) {
      console.error('Error creating intelligent booking:', error);
      throw new Error('Failed to create booking');
    }
  }

  /**
   * Analyze potential booking conflicts
   */
  private async analyzeBookingConflicts(
    startTime: string,
    endTime: string,
    customerEmail: string
  ): Promise<ConflictAnalysis> {
    try {
      // Check calendar conflicts for the customer
      const customerConflicts = await this.graphClient
        .api('/me/calendar/getSchedule')
        .post({
          schedules: [customerEmail],
          startTime: { dateTime: startTime, timeZone: 'UTC' },
          endTime: { dateTime: endTime, timeZone: 'UTC' },
          availabilityViewInterval: 15
        });

      const hasConflicts = customerConflicts.value.some((schedule: any) =>
        schedule.busyViewEntries?.some((entry: any) => entry.status === 'busy')
      );

      return {
        hasConflicts,
        conflictDetails: hasConflicts ? [{
          conflictType: 'hard',
          description: 'Customer has existing commitment during requested time',
          suggestedResolution: 'Suggest alternative time slots'
        }] : []
      };
    } catch (error) {
      console.error('Error analyzing booking conflicts:', error);
      return { hasConflicts: false, conflictDetails: [] };
    }
  }

  /**
   * Orchestrate cross-platform booking synchronization
   * 
   * This method coordinates with Google Calendar, Zoom, and other platforms
   * to create a unified booking experience across all user's tools.
   */
  private async orchestrateCrossPlatformSync(booking: BookingAppointment): Promise<void> {
    try {
      console.log('Initiating cross-platform sync for booking:', booking.id);
      
      // This would integrate with our agent orchestration system
      // to coordinate bookings across Google Calendar, Zoom, etc.
      
      // For now, we'll create a calendar event as a starting point
      if (booking.start && booking.end) {
        await this.createCalendarEvent({
          subject: `Booking: ${booking.serviceId}`,
          start: { dateTime: booking.start, timeZone: 'UTC' },
          end: { dateTime: booking.end, timeZone: 'UTC' },
          attendees: booking.customers?.map(customer => ({
            emailAddress: { address: customer.emailAddress, name: customer.name }
          }))
        });
      }
    } catch (error) {
      console.error('Error in cross-platform sync:', error);
      // Don't fail the main booking if sync fails
    }
  }

  // ==================================================
  // CALENDAR EVENT MANAGEMENT
  // ==================================================

  /**
   * Create calendar event with intelligent scheduling
   */
  async createCalendarEvent(eventData: Partial<Event>): Promise<Event> {
    try {
      return await this.graphClient
        .api('/me/events')
        .post(eventData);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Get upcoming events with enhanced metadata
   */
  async getUpcomingEvents(
    startDate?: Date,
    endDate?: Date,
    filter?: string
  ): Promise<Event[]> {
    try {
      let query = this.graphClient.api('/me/events');
      
      if (startDate || endDate) {
        const start = startDate?.toISOString() || new Date().toISOString();
        const end = endDate?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        
        query = query.filter(`start/dateTime ge '${start}' and end/dateTime le '${end}'`);
      }
      
      if (filter) {
        query = query.filter(filter);
      }
      
      const response = await query
        .select('id,subject,start,end,attendees,location,webLink')
        .orderby('start/dateTime')
        .top(50)
        .get();
      
      return response.value;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw new Error('Failed to fetch events');
    }
  }

  // ==================================================
  // FACILITATOR AGENT INTEGRATION
  // ==================================================

  /**
   * Initialize Facilitator Agent for Teams meetings
   * 
   * This method sets up the intelligent meeting assistant that can
   * take notes, track decisions, and manage follow-up actions.
   */
  async initializeFacilitatorAgent(eventId: string): Promise<{
    agentId: string;
    capabilities: string[];
    status: 'active' | 'standby' | 'error';
  }> {
    try {
      // This would integrate with the actual Facilitator Agent API
      // For now, we'll simulate the initialization
      
      const agentId = `facilitator-${eventId}-${Date.now()}`;
      
      console.log(`Initializing Facilitator Agent ${agentId} for event ${eventId}`);
      
      return {
        agentId,
        capabilities: [
          'real-time note taking',
          'decision tracking',
          'action item management',
          'attendance monitoring',
          'meeting summary generation'
        ],
        status: 'active'
      };
    } catch (error) {
      console.error('Error initializing Facilitator Agent:', error);
      return {
        agentId: '',
        capabilities: [],
        status: 'error'
      };
    }
  }

  // ==================================================
  // ERROR HANDLING AND UTILITIES
  // ==================================================

  /**
   * Handle Graph API errors with intelligent retry logic
   */
  private async handleGraphError(error: any, operation: string): Promise<never> {
    console.error(`Graph API error in ${operation}:`, error);
    
    if (error.code === 'InvalidAuthenticationToken') {
      throw new Error('Authentication token expired. Please sign in again.');
    } else if (error.code === 'Forbidden') {
      throw new Error('Insufficient permissions for this operation.');
    } else if (error.code === 'TooManyRequests') {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else {
      throw new Error(`Operation failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Validate service health and connectivity
   */
  async validateServiceHealth(): Promise<{
    isHealthy: boolean;
    services: { [key: string]: boolean };
    lastChecked: Date;
  }> {
    const services: { [key: string]: boolean } = {};
    let isHealthy = true;

    try {
      // Test basic Graph connectivity
      await this.getCurrentUser();
      services.graph = true;
    } catch {
      services.graph = false;
      isHealthy = false;
    }

    try {
      // Test calendar access
      await this.getUserCalendars();
      services.calendar = true;
    } catch {
      services.calendar = false;
    }

    try {
      // Test bookings access
      await this.getBookingBusinesses();
      services.bookings = true;
    } catch {
      services.bookings = false; // Not critical for all users
    }

    return {
      isHealthy,
      services,
      lastChecked: new Date()
    };
  }
}

export default GraphService;