import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { backend } from 'declarations/backend';
import botImg from '/bot.svg';
import userImg from '/user.svg';
import '/index.css';

const App = () => {
  const [chat, setChat] = useState([
    {
      system: { content: "I'm a sovereign AI agent living on the Internet Computer. Ask me anything." }
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expressions, setExpressions] = useState({}); // Untuk menyimpan ekspresi AI
  const [gatchaCount, setGatchaCount] = useState(0); // Counter untuk gatcha card
  const chatBoxRef = useRef(null);

  const formatDate = (date) => {
    const h = '0' + date.getHours();
    const m = '0' + date.getMinutes();
    return `${h.slice(-2)}:${m.slice(-2)}`;
  };

  const askAgent = async (messages) => {
    try {
      const response = await backend.chat(messages);
      setChat((prevChat) => {
        const newChat = [...prevChat];
        newChat.pop(); // Hapus pesan "Thinking..."
        newChat.push({ system: { content: response } });
        return newChat;
      });

      // Simulasikan ekspresi AI berdasarkan konteks
      if (response.includes('happy')) {
        setExpressions({ system: '😊' });
      } else if (response.includes('confused')) {
        setExpressions({ system: '🤔' });
      } else {
        setExpressions({ system: '😐' });
      }

      // Increment gatcha count
      setGatchaCount((prevCount) => prevCount + 1);

      // Jika sudah 3 percakapan, berikan gatcha card
      if (gatchaCount === 3) {
        setChat((prevChat) => [
          ...prevChat,
          {
            system: { content: 'Congratulations! Here is your gatcha card:' },
          },
          {
            system: { content: '✨ [Mystery Card] ✨' },
          },
        ]);
        setGatchaCount(0); // Reset counter
      }
    } catch (e) {
      console.log(e);
      const eStr = String(e);
      const match = eStr.match(/(SysTransient|CanisterReject), \\+"([^\\"]+)/);
      if (match) {
        alert(match[2]);
      }
      setChat((prevChat) => {
        const newChat = [...prevChat];
        newChat.pop();
        return newChat;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      user: { content: inputValue }
    };
    const thinkingMessage = {
      system: { content: 'Thinking ...' }
    };
    setChat((prevChat) => [...prevChat, userMessage, thinkingMessage]);
    setInputValue('');
    setIsLoading(true);

    const messagesToSend = chat.slice(1).concat(userMessage);
    askAgent(messagesToSend);
  };

  const handleVoiceInput = async () => {
    try {
      const mediaRecorder = new MediaRecorder(navigator.mediaDevices.getUserMedia({ audio: true }));
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000); // Batas waktu rekaman 5 detik

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('file', blob, 'voice-input.wav');

        // Simulasi konversi suara ke teks (gunakan API suara ke teks)
        const voiceText = await fetch('/api/speech-to-text', {
          method: 'POST',
          body: formData,
        }).then((response) => response.text());

        setInputValue(voiceText);
        handleSubmit({ preventDefault: () => {} }); // Simulasikan submit
      };
    } catch (error) {
      console.error('Error recording audio:', error);
    }
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between bg-amber-500 p-4 text-white">
          <img src={botImg} alt="Bot" className="h-10 w-10 rounded-full" />
          <span className="font-bold">LLM Chatbot</span>
        </div>

        {/* Chat Box */}
        <div className="flex-1 overflow-y-auto rounded-t-lg bg-gray-100 p-4" ref={chatBoxRef}>
          {chat.map((message, index) => {
            const isUser = 'user' in message;
            const img = isUser ? userImg : botImg;
            const name = isUser ? 'User' : 'System';
            const text = isUser ? message.user.content : message.system.content;

            return (
              <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
                {!isUser && (
                  <div
                    className="mr-2 h-10 w-10 rounded-full"
                    style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover' }}
                  >
                    {expressions.system && <span className="text-xl">{expressions.system}</span>}
                  </div>
                )}
                <div className={`max-w-[70%] rounded-lg p-3 ${isUser ? 'bg-blue-500 text-white' : 'bg-white shadow'}`}>
                  <div
                    className={`mb-1 flex items-center justify-between text-sm ${isUser ? 'text-white' : 'text-gray-500'}`}
                  >
                    <div>{name}</div>
                    <div className="mx-2">{formatDate(new Date())}</div>
                  </div>
                  <div>{text}</div>
                </div>
                {isUser && (
                  <div
                    className="ml-2 h-10 w-10 rounded-full"
                    style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover' }}
                  ></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Input */}
        <form className="flex rounded-b-lg border-t bg-white p-4" onSubmit={handleSubmit}>
          <input
            type="text"
            className="flex-1 rounded-l border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask anything ..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="rounded-r bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading}
          >
            Send
          </button>
          <button
            type="button"
            onClick={handleVoiceInput}
            className="ml-2 rounded bg-green-500 p-2 text-white hover:bg-green-600"
          >
            🎤 Voice
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);