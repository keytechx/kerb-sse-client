import { useState, useEffect, useRef } from 'react';
import './App.css';

interface BookingEvent {
  event_class: string;
  event_id: string;
  booking_id: string;
  transaction_id?: string;
  updated_at: string;
  user_id?: string;
  metadata: Record<string, unknown>;
}

const SSE_BASE_URL = import.meta.env.VITE_SSE_BASE_URL || 'http://localhost:8081';
const API_KEY = import.meta.env.VITE_API_KEY;
const BOOKING_ID = 'booking-123';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [autoPublishScheduled, setAutoPublishScheduled] = useState(false);
  const eventSourceRef = useRef<{ close: () => void } | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const subscribeToSSE = async () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('Connecting...');

    try {
      const response = await fetch(
        `${SSE_BASE_URL}/api/sse/subscribe/bookings/${BOOKING_ID}`,
        {
          headers: {
            'X-API-Key': API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      setConnectionStatus('Connected');
      setIsConnected(true);

      const decoder = new TextDecoder();
      let buffer = '';

      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6);
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'connected') {
                    console.log('Connected:', parsed.message);
                  } else {
                    const bookingEvent: BookingEvent = parsed;
                    setEvents((prev) => [...prev, bookingEvent]);
                  }
                } catch (e) {
                  console.log('Received:', data);
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream reading error:', error);
          setConnectionStatus('Connection error');
          setIsConnected(false);
        }
      };

      readStream();

      // Store a reference for cleanup
      eventSourceRef.current = { close: () => reader.cancel() };
    } catch (error) {
      console.error('SSE connection error:', error);
      setConnectionStatus('Connection failed');
      setIsConnected(false);
    }

    // Schedule auto-publish after 10 seconds
    if (!autoPublishScheduled) {
      setAutoPublishScheduled(true);
      timeoutRef.current = setTimeout(() => {
        publishBookingUpdate();
      }, 10000);
    }
  };

  const publishBookingUpdate = async () => {
    try {
      const response = await fetch(
        `${SSE_BASE_URL}/api/sse/events/bookings/${BOOKING_ID}/updated`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
          },
          body: JSON.stringify({
            event_id: `evt-${Date.now()}`,
            transaction_id: `txn-${Date.now()}`,
            updated_at: new Date().toISOString(),
            user_id: 'user-789',
            metadata: {
              source: 'react-client',
              triggered_at: new Date().toISOString(),
            },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Event published:', result);
      } else {
        console.error('Failed to publish event:', response.statusText);
      }
    } catch (error) {
      console.error('Error publishing event:', error);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('Disconnected');
    setAutoPublishScheduled(false);
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="app">
      <h1>Kerb SSE Client</h1>
      <div className="status-section">
        <p>
          <strong>Status:</strong>{' '}
          <span className={isConnected ? 'status-connected' : 'status-disconnected'}>
            {connectionStatus}
          </span>
        </p>
        <p>
          <strong>Booking ID:</strong> {BOOKING_ID}
        </p>
      </div>

      <div className="button-section">
        {!isConnected ? (
          <button onClick={subscribeToSSE} className="btn btn-primary">
            Subscribe to SSE
          </button>
        ) : (
          <>
            <button onClick={disconnect} className="btn btn-danger">
              Disconnect
            </button>
            <button onClick={publishBookingUpdate} className="btn btn-secondary">
              Manually Publish Event
            </button>
          </>
        )}
      </div>

      {autoPublishScheduled && isConnected && (
        <p className="info-message">
          ℹ️ An event will be automatically published in 10 seconds...
        </p>
      )}

      <div className="events-section">
        <h2>Received Events ({events.length})</h2>
        {events.length === 0 ? (
          <p className="no-events">No events received yet. Click "Subscribe to SSE" to start.</p>
        ) : (
          <div className="events-list">
            {events.map((event, index) => (
              <div key={`${event.event_id}-${index}`} className="event-card">
                <div className="event-header">
                  <span className="event-type">{event.event_class}</span>
                  <span className="event-id">{event.event_id}</span>
                </div>
                <div className="event-body">
                  <p>
                    <strong>Booking:</strong> {event.booking_id}
                  </p>
                  {event.transaction_id && (
                    <p>
                      <strong>Transaction:</strong> {event.transaction_id}
                    </p>
                  )}
                  <p>
                    <strong>Updated At:</strong> {new Date(event.updated_at).toLocaleString()}
                  </p>
                  {event.user_id && (
                    <p>
                      <strong>User:</strong> {event.user_id}
                    </p>
                  )}
                  {Object.keys(event.metadata).length > 0 && (
                    <details className="metadata">
                      <summary>Metadata</summary>
                      <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
