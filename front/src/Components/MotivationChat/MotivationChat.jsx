// MotivationInput.jsx
import { useState } from 'react';

export default function MotivationChat({ addMessage, handleBotReply,username, N8N_WEBHOOK_URL_MOTIVATION, text }) {
    const [motivationInput, setMotivationInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMotivation = async (e) => {
        e.preventDefault();

        setLoading(true);

        try {
            const res = await fetch(N8N_WEBHOOK_URL_MOTIVATION, {
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
        <form onSubmit={sendMotivation}>
            <button type="submit" disabled={loading}>
                {loading ? '...' : 'Send'}
            </button>
        </form>
    );
}
