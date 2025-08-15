
import { useState } from 'react';

export default function AlarmChat({ addMessage, handleBotReply,username, N8N_WEBHOOK_URL_ALARM, text }) {
    const [loading, setLoading] = useState(false);

    const sendAlarm = async (e) => {
        e.preventDefault();

        setLoading(true);

        try {
            const res = await fetch(N8N_WEBHOOK_URL_ALARM, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'text', message: text,  userId: username, }),
            });

            const data = await res.json();
            await handleBotReply(data);
        } catch (error) {
            console.error('Error:', error);
            addMessage({ from: 'bot', text: 'Error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={sendAlarm}>

            <button type="submit" disabled={loading}>
                {loading ? '...' : 'Send'}
            </button>
        </form>
    );
}
