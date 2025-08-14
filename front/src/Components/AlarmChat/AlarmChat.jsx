
import { useState } from 'react';

export default function AlarmChat({ addMessage, handleBotReply,username, N8N_WEBHOOK_URL_ALARM }) {
    const [alarmInput, setAlarmInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendAlarm = async (e) => {
        e.preventDefault();
        const text = alarmInput.trim();
        if (!text) return;

        setAlarmInput('');
        addMessage({ from: 'user', text });
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
            <input
                value={alarmInput}
                onChange={(e) => setAlarmInput(e.target.value)}
                placeholder="Set your alarmInput"
            />
            <button type="submit" disabled={loading}>
                {loading ? '...' : 'Send'}
            </button>
        </form>
    );
}
