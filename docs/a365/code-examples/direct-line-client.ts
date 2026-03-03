/**
 * direct-line-client.ts
 *
 * A production-ready Direct Line client for connecting a custom web or mobile
 * application to a Copilot Studio agent. Covers:
 *
 *   - Server-side token exchange (never expose the Direct Line secret to clients)
 *   - WebSocket-based activity streaming with automatic reconnection
 *   - Watermark-based polling fallback
 *   - Adaptive Card submission handling
 *   - Token refresh before expiry
 *
 * Prerequisites:
 *   npm install ws
 *
 * Environment variables (server-side token endpoint only):
 *   DIRECT_LINE_SECRET       - Direct Line channel secret (server-side only)
 *   ALLOWED_CLIENT_ORIGIN    - Trusted client origin for CORS validation
 */

import * as https from "https";
import { EventEmitter } from "events";

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/** A Direct Line conversation activity. */
export interface Activity {
  type: "message" | "event" | "invoke" | "endOfConversation" | "typing";
  id?: string;
  timestamp?: string;
  channelId?: string;
  from?: { id: string; name?: string };
  conversation?: { id: string };
  text?: string;
  value?: unknown;
  attachments?: Attachment[];
  suggestedActions?: SuggestedActions;
}

export interface Attachment {
  contentType: string;
  content?: unknown;
  contentUrl?: string;
  name?: string;
}

export interface SuggestedActions {
  actions: CardAction[];
}

export interface CardAction {
  type: string;
  title: string;
  value: string | unknown;
}

export interface AdaptiveCardAttachment extends Attachment {
  contentType: "application/vnd.microsoft.card.adaptive";
  content: AdaptiveCardContent;
}

export interface AdaptiveCardContent {
  $schema: string;
  type: "AdaptiveCard";
  version: string;
  body: unknown[];
  actions?: unknown[];
}

/** Short-lived token response from the Direct Line token endpoint. */
export interface DirectLineTokenResponse {
  conversationId: string;
  token: string;
  streamUrl?: string;
  expires_in: number;
}

/** Reconnect response when resuming a dropped WebSocket connection. */
export interface DirectLineReconnectResponse {
  token: string;
  streamUrl: string;
}

/** Set of activities returned from a polling request. */
export interface ActivitySet {
  activities: Activity[];
  watermark?: string;
}

// ---------------------------------------------------------------------------
// Server-side token endpoint
//
// This function runs on the server. The client calls it to get a short-lived
// Direct Line token. The Direct Line secret is never sent to the client.
// ---------------------------------------------------------------------------

/**
 * Generates a short-lived Direct Line token by exchanging the server-held
 * Direct Line secret. Call this from an HTTP endpoint that only trusted
 * client origins can reach.
 *
 * @param directLineSecret - The Direct Line channel secret (server-side only).
 * @param userId           - Optional user ID to bind to the token.
 */
export async function generateDirectLineToken(
  directLineSecret: string,
  userId?: string
): Promise<DirectLineTokenResponse> {
  const body = userId
    ? JSON.stringify({ user: { id: userId } })
    : undefined;

  return httpPost<DirectLineTokenResponse>(
    "https://directline.botframework.com/v3/directline/tokens/generate",
    `Bearer ${directLineSecret}`,
    body
  );
}

/**
 * Refreshes a short-lived Direct Line token before it expires.
 * Tokens expire after 30 minutes; refresh when fewer than 5 minutes remain.
 *
 * @param currentToken - The token to refresh.
 */
export async function refreshDirectLineToken(
  currentToken: string
): Promise<Pick<DirectLineTokenResponse, "token" | "expires_in">> {
  return httpPost<Pick<DirectLineTokenResponse, "token" | "expires_in">>(
    "https://directline.botframework.com/v3/directline/tokens/refresh",
    `Bearer ${currentToken}`
  );
}

// ---------------------------------------------------------------------------
// DirectLineClient
//
// Client-side class for managing a conversation with a Copilot Studio agent
// over the Direct Line channel. Supports both WebSocket streaming and
// HTTP long-poll fallback.
// ---------------------------------------------------------------------------

export type ActivityListener = (activity: Activity) => void;

export class DirectLineClient extends EventEmitter {
  private token: string;
  private tokenExpiry: number;
  private readonly conversationId: string;
  private watermark?: string;
  private socket?: WebSocketWrapper;
  private polling = false;
  private reconnecting = false;

  private static readonly baseUrl =
    "https://directline.botframework.com/v3/directline";

  constructor(tokenResponse: DirectLineTokenResponse) {
    super();
    this.token = tokenResponse.token;
    this.conversationId = tokenResponse.conversationId;
    this.tokenExpiry =
      Date.now() + (tokenResponse.expires_in - 60) * 1000;
  }

  // -- Connection management ------------------------------------------------

