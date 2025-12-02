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
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const subscribeToSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('Connecting...');

    const url = `${SSE_BASE_URL}/api/sse/subscribe/bookings/${BOOKING_ID}?k=${API_KEY}`;
    const eventSource = new EventSource(url);

    console.log('Creating EventSource with URL:', url);

    eventSource.onopen = () => {
      setConnectionStatus('Connected');
      setIsConnected(true);
      console.log('SSE connection opened successfully');
    };

    const handleSSEMessage = (event: MessageEvent) => {
      console.log('Raw SSE message received:', event.data);
      try {
        const parsed = JSON.parse(event.data);
        console.log('Parsed message:', parsed);

        if (parsed.type === 'connected') {
          console.log('Connected:', parsed.message);
        } else {
          const bookingEvent: BookingEvent = parsed;
          console.log('Adding booking event:', bookingEvent);
          setEvents((prev) => {
            const updated = [...prev, bookingEvent];
            console.log('Updated events array:', updated);
            return updated;
          });
        }
      } catch (e) {
        console.error('Failed to parse SSE message:', e);
        console.log('Raw data:', event.data);
      }
    };

    // Primary handler using onmessage (more reliable)
    eventSource.onmessage = handleSSEMessage;

    // Listen for the actual event type your server sends
    eventSource.addEventListener('BOOKING_UPDATED', (event) => {
      console.log('BOOKING_UPDATED event received:', event);
      handleSSEMessage(event as MessageEvent);
    });

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      console.log('EventSource readyState:', eventSource.readyState);
      console.log('CONNECTING=0, OPEN=1, CLOSED=2');
      if (eventSource.readyState === EventSource.CLOSED) {
        setConnectionStatus('Connection closed');
        setIsConnected(false);
      } else {
        setConnectionStatus('Connection error (will retry)');
      }
    };

    eventSourceRef.current = eventSource;

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
        `${SSE_BASE_URL}/api/sse/events/bookings/${BOOKING_ID}/updated?k=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        console.log('Event published successfully:', result);
      } else {
        const errorText = await response.text();
        console.error('Failed to publish event:', response.status, errorText);
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
