# Kerb SSE Client

A React TypeScript client for testing the Kerb SSE service. This client demonstrates real-time Server-Sent Events (SSE) subscription and event publishing.

## Features

- **SSE Subscription**: Subscribe to events via SSE using a session/reference ID
- **Auto-publish**: Automatically publishes an event 10 seconds after subscribing
- **Manual publish**: Manually trigger event publishing
- **Real-time updates**: Display received events in real-time
- **Connection status**: Show connection status and event count
- **TypeScript**: Fully typed with TypeScript
- **React Hooks**: Uses modern React hooks (useState, useEffect, useRef)
- **Flexible Reference**: Uses session ID as reference for event channels (e.g., paymentSessionId)

## Prerequisites

Make sure the Kerb SSE service is running:

```bash
cd ../kerb-sse-emitter
cargo run
```

The service should be running on `http://localhost:8086`

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update with your API key:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set your configuration (get API key from the backend `.env` file):

```env
VITE_SSE_BASE_URL=http://localhost:8086
VITE_API_KEY=your-actual-api-key-here
VITE_SESSION_ID=session-test-123
```

**Important:** The `.env.local` file is ignored by git and should never be committed.

### 3. Run Development Server

```bash
npm run dev
```

The client will be available at `http://localhost:5173`

## How It Works

### 1. Subscribe to SSE

Click the "Subscribe to SSE" button to:
- Establish SSE connection to `http://localhost:8086/api/sse/subscribe/ref/{session_id}`
- Start receiving events for the specified session/reference ID
- Automatically schedule an event to be published after 10 seconds

**Note:** The session ID acts as the reference for the event channel. In production, this would be your `paymentSessionId` or similar identifier.

### 2. Receive Events

Once subscribed, the client will:
- Display connection status and session ID
- Show received events in real-time
- Display event details (ref ID, booking ID, transaction ID, timestamp, metadata)

### 3. Publish Events

Events are published to the SSE service via:
- **Auto-publish**: Automatically after 10 seconds of subscribing
- **Manual publish**: Click "Manually Publish Event" button

Events are sent to: `POST http://localhost:8086/api/sse/events/ref/{session_id}/updated`

## Component Structure

### App.tsx

Main component that handles:
- **State management**: Connection status, events, auto-publish scheduling
- **SSE connection**: Using EventSource API
- **Event publishing**: Using Fetch API
- **UI rendering**: Status, buttons, event list

### Key React Hooks Used

- `useState`: Manage connection state, events, and status
- `useEffect`: Cleanup SSE connection on unmount
- `useRef`: Store EventSource and timeout references

## API Integration

### Subscribe Endpoint

```typescript
GET http://localhost:8086/api/sse/subscribe/ref/{ref_id}?k={api_key}
```

- `{ref_id}`: Session ID or any reference identifier (e.g., paymentSessionId)
- `{api_key}`: API key for authentication

### Publish Endpoint

```typescript
POST http://localhost:8086/api/sse/events/ref/{ref_id}/updated?k={api_key}
Content-Type: application/json

{
  "event_id": "evt-123",
  "booking_id": "booking-456",
  "transaction_id": "txn-789",
  "updated_at": "2025-11-28T10:00:00Z",
  "user_id": "user-789",
  "metadata": {}
}
```

**Note:** The `ref_id` comes from the URL path parameter (not the JSON body). The `booking_id` is included in the body for reference.

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Technology Stack

- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **EventSource API**: Native SSE support
- **Fetch API**: HTTP requests

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Troubleshooting

### CORS Issues

If you encounter CORS issues, make sure the SSE service has CORS enabled. The Rust service uses `CorsLayer::permissive()` which should allow all origins.

### Connection Issues

- Ensure the SSE service is running on `http://localhost:8086`
- Check browser console for errors
- Verify the session ID is properly configured
- Ensure the API key is valid

## License

MIT
