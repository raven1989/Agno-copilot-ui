# Agno Agent & Team API Event Types Reference

This document records all Server-Sent Events (SSE) returned by the Agno agent and team APIs for UI implementation reference.

## Quick Start

```bash
uv add agno fastapi uvicorn openai ag-ui-protocol
cd my-copilot-app
npm install @copilotkit/react-ui @copilotkit/react-core @copilotkit/runtime @ag-ui/agno
npm run dev
```

The app will be available at `http://localhost:3000`.

## Configuration

The app uses a **dynamic UI-based configuration system**. No environment variables are required.

### Getting Started

1. Start the app with `npm run dev`
2. Enter your Agno server URL in the sidebar (default: `http://localhost:9001`)
3. Click **Connect** to discover available agents and teams
4. Select an agent or team from the list to start chatting

### Features

- **Server Discovery**: Automatically fetches available agents and teams from `/agents` and `/teams` endpoints
- **Dynamic Selection**: Switch between agents and teams without restarting
- **Persistence**: Server URL and selected entity are saved to localStorage
- **Collapsible Sidebar**: Toggle sidebar visibility for more chat space
- **Session Management**: View, resume, and delete conversation sessions with multi-select support

### Connection Management

| Status | Description |
|--------|-------------|
| Disconnected | Not connected to any server |
| Connecting | Attempting to fetch agents/teams |
| Connected | Successfully connected, entities available |
| Error | Connection failed (check server URL) |

**Note:** The app makes direct HTTP requests to the agent/team server using `application/x-www-form-urlencoded` format.

## Session Management

The app provides full session management capabilities, allowing users to view, resume, and delete conversation sessions.

### Features

| Feature | Description |
|---------|-------------|
| **Session List** | View recent sessions in the sidebar with pagination support |
| **Resume Session** | Click a session to load the full conversation history |
| **Multi-select** | Select multiple sessions using checkboxes |
| **Batch Delete** | Delete selected sessions with confirmation dialog |
| **Session Filtering** | Sessions filter by selected entity type (agent/team) |
| **Active Indicator** | Shows "Active" tag on currently loaded session |

### Session List UI

Sessions appear in the sidebar below the Entity List:

```
┌─────────────────────────┐
│ Recent Sessions    (↻)  │
├─────────────────────────┤
│ [□] Select all          │
├─────────────────────────┤
│ [☑] Session 1      Active│
│ [○] Session 2           │
│ [○] Session 3           │
│ [Delete (1)]            │
├─────────────────────────┤
│ ◀ Page 1 of 3 ▶         │
└─────────────────────────┘
```

### Session List Behavior

- **On Connect**: Automatically fetches sessions from the server
- **On Entity Selection**: Filters sessions by the selected entity type
- **On Session Click**: Loads the session's runs into the chat
- **On New Chat**: Clears the current session and starts fresh
- **On Page Refresh**: Clears session state, starts fresh

### Session API Endpoints

For detailed API documentation, see [session_management_api.md](./session_management_api.md).

The session management uses the following API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sessions?type={agent\|team}` | GET | List sessions with pagination |
| `/sessions/{session_id}/runs` | GET | Get all runs for a session |
| `/sessions` | DELETE | Delete multiple sessions |

### Session Data Structure

```typescript
interface Session {
  session_id: string;
  session_name: string;      // Derived from first user message
  session_state: Record<string, unknown>;
  created_at: string;        // ISO 8601 timestamp
  updated_at: string;        // ISO 8601 timestamp
  session_type: 'agent' | 'team';
}
```

### Loading Historical Sessions

When a session is loaded, the app:

1. Fetches all runs for the session from `/sessions/{session_id}/runs`
2. Separates top-level runs from member runs (for teams)
3. Extracts tool calls from each run's `tools` array
4. Transforms runs into Message objects with full content:
   - User messages from `run_input`
   - Assistant messages with `content`, `reasoning_content`, `tool_calls`
   - Member runs for team sessions (nested agent responses)

## Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Core Types & Utilities | Completed |
| Phase 2 | UI Components | Completed |
| Phase 3 | Chat Interface | Completed |
| Phase 4 | Polish & UX | Completed |
| Phase 5 | Team Support | Completed |
| Phase 6 | Session Management | Completed |

---

## API Endpoints

### Agent Endpoint
```
POST http://localhost:9001/agents/{agent_id}/runs
Content-Type: application/x-www-form-urlencoded

