// src/components/Dashboard/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Brain, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Globe,
  RefreshCw,
  Plus,
  ArrowRight
} from 'lucide-react';
import { format, addDays, isToday, isTomorrow } from 'date-fns';

import { useBookingStore, useCalendar, useAgents, useAnalytics, usePlatforms } from '../../store/useBookingStore';
import QuickBookingWidget from './QuickBookingWidget';
import UpcomingEventsWidget from './UpcomingEventsWidget';
import AgentActivityFeed from './AgentActivityFeed';
import AnalyticsOverview from './AnalyticsOverview';
import PlatformStatusGrid from './PlatformStatusGrid';

/**
 * Dashboard Component
 * 
 * This is the command center of our intelligent booking system.
 * It provides users with a comprehensive overview of their scheduling ecosystem,
 * agent activities, cross-platform integrations, and actionable insights.
 * 
 * Think of this as an air traffic control tower - everything important
 * is visible at a glance, with quick access to detailed information.
 */
const Dashboard: React.FC = () => {
  const { setCurrentView } = useBookingStore();
  const { upcomingEvents, loadEvents, selectedDate, setSelectedDate } = useCalendar();
  const { agentStatus, updateStatus } = useAgents();
  const { analytics, generateInsights } = useAnalytics();
  const { platforms, syncAllPlatforms } = usePlatforms();

  // Local state for dashboard-specific features
  const [refreshing, setRefreshing] = useState(false);
  const [quickStatsTimeframe, setQuickStatsTimeframe] = useState<'today' | 'week' | 'month'>('today');

  /**
   * Initialize dashboard data
   * 
   * When users land on the dashboard, we want to immediately provide
   * them with fresh, relevant information about their scheduling landscape.
   */
  useEffect(() => {
    const initializeDashboard = async () => {
      // Load upcoming events for the next 7 days
      const startDate = new Date();
      const endDate = addDays(new Date(), 7);
      await loadEvents(startDate, endDate);

      // Generate fresh insights
      await generateInsights();

      // Update agent status
      await updateStatus();
    };

    initializeDashboard();
  }, []);

  /**
   * Refresh all dashboard data
   * 
   * This provides users with a manual refresh option to ensure
   * they always have the latest information across all platforms.
   */
  const handleRefreshAll = async () => {
    setRefreshing(true);
    
    try {
      // Refresh events
      const startDate = new Date();
      const endDate = addDays(new Date(), 7);
      await loadEvents(startDate, endDate);

      // Sync all platforms
      await syncAllPlatforms();

      // Update agent status
      await updateStatus();

      // Regenerate insights
      await generateInsights();

    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Calculate quick statistics based on current data
   * 
   * These provide immediate insight into the user's scheduling patterns
   * and system performance.
   */
  const calculateQuickStats = () => {
    const now = new Date();
    const filteredEvents = upcomingEvents.filter(event => {
      const eventDate = new Date(event.start?.dateTime || event.start?.date || '');
      
      switch (quickStatsTimeframe) {
        case 'today':
          return isToday(eventDate);
        case 'week':
          const weekFromNow = addDays(now, 7);
          return eventDate >= now && eventDate <= weekFromNow;
        case 'month':
          const monthFromNow = addDays(now, 30);
          return eventDate >= now && eventDate <= monthFromNow;
        default:
          return false;
      }
    });

    const connectedPlatforms = Object.values(platforms).filter(p => p.connected).length;
    const totalPlatforms = Object.keys(platforms).length;

    return {
      upcomingMeetings: filteredEvents.length,
      connectedPlatforms,
      totalPlatforms,
      agentHealth: agentStatus.isInitialized ? 'Healthy' : 'Initializing',
      automationLevel: agentStatus.activeTasks > 0 ? 'Active' : 'Standby'
    };
  };

  const stats = calculateQuickStats();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Your intelligent booking command center
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Timeframe Selector */}
          <select 
            value={quickStatsTimeframe}
            onChange={(e) => setQuickStatsTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh All</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Upcoming Meetings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Meetings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.upcomingMeetings}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {quickStatsTimeframe === 'today' ? 'today' : `this ${quickStatsTimeframe}`}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Platform Connectivity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Connected Platforms</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.connectedPlatforms}/{stats.totalPlatforms}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.connectedPlatforms === stats.totalPlatforms ? 'All synced' : 'Partial sync'}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Globe className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Agent Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">AI Agents</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {agentStatus.activeAgents}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.agentHealth}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Automation Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {agentStatus.activeTasks}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.automationLevel}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Primary Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Booking Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Quick Booking</h2>
                <button
                  onClick={() => setCurrentView('booking')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                >
                  <span>Advanced Booking</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <QuickBookingWidget />
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
                <button
                  onClick={() => setCurrentView('calendar')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                >
                  <span>View Calendar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <UpcomingEventsWidget events={upcomingEvents} />
            </div>
          </div>

          {/* Analytics Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Insights & Analytics</h2>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <AnalyticsOverview analytics={analytics} />
            </div>
          </div>
        </div>

        {/* Right Column - Status & Activity */}
        <div className="space-y-6">
          {/* Platform Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Platform Status</h2>
            </div>
            <div className="p-6">
              <PlatformStatusGrid platforms={platforms} />
            </div>
          </div>

          {/* Agent Activity Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Agent Activity</h2>
            </div>
            <div className="p-6">
              <AgentActivityFeed agentStatus={agentStatus} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => setCurrentView('booking')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">New Booking</p>
                  <p className="text-sm text-gray-600">Create intelligent booking</p>
                </div>
              </button>

              <button
                onClick={() => generateInsights()}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Generate Insights</p>
                  <p className="text-sm text-gray-600">Analyze booking patterns</p>
                </div>
              </button>

              <button
                onClick={() => syncAllPlatforms()}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Sync Platforms</p>
                  <p className="text-sm text-gray-600">Update all integrations</p>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('settings')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-900">Agent Settings</p>
                  <p className="text-sm text-gray-600">Configure AI behavior</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Banner */}
      {(!agentStatus.isInitialized || Object.values(platforms).some(p => !p.connected)) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                System Status Alert
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {!agentStatus.isInitialized && "AI agents are still initializing. "}
                {Object.values(platforms).some(p => !p.connected) && "Some platforms are not connected. "}
                Full functionality may be limited.
              </p>
            </div>
            <button
              onClick={handleRefreshAll}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;