# Agno Session Management API

## Overview

The Session Management API provides endpoints to list, retrieve, and delete sessions and their associated runs. Sessions represent conversation threads with agents or teams, while runs represent individual interactions within a session.

---

## List Sessions

Retrieve a paginated list of sessions filtered by type (agent or team).

### Request

```bash
# List agent sessions
curl --request GET \
  --url 'http://localhost:9001/sessions?type=agent'

# List team sessions
curl --request GET \
  --url 'http://localhost:9001/sessions?type=team'

# With pagination
curl --request GET \
  --url 'http://localhost:9001/sessions?type=team&page=1&limit=5'
```

### Query Parameters

| Parameter | Type   | Required | Default | Description                    |
|-----------|--------|----------|---------|--------------------------------|
| `type`    | string | Yes      | -       | Session type: `agent` or `team`|
| `page`    | int    | No       | 1       | Page number for pagination     |
| `limit`   | int    | No       | 20      | Items per page                 |

### Response Schema

```json
{
  "data": [
    {
      "session_id": "90c5af79-25cc-4450-9ace-f1f8698e4fe7",
      "session_name": "tell me about ub wo so",
      "session_state": {},
      "created_at": "2026-03-13T06:34:11Z",
      "updated_at": "2026-03-13T06:36:42Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 5,
    "total_pages": 6,
    "total_count": 26,
    "search_time_ms": 0.0
  }
}
```

### TypeScript Interface

```typescript
interface Session {
  session_id: string;
  session_name: string;
  session_state: Record<string, unknown>;
  created_at: string;  // ISO 8601 timestamp
  updated_at: string;  // ISO 8601 timestamp
}

interface SessionListResponse {
  data: Session[];
  meta: {
    page: number;
    limit: number;
    total_pages: number;
    total_count: number;
    search_time_ms: number;
  };
}
```

### Notes

- `session_name` is derived from the first user message in the session
- `session_state` contains any custom state stored during the session (usually empty `{}`)
- Sessions are returned in reverse chronological order (most recent first)
- Empty `data` array indicates no sessions of that type exist

---

## Get Session Runs

Retrieve all runs (executions) for a specific session. Runs represent individual agent/team interactions within a session, including nested member agent runs for teams.

### Request

```bash
curl --request GET \
  --url 'http://localhost:9001/sessions/{session_id}/runs'
```

### Path Parameters

| Parameter    | Type   | Description     |
|--------------|--------|-----------------|
| `session_id` | string | Session UUID    |

### Response Schema

Returns an array of run objects. Each run contains:

```json
[
  {
    "run_id": "9cefeada-21ff-46be-a886-e6f1a49a3eea",
    "parent_run_id": "09699935-9844-4020-9fe8-3558757d3efe",
    "agent_id": "internal-knowledge-assistant",
    "user_id": "",
    "status": "COMPLETED",
    "run_input": "Search for information about...",
    "content": "I'll search for \"ub wo so\"...",
    "run_response_format": "text",
    "reasoning_content": "The user is asking me to...",
    "reasoning_steps": [],
    "metrics": {
      "time_to_first_token": 2.817298166999535,
      "duration": 21.653727375000017,
      "details": {
        "model": [
          {
            "id": "endor/endor-glm-5",
            "provider": "DeepSeek"
          }
        ]
      }
    },
    "messages": [
      {
        "id": "85e2ac16-62b5-4d7d-bd3e-157097fdc130",
        "content": "System prompt...",
        "from_history": false,
        "stop_after_tool_call": false,
        "role": "system",
        "created_at": 1773383661
      }
    ]
  }
]
```

### TypeScript Interface

```typescript
interface RunMessage {
  id: string;
  content: string;
  from_history: boolean;
  stop_after_tool_call: boolean;
  role: 'system' | 'user' | 'assistant';
  created_at: number;  // Unix timestamp
  reasoning_content?: string;
}

interface RunMetrics {
  time_to_first_token: number;
  duration: number;
  details: {
    model: Array<{
      id: string;
      provider: string;
    }>;
  };
}

interface Run {
  run_id: string;
  parent_run_id: string | null;  // For nested member agent runs
  agent_id: string;
  user_id: string;
  status: 'COMPLETED' | 'RUNNING' | 'ERROR';
  run_input: string;
  content: string;
  run_response_format: string;
  reasoning_content: string;
  reasoning_steps: unknown[];
  metrics: RunMetrics;
  messages: RunMessage[];
}

type SessionRunsResponse = Run[];
```

### Key Fields Explained

