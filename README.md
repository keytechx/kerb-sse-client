# Kerb SSE Client

A React TypeScript client for testing the Kerb SSE service. This client demonstrates real-time Server-Sent Events (SSE) subscription and event publishing.

## Features

- **SSE Subscription**: Subscribe to booking events via SSE
- **Auto-publish**: Automatically publishes an event 10 seconds after subscribing
- **Manual publish**: Manually trigger event publishing
- **Real-time updates**: Display received events in real-time
- **Connection status**: Show connection status and event count
- **TypeScript**: Fully typed with TypeScript
- **React Hooks**: Uses modern React hooks (useState, useEffect, useRef)

## Prerequisites

Make sure the Kerb SSE service is running:

```bash
cd ../kerb-sse-emitter
cargo run
```

The service should be running on `http://localhost:8081`

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

Edit `.env.local` and set your API key (get this from the backend `.env` file):

```env
VITE_SSE_BASE_URL=http://localhost:8081
VITE_API_KEY=your-actual-api-key-here
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
- Establish SSE connection to `http://localhost:8081/api/sse/subscribe/bookings/booking-123`
- Start receiving events for booking ID `booking-123`
- Automatically schedule an event to be published after 10 seconds

### 2. Receive Events

Once subscribed, the client will:
- Display connection status
- Show received events in real-time
- Display event details (ID, fields updated, timestamp, metadata)

### 3. Publish Events

Events are published to the SSE service via:
- **Auto-publish**: Automatically after 10 seconds of subscribing
- **Manual publish**: Click "Manually Publish Event" button

Events are sent to: `POST http://localhost:8081/api/sse/events/bookings/booking-123/updated`

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
GET http://localhost:8081/api/sse/subscribe/bookings/{booking_id}
```

### Publish Endpoint

```typescript
POST http://localhost:8081/api/sse/events/bookings/{booking_id}/updated
Content-Type: application/json

{
  "event_id": "evt-123",
  "fields_updated": ["status", "updated_at"],
  "updated_at": "2025-11-28T10:00:00Z",
  "user_id": "user-789",
  "metadata": {}
}
```

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

- Ensure the SSE service is running on `http://localhost:8081`
- Check browser console for errors
- Verify the booking ID matches between client and server

## License

MIT
