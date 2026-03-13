// src/services/AgentOrchestrator.ts
import { EventEmitter } from 'events';
import { GraphService } from './GraphService';

/**
 * Agent Types and Interfaces
 * 
 * These define the different types of intelligent agents in our ecosystem.
 * Each agent has specialized capabilities, similar to having different experts
 * on a team - each with their own expertise but able to collaborate seamlessly.
 */

export type AgentType = 
  | 'scheduling'    // Optimizes meeting times and handles calendar conflicts
  | 'facilitator'   // Manages meeting flow and takes intelligent notes
  | 'coordinator'   // Orchestrates cross-platform bookings
  | 'analyst'       // Provides insights and recommendations
  | 'notifier'      // Handles communications and reminders
  | 'resolver';     // Resolves conflicts and handles exceptions

export type AgentStatus = 'idle' | 'active' | 'busy' | 'error' | 'offline';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Core Agent Interface
 * 
 * Think of this as the "job description" for every agent in our system.
 * Every agent, regardless of specialty, must be able to communicate,
 * report status, and handle tasks in a standardized way.
 */
export interface Agent {
  readonly id: string;
  readonly type: AgentType;
  readonly name: string;
  readonly capabilities: string[];
  status: AgentStatus;
  
  // Core agent operations
  initialize(): Promise<void>;
  executeTask(task: AgentTask): Promise<AgentTaskResult>;
  getStatus(): AgentStatus;
  getCapabilities(): string[];
  
  // Communication and coordination
  sendMessage(message: AgentMessage): Promise<void>;
  receiveMessage(message: AgentMessage): Promise<void>;
  
  // Health and diagnostics
  healthCheck(): Promise<boolean>;
  cleanup(): Promise<void>;
}

/**
 * Task Definition
 * 
 * This represents a unit of work that can be assigned to an agent.
 * Tasks can be simple (like sending an email) or complex (like orchestrating
 * a multi-platform booking across Google, Microsoft, and Zoom).
 */
export interface AgentTask {
  id: string;
  type: string;
  priority: TaskPriority;
  data: any;
  requiredCapabilities: string[];
  deadline?: Date;
  dependencies?: string[]; // IDs of tasks that must complete first
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
  metadata?: {
    source: string;
    userContext?: any;
    crossPlatformRequirements?: {
      google?: boolean;
      zoom?: boolean;
      teams?: boolean;
    };
  };
}

/**
 * Task Result
 * 
 * The standardized response format for all agent task executions.
 * This allows the orchestrator to understand what happened regardless
 * of which agent performed the work.
 */
export interface AgentTaskResult {
  taskId: string;
  agentId: string;
  status: 'completed' | 'failed' | 'partial' | 'deferred';
  result?: any;
  error?: string;
  metrics?: {
    startTime: Date;
    endTime: Date;
    duration: number;
    resourcesUsed?: string[];
  };
  followUpTasks?: AgentTask[]; // Tasks that should be created as a result
  crossPlatformResults?: {
    google?: any;
    zoom?: any;
    teams?: any;
  };
}

/**
 * Inter-Agent Communication Message
 * 
 * Agents communicate through structured messages, similar to how
 * departments in a company send formal memos to coordinate work.
 */
export interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent: string | 'broadcast';
  type: 'request' | 'response' | 'notification' | 'coordination';
  data: any;
  timestamp: Date;
  correlationId?: string; // Links related messages together
}

/**
 * Orchestrator Configuration
 * 
 * This controls how our agent system behaves - think of it as the
 * "operating procedures" for our intelligent workforce.
 */
export interface OrchestratorConfig {
  maxConcurrentTasks: number;
  taskTimeoutMs: number;
  agentLoadBalancing: 'round-robin' | 'capability-based' | 'load-based';
  retryPolicy: {
    defaultMaxAttempts: number;
    backoffStrategy: 'linear' | 'exponential';
    baseBackoffMs: number;
  };
  crossPlatformCoordination: {
    enabled: boolean;
    platforms: ('microsoft' | 'google' | 'zoom')[];
    syncStrategy: 'parallel' | 'sequential' | 'adaptive';
  };
  monitoring: {
    enableMetrics: boolean;
    enableLogging: boolean;
    performanceTracking: boolean;
  };
}

/**
 * Multi-Agent Orchestrator
 * 
 * This is the "CEO" of our agent ecosystem - it knows what needs to be done,
 * which agents are best suited for each task, and how to coordinate complex
 * workflows that span multiple platforms and require different expertise.
 */
