// src/components/CopilotStudio/CopilotStudioIntegration.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMsal, useAccount } from '@azure/msal-react';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Calendar,
  Clock,
  Users,
  Zap,
  RefreshCw,
  Settings,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import { format } from 'date-fns';

import { useBookingStore, useAgents } from '../../store/useBookingStore';

/**
 * Copilot Studio Environment Configuration
 * 
 * These are the real environment details from your MeetingAssist Copilot Studio setup.
 * This configuration connects our React app directly to your live AI agent.
 */
const COPILOT_STUDIO_CONFIG = {
  // Your Copilot Studio agent details (from darbotlabs environment)
  environmentId: 'YOUR_ENVIRONMENT_ID',
  agentSchema: 'dystudio_meetMaster',
  agentId: 'YOUR_AGENT_ID',
  
  // Power Platform API endpoints
  apiBase: 'https://api.powerplatform.com',
  directLineEndpoint: 'https://europe.directline.botframework.com/v3/directline',
  
  // Authentication scopes for Copilot Studio access
  scopes: [
    'https://service.powerapps.com/Copilot.Invoke',
    'https://service.powerapps.com/Copilot.ReadWrite'
  ]
};

/**
 * Message interface for chat conversations
 */
interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    suggestedActions?: Array<{
      type: string;
      title: string;
      value: string;
    }>;
    attachments?: Array<{
      contentType: string;
      content: any;
    }>;
    agentContext?: {
      taskId?: string;
      agentType?: string;
      confidence?: number;
    };
  };
}

/**
 * Connection status for the Copilot Studio agent
 */
interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastActivity: Date | null;
  sessionId: string | null;
  error?: string;
}

/**
 * Props for the Copilot Studio Integration component
 */
interface CopilotStudioIntegrationProps {
  isMinimized?: boolean;
  onToggleMinimized?: () => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Copilot Studio Integration Component
 * 
 * This component creates a sophisticated bridge between our React application
 * and your live MeetingAssist Copilot Studio agent. Think of it as a "diplomatic
 * embassy" that enables seamless communication between our local agent orchestrator
 * and your cloud-based AI assistant.
 * 
 * The integration provides:
 * - Real-time chat with your MeetingAssist agent
 * - Automatic authentication with your Power Platform environment
 * - Intelligent context sharing between local and cloud agents
 * - Booking workflow coordination across both systems
 */
const CopilotStudioIntegration: React.FC<CopilotStudioIntegrationProps> = ({
  isMinimized = false,
  onToggleMinimized,
  onClose,
  className = ''
}) => {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || null);
  const { submitTask } = useAgents();
  const { user, addNotification } = useBookingStore();