Parameters:
- message: string (user message)
- stream: boolean (true for SSE, false for complete response)
```

### Team Endpoint
```
POST http://localhost:9001/teams/{team_id}/runs
Content-Type: application/x-www-form-urlencoded

Parameters:
- message: string (user message)
- stream: boolean (true for SSE, false for complete response)
```

---

## Event Types Overview

### Agent Events

| Event | Description | Occurrence |
|-------|-------------|------------|
| `RunStarted` | Run initialization | Once at start |
| `ModelRequestStarted` | Model begins processing | Before each model call |
| `RunContent` | Streaming content chunks | Multiple times during response |
| `ModelRequestCompleted` | Model finishes processing | After each model call |
| `ToolCallStarted` | Tool execution begins | When agent calls a tool |
| `ToolCallCompleted` | Tool execution finishes | After tool returns result |
| `RunContentCompleted` | Content streaming done | Once before RunCompleted |
| `RunCompleted` | Run finishes | Once at end |

### Team Events

| Event | Description | Occurrence |
|-------|-------------|------------|
| `TeamRunStarted` | Team run initialization | Once at start |
| `TeamModelRequestStarted` | Model begins processing | Before each model call |
| `TeamRunContent` | Streaming content chunks | Multiple times during response |
| `TeamModelRequestCompleted` | Model finishes processing | After each model call |
| `TeamToolCallStarted` | Tool execution begins | When team calls a tool |
| `TeamToolCallCompleted` | Tool execution finishes | After tool returns result |
| `TeamRunContentCompleted` | Content streaming done | Once before TeamRunCompleted |
| `TeamRunCompleted` | Team run finishes | Once at end |

### Nested Member Agent Events

When a team delegates to a member agent (via `delegate_task_to_member` tool), the member agent's events include a `parent_run_id` field linking back to the team run. These events use standard agent event names but are processed as nested runs within the team context.

---

## Team Event Schemas

Team events follow the same structure as agent events, but with `team_id` and `team_name` instead of `agent_id` and `agent_name`.

### TeamRunStarted

```json
{
  "created_at": 1773126400,
  "event": "TeamRunStarted",
  "team_id": "helpful-assistant",
  "team_name": "Helpful Assistant",
  "run_id": "84efe41b-165c-4c7a-b336-f12ab9861d3f",
  "session_id": "f772406d-dc4d-48c9-831a-8c5c8bd163d9",
  "model": "endor/endor-glm-5",
  "model_provider": "DeepSeek"
}
```

### TeamRunContent

```json
{
  "created_at": 1773126414,
  "event": "TeamRunContent",
  "team_id": "helpful-assistant",
  "team_name": "Helpful Assistant",
  "run_id": "84efe41b-165c-4c7a-b336-f12ab9861d3f",
  "session_id": "f772406d-dc4d-48c9-831a-8c5c8bd163d9",
  "content": "I",
  "content_type": "str",
  "reasoning_content": "",
  "model_provider_data": {
    "id": "e52ef6aa7d9e44829f38c36795193566"
  }
}
```

### TeamToolCallStarted (delegate_task_to_member)

When a team delegates to a member agent:

```json
{
  "created_at": 1773126415,
  "event": "TeamToolCallStarted",
  "team_id": "helpful-assistant",
  "team_name": "Helpful Assistant",
  "run_id": "84efe41b-165c-4c7a-b336-f12ab9861d3f",
  "session_id": "f772406d-dc4d-48c9-831a-8c5c8bd163d9",
  "tool": {
    "tool_call_id": "call_750af3d8fa6d4d9bbb40ab45",
    "tool_name": "delegate_task_to_member",
    "tool_args": {
      "member_id": "external-knowledge-assistant",
      "task": "Search for information about UB7..."
    },
    "tool_call_error": null,
    "result": null
  }
}
```

### Nested Member Agent RunStarted

After delegation, member agent events include `parent_run_id`:

```json
{
  "created_at": 1773126415,
  "event": "RunStarted",
  "agent_id": "external-knowledge-assistant",
  "agent_name": "External Knowledge Assistant",
  "run_id": "a21e7fe8-569f-4f27-9ba9-608c023fc1d9",
  "parent_run_id": "84efe41b-165c-4c7a-b336-f12ab9861d3f",
  "session_id": "f772406d-dc4d-48c9-831a-8c5c8bd163d9",
  "model": "endor/endor-glm-5",
  "model_provider": "DeepSeek"
}
```

### TeamRunCompleted

```json
{
  "created_at": 1773126577,
  "event": "TeamRunCompleted",
  "team_id": "helpful-assistant",
  "team_name": "Helpful Assistant",
  "run_id": "84efe41b-165c-4c7a-b336-f12ab9861d3f",
  "session_id": "f772406d-dc4d-48c9-831a-8c5c8bd163d9",
  "content": "Full team response...",
  "content_type": "str",
  "reasoning_content": "Team reasoning...",
  "session_state": {},
  "metrics": {
    "time_to_first_token": 2.88,
    "duration": 177.5,
    "details": {
      "model": [{"id": "endor/endor-glm-5", "provider": "DeepSeek"}]
    }
  }
}
```

---

## Event Schemas

### 1. RunStarted

Emitted when a new run is initialized.

```json
{
  "created_at": 1773052204,
  "event": "RunStarted",
  "agent_id": "helperful-assistant",
  "agent_name": "Helperful Assistant",
  "run_id": "d46a9c47-29a5-44e4-a3c7-1dc9cf323c77",
  "session_id": "a21fecb7-2472-46b1-8dd2-63ecddc46b12",
  "model": "endor/endor-glm-5",
  "model_provider": "DeepSeek"
}
```

**Fields:**
- `created_at`: Unix timestamp (seconds)
- `event`: Event type name
- `agent_id`: Agent identifier
- `agent_name`: Human-readable agent name
- `run_id`: Unique run identifier (UUID)
- `session_id`: Session identifier (UUID)
- `model`: Model identifier
- `model_provider`: Model provider name

---

### 2. ModelRequestStarted

Emitted when the model begins processing a request.

```json
{
  "created_at": 1773052204,
  "event": "ModelRequestStarted",
  "agent_id": "helperful-assistant",
  "agent_name": "Helperful Assistant",
  "run_id": "d46a9c47-29a5-44e4-a3c7-1dc9cf323c77",
  "session_id": "a21fecb7-2472-46b1-8dd2-63ecddc46b12",
  "model": "endor/endor-glm-5",
  "model_provider": "DeepSeek"
}
```

---

### 3. RunContent

Emitted multiple times during response generation. Contains streaming content.

```json
{
  "created_at": 1773052207,
  "event": "RunContent",
  "agent_id": "helperful-assistant",
  "agent_name": "Helperful Assistant",
  "run_id": "d46a9c47-29a5-44e4-a3c7-1dc9cf323c77",
  "session_id": "a21fecb7-2472-46b1-8dd2-63ecddc46b12",
  "content": "I",
  "workflow_agent": false,
  "content_type": "str",
  "reasoning_content": "",
  "model_provider_data": {
    "id": "f7c6674442314c70b8a3e59e4db5e64b"
  }
}
```

**Key Fields:**
- `content`: User-visible text content (streamed token by token)
- `reasoning_content`: AI's internal thinking/reasoning (streamed token by token)
- `content_type`: Content type (e.g., "str")
- `workflow_agent`: Boolean flag for workflow agents
- `model_provider_data`: Provider-specific metadata with `id`

**Important Notes:**
- `content` and `reasoning_content` are mutually exclusive in each event
- When `reasoning_content` has content, `content` is typically empty or not present
- When `content` has content, `reasoning_content` is typically empty
- Content is streamed token-by-token (sometimes character-by-character)

**Example with reasoning_content:**
```json
{
  "created_at": 1773052207,
  "event": "RunContent",
  "agent_id": "helperful-assistant",
  "agent_name": "Helperful Assistant",
  "run_id": "d46a9c47-29a5-44e4-a3c7-1dc9cf323c77",
  "session_id": "a21fecb7-2472-46b1-8dd2-63ecddc46b12",
  "workflow_agent": false,
  "content_type": "str",
  "reasoning_content": "The user is asking"
}
```

---

### 4. ModelRequestCompleted

Emitted when model finishes processing.

```json
{
  "created_at": 1773052210,
  "event": "ModelRequestCompleted",
  "agent_id": "helperful-assistant",
  "agent_name": "Helperful Assistant",
  "run_id": "d46a9c47-29a5-44e4-a3c7-1dc9cf323c77",
  "session_id": "a21fecb7-2472-46b1-8dd2-63ecddc46b12",
  "model": "endor/endor-glm-5",
  "model_provider": "DeepSeek",
  "input_tokens": 0,
  "output_tokens": 0,
  "total_tokens": 0,
  "time_to_first_token": 2.6414987499993003,
  "reasoning_tokens": 0,
  "cache_read_tokens": 0,
  "cache_write_tokens": 0
}
```

**Metrics Fields:**
- `input_tokens`: Number of input tokens
- `output_tokens`: Number of output tokens
- `total_tokens`: Total tokens used
- `time_to_first_token`: Time in seconds to first token
- `reasoning_tokens`: Tokens used for reasoning
- `cache_read_tokens`: Tokens read from cache
- `cache_write_tokens`: Tokens written to cache

---

### 5. ToolCallStarted

Emitted when a tool execution begins.

```json
{
  "created_at": 1773052210,
  "event": "ToolCallStarted",
  "agent_id": "helperful-assistant",
  "agent_name": "Helperful Assistant",
  "run_id": "d46a9c47-29a5-44e4-a3c7-1dc9cf323c77",
  "session_id": "a21fecb7-2472-46b1-8dd2-63ecddc46b12",
  "tool": {
    "tool_call_id": "call_9832201e3121446a950ea2d2",
    "tool_name": "get_skill_script",
    "tool_args": {
      "skill_name": "knowledge-retrieval",
      "script_path": "search_for_apple_internal_knowledge.py",
      "execute": true,
      "args": ["UB7"]
    },
    "tool_call_error": null,
    "result": null,
    "metrics": null,
    "child_run_id": null,
    "stop_after_tool_call": false,
    "created_at": 1773052210,
    "requires_confirmation": null,
    "confirmed": null,
    "confirmation_note": null,
    "requires_user_input": null,
    "user_input_schema": null,
    "user_feedback_schema": null,
    "answered": null,
    "external_execution_required": null,
    "external_execution_silent": null,
    "approval_type": null,
    "approval_id": null
  }
}
```

**Tool Object Fields:**
- `tool_call_id`: Unique identifier for this tool call
- `tool_name`: Name of the tool being called
- `tool_args`: Object containing tool arguments
- `tool_call_error`: Error if any (null on start)
- `result`: Tool result (null on start)
- `metrics`: Performance metrics (null on start)
- `child_run_id`: Child run ID if applicable
- `stop_after_tool_call`: Whether to stop after this call
- `created_at`: Unix timestamp
- `requires_confirmation`: Whether confirmation is needed
- `confirmed`: Confirmation status
- `confirmation_note`: Note for confirmation
- `requires_user_input`: Whether user input is needed
- `user_input_schema`: Schema for user input
- `user_feedback_schema`: Schema for user feedback
- `answered`: Whether answered
- `external_execution_required`: Whether external execution is needed
- `external_execution_silent`: Whether to execute silently
- `approval_type`: Type of approval required
- `approval_id`: Approval identifier

---

### 6. ToolCallCompleted

Emitted when tool execution finishes.

```json
{
  "created_at": 1773052212,
  "event": "ToolCallCompleted",
  "agent_id": "helperful-assistant",
  "agent_name": "Helperful Assistant",
  "run_id": "d46a9c47-29a5-44e4-a3c7-1dc9cf323c77",
  "session_id": "a21fecb7-2472-46b1-8dd2-63ecddc46b12",
  "content": "get_skill_script(skill_name=knowledge-retrieval, script_path=search_for_apple_internal_knowledge.py, execute=True, args=['UB7']) completed in 1.8188s. ",
  "tool": {
    "tool_call_id": "call_9832201e3121446a950ea2d2",
    "tool_name": "get_skill_script",
    "tool_args": {
      "skill_name": "knowledge-retrieval",
      "script_path": "search_for_apple_internal_knowledge.py",
      "execute": true,
      "args": ["UB7"]
    },
    "tool_call_error": false,
    "result": "{\"skill_name\": \"knowledge-retrieval\", ...}",
    "metrics": null,
    "child_run_id": null,
    "stop_after_tool_call": false,
    "created_at": 1773052210,
    "requires_confirmation": null,
    "confirmed": null,
    "confirmation_note": null,
    "requires_user_input": null,
    "user_input_schema": null,
    "user_feedback_schema": null,
    "answered": null,
    "external_execution_required": null,
    "external_execution_silent": null,
    "approval_type": null,
    "approval_id": null
  }
}
```

**Additional Fields on Completion:**
- `content`: Summary message of tool execution
- `tool.tool_call_error`: Boolean (false = success, true = error)
- `tool.result`: JSON string containing tool result

---

### 7. RunContentCompleted

Emitted when content streaming is complete.

```json
{
  "created_at": 1773052234,
  "event": "RunContentCompleted",
  "agent_id": "helperful-assistant",
  "agent_name": "Helperful Assistant",
  "run_id": "d46a9c47-29a5-44e4-a3c7-1dc9cf323c77",
  "session_id": "a21fecb7-2472-46b1-8dd2-63ecddc46b12"
}
```

---

### 8. RunCompleted

Emitted when the entire run is complete. Contains the full response.

```json
{
  "created_at": 1773052234,
  "event": "RunCompleted",
  "agent_id": "helperful-assistant",
  "agent_name": "Helperful Assistant",
  "run_id": "d46a9c47-29a5-44e4-a3c7-1dc9cf323c77",
  "session_id": "a21fecb7-2472-46b1-8dd2-63ecddc46b12",
  "content": "Full response text here...",
  "content_type": "str",
  "reasoning_content": "Full reasoning text here...",
  "model_provider_data": {
    "id": "b76080464bb64533b15bcfff6b61014a"
  },
  "session_state": {},
  "metrics": {
    "time_to_first_token": 2.650406500000827,
    "duration": 30.007046292001178,
    "details": {
      "model": [
        {
          "id": "endor/endor-glm-5",
          "provider": "DeepSeek"
        }
      ]
    }
  }
}
```

**Run Metrics:**
- `time_to_first_token`: Time to first token in seconds
- `duration`: Total run duration in seconds
- `details.model`: Array of models used with their providers

---

## SSE Format

Events are sent in the following format:

```
event: {EventName}
data: {JSON_PAYLOAD}