  /**
   * Starts a conversation by opening a WebSocket connection.
   * Falls back to polling if WebSocket is not available.
   *
   * @param streamUrl - The streamUrl returned with the token, if any.
   */
  async connect(streamUrl?: string): Promise<void> {
    if (streamUrl) {
      await this.connectWebSocket(streamUrl);
    } else {
      const conv = await this.startOrResumeConversation();
      if (conv.streamUrl) {
        await this.connectWebSocket(conv.streamUrl);
      } else {
        this.startPolling();
      }
    }
  }

  /** Disconnects the WebSocket and stops polling. */
  disconnect(): void {
    this.socket?.close();
    this.socket = undefined;
    this.polling = false;
    this.emit("disconnected");
  }

  // -- Sending activities ---------------------------------------------------

  /**
   * Sends a plain text message to the Copilot Studio agent.
   *
   * @param text     - Message text.
   * @param userId   - Sender user ID.
   * @param userName - Sender display name.
   */
  async sendMessage(
    text: string,
    userId: string,
    userName?: string
  ): Promise<string> {
    await this.ensureTokenFresh();

    const activity: Activity & { from: { id: string; name?: string } } = {
      type: "message",
      text,
      from: { id: userId, name: userName },
    };

    return this.postActivity(activity);
  }

  /**
   * Submits an Adaptive Card action payload to the agent.
   * Call this when the user submits an Adaptive Card rendered in the client UI.
   *
   * @param cardData - The `data` payload from the Adaptive Card Action.Submit.
   * @param userId   - Submitting user ID.
   */
  async submitAdaptiveCard(
    cardData: Record<string, unknown>,
    userId: string
  ): Promise<string> {
    await this.ensureTokenFresh();

    const activity: Activity & { from: { id: string } } = {
      type: "message",
      value: cardData,
      from: { id: userId },
    };

    return this.postActivity(activity);
  }

  /**
   * Sends an event activity to the agent. Useful for sending structured
   * context changes without displaying a user message (for example, page
   * navigation events, locale changes).
   *
   * @param name   - Event name understood by the Copilot Studio agent.
   * @param value  - Event payload.
   * @param userId - Sender user ID.
   */
  async sendEvent(
    name: string,
    value: unknown,
    userId: string
  ): Promise<string> {
    await this.ensureTokenFresh();

    const activity: Activity & { name: string; from: { id: string } } = {
      type: "event",
      name,
      value,
      from: { id: userId },
    };

    return this.postActivity(activity as Activity);
  }

  // -- Activity reception via polling (fallback) ----------------------------

  /**
   * Retrieves new activities from the agent using HTTP polling.
   * Use WebSocket streaming when available; fall back to this method only
   * when WebSocket is not supported by the network environment.
   */
  async pollActivities(): Promise<ActivitySet> {
    await this.ensureTokenFresh();

    const query = this.watermark
      ? `?watermark=${encodeURIComponent(this.watermark)}`
      : "";

    const url = `${DirectLineClient.baseUrl}/conversations/${this.conversationId}/activities${query}`;
    const result = await httpGet<ActivitySet>(url, `Bearer ${this.token}`);

    this.watermark = result.watermark;
    return result;
  }

  // -- Private helpers ------------------------------------------------------

  private async startOrResumeConversation(): Promise<DirectLineTokenResponse> {
    return httpPost<DirectLineTokenResponse>(
      `${DirectLineClient.baseUrl}/conversations`,
      `Bearer ${this.token}`
    );
  }

  private async connectWebSocket(streamUrl: string): Promise<void> {
    this.socket = new WebSocketWrapper(streamUrl);

    this.socket.on("activity", (activity: Activity) => {
      this.emit("activity", activity);
    });

    this.socket.on("close", async () => {
      if (!this.reconnecting) {
        await this.reconnect();
      }
    });

    this.socket.on("error", (err: Error) => {
      this.emit("error", err);
    });

    await this.socket.connect();
  }

  private async reconnect(): Promise<void> {
    if (this.reconnecting) return;
    this.reconnecting = true;

    try {
      await this.ensureTokenFresh();

      const response = await httpGet<DirectLineReconnectResponse>(
        `${DirectLineClient.baseUrl}/conversations/${this.conversationId}?watermark=${this.watermark ?? ""}`,
        `Bearer ${this.token}`
      );

      await this.connectWebSocket(response.streamUrl);
      this.emit("reconnected");
    } catch (err) {
      this.emit("error", err);
    } finally {
      this.reconnecting = false;
    }
  }

  private startPolling(): void {
    this.polling = true;

    const poll = async (): Promise<void> => {
      if (!this.polling) return;

      try {
        const result = await this.pollActivities();
        for (const activity of result.activities) {
          this.emit("activity", activity);
        }
      } catch (err) {
        this.emit("error", err);
      }

      if (this.polling) {
        setTimeout(poll, 1000);
      }
    };

    poll();
  }

