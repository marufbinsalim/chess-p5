import React, { useState, useEffect } from 'react';
import Chessboard from './components/Chessboard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import GameInfo from './components/GameInfo';
import { Chess } from './chess/Chess';
import { MultiplayerManager } from './database/multiplayer';

const App: React.FC = () => {
  const [chess, setChess] = useState<Chess>(new Chess());
  const [multiplayer, setMultiplayer] = useState<MultiplayerManager | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<string[]>([]);

  useEffect(() => {
    // Handle URL hash for multiplayer rooms
    const hash = window.location.hash.slice(1);
    if (hash) {
      joinRoom(hash);
    }
  }, []);

  const createRoom = async () => {
    const newMultiplayer = new MultiplayerManager();
    try {
      const newRoomId = await newMultiplayer.createRoom();
      console.log('Created room:', newRoomId);
      window.location.hash = newRoomId;
      setRoomId(newRoomId);
      setMultiplayer(newMultiplayer);
      setPlayerColor(newMultiplayer.getPlayerColor());

      // Set up room update listener
      newMultiplayer.onRoomUpdate((room) => {
        if (room.game_state) {
          const updatedChess = new Chess();
          updatedChess.loadState(room.game_state);
          setChess(updatedChess);
        }
      });
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const joinRoom = async (hash: string) => {
    const newMultiplayer = new MultiplayerManager();
    const success = await newMultiplayer.joinRoom(hash);
    if (success) {
      console.log('Joined room:', hash);
      setRoomId(hash);
      setMultiplayer(newMultiplayer);
      setPlayerColor(newMultiplayer.getPlayerColor());

      // Set up room update listener
      newMultiplayer.onRoomUpdate((room) => {
        if (room.game_state) {
          const updatedChess = new Chess();
          updatedChess.loadState(room.game_state);
          setChess(updatedChess);
        }
      });
    } else {
      console.error('Failed to join room');
    }
  };

  const leaveRoom = () => {
    if (multiplayer) {
      multiplayer.cleanup();
      setMultiplayer(null);
      setRoomId(null);
      setPlayerColor(null);
      setChess(new Chess());
    }
    window.location.hash = '';
  };

  const sendChatMessage = (message: string) => {
    setChatMessages((prev) => [...prev, message]);
  };

  return (
    <div className="app">
      <Header />
      <div className="main-container">
        <Sidebar />
        <div className="game-area">
          <GameInfo roomId={roomId} playerColor={playerColor} />
          <div className="chessboard-wrapper">
            <Chessboard chess={chess} setChess={setChess} multiplayer={multiplayer} />
          </div>
          <div className="controls">
            {!roomId ? (
              <button className="btn-primary" onClick={createRoom}>
                Create Room
              </button>
            ) : (
              <button className="btn-secondary" onClick={leaveRoom}>
                Leave Room
              </button>
            )}
          </div>
        </div>
        <Chat messages={chatMessages} onSendMessage={sendChatMessage} />
      </div>
    </div>
  );
};

export default App;