```

**Example:**
```
event: RunContent
data: {"created_at":1773052210,"event":"RunContent","agent_id":"helperful-assistant",...}

```

Note: Each event is followed by a blank line.

---

## Event Flow Example

### Agent Event Flow

```
1. RunStarted
2. ModelRequestStarted
3. RunContent (reasoning_content) x N times
4. RunContent (content) x N times
5. ModelRequestCompleted
6. ToolCallStarted (if tool needed)
7. ToolCallCompleted
8. ModelRequestStarted (continue after tool)
9. RunContent (content) x N times
10. ModelRequestCompleted
11. RunContentCompleted
12. RunCompleted
```

### Team Event Flow (with Member Delegation)

```
1. TeamRunStarted
2. TeamModelRequestStarted
3. TeamRunContent (reasoning_content) x N times
4. TeamRunContent (content) x N times
5. TeamModelRequestCompleted
6. TeamToolCallStarted (delegate_task_to_member)
   ├── RunStarted (member agent, with parent_run_id)
   ├── ModelRequestStarted (member agent)
   ├── RunContent (member agent) x N times
   ├── ToolCallStarted (member agent tool)
   ├── ToolCallCompleted (member agent tool)
   ├── ModelRequestCompleted (member agent)
   └── RunCompleted (member agent)
