import {useState, useRef, memo} from 'react';
import './App.css';

const N8N_WEBHOOK_URL = 'https://t3d-projects.app.n8n.cloud/webhook/incoming-message';

// 🔊 keys for ElevenLabs
/*const ELEVENLABS_API_KEY = 'sk_2c7d605a06bef08acd46a55d5c14115c2480ae68c470c374';
const ELEVENLABS_VOICE_ID = 'TERu3lB0KuECqdPTHehh';*/

// Msg component
const Message = ({from, text, audio, username}) => (
    <div className={`msg ${from}`}>
        <strong>{from === 'user' ? username : 'Robert'}:</strong><br/>
        {audio ? <audio controls src={audio}/> : <span style={{whiteSpace: 'pre-wrap'}}>{text}</span>}
    </div>
);

// Chat (memoized to avoid re-rendering every text input)
const Chat = memo(function Chat({messages, loading, username}) {
    return (
        <div className="chat">
            {messages.map((msg, i) => (
                <Message key={i} {...msg} username={username}/>
            ))}
            {loading && (
                <div className="msg bot">
                    <em>Robert is typing...</em>
                </div>
            )}
        </div>
    );
});

function App() {
    const [input, setInput] = useState('');
    const [inputUsername, setInputUsername] = useState('');
    const [inputTOV, setInputTOV] = useState('');
    const [inputDailyInfo, setInputDailyInfo] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recording, setRecording] = useState(false);
    const [username, setUsername] = useState('');
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // 🎤 Speech synthesis by ElevenLabs
    /*const synthesizeSpeechElevenLabs = async (text) => {
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
        } catch (error) {
            console.error('Ошибка синтеза речи:', error);
            return null;
        }
    };*/

    const handleSetUsername = (e) => {
        e.preventDefault();
        if (inputUsername.trim()) {
            setUsername(inputUsername.trim());
        }
    };

    const addMessage = (msg) => {
        setMessages((prev) => [...prev, msg]);
    };

// 🗣 Bot response + voiceover
    const handleBotReply = async (data) => {
        const replyText = data?.[0]?.output || '...';
        const speechText = data?.[0]?.speech || replyText;

        addMessage({from: 'bot', text: replyText});

        /*const audioUrl = await synthesizeSpeechElevenLabs(speechText);
        if (audioUrl) {
            addMessage({from: 'bot', audio: audioUrl});
        }*/
    };

    const sendMessage = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        setInput('');
        addMessage({from: 'user', text: trimmedInput});
        setLoading(true);

        try {
            const res = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    type: 'text',
                    message: trimmedInput,
                    userId: username,
                    TOV: inputTOV,
                    inputDailyInfo: inputDailyInfo,
                }),
            });

            const data = await res.json();
            await handleBotReply(data);
        } catch (error) {
            console.error('Error:', error);
            addMessage({from: 'bot', text: 'Error'});
        } finally {
            setLoading(false);
        }
    };

// 🎙️ voice recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});

            const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : 'audio/mp4'; //  Safari / iOS

            const mediaRecorder = new MediaRecorder(stream, {mimeType});

            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // ✅ Используем тот же mimeType при создании Blob
                const audioBlob = new Blob(audioChunksRef.current, {type: mimeType});

                const formData = new FormData();
                formData.append('data_voice', audioBlob, `voice.${mimeType === 'audio/webm' ? 'webm' : 'mp4'}`);
                formData.append('type', 'audio');
                formData.append('userId', username);

                // Локальное воспроизведение
                const audioUrl = URL.createObjectURL(audioBlob);
                addMessage({from: 'user', audio: audioUrl});

                setLoading(true);
                try {
                    const res = await fetch(N8N_WEBHOOK_URL, {
                        method: 'POST',
                        body: formData,
                    });

                    const data = await res.json();
                    await handleBotReply(data);
                } catch (error) {
                    console.error('sending voice Error:', error);
                    addMessage({from: 'bot', text: 'sending voice Error'});
                } finally {
                    setLoading(false);
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setRecording(true);
        } catch (err) {
            console.error('recording error:', err);
            addMessage({from: 'bot', text: 'recording error: ' + err.message});
        }
    };


    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    if (!username) {
        return (
            <div className="App">
                <h1>Введите ваше имя</h1>
                <form className="startFrom" onSubmit={handleSetUsername}>
                    <input
                        id="name"
                        value={inputUsername}
                        onChange={(e) => setInputUsername(e.target.value)}
                        placeholder="Your name"
                    />
                    <label htmlFor="inputTOV">set the tone of voice</label>
                    <input
                        id="inputTOV"
                        value={inputTOV}
                        onChange={(e) => setInputTOV(e.target.value)}
                        placeholder="key words for ton of voice"
                    />
                    <label htmlFor="inputDailyInfo">input for daily quiz (If the data is not updated, the agent will use
                        the old data.)</label>
                    <input
                        id="inputDailyInfo"
                        value={inputDailyInfo}
                        onChange={(e) => setInputDailyInfo(e.target.value)}
                        placeholder="input Daily Info"
                    />
                    <button type="submit">Start</button>
                </form>
            </div>
        );
    }

    return (
        <div className="App">
            <h1>n8n Чат ({username})</h1>

            <Chat messages={messages} loading={loading} username={username}/>

            <div className="input-box">
                <input
                    id="msgInput"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) sendMessage();
                    }}
                    placeholder="Enter your message"
                />
                <button onClick={sendMessage} disabled={loading}>
                    {loading ? '...' : 'Send'}
                </button>
                <button onClick={recording ? stopRecording : startRecording} disabled={loading}>
                    {recording ? '🛑 Stop' : '🎙️ Speak'}
                    {recording && <span className="recording-dot"/>}
                </button>
            </div>
        </div>
    );
}

export default App;