  private async postActivity(activity: Activity): Promise<string> {
    const body = JSON.stringify(activity);
    const result = await httpPost<{ id: string }>(
      `${DirectLineClient.baseUrl}/conversations/${this.conversationId}/activities`,
      `Bearer ${this.token}`,
      body
    );
    return result.id;
  }

  private async ensureTokenFresh(): Promise<void> {
    if (this.tokenExpiry - Date.now() < 5 * 60 * 1000) {
      const refreshed = await refreshDirectLineToken(this.token);
      this.token = refreshed.token;
      this.tokenExpiry = Date.now() + (refreshed.expires_in - 60) * 1000;
    }
  }
}

// ---------------------------------------------------------------------------
// WebSocketWrapper
//
// Thin wrapper around the Node.js `ws` library for WebSocket activity
// streaming. In a browser environment, replace with the native WebSocket API.
// ---------------------------------------------------------------------------

class WebSocketWrapper extends EventEmitter {
  private readonly url: string;
  private ws?: import("ws");

  constructor(url: string) {
    super();
    this.url = url;
  }

  async connect(): Promise<void> {
    const WebSocket = (await import("ws")).default;
    this.ws = new WebSocket(this.url);

    await new Promise<void>((resolve, reject) => {
      this.ws!.once("open", resolve);
      this.ws!.once("error", reject);
    });

    this.ws.on("message", (data: Buffer | string) => {
      try {
        const parsed = JSON.parse(data.toString()) as { activities?: Activity[] };
        if (parsed.activities) {
          for (const activity of parsed.activities) {
            this.emit("activity", activity);
          }
        }
      } catch {
        // Ignore malformed frames.
      }
    });

    this.ws.on("close", () => this.emit("close"));
    this.ws.on("error", (err: Error) => this.emit("error", err));
  }

  close(): void {
    this.ws?.close();
  }
}

// ---------------------------------------------------------------------------
// Adaptive Card rendering helper
//
// Identifies Adaptive Card attachments in a response activity and returns
// the card content ready for the client-side rendering library.
// ---------------------------------------------------------------------------

/**
 * Extracts Adaptive Card payloads from a response activity's attachments.
 *
 * @param activity - Activity received from the Copilot Studio agent.
 * @returns Array of Adaptive Card content objects. Empty if none present.
 */
export function extractAdaptiveCards(activity: Activity): AdaptiveCardContent[] {
  if (!activity.attachments || activity.attachments.length === 0) {
    return [];
  }

  return activity.attachments
    .filter(
      (a): a is AdaptiveCardAttachment =>
        a.contentType === "application/vnd.microsoft.card.adaptive" &&
        a.content !== undefined
    )
    .map((a) => a.content);
}

// ---------------------------------------------------------------------------
// HTTP utilities
// ---------------------------------------------------------------------------

function httpPost<T>(url: string, authHeader: string, body?: string): Promise<T> {
  return httpRequest<T>("POST", url, authHeader, body);
}

function httpGet<T>(url: string, authHeader: string): Promise<T> {
  return httpRequest<T>("GET", url, authHeader);
}

function httpRequest<T>(
  method: string,
  url: string,
  authHeader: string,
  body?: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const parsedUrl = new URL(url);

    const options: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300) {
          // Some endpoints return an empty body (204 No Content).
          if (!data.trim()) {
            resolve({} as T);
            return;
          }
          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode ?? "unknown"}: ${data}`));
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Usage example
//
// Illustrates the end-to-end client flow. In production, generateDirectLineToken
// is called from a server-side endpoint, not from client code.
// ---------------------------------------------------------------------------

/*
async function example(): Promise<void> {
  // Step 1 (server-side): Exchange the secret for a short-lived token.
  const tokenResponse = await generateDirectLineToken(
    process.env.DIRECT_LINE_SECRET ?? "",
    "user-abc123"
  );

  // Step 2 (client-side): Create the client with the short-lived token.
  const client = new DirectLineClient(tokenResponse);

  // Step 3: Listen for incoming activities from the agent.
  client.on("activity", (activity: Activity) => {
    if (activity.type === "message") {
      const cards = extractAdaptiveCards(activity);
      if (cards.length > 0) {
        console.log("Received Adaptive Card:", JSON.stringify(cards[0], null, 2));
      } else {
        console.log("Agent says:", activity.text);
      }
    }
  });

  client.on("error", (err: Error) => console.error("Client error:", err));
  client.on("reconnected", () => console.log("Reconnected after network interruption"));

  // Step 4: Open the WebSocket connection.
  await client.connect(tokenResponse.streamUrl);

  // Step 5: Send a message.
  await client.sendMessage("Check the status of my claim 87654", "user-abc123", "Jane Smith");

  // Step 6: Submit an Adaptive Card form.
  await client.submitAdaptiveCard(
    {
      action: "submitFnol",
      claimantName: "Jane Smith",
      incidentDate: "2026-02-15",
      incidentType: "auto",
    },
    "user-abc123"
  );
}
*/