7. TeamToolCallCompleted
8. TeamModelRequestStarted (continue after delegation)
9. TeamRunContent (content) x N times
10. TeamModelRequestCompleted
11. TeamRunContentCompleted
12. TeamRunCompleted
```

---

## UI Implementation Notes

### Content Types to Display

1. **Reasoning Content** (`reasoning_content`)
   - Display in collapsible "Thinking" section
   - Use muted/distinct styling
   - Optional: show by default or hide

2. **Main Content** (`content`)
   - Primary user-facing content
   - Render as Markdown
   - Stream with typing animation

3. **Tool Calls**
   - Show as expandable cards
   - Display: tool name, args, status, result
   - Indicate running vs completed state

4. **Member Agent Runs** (Teams only)
   - Display nested within team response
   - Show agent name with distinct styling
   - Collapsible with default collapsed state
   - Include member's reasoning, content, and tool calls
   - Status indicators: spinning (streaming) or checkmark (completed)

5. **Main Agent/Team Runs**
   - Status indicator next to entity name
   - Spinning icon during streaming
   - Checkmark when completed

### State Management

Track the following state during streaming:
- Current run_id and session_id
- Entity type (agent or team)
- Accumulated reasoning_content
- Accumulated content
- List of tool calls with their states
- Run status (running/completed/error)
- **For teams:** Map of member agent runs keyed by run_id

### Streaming Strategy

1. Accumulate `content` and `reasoning_content` separately
2. Update UI on each `RunContent` / `TeamRunContent` event
3. Handle tool calls as they occur
4. Use `RunCompleted` / `TeamRunCompleted` for final state/metrics
5. **For teams:** Track member agent runs via `parent_run_id` linkage

---

## Implementation Details

### Implemented File Structure

```
my-copilot-app/
├── app/
│   ├── page.tsx              # Main chat page with ConfigProvider
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles with animations
├── components/
│   ├── ChatContainer.tsx     # Main chat container with state management
│   ├── ChatMessage.tsx       # Single message display (user/assistant)
│   ├── ChatInput.tsx         # Input field with send button
│   ├── MessageStream.tsx     # Streaming message display container
│   ├── ReasoningBlock.tsx    # Collapsible thinking section
│   ├── ToolCallBlock.tsx     # Tool execution card with status
│   ├── ContentBlock.tsx      # Markdown content with syntax highlighting
│   ├── Sidebar.tsx           # Collapsible sidebar with server config
│   ├── ServerConfig.tsx      # Server URL input and connection controls
│   ├── EntityList.tsx        # List of available agents and teams
│   ├── SessionList.tsx       # Session list with multi-select and pagination
│   ├── SessionItem.tsx       # Individual session row with checkbox
│   ├── DeleteConfirmModal.tsx # Confirmation dialog for session deletion
│   └── tool-call/            # Tool call content rendering components
│       ├── index.ts          # Exports for tool-call components
│       ├── JsonValue.tsx     # Collapsible JSON renderer with syntax highlighting
│       ├── ContentDetector.tsx # Auto-detects content type and routes to renderer
│       ├── CodeRenderer.tsx  # Syntax-highlighted code display
│       ├── MarkdownRenderer.tsx # Markdown content renderer
│       └── TextRenderer.tsx  # Plain text with truncation support
├── lib/
│   ├── types/
│   │   ├── events.ts         # TypeScript interfaces for all 8 SSE events
│   │   ├── message.ts        # Message and state types
│   │   ├── config.ts         # Configuration types (AgentInfo, TeamInfo, etc.)
│   │   ├── session.ts        # Session and run types for session management
│   │   └── index.ts          # Type exports
│   ├── utils/
│   │   ├── sse-parser.ts     # SSE parsing utility (SSEParser class)
│   │   └── content-utils.ts  # Content detection and formatting utilities
│   ├── context/
│   │   └── ConfigContext.tsx # React context for global config state
│   └── hooks/
│       ├── useAgentRun.ts    # Agent/team communication hook with session loading
│       ├── useConfig.ts      # Server connection and entity selection hook
│       └── useSessionManager.ts # Session list, selection, and deletion hook
└── package.json              # Dependencies installed
```

---

### Installed Dependencies

```json
{
  "dependencies": {
    "react-markdown": "^10.1.0",
    "remark-gfm": "^4.0.1",
    "react-syntax-highlighter": "^15.6.3",
    "lucide-react": "^0.483.0"
  }
}
```

---

### Component Details

#### ChatContainer
- Main orchestration component
- Uses `useAgentRun` hook for state management
- Auto-scrolls to bottom on new content
- Shows streaming messages in real-time
- Clear chat functionality

#### ChatMessage
- Displays user and assistant messages
- User messages: simple text display
- Assistant messages: uses `MessageStream` for rich content
- **Status indicators:** Spinning icon (streaming) or checkmark (completed) next to entity name

#### ChatInput
- Textarea with auto-resize
- Enter to send, Shift+Enter for newline
- Disabled during streaming
- Send button with icon

#### MessageStream
- Orchestrates display order:
  1. Reasoning content (if any)
  2. Tool calls (if any)
  3. Member agent runs (for teams)
  4. Main content
- Shows typing indicator during initial load
- **Team indicator:** Shows "Team Response" label with Users icon

#### MemberRunBlock (for Teams)
- Displays nested member agent responses
- Shows agent name with Bot icon
- Teal color scheme to distinguish from team content
- **Collapsible:** Expand/fold button with default collapsed state
- **Status indicators:** Spinning icon (streaming) or checkmark (completed)
- Includes member's reasoning, tool calls, and content when expanded

#### ReasoningBlock
- Collapsible "Thinking" section
- Purple brain icon
- Gray muted background
- Expand/collapse animation

#### ToolCallBlock
- Expandable card for tool execution
- Color-coded tool name badges
- Status icons: spinner (running), checkmark (completed), X (error)
- Smart content rendering with auto-detection:
  - JSON: Collapsible tree view with syntax highlighting
  - Code: Syntax-highlighted with language detection
  - Markdown: Formatted markdown rendering
  - Text: Plain text with truncation support
- Copy-to-clipboard for arguments and results
- Color-coded borders based on status
- Keyboard accessible with proper ARIA attributes

#### ContentBlock
- Markdown rendering with GitHub Flavored Markdown
- Syntax highlighting for code blocks using VS Code dark theme (`vscDarkPlus`)
- Proper rendering of code blocks without language specification
- Clean minimal table styling
- Inline code with slate color scheme

#### Sidebar
- Collapsible sidebar with smooth animation
- Contains ServerConfig and EntityList components
- Toggle button in ChatContainer header

#### ServerConfig
- Server URL input field
- Connect/Disconnect buttons
- Connection status indicator with color-coded icons
- Error display for failed connections

#### EntityList
- Displays available agents and teams after connection
- Refresh button to reload entities from server
- Shows agent role and team mode/member info
- Click to select entity for chat

#### Tool Call Rendering Components

The `tool-call/` directory contains specialized renderers for tool output:

##### ContentDetector
- Auto-detects content type from raw string
- Routes to appropriate renderer based on analysis
- Supports JSON, code, markdown, and plain text

##### JsonValue / JsonRenderer
- Collapsible tree view for JSON objects and arrays
- Color-coded syntax highlighting
- Configurable max expansion depth
- Shows item/key counts for arrays and objects

##### CodeRenderer
- Syntax highlighting for detected programming languages
- Auto-detects language from content patterns
- Line truncation with "show more" support

##### MarkdownRenderer
- GitHub Flavored Markdown rendering
- Code block syntax highlighting with VS Code dark theme
- Proper handling of code blocks without language specification
- Line truncation with expand/collapse support

##### TextRenderer
- Plain text display with whitespace preservation
- Line truncation with expandable view

---

### useAgentRun Hook

The core hook for agent/team communication:

```typescript
const {
  messages,      // Message[] - completed messages
  currentRun,    // StreamMessage | null - current streaming run
  isStreaming,   // boolean - is a run in progress
  error,         // string | null - error message if any
  sessionId,     // string | null - current session ID
  sendMessage,   // (content: string) => Promise<void>
  loadSession,   // (sessionId: string) => Promise<void> - load historical session
  clearMessages, // () => void
} = useAgentRun({
  serverUrl,      // string - URL of the Agno server
  selectedEntity, // SelectedEntity | null - selected agent or team
});
```

**Features:**
- Direct HTTP POST to agent/team API using `application/x-www-form-urlencoded`
- Uses custom `SSEParser` to parse Agno SSE events
- Accumulates `content` and `reasoning_content` separately
- Tracks tool call states (running/completed/error)
- Maintains session ID for conversation continuity
- Error handling with user feedback
- **Team Support:** Tracks member agent runs when teams delegate tasks
- **Nested Runs:** Handles `parent_run_id` for member agent events within team runs
- **Session Loading:** Loads historical sessions with full tool call and member run data

**Configuration:** Server URL and selected entity are passed as options, typically from `useConfigContext()`.

### useSessionManager Hook

Hook for managing session list and operations:

```typescript
const {
  sessions,              // Session[] - list of sessions
  page,                  // number - current page
  totalPages,            // number - total pages
  totalCount,            // number - total session count
  isLoading,             // boolean - loading state
  error,                 // string | null - error message
  selectedSessionIds,    // Set<string> - selected session IDs
  fetchSessions,         // (page?: number) => Promise<void>
  deleteSelectedSessions,// () => Promise<boolean>
  toggleSessionSelection,// (sessionId: string) => void
  selectAllSessions,     // () => void
  clearSelection,        // () => void
  refreshSessions,       // () => Promise<void>
} = useSessionManager({
  serverUrl,             // string - URL of the Agno server
  connectionStatus,      // ConnectionStatus - connection state
  selectedEntityType,    // EntityType | null - filter by type
});
```

**Features:**
- Fetches sessions from both agent and team endpoints when no filter is set
- Filters by entity type when an agent or team is selected
- Multi-select support with Set-based selection tracking
- Batch delete with confirmation
- Pagination support
- Auto-refresh on connection/entity change

### useConfig Hook

Hook for managing server connection and entity selection:

```typescript
const {
  // State
  serverUrl,        // string - current server URL
  setServerUrl,     // (url: string) => void
  sidebarOpen,      // boolean - sidebar visibility
  toggleSidebar,    // () => void
  connectionStatus, // ConnectionStatus - 'disconnected' | 'connecting' | 'connected' | 'error'
  agents,           // AgentInfo[] - available agents
  teams,            // TeamInfo[] - available teams
  selectedEntity,   // SelectedEntity | null - selected agent or team

  // Actions
  connect,          // () => Promise<void> - connect to server
  disconnect,       // () => void - disconnect from server
  refresh,          // () => Promise<void> - refresh agents/teams
  refreshing,       // boolean - refresh in progress
  selectEntity,     // (type, id, name) => void - select agent or team
  error,            // string | null - connection error

  // Callbacks
  setOnEntityChange, // (callback) => void - register entity change callback
} = useConfig();
```

**Features:**
- Fetches agents and teams from `/agents` and `/teams` endpoints
- Persists server URL, sidebar state, and selected entity to localStorage
- Provides connection status tracking
- Entity change callback for clearing chat on selection change

### ConfigContext

React context provider for global configuration state:

```typescript
// Wrap your app
<ConfigProvider>
  <App />
