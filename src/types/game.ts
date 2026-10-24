export type GameState =
  | 'START'
  | 'PROCESSING_PHOTO'
  | 'READY'
  | 'PLAYING'
  | 'ARRIVAL'
  | 'VICTORY'
  | 'RECORDING_FINALIZATION'
  | 'VIDEO_READY'
  | 'ERROR';

export type AvatarCostume = 'wizard' | 'dracula' | 'elf' | 'pumpkin';

export interface PlayerConfig {
  name: string;
  faceDataUrl: string | null;
  costume: AvatarCostume;
  faceTextureCanvas?: HTMLCanvasElement;
}

export interface CollectibleItem {
  id: number;
  x: number;
  z: number;
  collected: boolean;
  type: 'candy_corn' | 'lollipop' | 'chocolate';
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}
