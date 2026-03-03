/**
 * teams-ai-copilot-studio.ts
 *
 * Demonstrates the MAD-Scheduler pattern: a Teams AI application delegates
 * conversation turns to a Copilot Studio agent using CopilotStudioClient.
 *
 * Prerequisites:
 *   npm install @microsoft/agents-botframework @azure/identity botbuilder
 *
 * Environment variables:
 *   MICROSOFT_APP_ID          - Azure Bot registration application ID
 *   MICROSOFT_APP_TENANT_ID   - Azure AD tenant ID
 *   MICROSOFT_APP_SECRET      - Client secret or certificate reference
 *   COPILOT_STUDIO_BOT_ID     - Copilot Studio agent bot identifier
 *   COPILOT_STUDIO_TENANT_ID  - Tenant hosting the Copilot Studio agent
 *   DIRECT_LINE_SECRET        - Direct Line channel secret for the Copilot Studio agent
 */

import { ActivityHandler, BotFrameworkAdapter, ConversationState, MemoryStorage, StatePropertyAccessor, TurnContext } from "botbuilder";
import { ClientSecretCredential } from "@azure/identity";
import * as https from "https";

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

interface SessionRecord {
  copilotSessionId: string;
  conversationId: string;
  token: string;
  tokenExpiry: number;
}

interface DirectLineConversation {
  conversationId: string;
  token: string;
  streamUrl: string;
  expires_in: number;
}

interface DirectLineActivity {
  type: string;
  id?: string;
  text?: string;
  value?: unknown;
  attachments?: unknown[];
  suggestedActions?: unknown;
}

interface DirectLineActivitySet {
  activities: DirectLineActivity[];
  watermark?: string;
}

// ---------------------------------------------------------------------------
// CopilotStudioClient
//
// Manages Direct Line sessions to a Copilot Studio agent.
// ---------------------------------------------------------------------------

export class CopilotStudioClient {
  private readonly directLineSecret: string;
  private readonly baseUrl = "https://directline.botframework.com/v3/directline";

  constructor(directLineSecret: string) {
    if (!directLineSecret) {
      throw new Error("directLineSecret is required");
    }
    this.directLineSecret = directLineSecret;
  }

  /**
   * Opens a new Direct Line conversation session with the Copilot Studio agent.
   * Returns the session record containing the conversation ID and short-lived token.
   */
  async startConversation(): Promise<SessionRecord> {
    const response = await this.post<DirectLineConversation>(
      `${this.baseUrl}/conversations`,
      null,
      `Bearer ${this.directLineSecret}`
    );

    return {
      copilotSessionId: response.conversationId,
      conversationId: response.conversationId,
      token: response.token,
      tokenExpiry: Date.now() + (response.expires_in - 60) * 1000, // refresh 60 s early
    };
  }

  /**
   * Refreshes a Direct Line token before it expires.
   * Call this proactively when tokenExpiry is within 5 minutes.
   */
  async refreshToken(currentToken: string): Promise<Pick<SessionRecord, "token" | "tokenExpiry">> {
    const response = await this.post<{ token: string; expires_in: number }>(
      `${this.baseUrl}/tokens/refresh`,
      null,
      `Bearer ${currentToken}`
    );

    return {
      token: response.token,
      tokenExpiry: Date.now() + (response.expires_in - 60) * 1000,
    };
  }

  /**
   * Sends a text message to the Copilot Studio agent within the given session.
   * Returns the activity ID assigned by Direct Line.
   */
  async sendMessage(
    session: SessionRecord,
    text: string,
    userId: string,
    userName: string
  ): Promise<string> {
    const activity: DirectLineActivity = {
      type: "message",
      text,
      value: undefined,
      attachments: [],
    };

    const body = {
      ...activity,
      from: { id: userId, name: userName },
    };

    const response = await this.post<{ id: string }>(
      `${this.baseUrl}/conversations/${session.conversationId}/activities`,
      body,
      `Bearer ${session.token}`
    );

    return response.id;
  }

  /**
   * Sends a structured event activity to the Copilot Studio agent.
   * Useful for passing machine-readable context alongside a user message.
   */
  async sendEvent(
    session: SessionRecord,
    name: string,
    value: unknown,
    userId: string
  ): Promise<string> {
    const body = {
      type: "event",
      name,
      value,
      from: { id: userId },
    };

    const response = await this.post<{ id: string }>(
      `${this.baseUrl}/conversations/${session.conversationId}/activities`,
      body,
      `Bearer ${session.token}`
    );

    return response.id;
  }

