# Task Management API

This document describes the Task Management API endpoints and database setup.

## Database Setup

### 1. Run the Migration

Execute the SQL migration file to create the tasks table:

```bash
# In your Supabase SQL editor or via psql
psql -h your-db-host -U your-user -d your-database -f migrations/002_create_tasks.sql
```

Or manually run the SQL from `migrations/002_create_tasks.sql` in your Supabase dashboard.

### 2. Table Schema

The `tasks` table has the following structure:

```sql
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  description text,
  task_date date NOT NULL,
  task_time time NOT NULL,
  goal text,
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

## API Endpoints

All endpoints require authentication via Bearer token in the Authorization header.

Base URL: `http://your-server:5000/tasks`

### 1. Create Task

**POST** `/tasks`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "task_name": "Morning Feed Distribution",
  "description": "Distribute feed to all areas",
  "task_date": "2024-01-15",
  "task_time": "06:00",
  "goal": "Ensure all animals are fed on time"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "task_name": "Morning Feed Distribution",
    "description": "Distribute feed to all areas",
    "task_date": "2024-01-15",
    "task_time": "06:00:00",
    "goal": "Ensure all animals are fed on time",
    "completed": false,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### 2. Get All Tasks

**GET** `/tasks`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "task_name": "Morning Feed Distribution",
      "description": "Distribute feed to all areas",
      "task_date": "2024-01-15",
      "task_time": "06:00:00",
      "goal": "Ensure all animals are fed on time",
      "completed": false,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 3. Get Task by ID

**GET** `/tasks/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "task_name": "Morning Feed Distribution",
    ...
  }
}
```

### 4. Toggle Task Completion

**PATCH** `/tasks/:id/toggle`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "completed": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task marked as completed",
  "data": {
    "id": "uuid",
    "completed": true,
    ...
  }
}
```

### 5. Update Task

**PUT** `/tasks/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "task_name": "Updated Task Name",
  "description": "Updated description",
  "task_date": "2024-01-16",
  "task_time": "07:00",
  "goal": "Updated goal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": "uuid",
    ...
  }
}
```

### 6. Delete Task

**DELETE** `/tasks/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

## Validation Rules

1. **task_name**: Required, must be a non-empty string
2. **task_date**: Required, must be in format `YYYY-MM-DD`
3. **task_time**: Required, must be in format `HH:MM` (24-hour format)
4. **description**: Optional
5. **goal**: Optional
6. **completed**: Boolean, defaults to `false`

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing or invalid token)
- `404`: Not Found (task doesn't exist or doesn't belong to user)
- `500`: Internal Server Error

## Security

- All endpoints require authentication
- Users can only access their own tasks (enforced by user_id)
- Row Level Security (RLS) policies are enabled on the tasks table
- Tasks are automatically associated with the authenticated user

## Notes

- Tasks are automatically sorted by date and time (ascending)
- The `updated_at` field is automatically updated when a task is modified
- Tasks are soft-deleted (actually deleted from database)
- Date and time are stored separately for easier querying and filtering

