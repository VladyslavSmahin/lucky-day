import { useState } from 'react';
import './App.css';

function App() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        setMessages(prev => [...prev, { from: 'user', text: input }]);
        setLoading(true);

        try {
            const res = await fetch('https://t3d-projects.app.n8n.cloud/webhook-test/incoming-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { from: 'bot', text: data.reply || JSON.stringify(data) }]);
        } catch (err) {
            setMessages(prev => [...prev, { from: 'bot', text: 'Ошибка запроса' }]);
        } finally {
            setLoading(false);
            setInput('');
        }
    };

    return (
        <div className="App">
            <h1>n8n Чат</h1>
            <div className="chat">
                {messages.map((msg, i) => (
                    <div key={i} className={`msg ${msg.from}`}>{msg.text}</div>
                ))}
            </div>
            <div className="input-box">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Введите сообщение"
                />
                <button onClick={sendMessage} disabled={loading}>
                    {loading ? '...' : 'Отправить'}
                </button>
            </div>
        </div>
    );
}

export default App;