  /**
   * Polls for new activities from the Copilot Studio agent.
   * Pass the watermark from the previous poll to retrieve only new activities.
   */
  async getActivities(
    session: SessionRecord,
    watermark?: string
  ): Promise<DirectLineActivitySet> {
    const url = watermark
      ? `${this.baseUrl}/conversations/${session.conversationId}/activities?watermark=${encodeURIComponent(watermark)}`
      : `${this.baseUrl}/conversations/${session.conversationId}/activities`;

    return this.get<DirectLineActivitySet>(url, `Bearer ${session.token}`);
  }

  /**
   * Waits for the Copilot Studio agent to respond after a sent message.
   * Polls until at least one response activity arrives or the timeout elapses.
   *
   * @param session       - Active session record
   * @param afterActivityId - ID of the sent activity; wait for responses after it
   * @param timeoutMs     - Maximum wait time in milliseconds (default 15 000)
   * @param pollIntervalMs - Polling interval in milliseconds (default 1 000)
   */
  async waitForResponse(
    session: SessionRecord,
    afterActivityId: string,
    timeoutMs = 15000,
    pollIntervalMs = 1000
  ): Promise<DirectLineActivity[]> {
    const deadline = Date.now() + timeoutMs;
    let watermark: string | undefined;
    let foundSent = false;
    const responses: DirectLineActivity[] = [];

    while (Date.now() < deadline) {
      await delay(pollIntervalMs);

      const result = await this.getActivities(session, watermark);
      watermark = result.watermark;

      for (const activity of result.activities) {
        if (!foundSent) {
          if (activity.id === afterActivityId) {
            foundSent = true;
          }
          continue;
        }
        // Collect bot response activities (from is not the user)
        if (activity.type === "message" || activity.type === "event") {
          responses.push(activity);
        }
      }

      if (responses.length > 0) {
        break;
      }
    }

    return responses;
  }

  // -- Private HTTP helpers --------------------------------------------------

  private post<T>(url: string, body: unknown, authHeader: string): Promise<T> {
    return this.request<T>("POST", url, authHeader, body);
  }

  private get<T>(url: string, authHeader: string): Promise<T> {
    return this.request<T>("GET", url, authHeader, null);
  }