  // Chat state management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'disconnected',
    lastActivity: null,
    sessionId: null
  });

  // UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs for chat management
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<any>(null);
  const accessTokenRef = useRef<string | null>(null);

  /**
   * Initialize connection to Copilot Studio
   * 
   * This establishes a secure, authenticated connection to your MeetingAssist agent.
   * We use the Direct Line API which is the recommended way to integrate
   * external applications with Copilot Studio agents.
   */
  const initializeCopilotConnection = useCallback(async () => {
    if (!account || connectionStatus.status === 'connected') return;

    setConnectionStatus(prev => ({ ...prev, status: 'connecting' }));

    try {
      // Acquire access token for Power Platform API
      const tokenRequest = {
        scopes: COPILOT_STUDIO_CONFIG.scopes,
        account: account,
      };

      const response = await instance.acquireTokenSilent(tokenRequest);
      accessTokenRef.current = response.accessToken;

      // Initialize Direct Line connection to your MeetingAssist agent
      const directLineResponse = await fetch(`${COPILOT_STUDIO_CONFIG.directLineEndpoint}/tokens/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${response.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            id: account.homeAccountId,
            name: user?.displayName || account.name
          },
          // Include your specific agent context
          bot: {
            id: COPILOT_STUDIO_CONFIG.agentId,
            name: 'MeetingAssist'
          }
        })
      });

      if (!directLineResponse.ok) {
        throw new Error(`Failed to connect: ${directLineResponse.statusText}`);
      }

      const directLineData = await directLineResponse.json();
      
      // Establish WebSocket connection for real-time communication
      connectionRef.current = {
        token: directLineData.token,
        conversationId: directLineData.conversationId,
        streamUrl: directLineData.streamUrl
      };

      setConnectionStatus({
        status: 'connected',
        lastActivity: new Date(),
        sessionId: directLineData.conversationId
      });

      // Send welcome message to establish context
      await sendSystemMessage('connection_established', {
        userContext: {
          name: user?.displayName,
          email: user?.mail || user?.userPrincipalName,
          environment: 'sophisticated_booking_app',
          capabilities: ['multi_agent_orchestration', 'cross_platform_booking', 'ai_scheduling']
        }
      });

      addNotification({
        type: 'success',
        title: 'MeetingAssist Connected',
        message: 'Successfully connected to your Copilot Studio agent'
      });

      console.log('🤖 MeetingAssist Copilot Studio connection established');
      console.log('📋 Agent Schema:', COPILOT_STUDIO_CONFIG.agentSchema);
      console.log('🆔 Session ID:', directLineData.conversationId);

    } catch (error) {
      console.error('Failed to connect to Copilot Studio:', error);
      
      setConnectionStatus({
        status: 'error',
        lastActivity: null,
        sessionId: null,
        error: error instanceof Error ? error.message : 'Connection failed'
      });

      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: 'Could not connect to MeetingAssist agent'
      });
    }
  }, [account, instance, user, connectionStatus.status]);

  /**
   * Send a message to the Copilot Studio agent
   * 
   * This method handles the sophisticated communication protocol between
   * our React app and your MeetingAssist agent, including context preservation
   * and intelligent message routing.
   */
  const sendMessageToCopilot = async (message: string, messageType: 'user' | 'system' = 'user') => {
    if (!connectionRef.current || connectionStatus.status !== 'connected') {
      await initializeCopilotConnection();
      return;
    }

    try {
      // Create user message in our local chat
      if (messageType === 'user') {
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          type: 'user',
          content: message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
      }

      // Send message to Copilot Studio via Direct Line API
      const response = await fetch(
        `${COPILOT_STUDIO_CONFIG.directLineEndpoint}/conversations/${connectionRef.current.conversationId}/activities`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${connectionRef.current.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'message',
            from: {
              id: account?.homeAccountId,
              name: user?.displayName || 'User'
            },
            text: message,
            // Include context about our local agent system
            channelData: {
              source: 'sophisticated_booking_app',
              localAgentSystem: {
                orchestratorActive: true,
                availableAgents: ['scheduling', 'facilitator', 'coordinator', 'analyst', 'notifier'],
                crossPlatformCapabilities: ['microsoft', 'google', 'zoom']
              }
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Message send failed: ${response.statusText}`);
      }

      // Start listening for the agent's response
      setIsTyping(true);
      pollForBotResponse();

      setConnectionStatus(prev => ({
        ...prev,
        lastActivity: new Date()
      }));

    } catch (error) {
      console.error('Failed to send message to Copilot:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: 'Failed to send message to MeetingAssist. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  /**
   * Send system message for internal coordination
   * 
   * This enables our local agent orchestrator to communicate with
   * your Copilot Studio agent about ongoing tasks and context.
   */
  const sendSystemMessage = async (action: string, data: any) => {
    if (!connectionRef.current) return;

    try {
      await fetch(
        `${COPILOT_STUDIO_CONFIG.directLineEndpoint}/conversations/${connectionRef.current.conversationId}/activities`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${connectionRef.current.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'event',
            name: action,
            value: data,
            from: {
              id: 'system',
              name: 'Local Agent Orchestrator'
            }
          })
        }
      );
    } catch (error) {
      console.error('Failed to send system message:', error);
    }
  };

  /**
   * Poll for bot responses using Direct Line API
   * 
   * This implements intelligent polling to receive responses from your
   * MeetingAssist agent while maintaining efficient network usage.
   */
  const pollForBotResponse = async () => {
    if (!connectionRef.current) return;

    try {
      const response = await fetch(
        `${COPILOT_STUDIO_CONFIG.directLineEndpoint}/conversations/${connectionRef.current.conversationId}/activities`,
        {
          headers: {
            'Authorization': `Bearer ${connectionRef.current.token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Process new messages from the bot
        const newMessages = data.activities
          .filter((activity: any) => 
            activity.from.id !== account?.homeAccountId && 
            activity.type === 'message' &&
            !messages.find(m => m.id === activity.id)
          )
          .map((activity: any) => ({
            id: activity.id,
            type: 'bot' as const,
            content: activity.text || 'I received your message.',
            timestamp: new Date(activity.timestamp),
            metadata: {
              suggestedActions: activity.suggestedActions?.actions || [],
              attachments: activity.attachments || [],
              agentContext: {
                confidence: 0.95,
                agentType: 'copilot_studio'
              }
            }
          }));

        if (newMessages.length > 0) {
          setMessages(prev => [...prev, ...newMessages]);
          setIsTyping(false);

          // If the bot suggests booking actions, coordinate with local agents
          newMessages.forEach(msg => {
            if (msg.metadata?.suggestedActions) {
              msg.metadata.suggestedActions.forEach(action => {
                if (action.type === 'imBack' && action.value.includes('book')) {
                  coordinateWithLocalAgents('booking_suggestion', { suggestion: action });
                }
              });
            }
          });
        }
      }

      // Continue polling if we're still expecting a response
      if (isTyping) {
        setTimeout(pollForBotResponse, 1000);
      }

    } catch (error) {
      console.error('Polling error:', error);
      setIsTyping(false);
    }
  };

  /**
   * Coordinate with local agent orchestrator
   * 
   * This method creates intelligent coordination between your Copilot Studio
   * agent and our local multi-agent system, enabling sophisticated workflows
   * that span both cloud and local AI capabilities.
   */
  const coordinateWithLocalAgents = async (action: string, data: any) => {
    try {
      // Submit coordination task to our local agent orchestrator
      const taskId = await submitTask({
        type: 'copilot_coordination',
        priority: 'medium',
        data: {
          action,
          copilotData: data,
          sessionId: connectionStatus.sessionId
        },
        requiredCapabilities: ['cross_platform_sync', 'coordination'],
        metadata: {
          source: 'copilot_studio_integration',
          copilotAgent: COPILOT_STUDIO_CONFIG.agentSchema
        }
      });

      console.log(`🔄 Coordinated with local agents: ${taskId}`);

      // Notify Copilot Studio about local agent involvement
      await sendSystemMessage('local_agent_coordination', {
        taskId,
        action,
        localCapabilities: ['scheduling', 'facilitator', 'coordinator', 'analyst', 'notifier']
      });

    } catch (error) {
      console.error('Local agent coordination failed:', error);
    }
  };

  /**
   * Handle user message submission
   */
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    await sendMessageToCopilot(currentMessage.trim());
    setCurrentMessage('');
  };

  /**
   * Handle suggested action clicks
   */
  const handleSuggestedAction = async (action: any) => {
    if (action.type === 'imBack') {
      await sendMessageToCopilot(action.value);
    } else if (action.type === 'openUrl') {
      window.open(action.value, '_blank');
    }
  };

  /**
   * Initialize connection when component mounts
   */
  useEffect(() => {
    if (account && connectionStatus.status === 'disconnected') {
      initializeCopilotConnection();
    }
  }, [account, initializeCopilotConnection]);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Add initial welcome message
   */
  useEffect(() => {
    if (messages.length === 0 && connectionStatus.status === 'connected') {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'bot',
        content: `Hello ${user?.displayName || 'there'}! I'm your MeetingAssist agent. I can help you schedule meetings, coordinate with your calendar, and manage your booking needs across Microsoft, Google, and Zoom platforms.`,
        timestamp: new Date(),
        metadata: {
          suggestedActions: [
            { type: 'imBack', title: 'Schedule a meeting', value: 'Help me schedule a meeting' },
            { type: 'imBack', title: 'Check availability', value: 'Check my availability for this week' },
            { type: 'imBack', title: 'View upcoming events', value: 'Show me my upcoming meetings' }
          ]
        }
      };
      setMessages([welcomeMessage]);
    }
  }, [connectionStatus.status, user?.displayName, messages.length]);

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={onToggleMinimized}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
          {connectionStatus.status === 'connected' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bot className="w-8 h-8 text-blue-600" />
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              connectionStatus.status === 'connected' ? 'bg-green-500' :
              connectionStatus.status === 'connecting' ? 'bg-yellow-500' :
              connectionStatus.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
            }`}></div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900">MeetingAssist</h3>
            <p className="text-xs text-gray-600">
              {connectionStatus.status === 'connected' ? 'Connected to Copilot Studio' :
               connectionStatus.status === 'connecting' ? 'Connecting...' :
               connectionStatus.status === 'error' ? 'Connection Error' : 'Disconnected'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          {onToggleMinimized && (
            <button
              onClick={onToggleMinimized}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-2">Connection Details</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p><span className="font-medium">Agent Schema:</span> {COPILOT_STUDIO_CONFIG.agentSchema}</p>
            <p><span className="font-medium">Environment:</span> {COPILOT_STUDIO_CONFIG.environmentId}</p>
            <p><span className="font-medium">Session ID:</span> {connectionStatus.sessionId || 'Not connected'}</p>
            <p><span className="font-medium">Last Activity:</span> {
              connectionStatus.lastActivity ? format(connectionStatus.lastActivity, 'h:mm:ss a') : 'None'
            }</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isExpanded ? 'h-96' : 'h-80'}`}>
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.type === 'user' 
                ? 'bg-blue-600 text-white' 
                : message.type === 'bot'
                ? 'bg-gray-100 text-gray-900'
                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}>
              <div className="flex items-start space-x-2">
                {message.type === 'bot' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                {message.type === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {format(message.timestamp, 'h:mm a')}
                  </p>
                </div>
              </div>
              
              {/* Suggested Actions */}
              {message.metadata?.suggestedActions && message.metadata.suggestedActions.length > 0 && (
                <div className="mt-3 space-y-1">
                  {message.metadata.suggestedActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedAction(action)}
                      className="block w-full text-left px-3 py-2 text-xs bg-white text-gray-700 rounded border hover:bg-gray-50 transition-colors"
                    >
                      {action.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center space-x-2">
              <Bot className="w-4 h-4 text-gray-600" />
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask MeetingAssist to help with scheduling..."
            disabled={connectionStatus.status !== 'connected'}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || connectionStatus.status !== 'connected'}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {connectionStatus.status === 'error' && (
          <div className="mt-2 flex items-center justify-between text-sm text-red-600">
            <span>{connectionStatus.error}</span>
            <button
              onClick={initializeCopilotConnection}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CopilotStudioIntegration;