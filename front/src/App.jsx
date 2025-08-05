import {useState, useRef, useEffect} from 'react';
import './App.css';

const ELEVENLABS_API_KEY = 'sk_2c7d605a06bef08acd46a55d5c14115c2480ae68c470c374';
const ELEVENLABS_VOICE_ID = 'TERu3lB0KuECqdPTHehh';
const N8N_WEBHOOK_URL = 'https://t3d-projects.app.n8n.cloud/webhook/incoming-message';

function App() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recording, setRecording] = useState(false);
    const [username, setUsername] = useState('');
    const [inputUsername, setInputUsername] = useState('');
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const synthesizeSpeechElevenLabs = async (text) => {
        try {
            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'xi-api-key': ELEVENLABS_API_KEY,
                    },
                    body: JSON.stringify({ text }),
                }
            );

            if (!response.ok) throw new Error('Speech synthesis failed');

            const audioBlob = await response.blob();
            return URL.createObjectURL(audioBlob);
        } catch {
            return null;
        }
    };


    const handleSetUsername = (e) => {
        e.preventDefault();
        if (inputUsername.trim()) {
            setUsername(inputUsername.trim());
        }
    };

    const addMessage = (msg) => {
        setMessages((prev) => [...prev, msg]);
    };

    const sendMessage = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        setInput('');
        addMessage({ from: 'user', text: trimmedInput });
        setLoading(true);

        try {
            const res = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'text',
                    message: trimmedInput,
                    userId: username,
                }),
            });

            const data = await res.json();
            const replyText = data?.[0]?.output || '...';
            const speechText = data?.[0]?.speech || replyText;

            addMessage({ from: 'bot', text: replyText });

            const audioUrl = await synthesizeSpeechElevenLabs(speechText);
            if (audioUrl) addMessage({ from: 'bot', audio: audioUrl });
        } catch {
            addMessage({ from: 'bot', text: 'Ошибка запроса' });
        } finally {
            setLoading(false);
        }
    };


    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('data_voice', audioBlob, 'voice.webm');
                formData.append('type', 'audio');
                formData.append('userId', username);

                const audioUrl = URL.createObjectURL(audioBlob);
                addMessage({ from: 'user', audio: audioUrl });

                setLoading(true);
                try {
                    const res = await fetch(N8N_WEBHOOK_URL, {
                        method: 'POST',
                        body: formData,
                    });
                    const data = await res.json();
                    const replyText = Array.isArray(data) && data[0]?.output ? data[0].output : JSON.stringify(data);
                    const speechText = data[0]?.speech || replyText;

                    const botAudioUrl = await synthesizeSpeechElevenLabs(speechText);
                    addMessage({ from: 'bot', text: replyText, audio: botAudioUrl });
                } catch {
                    addMessage({ from: 'bot', text: 'Ошибка при отправке голоса' });
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

    if (!username) {
        return (
            <div className="App">
                <h1>Введите ваше имя</h1>
                <form onSubmit={handleSetUsername}>
                    <input
                        value={inputUsername}
                        onChange={(e) => setInputUsername(e.target.value)}
                        placeholder="Ваше имя"
                    />
                    <button type="submit">Начать</button>
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
                            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                        )}
                    </div>
                ))}
            </div>

            <div className="input-box">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) sendMessage();
                    }}
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
