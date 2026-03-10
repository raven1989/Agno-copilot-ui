# Agno Agent API Event Types Reference

This document records all Server-Sent Events (SSE) returned by the Agno agent API for UI implementation reference.

## Quick Start

```bash
cd my-copilot-app
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Configuration

The app connects to the Agno agent server using these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_AGENT_URL` | `http://localhost:9001` | URL of the Agno agent server |
| `NEXT_PUBLIC_AGENT_ID` | `helperful-assistant` | ID of the agent to use |

Create a `.env.local` file in `my-copilot-app/` to override defaults:

```
NEXT_PUBLIC_AGENT_URL=http://localhost:9001
NEXT_PUBLIC_AGENT_ID=helperful-assistant
```

**Note:** The app makes direct HTTP requests to the agent server using `application/x-www-form-urlencoded` format.

## Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Core Types & Utilities | Completed |
| Phase 2 | UI Components | Completed |
| Phase 3 | Chat Interface | Completed |
| Phase 4 | Polish & UX | Completed |

---

## API Endpoint

```
POST http://localhost:9001/agents/{agent_id}/runs
Content-Type: application/x-www-form-urlencoded

Parameters:
- message: string (user message)
- stream: boolean (true for SSE, false for complete response)
```

---

## Event Types Overview

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

### State Management

Track the following state during streaming:
- Current run_id and session_id
- Accumulated reasoning_content
- Accumulated content
- List of tool calls with their states
- Run status (running/completed/error)

### Streaming Strategy

1. Accumulate `content` and `reasoning_content` separately
2. Update UI on each `RunContent` event
3. Handle tool calls as they occur
4. Use `RunCompleted` for final state/metrics

---

## Implementation Details

### Implemented File Structure

```
my-copilot-app/
├── app/
│   ├── page.tsx              # Main chat page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles with animations
├── components/
│   ├── ChatContainer.tsx     # Main chat container with state management
│   ├── ChatMessage.tsx       # Single message display (user/assistant)
│   ├── ChatInput.tsx         # Input field with send button
│   ├── MessageStream.tsx     # Streaming message display container
│   ├── ReasoningBlock.tsx    # Collapsible thinking section
│   ├── ToolCallBlock.tsx     # Tool execution card with status
│   └── ContentBlock.tsx      # Markdown content with syntax highlighting
├── lib/
│   ├── types/
│   │   ├── events.ts         # TypeScript interfaces for all 8 SSE events
│   │   ├── message.ts        # Message and state types
│   │   └── index.ts          # Type exports
│   ├── utils/
│   │   └── sse-parser.ts     # SSE parsing utility (SSEParser class)
│   └── hooks/
│       └── useAgentRun.ts    # Agent communication hook
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

#### ChatInput
- Textarea with auto-resize
- Enter to send, Shift+Enter for newline
- Disabled during streaming
- Send button with icon

#### MessageStream
- Orchestrates display order:
  1. Reasoning content (if any)
  2. Tool calls (if any)
  3. Main content
- Shows typing indicator during initial load

#### ReasoningBlock
- Collapsible "Thinking" section
- Purple brain icon
- Gray muted background
- Expand/collapse animation

#### ToolCallBlock
- Expandable card for tool execution
- Color-coded tool name badges
- Status icons: spinner (running), checkmark (completed), X (error)
- JSON formatting for arguments and results
- Color-coded borders based on status

#### ContentBlock
- Markdown rendering with GitHub Flavored Markdown
- Syntax highlighting for code blocks using `oneLight` theme
- Styled tables with borders
- Inline code with pink highlight

---

### useAgentRun Hook

The core hook for agent communication:

```typescript
const {
  messages,      // Message[] - completed messages
  currentRun,    // StreamMessage | null - current streaming run
  isStreaming,   // boolean - is a run in progress
  error,         // string | null - error message if any
  sendMessage,   // (content: string) => Promise<void>
  clearMessages, // () => void
} = useAgentRun();
```

**Features:**
- Direct HTTP POST to agent API using `application/x-www-form-urlencoded`
- Uses custom `SSEParser` to parse Agno SSE events
- Accumulates `content` and `reasoning_content` separately
- Tracks tool call states (running/completed/error)
- Maintains session ID for conversation continuity
- Error handling with user feedback

**Configuration:** Agent URL and ID are configured via environment variables at the top of the hook:
```typescript
const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:9001';
const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID || 'helperful-assistant';
```

---

### Animations

Added to `globals.css`:

```css
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

---

### Removed Dependencies

The following CopilotKit packages were removed:
- `@copilotkit/react-core`
- `@copilotkit/react-ui`
- `@copilotkit/runtime`

The app now uses a custom implementation without CopilotKit dependencies.
