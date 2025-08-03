export interface GameState {
  day: number;
  location: string;
  honor: number;
  morale: number;
  rations: number;
  firewood: number;
  special_items: Record<string, unknown>;
  men_alive: number;
  joubert_status: string;
  weather: string;
}

export interface StartGameRequest {
  username: string;
}

export interface UpdateStateRequest {
  player_id: string;
  updates: Partial<GameState>;
}

export interface LogEventRequest {
  player_id: string;
  day: number;
  event_type: string;
  description: string;
}