  private request<T>(
    method: string,
    url: string,
    authHeader: string,
    body: unknown
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const payload = body !== null ? JSON.stringify(body) : undefined;
      const parsedUrl = new URL(url);

      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data) as T);
            } catch {
              reject(new Error(`Failed to parse response: ${data}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on("error", reject);

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }
}

// ---------------------------------------------------------------------------
// TeamsAiDelegatingHandler
//
// ActivityHandler for the Teams AI application. Delegates eligible messages
// to Copilot Studio and returns the response to the Teams user.
// ---------------------------------------------------------------------------

export class TeamsAiDelegatingHandler extends ActivityHandler {
  private readonly copilotClient: CopilotStudioClient;
  private readonly conversationState: ConversationState;
  private readonly sessionAccessor: StatePropertyAccessor<SessionRecord | null>;

  /**
   * Routing policy: returns true when the message should be delegated to
   * Copilot Studio rather than handled locally.
   */
  private readonly delegationPolicy: (text: string) => boolean;

  constructor(
    copilotClient: CopilotStudioClient,
    conversationState: ConversationState,
    delegationPolicy?: (text: string) => boolean
  ) {
    super();

    this.copilotClient = copilotClient;
    this.conversationState = conversationState;
    this.sessionAccessor = conversationState.createProperty<SessionRecord | null>(
      "CopilotStudioSession"
    );

    // Default policy: delegate everything. Override for intent-based routing.
    this.delegationPolicy = delegationPolicy ?? (() => true);

    this.onMessage(async (context, next) => {
      await this.handleMessage(context);
      await next();
    });

    this.onConversationUpdate(async (context, next) => {
      const membersAdded = context.activity.membersAdded ?? [];
      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity("Hello. How can I help you today?");
        }
      }
      await next();
    });
  }

  private async handleMessage(context: TurnContext): Promise<void> {
    const text = context.activity.text?.trim() ?? "";

    if (!this.delegationPolicy(text)) {
      await context.sendActivity("I will handle this one locally.");
      return;
    }

    await context.sendActivity({ type: "typing" });

    let session = await this.sessionAccessor.get(context, null);

    // Start a new session if none exists or if the token has expired.
    if (!session || Date.now() >= session.tokenExpiry) {
      session = await this.copilotClient.startConversation();
    } else if (session.tokenExpiry - Date.now() < 5 * 60 * 1000) {
      // Proactively refresh when within 5 minutes of expiry.
      const refreshed = await this.copilotClient.refreshToken(session.token);
      session = { ...session, ...refreshed };
    }

    const userId = context.activity.from.id;
    const userName = context.activity.from.name ?? "Teams User";

    const sentId = await this.copilotClient.sendMessage(session, text, userId, userName);

    const responses = await this.copilotClient.waitForResponse(session, sentId);

    if (responses.length === 0) {
      await context.sendActivity("I did not receive a response. Please try again.");
    } else {
      for (const response of responses) {
        if (response.attachments && response.attachments.length > 0) {
          await context.sendActivity({
            type: "message",
            text: response.text,
            attachments: response.attachments as any[],
          });
        } else {
          await context.sendActivity(response.text ?? "");
        }
      }
    }

    // Persist the updated session.
    await this.sessionAccessor.set(context, session);
    await this.conversationState.saveChanges(context);
  }
}

// ---------------------------------------------------------------------------
// Connection pool
//
// For high-throughput scenarios, maintain a pool of Copilot Studio sessions
// assigned to concurrent users rather than creating a new session per message.
// ---------------------------------------------------------------------------

interface PoolEntry {
  session: SessionRecord;
  inUse: boolean;
  lastUsed: number;
}

export class CopilotStudioSessionPool {
  private readonly client: CopilotStudioClient;
  private readonly maxSize: number;
  private readonly idleTimeoutMs: number;
  private readonly pool: PoolEntry[] = [];

  constructor(
    client: CopilotStudioClient,
    maxSize = 10,
    idleTimeoutMs = 5 * 60 * 1000
  ) {
    this.client = client;
    this.maxSize = maxSize;
    this.idleTimeoutMs = idleTimeoutMs;
  }

  /**
   * Acquires a session from the pool. Creates a new one if no idle session is
   * available and the pool has not reached its maximum size.
   * Returns null when the pool is at capacity with all sessions in use.
   */
  async acquire(): Promise<SessionRecord | null> {
    this.evictExpired();

    const idle = this.pool.find((e) => !e.inUse);
    if (idle) {
      idle.inUse = true;
      idle.lastUsed = Date.now();

      if (idle.session.tokenExpiry - Date.now() < 60 * 1000) {
        const refreshed = await this.client.refreshToken(idle.session.token);
        idle.session = { ...idle.session, ...refreshed };
      }

      return idle.session;
    }

    if (this.pool.length < this.maxSize) {
      const session = await this.client.startConversation();
      this.pool.push({ session, inUse: true, lastUsed: Date.now() });
      return session;
    }

    return null;
  }

  /**
   * Returns a session to the pool after use.
   */
  release(conversationId: string): void {
    const entry = this.pool.find((e) => e.session.conversationId === conversationId);
    if (entry) {
      entry.inUse = false;
      entry.lastUsed = Date.now();
    }
  }

  /**
   * Removes idle sessions that have exceeded the idle timeout.
   */
  private evictExpired(): void {
    const now = Date.now();
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const entry = this.pool[i];
      if (!entry.inUse && now - entry.lastUsed > this.idleTimeoutMs) {
        this.pool.splice(i, 1);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Error handling utilities
// ---------------------------------------------------------------------------

/**
 * Retries an async operation with exponential backoff.
 *
 * @param operation      - Async function to retry
 * @param maxAttempts    - Maximum number of attempts (default 3)
 * @param baseDelayMs    - Initial delay in milliseconds (default 500)
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;

      if (attempt < maxAttempts) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates and starts the Teams AI adapter and activity handler.
 * Call this from your application entry point.
 */
export function createTeamsApp(): {
  adapter: BotFrameworkAdapter;
  handler: TeamsAiDelegatingHandler;
} {
  const adapter = new BotFrameworkAdapter({
    appId: process.env.MICROSOFT_APP_ID ?? "",
    appPassword: process.env.MICROSOFT_APP_SECRET ?? "",
    appTenantId: process.env.MICROSOFT_APP_TENANT_ID ?? "",
  });

  adapter.onTurnError = async (context, error) => {
    console.error("Unhandled error:", error);
    await context.sendActivity("An error occurred. Please try again.");
  };

  const storage = new MemoryStorage(); // Replace with CosmosDbPartitionedStorage from botbuilder-azure in production.
  const conversationState = new ConversationState(storage);

  const copilotClient = new CopilotStudioClient(
    process.env.DIRECT_LINE_SECRET ?? ""
  );

  // Example routing policy: delegate to Copilot Studio for claim and policy topics.
  const delegationPolicy = (text: string): boolean => {
    const lower = text.toLowerCase();
    return lower.startsWith("claim") || lower.startsWith("policy") || lower.includes("insurance");
  };

  const handler = new TeamsAiDelegatingHandler(
    copilotClient,
    conversationState,
    delegationPolicy
  );

  return { adapter, handler };
}
