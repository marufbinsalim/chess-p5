import { supabase } from './client';
import type { Chess } from '../chess/Chess';



export interface ChessRoom {
  id: string;
  created_at: string;
  white_player_id: string | null;
  black_player_id: string | null;
  game_state: any;
  current_turn: string;
  game_status: string;
  winner: string | null;
  white_time: number;
  black_time: number;
}

export class MultiplayerManager {
  private roomId: string | null = null;
  private playerId: string;
  private playerColor: 'white' | 'black' | null = null;
  private roomSubscription: any = null;
  private chatSubscription: any = null;
  private onRoomUpdateCallback: ((room: ChessRoom) => void) | null = null;

  constructor() {
    this.playerId = this.generatePlayerId();
  }

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get or create player ID from localStorage
  private getStoredPlayerId(): string {
    let id = localStorage.getItem('chess_player_id');
    if (!id) {
      id = this.generatePlayerId();
      localStorage.setItem('chess_player_id', id);
    }
    return id;
  }

  // Create a new chess room
  async createRoom(): Promise<string> {
    this.playerId = this.getStoredPlayerId();
    
    const { data, error } = await supabase
      .from('chess_rooms')
      .insert([
        {
          white_player_id: this.playerId,
          game_status: 'waiting',
          current_turn: 'white',
        },
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error creating room:', error);
      throw error;
    }

    this.roomId = data.id;
    this.playerColor = 'white';
    await this.setupSubscriptions();
    return data.id;
  }

  // Join an existing chess room
  async joinRoom(roomId: string): Promise<boolean> {
    this.playerId = this.getStoredPlayerId();
    this.roomId = roomId;

    // Get current room state
    const { data: room, error } = await supabase
      .from('chess_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      console.error('Error joining room:', error);
      return false;
    }

    // Determine player color
    if (room.white_player_id === null) {
      this.playerColor = 'white';
      await supabase
        .from('chess_rooms')
        .update({ white_player_id: this.playerId })
        .eq('id', roomId);
    } else if (room.black_player_id === null) {
      this.playerColor = 'black';
      await supabase
        .from('chess_rooms')
        .update({ black_player_id: this.playerId, game_status: 'playing' })
        .eq('id', roomId);
    } else {
      // Room is full
      return false;
    }

    await this.setupSubscriptions();
    return true;
  }

  // Setup realtime subscriptions
  private async setupSubscriptions() {
    if (!this.roomId) return;

    // Subscribe to room updates
    this.roomSubscription = supabase
      .channel(`room_${this.roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chess_rooms',
          filter: `id=eq.${this.roomId}`,
        },
        (payload: any) => {
          if (this.onRoomUpdateCallback) {
            this.onRoomUpdateCallback(payload.new as ChessRoom);
          }
        }
      )
      .subscribe();

  }

  // Update game state in database
  async updateGameState(chess: Chess) {
    if (!this.roomId) return;

    const gameState = {
      board: chess.board,
      whiteTurn: chess.whiteTurn,
      whiteKingPosition: chess.whiteKingPosition,
      blackKingPosition: chess.blackKingPosition,
      whiteCastleKingside: chess.whiteCastleKingside,
      whiteCastleQueenside: chess.whiteCastleQueenside,
      blackCastleKingside: chess.blackCastleKingside,
      blackCastleQueenside: chess.blackCastleQueenside,
      enPassantTarget: chess.enPassantTarget,
      halfMoveClock: chess.halfMoveClock,
      fullMoveNumber: chess.fullMoveNumber,
      capturedWhitePieces: chess.getCapturedWhitePieces(),
      capturedBlackPieces: chess.getCapturedBlackPieces(),
    };

    const { error } = await supabase
      .from('chess_rooms')
      .update({
        game_state: gameState,
        current_turn: chess.whiteTurn ? 'white' : 'black',
      })
      .eq('id', this.roomId);

    if (error) {
      console.error('Error updating game state:', error);
    }
  }

  // Send chat message
  async sendChatMessage(message: string) {
    if (!this.roomId || !this.playerColor) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert([
        {
          room_id: this.roomId,
          sender_id: this.playerId,
          sender_color: this.playerColor,
          message: message,
        },
      ]);

    if (error) {
      console.error('Error sending chat message:', error);
    }
  }



  // Set callbacks for updates
  onRoomUpdate(callback: (room: ChessRoom) => void) {
    this.onRoomUpdateCallback = callback;
  }


  // Getters
  getRoomId(): string | null {
    return this.roomId;
  }

  getPlayerId(): string {
    return this.playerId;
  }

  getPlayerColor(): 'white' | 'black' | null {
    return this.playerColor;
  }

  // Check if player is in a room
  isInRoom(): boolean {
    return !!this.roomId;
  }

  // Check if player's turn
  isPlayerTurn(chess: Chess): boolean {
    if (!this.playerColor) return true;
    return chess.whiteTurn === (this.playerColor === 'white');
  }

  // Cleanup subscriptions
  cleanup() {
    if (this.roomSubscription) {
      supabase.removeChannel(this.roomSubscription);
    }
    if (this.chatSubscription) {
      supabase.removeChannel(this.chatSubscription);
    }
  }
}
