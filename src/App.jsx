import { useState, useRef } from 'react';
import './App.css';

function App() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recording, setRecording] = useState(false);
    const [username, setUsername] = useState('');
    const [inputUsername, setInputUsername] = useState('');

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const handleSetUsername = () => {
        if (inputUsername.trim()) {
            setUsername(inputUsername.trim());
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        setMessages(prev => [...prev, { from: 'user', text: input }]);
        setLoading(true);

        try {
            const res = await fetch('https://t3d-projects.app.n8n.cloud/webhook-test/incoming-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'text',
                    message: input,
                    userId: username,
                }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { from: 'bot', text: data.reply || JSON.stringify(data) }]);
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setMessages(prev => [...prev, { from: 'bot', text: 'Ошибка запроса' }]);
        } finally {
            setLoading(false);
            setInput('');
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('data_voice', audioBlob, 'voice.webm');
                formData.append('type', 'audio');
                formData.append('userId', username);

                const audioUrl = URL.createObjectURL(audioBlob);
                setMessages(prev => [...prev, { from: 'user', audio: audioUrl }]);

                setLoading(true);

                try {
                    const res = await fetch('https://t3d-projects.app.n8n.cloud/webhook-test/incoming-message', {
                        method: 'POST',
                        body: formData,
                    });
                    const data = await res.json();
                    setMessages(prev => [...prev, { from: 'bot', text: data.reply || JSON.stringify(data) }]);
                    // eslint-disable-next-line no-unused-vars
                } catch (err) {
                    setMessages(prev => [...prev, { from: 'bot', text: 'Ошибка при отправке голоса' }]);
                } finally {
                    setLoading(false);
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setRecording(true);
        } catch (err) {
            alert('Не удалось начать запись: ' + err.message);
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
    };

    // Если имя не введено — показать форму
    if (!username) {
        return (
            <div className="App">
                <h1>Введите ваше имя</h1>
                <form>
                    <input
                        value={inputUsername}
                        onChange={(e) => setInputUsername(e.target.value)}
                        placeholder="Ваше имя"
                    />
                    <button onClick={handleSetUsername}>Начать</button>
                </form>
            </div>
        );
    }

    return (
        <div className="App">
            <h1>n8n Чат ({username})</h1>
            <div className="chat">
                {messages.map((msg, i) => (
                    <div key={i} className={`msg ${msg.from}`}>
                        <strong>{msg.from === 'user' ? username : 'Роберт'}:</strong><br />
                        {msg.audio ? (
                            <audio controls src={msg.audio} />
                        ) : (
                            msg.text
                        )}
                    </div>
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
                <button onClick={recording ? stopRecording : startRecording} disabled={loading}>
                    {recording ? '🛑 Стоп' : '🎙️ Говорить'}
                </button>
            </div>
        </div>
    );
}

export default App;
