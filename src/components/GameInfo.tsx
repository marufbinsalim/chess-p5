import React from 'react';

interface GameInfoProps {
  roomId: string | null;
  playerColor: string | null;
}

const GameInfo: React.FC<GameInfoProps> = ({ roomId, playerColor }) => {
  return (
    <div className="game-info">
      <div className="game-status">
        <div className="status-label">Game Status</div>
        <div className="status-value">
          {roomId ? 'In Game' : 'Ready to Play'}
        </div>
      </div>
      {roomId && (
        <div className="room-details">
          <div className="room-id">
            <span className="label">Room ID:</span>
            <span className="value">{roomId}</span>
          </div>
          {playerColor && (
            <div className="player-color">
              <span className="label">Your Color:</span>
              <span className="value">{playerColor}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameInfo;
