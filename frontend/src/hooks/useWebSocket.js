import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * WebSocket hook for real-time code execution
 * Manages connection, message handling, heartbeat, and reconnection
 */
export function useWebSocket(url, options = {}) {
    const {
        onMessage,
        onOpen,
        onClose,
        onError,
        reconnect = true,
        reconnectInterval = 3000,
        reconnectAttempts = 5,
        heartbeatInterval = 30000, // 30 seconds
        heartbeatTimeout = 10000   // 10 seconds to wait for pong
    } = options;

    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectCountRef = useRef(0);
    const heartbeatTimerRef = useRef(null);
    const heartbeatTimeoutRef = useRef(null);

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // ✅ Helper: clear all timers
    const clearTimers = () => {
        clearTimeout(reconnectTimeoutRef.current);
        clearInterval(heartbeatTimerRef.current);
        clearTimeout(heartbeatTimeoutRef.current);
    };

    const startHeartbeat = useCallback(() => {
        if (!wsRef.current) return;

        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = setInterval(() => {
            if (wsRef.current?.readyState !== WebSocket.OPEN) return;

            try {
                // Send ping frame (custom message)
                wsRef.current.send(JSON.stringify({ type: 'ping' }));

                // Wait for pong (heartbeatTimeout)
                clearTimeout(heartbeatTimeoutRef.current);
                heartbeatTimeoutRef.current = setTimeout(() => {
                    console.warn('⚠️ WebSocket heartbeat timeout — reconnecting...');
                    wsRef.current?.close(4000, 'Heartbeat timeout');
                }, heartbeatTimeout);
            } catch (err) {
                console.error('❌ Heartbeat send failed:', err);
            }
        }, heartbeatInterval);
    }, [heartbeatInterval, heartbeatTimeout]);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        setIsConnecting(true);

        try {
            const ws = new WebSocket(url);

            ws.onopen = (event) => {
                console.log('✅ WebSocket connected:', url);
                setIsConnected(true);
                setIsConnecting(false);
                reconnectCountRef.current = 0;
                startHeartbeat();
                onOpen?.(event);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                            console.log("📩 WebSocket message received:", data);

                    // Handle server heartbeat pongs 
                    if (data?.type === 'pong' || data?.type === 'ping') {
                        clearTimeout(heartbeatTimeoutRef.current);
                        return;
                    }

                    onMessage?.(data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            ws.onerror = (event) => {
                console.error('❌ WebSocket error:', event);
                onError?.(event);
            };

            ws.onclose = (event) => {
                console.log(
                    `🔌 WebSocket closed (code=${event.code}, reason=${event.reason || 'none'})`
                );

                setIsConnected(false);
                setIsConnecting(false);
                wsRef.current = null;
                clearTimers();
                onClose?.(event);

                // Auto-reconnect only for abnormal closes
                if (reconnect && event.code !== 1000 && reconnectCountRef.current < reconnectAttempts) {
                    reconnectCountRef.current++;
                    console.log(`🔄 Reconnecting... (${reconnectCountRef.current}/${reconnectAttempts})`);
                    reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            setIsConnecting(false);
        }
    }, [
        url,
        reconnect,
        reconnectInterval,
        reconnectAttempts,
        startHeartbeat,
        onMessage,
        onOpen,
        onClose,
        onError
    ]);

    const disconnect = useCallback(() => {
        clearTimers();
        if (wsRef.current) {
            wsRef.current.close(1000, 'Client disconnect');
            wsRef.current = null;
        }
        setIsConnected(false);
        setIsConnecting(false);
    }, []);

    const send = useCallback((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            try {
                wsRef.current.send(JSON.stringify(data));
                return true;
            } catch (err) {
                console.error('WebSocket send error:', err);
            }
        } else {
            console.warn('⚠️ WebSocket not connected, cannot send message');
        }
        return false;
    }, []);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        connect,
        disconnect,
        send,
        isConnected,
        isConnecting
    };
}
