// HeyGenLiveKit.jsx
import { useEffect, useRef } from 'react';
import { Room, RoomEvent } from 'livekit-client';

const API_CONFIG = {
    apiKey: 'NTkyMDkwNjE4OGNlNGU5YTg2YTRlNWFjNWRmZWMyYjktMTc1MDQyNDk0Ng==',
    serverUrl: 'https://api.heygen.com',
};

let sessionInfo = null;
let room = null;
let webSocket = null;
let sessionToken = null;

export default function HeyGenLiveKit() {
    const videoRef = useRef(null);

    const updateStatus = (msg) => {
        console.log(`[heygen] ${msg}`);
    };

    const getSessionToken = async () => {
        const res = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.create_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': API_CONFIG.apiKey,
            },
        });
        const data = await res.json();
        sessionToken = data.data.token;
        updateStatus('Session token ready');
    };

    const connectWebSocket = async (sessionId) => {
        const params = new URLSearchParams({
            session_id: sessionId,
            session_token: sessionToken,
            silence_response: false,
            opening_text: 'Привет, родное сердце.',
            stt_language: 'ru',
        });

        const wsUrl = `wss://${new URL(API_CONFIG.serverUrl).hostname}/v1/ws/streaming.chat?${params}`;
        webSocket = new WebSocket(wsUrl);
        webSocket.onmessage = (event) => {
            console.log('WebSocket message:', JSON.parse(event.data));
        };
    };

    const createNewSession = async () => {
        if (!sessionToken) await getSessionToken();

        const res = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.new`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({
                quality: 'high',
                avatar_name: 'bc337361041548b684662fe4d0e36573',
                voice: {
                    voice_id: 'voiceID',
                    rate: 1.0,
                },
                version: 'v2',
                video_encoding: 'H264',
            }),
        });

        sessionInfo = (await res.json()).data;

        room = new Room({
            adaptiveStream: true,
            dynacast: true,
        });

        const mediaStream = new MediaStream();

        room.on(RoomEvent.TrackSubscribed, (track) => {
            if (track.kind === 'video' || track.kind === 'audio') {
                mediaStream.addTrack(track.mediaStreamTrack);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    updateStatus('Media ready');
                }
            }
        });

        await room.prepareConnection(sessionInfo.url, sessionInfo.access_token);
        await connectWebSocket(sessionInfo.session_id);
        updateStatus('Session created');
    };

    const startStreaming = async () => {
        await fetch(`${API_CONFIG.serverUrl}/v1/streaming.start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({ session_id: sessionInfo.session_id }),
        });

        await room.connect(sessionInfo.url, sessionInfo.access_token);
        updateStatus('Streaming started');
    };

    useEffect(() => {
        (async () => {
            await createNewSession();
            await startStreaming();
        })();
    }, []);

    return (
        <div>
            <video ref={videoRef} autoPlay className="rounded-md border w-full max-w-lg" />
        </div>
    );
}

export async function sendText(text, taskType = 'talk') {
    if (!sessionInfo) return;
    await fetch(`${API_CONFIG.serverUrl}/v1/streaming.task`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
            session_id: sessionInfo.session_id,
            text,
            task_type: taskType,
        }),
    });
    console.log(`[heygen] Sent: ${text}`);
}
