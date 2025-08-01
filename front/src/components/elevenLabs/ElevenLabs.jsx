import { ElevenLabsClient, stream } from '@elevenlabs/elevenlabs-js';
import { Readable } from 'stream';
import fs from 'fs';

   const apiKey = 'sk_2c7d605a06bef08acd46a55d5c14115c2480ae68c470c374';
   const  voiceId = 'TERu3lB0KuECqdPTHehh';




const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
    },
    body: JSON.stringify({
        text: 'Привет, это тест озвучки моим голосом ElevenLabs!'
    })
});

if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
}

// Получаем поток
const dest = fs.createWriteStream('output.mp3');
response.body.pipe(dest);

dest.on('finish', () => {
    console.log('Аудиофайл сохранён как output.mp3');
});