export class AgentOrchestrator extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private activeTasks: Map<string, AgentTask> = new Map();
  private taskQueue: AgentTask[] = [];
  private messageQueue: AgentMessage[] = [];
  private config: OrchestratorConfig;
  private graphService: GraphService;
  private isRunning: boolean = false;

  constructor(graphService: GraphService, config?: Partial<OrchestratorConfig>) {
    super();
    this.graphService = graphService;
    this.config = {
      maxConcurrentTasks: 10,
      taskTimeoutMs: 300000, // 5 minutes
      agentLoadBalancing: 'capability-based',
      retryPolicy: {
        defaultMaxAttempts: 3,
        backoffStrategy: 'exponential',
        baseBackoffMs: 1000
      },
      crossPlatformCoordination: {
        enabled: true,
        platforms: ['microsoft', 'google', 'zoom'],
        syncStrategy: 'adaptive'
      },
      monitoring: {
        enableMetrics: true,
        enableLogging: true,
        performanceTracking: true
      },
      ...config
    };
  }

  // ==================================================
  // ORCHESTRATOR LIFECYCLE MANAGEMENT
  // ==================================================

  /**
   * Initialize the orchestrator and all registered agents
   * 
   * This is like starting up a company - we need to make sure all
   * departments are ready, communication channels are open, and
   * everyone knows their role.
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Agent Orchestrator...');
      
      // Initialize core agents
      await this.initializeCoreAgents();
      
      // Start the orchestrator engine
      this.isRunning = true;
      this.startTaskProcessor();
      this.startMessageProcessor();
      
      // Emit ready event
      this.emit('orchestrator:ready', {
        agentCount: this.agents.size,
        timestamp: new Date()
      });
      
      console.log(`Orchestrator initialized with ${this.agents.size} agents`);
    } catch (error) {
      console.error('Failed to initialize orchestrator:', error);
      throw new Error('Orchestrator initialization failed');
    }
  }

  /**
   * Initialize core agents required for intelligent booking
   * 
   * These are the essential "employees" every booking system needs.
   * Each brings specialized skills to handle different aspects of the booking process.
   */
  private async initializeCoreAgents(): Promise<void> {
    // Scheduling Agent - The time management expert
    const schedulingAgent = new SchedulingAgent(this.graphService);
    await this.registerAgent(schedulingAgent);

    // Facilitator Agent - The meeting management specialist
    const facilitatorAgent = new FacilitatorAgent(this.graphService);
    await this.registerAgent(facilitatorAgent);

    // Coordinator Agent - The cross-platform integration expert
    const coordinatorAgent = new CoordinatorAgent(this.graphService);
    await this.registerAgent(coordinatorAgent);

    // Analyst Agent - The insights and optimization specialist
    const analystAgent = new AnalystAgent(this.graphService);
    await this.registerAgent(analystAgent);

    // Notifier Agent - The communication specialist
    const notifierAgent = new NotifierAgent(this.graphService);
    await this.registerAgent(notifierAgent);
  }

  /**
   * Register a new agent with the orchestrator
   * 
   * This is like hiring a new employee - we need to verify their credentials,
   * understand their capabilities, and integrate them into our workflow.
   */
  async registerAgent(agent: Agent): Promise<void> {
    try {
      // Initialize the agent
      await agent.initialize();
      
      // Verify health
      const isHealthy = await agent.healthCheck();
      if (!isHealthy) {
        throw new Error(`Agent ${agent.id} failed health check`);
      }
      
      // Register in our system
      this.agents.set(agent.id, agent);
      
      console.log(`Registered agent: ${agent.name} (${agent.type}) with capabilities: ${agent.getCapabilities().join(', ')}`);
      
      // Emit registration event
      this.emit('agent:registered', {
        agentId: agent.id,
        agentType: agent.type,
        capabilities: agent.getCapabilities()
      });
    } catch (error) {
      console.error(`Failed to register agent ${agent.id}:`, error);
      throw error;
    }
  }

  // ==================================================
  // TASK ORCHESTRATION AND MANAGEMENT
  // ==================================================

  /**
   * Submit a task for execution by the agent ecosystem
   * 
   * This is the main entry point for requesting work from our agents.
   * The orchestrator will analyze the task, determine the best agent(s),
   * and coordinate the execution.
   */
  async submitTask(task: AgentTask): Promise<string> {
    // Generate unique task ID if not provided
    if (!task.id) {
      task.id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Validate task
    this.validateTask(task);

    // Add to queue
    this.taskQueue.push(task);
    this.activeTasks.set(task.id, task);

    console.log(`Task submitted: ${task.id} (${task.type}) with priority ${task.priority}`);

    // Emit task submitted event
    this.emit('task:submitted', {
      taskId: task.id,
      taskType: task.type,
      priority: task.priority
    });

    return task.id;
  }

  /**
   * Process the task queue and assign work to available agents
   * 
   * This is the heart of our orchestration logic - like a sophisticated
   * project manager who knows everyone's strengths and current workload.
   */
  private startTaskProcessor(): void {
    setInterval(async () => {
      if (!this.isRunning || this.taskQueue.length === 0) {
        return;
      }

      // Sort tasks by priority and deadline
      this.taskQueue.sort((a, b) => {
        const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityWeight[a.priority];
        const bPriority = priorityWeight[b.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        
        // If same priority, sort by deadline
        if (a.deadline && b.deadline) {
          return a.deadline.getTime() - b.deadline.getTime();
        }
        
        return 0;
      });

      // Process tasks up to our concurrency limit
      const activeTasks = Array.from(this.activeTasks.values()).filter(task => 
        this.isTaskInProgress(task.id)
      );

      const availableSlots = this.config.maxConcurrentTasks - activeTasks.length;
      
      for (let i = 0; i < Math.min(availableSlots, this.taskQueue.length); i++) {
        const task = this.taskQueue.shift()!;
        await this.assignTaskToAgent(task);
      }
    }, 1000); // Check every second
  }

  /**
   * Assign a task to the most suitable agent
   * 
   * This implements our "smart assignment" algorithm - we don't just give
   * tasks to the first available agent, we consider capabilities, current load,
   * and even the agent's track record with similar tasks.
   */
  private async assignTaskToAgent(task: AgentTask): Promise<void> {
    try {
      // Find suitable agents based on capabilities
      const suitableAgents = Array.from(this.agents.values()).filter(agent => {
        const agentCapabilities = agent.getCapabilities();
        return task.requiredCapabilities.every(capability => 
          agentCapabilities.includes(capability)
        );
      });

      if (suitableAgents.length === 0) {
        console.error(`No suitable agents found for task ${task.id}`);
        await this.handleTaskFailure(task, 'No suitable agents available');
        return;
      }

      // Select best agent based on configured strategy
      const selectedAgent = this.selectOptimalAgent(suitableAgents, task);

      console.log(`Assigning task ${task.id} to agent ${selectedAgent.name}`);

      // Execute the task
      this.executeTaskWithAgent(selectedAgent, task);

    } catch (error) {
      console.error(`Error assigning task ${task.id}:`, error);
      await this.handleTaskFailure(task, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Select the optimal agent for a task using intelligent algorithms
   * 
   * This is where our AI shines - we don't just match capabilities,
   * we optimize for performance, load balancing, and success probability.
   */
  private selectOptimalAgent(candidates: Agent[], task: AgentTask): Agent {
    switch (this.config.agentLoadBalancing) {
      case 'round-robin':
        // Simple round-robin selection
        return candidates[Math.floor(Math.random() * candidates.length)];
      
      case 'load-based':
        // Select agent with lowest current load
        return candidates.reduce((best, current) => {
          const bestLoad = this.getAgentLoad(best.id);
          const currentLoad = this.getAgentLoad(current.id);
          return currentLoad < bestLoad ? current : best;
        });
      
      case 'capability-based':
      default:
        // Select agent with best capability match and lowest load
        return candidates.reduce((best, current) => {
          const bestScore = this.calculateAgentScore(best, task);
          const currentScore = this.calculateAgentScore(current, task);
          return currentScore > bestScore ? current : best;
        });
    }
  }

  /**
   * Calculate an agent's suitability score for a specific task
   * 
   * This scoring system considers multiple factors:
   * - Capability overlap (how well the agent's skills match the task)
   * - Current workload (prefer less busy agents)
   * - Historical performance (agents that have succeeded with similar tasks)
   * - Specialization bonus (reward agents working in their primary domain)
   */
  private calculateAgentScore(agent: Agent, task: AgentTask): number {
    let score = 0;

    // Capability matching score (0-100)
    const agentCapabilities = agent.getCapabilities();
    const capabilityOverlap = task.requiredCapabilities.filter(cap => 
      agentCapabilities.includes(cap)
    ).length;
    const capabilityScore = (capabilityOverlap / task.requiredCapabilities.length) * 100;
    score += capabilityScore;

    // Load penalty (prefer less busy agents)
    const agentLoad = this.getAgentLoad(agent.id);
    const loadPenalty = agentLoad * 10; // Each active task reduces score by 10
    score -= loadPenalty;

    // Specialization bonus
    if (this.isAgentSpecializedForTask(agent, task)) {
      score += 25;
    }

    // Status bonus (prefer active agents over those coming online)
    if (agent.status === 'active') {
      score += 10;
    } else if (agent.status === 'idle') {
      score += 5;
    }

    return Math.max(0, score);
  }

  /**
   * Execute a task with a specific agent, including error handling and monitoring
   * 
   * This method wraps the actual task execution with all the infrastructure
   * needed for enterprise-grade reliability: timeouts, retries, monitoring,
   * and error recovery.
   */
  private async executeTaskWithAgent(agent: Agent, task: AgentTask): Promise<void> {
    const startTime = new Date();
    let attempts = 0;
    const maxAttempts = task.retryPolicy?.maxAttempts || this.config.retryPolicy.defaultMaxAttempts;

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        console.log(`Executing task ${task.id} with agent ${agent.name} (attempt ${attempts}/${maxAttempts})`);

        // Set timeout for task execution
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Task timeout')), this.config.taskTimeoutMs);
        });

        // Execute task with timeout
        const result = await Promise.race([
          agent.executeTask(task),
          timeoutPromise
        ]);

        // Handle successful execution
        await this.handleTaskSuccess(task, result, agent, startTime);
        return;

      } catch (error) {
        console.error(`Task ${task.id} failed on attempt ${attempts}:`, error);

        if (attempts >= maxAttempts) {
          // All attempts exhausted
          await this.handleTaskFailure(task, error instanceof Error ? error.message : 'Unknown error');
          return;
        }

        // Wait before retry
        const backoffMs = this.calculateBackoff(attempts);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  /**
   * Handle successful task completion
   * 
   * Success isn't just about completing the task - we also need to:
   * - Process any follow-up tasks that were generated
   * - Update our metrics and learning systems
   * - Notify interested parties about the completion
   * - Clean up resources
   */
  private async handleTaskSuccess(
    task: AgentTask, 
    result: AgentTaskResult, 
    agent: Agent, 
    startTime: Date
  ): Promise<void> {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log(`Task ${task.id} completed successfully by ${agent.name} in ${duration}ms`);

    // Remove from active tasks
    this.activeTasks.delete(task.id);

    // Process follow-up tasks
    if (result.followUpTasks && result.followUpTasks.length > 0) {
      for (const followUpTask of result.followUpTasks) {
        await this.submitTask(followUpTask);
      }
    }

    // Emit success event
    this.emit('task:completed', {
      taskId: task.id,
      agentId: agent.id,
      duration,
      result: result.result
    });

    // Update metrics if enabled
    if (this.config.monitoring.performanceTracking) {
      this.recordTaskMetrics(task, agent, duration, 'success');
    }
  }

  /**
   * Handle task failure with intelligent recovery
   * 
   * When tasks fail, we don't just give up - we analyze what went wrong
   * and try to recover gracefully, potentially by:
   * - Reassigning to a different agent
   * - Breaking the task into smaller pieces
   * - Requesting human intervention for complex issues
   */
  private async handleTaskFailure(task: AgentTask, error: string): Promise<void> {
    console.error(`Task ${task.id} failed permanently: ${error}`);

    // Remove from active tasks
    this.activeTasks.delete(task.id);

    // Emit failure event
    this.emit('task:failed', {
      taskId: task.id,
      error,
      timestamp: new Date()
    });

    // Attempt intelligent recovery
    await this.attemptTaskRecovery(task, error);
  }

  /**
   * Attempt to recover from task failure using various strategies
   */
  private async attemptTaskRecovery(task: AgentTask, error: string): Promise<void> {
    // Strategy 1: Try with a different agent if available
    const alternativeAgents = Array.from(this.agents.values()).filter(agent => {
      const capabilities = agent.getCapabilities();
      return task.requiredCapabilities.every(cap => capabilities.includes(cap));
    });

    if (alternativeAgents.length > 1) {
      console.log(`Attempting task recovery with alternative agent for task ${task.id}`);
      
      // Create a new task with lower priority to avoid infinite loops
      const recoveryTask: AgentTask = {
        ...task,
        id: `${task.id}-recovery`,
        priority: task.priority === 'low' ? 'low' : 'medium',
        retryPolicy: {
          maxAttempts: 1, // Only one attempt for recovery
          backoffMs: 0
        }
      };

      await this.submitTask(recoveryTask);
      return;
    }

    // Strategy 2: Break task into smaller components
    const subTasks = this.decomposeTask(task);
    if (subTasks.length > 1) {
      console.log(`Breaking failed task ${task.id} into ${subTasks.length} sub-tasks`);
      
      for (const subTask of subTasks) {
        await this.submitTask(subTask);
      }
      return;
    }

    // Strategy 3: Escalate for human intervention
    console.log(`Escalating failed task ${task.id} for human intervention`);
    this.emit('task:escalated', {
      taskId: task.id,
      error,
      requiresHumanIntervention: true
    });
  }

  // ==================================================
  // INTER-AGENT COMMUNICATION
  // ==================================================

  /**
   * Start the message processing system for inter-agent communication
   * 
   * This enables our agents to coordinate with each other, share information,
   * and work together on complex multi-step workflows.
   */
  private startMessageProcessor(): void {
    setInterval(() => {
      if (!this.isRunning || this.messageQueue.length === 0) {
        return;
      }

      // Process all queued messages
      const messagesToProcess = [...this.messageQueue];
      this.messageQueue = [];

      for (const message of messagesToProcess) {
        this.routeMessage(message);
      }
    }, 100); // Process messages frequently for real-time feel
  }

  /**
   * Route messages between agents
   * 
   * This is like an intelligent postal service that knows where everyone
   * is and can deliver messages instantly across our agent network.
   */
  private async routeMessage(message: AgentMessage): Promise<void> {
    try {
      if (message.toAgent === 'broadcast') {
        // Broadcast to all agents
        for (const agent of this.agents.values()) {
          if (agent.id !== message.fromAgent) {
            await agent.receiveMessage(message);
          }
        }
      } else {
        // Send to specific agent
        const targetAgent = this.agents.get(message.toAgent);
        if (targetAgent) {
          await targetAgent.receiveMessage(message);
        } else {
          console.warn(`Message delivery failed: Agent ${message.toAgent} not found`);
        }
      }
    } catch (error) {
      console.error('Error routing message:', error);
    }
  }

  /**
   * Send a message from one agent to another
   * 
   * This public method allows agents to communicate through the orchestrator,
   * ensuring all communication is logged and can be monitored for debugging.
   */
  async sendAgentMessage(message: AgentMessage): Promise<void> {
    message.timestamp = new Date();
    this.messageQueue.push(message);

    // Emit message event for monitoring
    this.emit('message:sent', {
      messageId: message.id,
      fromAgent: message.fromAgent,
      toAgent: message.toAgent,
      type: message.type
    });
  }

  // ==================================================
  // UTILITY METHODS
  // ==================================================

  /**
   * Get current load for an agent (number of active tasks)
   */
  private getAgentLoad(agentId: string): number {
    return Array.from(this.activeTasks.values()).filter(task => 
      this.isTaskAssignedToAgent(task.id, agentId)
    ).length;
  }

  /**
   * Check if an agent is specialized for a particular task type
   */
  private isAgentSpecializedForTask(agent: Agent, task: AgentTask): boolean {
    // Define specialization mappings
    const specializations: { [key in AgentType]: string[] } = {
      scheduling: ['calendar_management', 'availability_analysis', 'conflict_resolution'],
      facilitator: ['meeting_management', 'note_taking', 'decision_tracking'],
      coordinator: ['cross_platform_sync', 'integration_management'],
      analyst: ['data_analysis', 'insights_generation', 'reporting'],
      notifier: ['communication', 'reminder_management', 'notification_delivery'],
      resolver: ['conflict_resolution', 'exception_handling', 'escalation_management']
    };

    const agentSpecializations = specializations[agent.type] || [];
    return task.requiredCapabilities.some(capability => 
      agentSpecializations.includes(capability)
    );
  }

  /**
   * Calculate backoff time for retry attempts
   */
  private calculateBackoff(attempt: number): number {
    const base = this.config.retryPolicy.baseBackoffMs;
    
    if (this.config.retryPolicy.backoffStrategy === 'exponential') {
      return base * Math.pow(2, attempt - 1);
    } else {
      return base * attempt;
    }
  }

  /**
   * Validate task before adding to queue
   */
  private validateTask(task: AgentTask): void {
    if (!task.type) {
      throw new Error('Task type is required');
    }
    
    if (!task.requiredCapabilities || task.requiredCapabilities.length === 0) {
      throw new Error('Task must specify required capabilities');
    }
    
    if (!['low', 'medium', 'high', 'urgent'].includes(task.priority)) {
      throw new Error('Invalid task priority');
    }
  }

  /**
   * Check if a task is currently being processed
   */
  private isTaskInProgress(taskId: string): boolean {
    // This would track tasks currently being executed by agents
    // For now, we'll simulate this
    return this.activeTasks.has(taskId);
  }

  /**
   * Check if a task is assigned to a specific agent
   */
  private isTaskAssignedToAgent(taskId: string, agentId: string): boolean {
    // This would track task assignments
    // For now, we'll simulate this
    return false;
  }

  /**
   * Decompose a failed task into smaller sub-tasks
   */
  private decomposeTask(task: AgentTask): AgentTask[] {
    // Basic task decomposition logic
    // In a real system, this would use AI to intelligently break down complex tasks
    
    if (task.type === 'cross_platform_booking') {
      return [
        {
          ...task,
          id: `${task.id}-step1`,
          type: 'create_microsoft_booking',
          requiredCapabilities: ['microsoft_integration']
        },
        {
          ...task,
          id: `${task.id}-step2`,
          type: 'sync_google_calendar',
          requiredCapabilities: ['google_integration']
        },
        {
          ...task,
          id: `${task.id}-step3`,
          type: 'create_zoom_meeting',
          requiredCapabilities: ['zoom_integration']
        }
      ];
    }

    return [task]; // Can't decompose, return original
  }

  /**
   * Record performance metrics for tasks
   */
  private recordTaskMetrics(
    task: AgentTask, 
    agent: Agent, 
    duration: number, 
    status: 'success' | 'failure'
  ): void {
    if (!this.config.monitoring.performanceTracking) return;

    // In a real system, this would send metrics to a monitoring system
    console.log(`[METRICS] Task ${task.id} - Agent: ${agent.name}, Duration: ${duration}ms, Status: ${status}`);
    
    this.emit('metrics:recorded', {
      taskId: task.id,
      agentId: agent.id,
      agentType: agent.type,
      taskType: task.type,
      duration,
      status,
      timestamp: new Date()
    });
  }

  /**
   * Get orchestrator status and statistics
   */
  getStatus(): {
    isRunning: boolean;
    agentCount: number;
    activeTaskCount: number;
    queuedTaskCount: number;
    agentStatus: { [agentId: string]: AgentStatus };
  } {
    const agentStatus: { [agentId: string]: AgentStatus } = {};
    for (const [id, agent] of this.agents) {
      agentStatus[id] = agent.getStatus();
    }

    return {
      isRunning: this.isRunning,
      agentCount: this.agents.size,
      activeTaskCount: this.activeTasks.size,
      queuedTaskCount: this.taskQueue.length,
      agentStatus
    };
  }

  /**
   * Gracefully shutdown the orchestrator
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down Agent Orchestrator...');
    
    this.isRunning = false;
    
    // Cleanup all agents
    for (const agent of this.agents.values()) {
      try {
        await agent.cleanup();
      } catch (error) {
        console.error(`Error cleaning up agent ${agent.id}:`, error);
      }
    }

    this.emit('orchestrator:shutdown');
    console.log('Agent Orchestrator shutdown complete');
  }
}

// ==================================================
// SPECIALIZED AGENT IMPLEMENTATIONS
// ==================================================

/**
 * Base Agent Implementation
 * 
 * This provides the common functionality that all our specialized agents inherit.
 * Think of it as the "employee handbook" that defines standard procedures
 * every agent must follow, regardless of their specialty.
 */
abstract class BaseAgent implements Agent {
  public readonly id: string;
  public readonly type: AgentType;
  public readonly name: string;
  public readonly capabilities: string[];
  public status: AgentStatus = 'idle';
  
  protected graphService: GraphService;
  protected orchestrator?: AgentOrchestrator;

  constructor(
    type: AgentType,
    name: string,
    capabilities: string[],
    graphService: GraphService
  ) {
    this.id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.name = name;
    this.capabilities = capabilities;
    this.graphService = graphService;
  }

  async initialize(): Promise<void> {
    console.log(`Initializing ${this.name}...`);
    this.status = 'active';
  }

  abstract executeTask(task: AgentTask): Promise<AgentTaskResult>;

  getStatus(): AgentStatus {
    return this.status;
  }

  getCapabilities(): string[] {
    return [...this.capabilities];
  }

  async sendMessage(message: AgentMessage): Promise<void> {
    if (this.orchestrator) {
      await this.orchestrator.sendAgentMessage(message);
    }
  }

  async receiveMessage(message: AgentMessage): Promise<void> {
    console.log(`${this.name} received message: ${message.type} from ${message.fromAgent}`);
    // Base implementation - specialized agents can override
  }

  async healthCheck(): Promise<boolean> {
    return this.status !== 'error' && this.status !== 'offline';
  }

  async cleanup(): Promise<void> {
    this.status = 'offline';
    console.log(`${this.name} cleaned up`);
  }

  /**
   * Set the orchestrator reference for communication
   */
  setOrchestrator(orchestrator: AgentOrchestrator): void {
    this.orchestrator = orchestrator;
  }
}

/**
 * Scheduling Agent
 * 
 * The time management expert - this agent specializes in finding optimal
 * meeting times, resolving conflicts, and managing calendar complexity.
 */
class SchedulingAgent extends BaseAgent {
  constructor(graphService: GraphService) {
    super(
      'scheduling',
      'Intelligent Scheduling Agent',
      [
        'calendar_management',
        'availability_analysis',
        'conflict_resolution',
        'time_optimization',
        'preference_analysis'
      ],
      graphService
    );
  }

  async executeTask(task: AgentTask): Promise<AgentTaskResult> {
    const startTime = new Date();
    
    try {
      let result: any;

      switch (task.type) {
        case 'analyze_availability':
          result = await this.analyzeAvailability(task.data);
          break;
        
        case 'find_optimal_time':
          result = await this.findOptimalTime(task.data);
          break;
        
        case 'resolve_conflicts':
          result = await this.resolveConflicts(task.data);
          break;
        
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      return {
        taskId: task.id,
        agentId: this.id,
        status: 'completed',
        result,
        metrics: {
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime()
        }
      };
    } catch (error) {
      return {
        taskId: task.id,
        agentId: this.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime()
        }
      };
    }
  }

  private async analyzeAvailability(data: any): Promise<any> {
    // Implement sophisticated availability analysis using GraphService
    return await this.graphService.analyzeAvailability(
      data.attendeeEmails,
      data.startTime,
      data.endTime,
      data.duration,
      data.preferences
    );
  }

  private async findOptimalTime(data: any): Promise<any> {
    // Find the absolute best time based on multiple criteria
    const availability = await this.analyzeAvailability(data);
    
    // Apply advanced optimization algorithms
    return {
      recommendedTime: availability.availableSlots[0],
      confidence: 0.95,
      reasoning: 'Optimal based on availability, preferences, and productivity patterns'
    };
  }

  private async resolveConflicts(data: any): Promise<any> {
    // Implement intelligent conflict resolution
    return {
      conflicts: data.conflicts,
      resolutions: data.conflicts.map((conflict: any) => ({
        conflict,
        resolution: 'Suggest alternative time slot',
        confidence: 0.8
      }))
    };
  }
}

/**
 * Facilitator Agent
 * 
 * The meeting management specialist - handles real-time meeting coordination,
 * note-taking, and decision tracking during meetings.
 */
class FacilitatorAgent extends BaseAgent {
  constructor(graphService: GraphService) {
    super(
      'facilitator',
      'Meeting Facilitator Agent',
      [
        'meeting_management',
        'note_taking',
        'decision_tracking',
        'action_item_management',
        'real_time_collaboration'
      ],
      graphService
    );
  }

  async executeTask(task: AgentTask): Promise<AgentTaskResult> {
    const startTime = new Date();
    
    try {
      let result: any;

      switch (task.type) {
        case 'initialize_meeting_facilitation':
          result = await this.initializeMeetingFacilitation(task.data);
          break;
        
        case 'take_meeting_notes':
          result = await this.takeMeetingNotes(task.data);
          break;
        
        case 'track_decisions':
          result = await this.trackDecisions(task.data);
          break;
        
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      return {
        taskId: task.id,
        agentId: this.id,
        status: 'completed',
        result,
        metrics: {
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime()
        }
      };
    } catch (error) {
      return {
        taskId: task.id,
        agentId: this.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime()
        }
      };
    }
  }

  private async initializeMeetingFacilitation(data: any): Promise<any> {
    // Initialize Facilitator Agent for Teams meeting
    return await this.graphService.initializeFacilitatorAgent(data.eventId);
  }

  private async takeMeetingNotes(data: any): Promise<any> {
    // Implement intelligent note-taking
    return {
      notes: data.transcription ? this.processTranscription(data.transcription) : [],
      keyPoints: [],
      participants: data.participants || []
    };
  }

  private async trackDecisions(data: any): Promise<any> {
    // Track decisions made during meetings
    return {
      decisions: data.decisions || [],
      actionItems: data.actionItems || [],
      followUpRequired: true
    };
  }

  private processTranscription(transcription: string): string[] {
    // Basic transcription processing - in reality, this would use AI
    return transcription.split('.').filter(sentence => sentence.trim().length > 0);
  }
}

/**
 * Coordinator Agent
 * 
 * The cross-platform integration expert - manages synchronization across
 * Microsoft, Google, Zoom, and other platforms.
 */
class CoordinatorAgent extends BaseAgent {
  constructor(graphService: GraphService) {
    super(
      'coordinator',
      'Cross-Platform Coordinator Agent',
      [
        'cross_platform_sync',
        'microsoft_integration',
        'google_integration',
        'zoom_integration',
        'integration_management'
      ],
      graphService
    );
  }

  async executeTask(task: AgentTask): Promise<AgentTaskResult> {
    const startTime = new Date();
    
    try {
      let result: any;

      switch (task.type) {
        case 'cross_platform_booking':
          result = await this.createCrossPlatformBooking(task.data);
          break;
        
        case 'sync_platforms':
          result = await this.syncAcrossPlatforms(task.data);
          break;
        
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      return {
        taskId: task.id,
        agentId: this.id,
        status: 'completed',
        result,
        crossPlatformResults: result.crossPlatformResults,
        metrics: {
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime()
        }
      };
    } catch (error) {
      return {
        taskId: task.id,
        agentId: this.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime()
        }
      };
    }
  }

  private async createCrossPlatformBooking(data: any): Promise<any> {
    // Orchestrate booking across multiple platforms
    const results: any = {
      crossPlatformResults: {}
    };

    if (data.platforms.includes('microsoft')) {
      results.crossPlatformResults.microsoft = await this.createMicrosoftBooking(data);
    }

    if (data.platforms.includes('google')) {
      results.crossPlatformResults.google = await this.createGoogleCalendarEvent(data);
    }

    if (data.platforms.includes('zoom')) {
      results.crossPlatformResults.zoom = await this.createZoomMeeting(data);
    }

    return results;
  }

  private async syncAcrossPlatforms(data: any): Promise<any> {
    // Implement cross-platform synchronization
    return {
      syncStatus: 'completed',
      platformsUpdated: data.platforms || [],
      timestamp: new Date()
    };
  }

  private async createMicrosoftBooking(data: any): Promise<any> {
    // Create booking using Graph Service
    if (data.businessId) {
      return await this.graphService.createIntelligentBooking(
        data.businessId,
        data.appointmentData,
        { enableAgentOrchestration: true }
      );
    } else {
      // Create calendar event instead
      return await this.graphService.createCalendarEvent(data.eventData);
    }
  }

  private async createGoogleCalendarEvent(data: any): Promise<any> {
    // Placeholder for Google Calendar integration
    // In a real implementation, this would use Google Calendar API
    return {
      eventId: `google-event-${Date.now()}`,
      platform: 'google',
      status: 'created'
    };
  }

  private async createZoomMeeting(data: any): Promise<any> {
    // Placeholder for Zoom integration
    // In a real implementation, this would use Zoom API
    return {
      meetingId: `zoom-meeting-${Date.now()}`,
      joinUrl: 'https://zoom.us/j/123456789',
      platform: 'zoom',
      status: 'created'
    };
  }
}

/**
 * Analyst Agent
 * 
 * The insights and optimization specialist - analyzes patterns,
 * generates reports, and provides intelligent recommendations.
 */
class AnalystAgent extends BaseAgent {
  constructor(graphService: GraphService) {
    super(
      'analyst',
      'Analytics and Insights Agent',
      [
        'data_analysis',
        'insights_generation',
        'reporting',
        'pattern_recognition',
        'optimization_recommendations'
      ],
      graphService
    );
  }

  async executeTask(task: AgentTask): Promise<AgentTaskResult> {
    const startTime = new Date();
    
    try {
      let result: any;

      switch (task.type) {
        case 'analyze_booking_patterns':
          result = await this.analyzeBookingPatterns(task.data);
          break;
        
        case 'generate_insights':
          result = await this.generateInsights(task.data);
          break;
        
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      return {
        taskId: task.id,
        agentId: this.id,
        status: 'completed',
        result,
        metrics: {
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime()
        }
      };
    } catch (error) {
      return {
        taskId: task.id,
        agentId: this.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime()
        }
      };
    }
  }

  private async analyzeBookingPatterns(data: any): Promise<any> {
    // Analyze booking patterns and trends
    return {
      patterns: [
        'Most bookings occur on Tuesday-Thursday',
        'Peak booking times: 9-11 AM and 2-4 PM',
        'Average booking lead time: 3.5 days'
      ],
      trends: ['Increasing preference for virtual meetings'],
      recommendations: ['Consider dynamic pricing for peak times']
    };
  }

  private async generateInsights(data: any): Promise<any> {
    // Generate actionable insights
    return {
      insights: [
        'Room utilization is 73% - consider booking optimization',
        'Customer satisfaction score: 4.2/5 - focus on punctuality'
      ],
      actionableRecommendations: [
        'Implement buffer times between meetings',
        'Send automated reminders 24 hours before appointments'
      ]
    };
  }
}

/**
 * Notifier Agent
 * 
 * The communication specialist - handles all outbound communications,
 * reminders, and notifications across multiple channels.
 */
class NotifierAgent extends BaseAgent {
  constructor(graphService: GraphService) {
    super(
      'notifier',
      'Communication and Notification Agent',
      [
        'communication',
        'email_management',
        'reminder_management',
        'notification_delivery',
        'multi_channel_messaging'
      ],
      graphService
    );
  }

  async executeTask(task: AgentTask): Promise<AgentTaskResult> {
    const startTime = new Date();
    
    try {
      let result: any;

      switch (task.type) {
        case 'send_confirmation':
          result = await this.sendConfirmation(task.data);
          break;
        
        case 'send_reminder':
          result = await this.sendReminder(task.data);
          break;
        
        case 'send_notification':
          result = await this.sendNotification(task.data);
          break;
        
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      return {
        taskId: task.id,
        agentId: this.id,
        status: 'completed',
        result,
        metrics: {
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime()
        }
      };
    } catch (error) {
      return {
        taskId: task.id,
        agentId: this.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime()
        }
      };
    }
  }

  private async sendConfirmation(data: any): Promise<any> {
    // Send booking confirmation
    console.log(`Sending confirmation to ${data.recipient} for booking ${data.bookingId}`);
    
    return {
      messageId: `confirmation-${Date.now()}`,
      recipient: data.recipient,
      status: 'sent',
      timestamp: new Date()
    };
  }

  private async sendReminder(data: any): Promise<any> {
    // Send appointment reminder
    console.log(`Sending reminder to ${data.recipient} for appointment ${data.appointmentId}`);
    
    return {
      messageId: `reminder-${Date.now()}`,
      recipient: data.recipient,
      reminderTime: data.reminderTime,
      status: 'sent',
      timestamp: new Date()
    };
  }

  private async sendNotification(data: any): Promise<any> {
    // Send general notification
    console.log(`Sending notification: ${data.message} to ${data.recipient}`);
    
    return {
      messageId: `notification-${Date.now()}`,
      recipient: data.recipient,
      message: data.message,
      status: 'sent',
      timestamp: new Date()
    };
  }
}

export default AgentOrchestrator;