</ConfigProvider>

// Use in components
const config = useConfigContext();
```

### StreamMessage Type

```typescript
interface StreamMessage {
  run_id: string;
  session_id: string;
  entity_type: 'agent' | 'team';
  entity_id: string;
  entity_name: string;
  reasoning_content: string;
  content: string;
  tool_calls: ToolCallState[];
  member_runs: MemberRun[];  // For teams: nested agent runs
  status: 'streaming' | 'completed' | 'error';
  metrics?: {
    time_to_first_token?: number;
    duration?: number;
    model?: string;
    provider?: string;
  };
}
```

### MemberRun Type

```typescript
interface MemberRun {
  run_id: string;
  agent_id: string;
  agent_name: string;
  reasoning_content: string;
  content: string;
  tool_calls: ToolCallState[];
  status: 'streaming' | 'completed' | 'error';
  parent_run_id: string;  // Links back to team run
}
```

### Config Types

```typescript
interface AgentInfo {
  id: string;
  name: string;
  role?: string;
  model?: {
    name: string;
    model: string;
    provider: string;
  };
}

interface TeamMember {
  id: string;
  name: string;
  role?: string;
}

interface TeamInfo {
  id: string;
  name: string;
  mode?: string;
  members?: TeamMember[];
}

interface SelectedEntity {
  type: 'agent' | 'team';
  id: string;
  name: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
```

---

### Animations & Scroll Behavior

Added to `globals.css`:

```css
/* Prevent page-level scrolling - only inner containers should scroll */
html,
body {
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
```

**Scroll Behavior:**
- Page-level scrolling is disabled to keep the input box fixed at the bottom
- Only the messages container scrolls (`overscroll-contain` prevents scroll chaining)
- Auto-scroll uses direct `scrollTop` manipulation to avoid scrolling ancestor elements

---

### Removed Dependencies

The following CopilotKit packages were removed:
- `@copilotkit/react-core`
- `@copilotkit/react-ui`
- `@copilotkit/runtime`

The app now uses a custom implementation without CopilotKit dependencies.
