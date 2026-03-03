// src/config/auth.ts
import { Configuration, PopupRequest } from '@azure/msal-browser';

/**
 * Microsoft Authentication Library (MSAL) Configuration
 * 
 * This configuration establishes our security foundation for the entire application.
 * Think of this as creating a digital passport system that works across all Microsoft services
 * while maintaining enterprise-grade security standards.
 */
export const msalConfig: Configuration = {
  auth: {
    // MeetingAssist Copilot Studio App Registration (darbotlabs environment)
    clientId: process.env.VITE_AZURE_CLIENT_ID || 'bedaebf0-4f7a-4c5b-8861-e082001a8193',
    
    // Authority URL for Cypherdyne tenant (single tenant configuration)
    // This connects to your specific Copilot Studio environment
    authority: process.env.VITE_AZURE_AUTHORITY || 'https://login.microsoftonline.com/6b104499-c49f-45dc-b3a2-df95efd6eeb4',
    
    // Redirect URI after successful authentication
    redirectUri: process.env.VITE_REDIRECT_URI || 'http://localhost:5173',
    
    // Enable advanced features for enterprise scenarios
    postLogoutRedirectUri: '/',
    navigateToLoginRequestUrl: false,
  },
  cache: {
    // Use sessionStorage for enhanced security in multi-tab scenarios
    cacheLocation: 'sessionStorage',
    
    // Store auth state in cookies for better cross-tab experience
    storeAuthStateInCookie: false,
  },
  system: {
    // Enhanced logging for development (disable in production)
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        console.log(`[MSAL] ${level}: ${message}`);
      },
      piiLoggingEnabled: false,
      logLevel: process.env.NODE_ENV === 'development' ? 3 : 1, // Verbose in dev, Error in prod
    },
    
    // Allow redirect flows in popup scenarios
    allowRedirectInIframe: false,
    
    // Enhanced token renewal for long-running applications
    tokenRenewalOffsetSeconds: 300, // Renew tokens 5 minutes before expiry
  },
};

/**
 * Microsoft Graph API Scopes Configuration
 * 
 * These scopes define what data and operations our application can access.
 * We're requesting comprehensive permissions for our booking orchestration system.
 */
export const graphScopes = {
  // Core user information and profile access
  profile: ['User.Read', 'profile', 'openid', 'email'],
  
  // Calendar and booking management permissions
  calendar: [
    'Calendars.ReadWrite',      // Full calendar management
    'Calendars.ReadWrite.Shared', // Shared calendar access
    'Events.ReadWrite',         // Event creation and modification
    'Events.ReadWrite.Shared',  // Shared event management
  ],
  
  // Microsoft Bookings specific permissions
  bookings: [
    'Bookings.ReadWrite.All',   // Full Bookings API access
    'Bookings.Manage.All',      // Booking business management
    'BookingsAppointment.ReadWrite.All', // Appointment management
  ],
  
  // Mail and notification permissions
  mail: [
    'Mail.Send',                // Send confirmation emails
    'Mail.ReadWrite',          // Email integration features
  ],
  
  // Teams and collaboration permissions for Facilitator Agent integration
  teams: [
    'TeamSettings.ReadWrite.All', // Teams configuration
    'Channel.ReadBasic.All',    // Channel information
    'ChatMessage.Send',         // Agent messaging capabilities
  ],
  
  // Directory and organizational permissions for enterprise features
  directory: [
    'Directory.Read.All',       // Organization structure access
    'Group.Read.All',          // Group membership for booking policies
  ],
} as const;

/**
 * Login Request Configuration
 * 
 * This defines the specific permissions we request during login.
 * We start with minimal permissions and request additional ones as needed (incremental consent).
 */
export const loginRequest: PopupRequest = {
  scopes: [
    ...graphScopes.profile,
    ...graphScopes.calendar,
    'https://graph.microsoft.com/.default', // Default Graph permissions
  ],
  prompt: 'select_account', // Allow users to choose account in multi-tenant scenarios
};

/**
 * Booking-specific permission request
 * 
 * These elevated permissions are requested only when users access booking features.
 * This follows the principle of least privilege - only request what you need, when you need it.
 */
export const bookingRequest: PopupRequest = {
  scopes: [
    ...graphScopes.bookings,
    ...graphScopes.mail,
  ],
  prompt: 'consent', // Explicitly ask for consent for elevated permissions
};

/**
 * Teams integration permission request
 * 
 * For Facilitator Agent and advanced collaboration features.
 */
export const teamsRequest: PopupRequest = {
  scopes: [
    ...graphScopes.teams,
  ],
  prompt: 'consent',
};

/**
 * Token acquisition options for silent requests
 * 
 * These options optimize token acquisition for background operations.
 */
export const silentRequest = {
  scopes: graphScopes.profile,
  account: null, // Will be set dynamically
  forceRefresh: false, // Use cached tokens when possible
};

/**
 * Cross-platform authentication configuration
 * 
 * Configuration for integrating with Google and Zoom platforms.
 * Note: Actual implementation would require additional OAuth providers.
 */
export const crossPlatformConfig = {
  google: {
    clientId: process.env.VITE_GOOGLE_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/calendar'],
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  },
  
  zoom: {
    clientId: process.env.VITE_ZOOM_CLIENT_ID,
    scopes: ['meeting:write', 'user:read'],
    authUrl: 'https://zoom.us/oauth/authorize',
  },
} as const;

/**
 * Environment validation
 * 
 * Ensures all required environment variables are present for proper authentication.
 */
export const validateAuthConfig = (): boolean => {
  const requiredEnvVars = [
    'VITE_AZURE_CLIENT_ID',
    'VITE_AZURE_AUTHORITY',
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return false;
  }
  
  return true;
};

export default msalConfig;