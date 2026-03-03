// src/components/Dashboard/QuickBookingWidget.tsx
import React, { useState } from 'react';
import { Calendar, Clock, Users, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { format, addDays, addHours } from 'date-fns';
import { useBookings, useCalendar, useAgents } from '../../store/useBookingStore';

/**
 * Quick Booking Widget
 * 
 * This provides a streamlined interface for creating intelligent bookings.
 * Think of it as a "smart form" that leverages AI to suggest optimal times
 * and automatically handle cross-platform coordination.
 */
const QuickBookingWidget: React.FC = () => {
  const { createBooking, bookingBusinesses } = useBookings();
  const { analyzeAvailability, availabilitySlots, setSelectedTimeSlot } = useCalendar();
  const { submitTask } = useAgents();

  const [formData, setFormData] = useState({
    title: '',
    attendeeEmails: '',
    duration: 60,
    preferredDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    preferredTime: '09:00',
    crossPlatformSync: true,
    useAI: true
  });

  const [step, setStep] = useState<'form' | 'analyzing' | 'selecting' | 'booking' | 'success'>('form');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const handleAnalyzeAvailability = async () => {
    if (!formData.title || !formData.attendeeEmails) return;

    setStep('analyzing');

    try {
      const attendees = formData.attendeeEmails.split(',').map(email => email.trim());
      const startDate = new Date(`${formData.preferredDate}T${formData.preferredTime}`);
      const endDate = addHours(startDate, 8); // Look for slots within 8 hours

      await analyzeAvailability(attendees, startDate, endDate, formData.duration);
      setStep('selecting');
    } catch (error) {
      console.error('Failed to analyze availability:', error);
      setStep('form');
    }
  };

  const handleQuickBook = async () => {
    if (!selectedSlot) return;

    setStep('booking');

    try {
      // Create the intelligent booking
      if (bookingBusinesses.length > 0) {
        await createBooking(
          bookingBusinesses[0].id!,
          {
            serviceId: 'quick-booking',
            serviceName: formData.title,
            start: selectedSlot.start.toISOString(),
            end: selectedSlot.end.toISOString(),
            customers: formData.attendeeEmails.split(',').map(email => ({
              emailAddress: email.trim(),
              name: email.trim().split('@')[0]
            }))
          },
          {
            syncAcrossPlatforms: formData.crossPlatformSync,
            enableAgentOrchestration: formData.useAI
          }
        );
      } else {
        // Submit as agent task if no booking business available
        await submitTask({
          type: 'cross_platform_booking',
          priority: 'high',
          data: {
            eventData: {
              subject: formData.title,
              start: { dateTime: selectedSlot.start.toISOString(), timeZone: 'UTC' },
              end: { dateTime: selectedSlot.end.toISOString(), timeZone: 'UTC' },
              attendees: formData.attendeeEmails.split(',').map(email => ({
                emailAddress: { address: email.trim() }
              }))
            },
            platforms: ['microsoft', 'google', 'zoom']
          },
          requiredCapabilities: ['cross_platform_sync', 'microsoft_integration']
        });
      }

      setStep('success');
      
      // Reset form after success
      setTimeout(() => {
        setStep('form');
        setFormData({
          title: '',
          attendeeEmails: '',
          duration: 60,
          preferredDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
          preferredTime: '09:00',
          crossPlatformSync: true,
          useAI: true
        });
        setSelectedSlot(null);
      }, 3000);

    } catch (error) {
      console.error('Failed to create booking:', error);
      setStep('selecting');
    }
  };

  if (step === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Created!</h3>
        <p className="text-gray-600 text-sm">
          Your intelligent booking has been created and synchronized across all platforms.
        </p>
      </div>
    );
  }

  if (step === 'selecting') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Select Optimal Time</h3>
          <button
            onClick={() => setStep('form')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>

        {availabilitySlots.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No available slots found for the specified criteria.</p>
            <button
              onClick={() => setStep('form')}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              Try different parameters
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availabilitySlots.slice(0, 5).map((slot, index) => (
              <div
                key={index}
                onClick={() => setSelectedSlot(slot)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedSlot === slot
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(slot.start, 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(slot.start, 'h:mm a')} - {format(slot.end, 'h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        slot.confidence > 0.8 ? 'bg-green-500' :
                        slot.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="text-xs text-gray-500">
                        {Math.round(slot.confidence * 100)}% match
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedSlot && (
          <button
            onClick={handleQuickBook}
            className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Create Intelligent Booking</span>
          </button>
        )}
      </div>
    );
  }

  if (step === 'analyzing' || step === 'booking') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {step === 'analyzing' ? 'AI Analyzing Availability...' : 'Creating Intelligent Booking...'}
        </h3>
        <p className="text-gray-600 text-sm">
          {step === 'analyzing' 
            ? 'Our agents are finding the optimal time slots across all platforms'
            : 'Coordinating booking across Microsoft, Google, and Zoom platforms'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meeting Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter meeting title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attendee Emails (comma-separated)
        </label>
        <input
          type="text"
          value={formData.attendeeEmails}
          onChange={(e) => setFormData({ ...formData, attendeeEmails: e.target.value })}
          placeholder="email1@example.com, email2@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Date
          </label>
          <input
            type="date"
            value={formData.preferredDate}
            onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Time
          </label>
          <input
            type="time"
            value={formData.preferredTime}
            onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.crossPlatformSync}
            onChange={(e) => setFormData({ ...formData, crossPlatformSync: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Sync across all platforms</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.useAI}
            onChange={(e) => setFormData({ ...formData, useAI: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Use AI optimization</span>
        </label>
      </div>

      <button
        onClick={handleAnalyzeAvailability}
        disabled={!formData.title || !formData.attendeeEmails}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        <Zap className="w-4 h-4" />
        <span>Find Optimal Times with AI</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ==================================================
// UPCOMING EVENTS WIDGET
// ==================================================

interface UpcomingEventsWidgetProps {
  events: any[];
}

const UpcomingEventsWidget: React.FC<UpcomingEventsWidgetProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No upcoming events found</p>
        <p className="text-sm text-gray-400 mt-1">Your calendar is clear for the next week</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.slice(0, 5).map((event, index) => {
        const startTime = new Date(event.start?.dateTime || event.start?.date || '');
        const endTime = new Date(event.end?.dateTime || event.end?.date || '');
        const isAllDay = !event.start?.dateTime;

        return (
          <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {event.subject || 'No Title'}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">
                  {isAllDay 
                    ? format(startTime, 'MMM d') + ' (All day)'
                    : `${format(startTime, 'MMM d, h:mm a')} - ${format(endTime, 'h:mm a')}`
                  }
                </span>
              </div>
              {event.attendees && event.attendees.length > 0 && (
                <div className="flex items-center space-x-1 mt-1">
                  <Users className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              {isToday(startTime) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Today
                </span>
              )}
              {isTomorrow(startTime) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Tomorrow
                </span>
              )}
            </div>
          </div>
        );
      })}

      {events.length > 5 && (
        <div className="text-center pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            and {events.length - 5} more event{events.length - 5 > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

// ==================================================
// AGENT ACTIVITY FEED
// ==================================================

interface AgentActivityFeedProps {
  agentStatus: any;
}

const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({ agentStatus }) => {
  // Simulate recent agent activities for demonstration
  const activities = [
    {
      id: 1,
      agent: 'Scheduling Agent',
      action: 'Analyzed availability for 3 attendees',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      status: 'completed',
      type: 'analysis'
    },
    {
      id: 2,
      agent: 'Coordinator Agent',
      action: 'Synchronized calendar with Google Calendar',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'completed',
      type: 'sync'
    },
    {
      id: 3,
      agent: 'Facilitator Agent',
      action: 'Prepared meeting notes template',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      status: 'completed',
      type: 'preparation'
    },
    {
      id: 4,
      agent: 'Notifier Agent',
      action: 'Sent reminder to john@example.com',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      status: 'completed',
      type: 'notification'
    },
    {
      id: 5,
      agent: 'Analyst Agent',
      action: 'Generated weekly scheduling insights',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      status: 'completed',
      type: 'insights'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <Brain className="w-4 h-4 text-purple-600" />;
      case 'sync': return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case 'preparation': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'notification': return <Users className="w-4 h-4 text-orange-600" />;
      case 'insights': return <TrendingUp className="w-4 h-4 text-indigo-600" />;
      default: return <Zap className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!agentStatus.isInitialized) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm">Initializing AI agents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-700">Recent Activity</span>
        <span className="text-xs text-gray-500">
          {agentStatus.activeAgents} agent{agentStatus.activeAgents !== 1 ? 's' : ''} active
        </span>
      </div>

      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getActivityIcon(activity.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">{activity.action}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">{activity.agent}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                {format(activity.timestamp, 'h:mm a')}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      ))}

      <div className="text-center pt-3 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-700">
          View all activity
        </button>
      </div>
    </div>
  );
};

// ==================================================
// ANALYTICS OVERVIEW
// ==================================================

interface AnalyticsOverviewProps {
  analytics: any;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ analytics }) => {
  const { insights, recommendations } = analytics;

  if (!insights.length && !recommendations.length) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No insights available yet</p>
        <p className="text-sm text-gray-400 mt-1">Book a few meetings to see AI-powered insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {insights.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Key Insights</h4>
          <div className="space-y-2">
            {insights.slice(0, 3).map((insight, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">AI Recommendations</h4>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================================================
// PLATFORM STATUS GRID
// ==================================================

interface PlatformStatusGridProps {
  platforms: any;
}

const PlatformStatusGrid: React.FC<PlatformStatusGridProps> = ({ platforms }) => {
  const platformInfo = {
    microsoft: {
      name: 'Microsoft 365',
      icon: '🔵',
      color: 'blue'
    },
    google: {
      name: 'Google Workspace',
      icon: '🔴',
      color: 'red'
    },
    zoom: {
      name: 'Zoom',
      icon: '🟣',
      color: 'purple'
    }
  };

  return (
    <div className="space-y-3">
      {Object.entries(platforms).map(([key, platform]: [string, any]) => {
        const info = platformInfo[key as keyof typeof platformInfo];
        if (!info) return null;

        return (
          <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{info.icon}</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">{info.name}</p>
                <p className="text-xs text-gray-500">
                  {platform.lastSync 
                    ? `Synced ${format(new Date(platform.lastSync), 'h:mm a')}`
                    : 'Not synced'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                platform.connected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-gray-600">
                {platform.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuickBookingWidget;
export { UpcomingEventsWidget, AgentActivityFeed, AnalyticsOverview, PlatformStatusGrid };