| Field              | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| `run_id`           | Unique identifier for this run                                              |
| `parent_run_id`    | For team sessions, links nested member agent runs to the parent team run   |
| `agent_id`         | ID of the agent that executed this run                                      |
| `status`           | Run status: `COMPLETED`, `RUNNING`, or `ERROR`                              |
| `run_input`        | The input task/prompt for this run                                          |
| `content`          | The final response content (markdown formatted)                             |
| `reasoning_content`| AI's internal thinking/reasoning process                                    |
| `metrics`          | Performance metrics including timing and model info                         |
| `messages`         | Full message history for this run (system, user, assistant messages)        |

### Notes

- For team sessions, runs include both team runs and nested member agent runs
- Nested runs have `parent_run_id` linking to the parent team run
- `messages` array contains the full conversation context for that run
- Response can be large; consider implementing pagination or lazy loading in UI

---

## Delete Session

Permanently delete a specific session and all its associated runs.

### Request

```bash
curl --request DELETE \
  --url 'http://localhost:9001/sessions/{session_id}'
```

### Path Parameters

| Parameter    | Type   | Description     |
|--------------|--------|-----------------|
| `session_id` | string | Session UUID    |

### Response

- **Success**: HTTP 204 No Content (empty response body)
- **Error**: HTTP 404 if session not found

### Example

```bash
# Delete a session
curl -s -w "\nHTTP Status: %{http_code}\n" \
  --request DELETE \
  --url 'http://localhost:9001/sessions/76903d3e-e540-4076-b859-605ec64234c7'

# Output:
# HTTP Status: 204
```

### Notes

- This action is **irreversible**
- Deletes all associated runs and their message history
- Returns 204 on success (no response body)

---

## Delete Multiple Sessions

Permanently delete multiple sessions and all their associated runs in a single request.

### Request

```bash
curl --request DELETE \
  --url 'http://localhost:9001/sessions' \
  -H 'Content-Type: application/json' \
  -d '{
    "session_ids": ["session-uuid-1", "session-uuid-2"],
    "session_types": ["team", "agent"]
  }'
```

### Request Body

| Parameter       | Type     | Required | Description                                      |
|-----------------|----------|----------|--------------------------------------------------|
| `session_ids`   | string[] | Yes      | Array of session UUIDs to delete                 |
| `session_types` | string[] | Yes      | Array of session types corresponding to each ID (`agent` or `team`) |

### Response

- **Success**: HTTP 204 No Content (empty response body)
- **Validation Error**: HTTP 422 if required fields are missing

### Example

```bash
# Delete multiple sessions
curl -s -w "\nHTTP Status: %{http_code}\n" \
  --request DELETE \
  --url 'http://localhost:9001/sessions' \
  -H 'Content-Type: application/json' \
  -d '{
    "session_ids": ["90c5af79-25cc-4450-9ace-f1f8698e4fe7", "ace3bb48-1f7a-41ef-b26a-8dad5b073022"],
    "session_types": ["team", "team"]
  }'

# Output:
# HTTP Status: 204
```

### TypeScript Interface

```typescript
interface DeleteSessionsRequest {
  session_ids: string[];
  session_types: ('agent' | 'team')[];
}
```

### Notes

- This action is **irreversible**
- `session_ids` and `session_types` arrays must have the same length (each ID must have a corresponding type)
- Deletes all associated runs and message history for each session
- Returns 204 on success regardless of whether sessions existed

---

## UI Implementation Notes

### Session List View

1. Display sessions in reverse chronological order
2. Show `session_name` as the primary title
3. Show `created_at` and `updated_at` as relative timestamps
4. Support pagination with `page` and `limit` parameters
5. Allow filtering by type (agent/team)

### Session Detail View

1. Load runs for a session when user selects it
2. Display runs in chronological order
3. For team sessions:
   - Group nested member runs under their parent team run
   - Use `parent_run_id` to establish hierarchy
4. Show reasoning content in collapsible sections
5. Render `content` as markdown

### Resume Session Feature

To resume a session:
1. Store `session_id` from the session list
2. When starting a new chat, pass `session_id` in the POST request to `/agents/{agent_id}/runs` or `/teams/{team_id}/runs`
3. The server will load the session context and continue the conversation

### Delete Confirmation

Always show a confirmation dialog before deleting:
- Warn user that this action is irreversible
- Show session name and run count (if available)
- Require explicit confirmation (e.g., type session name or click "Delete")

### Batch Delete Feature

For the delete multiple sessions endpoint:
1. Provide multi-select functionality in the session list
2. Show selected count before confirming deletion
3. Use the batch delete endpoint instead of individual DELETE calls for efficiency
4. Ensure `session_ids` and `session_types` arrays are properly aligned:
   - Each session ID must have a corresponding type
   - Track the session type when loading the session list
5. Consider implementing a "Select All" feature with server-side filtering