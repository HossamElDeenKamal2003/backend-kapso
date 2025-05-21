import { Observable } from 'rxjs';

export interface RoomServiceGrpc {
  Create(data: CreateRoomRequest): Observable<CreateRoomResponse>;
  Join(data: JoinRoomRequest): Observable<JoinRoomResponse>;
}

export interface PeerInfo {
  id: string;
  cover: string;
  image: string;
  name: string;
}

export enum LiveType {
  video = 0,
  audio = 1,
}

export interface CreateRoomRequest {
  offer: string;
  liveId: string;
  liveType: LiveType;
  peerInfo: PeerInfo;
}

export interface CreateRoomResponse {
  answer: string;
}

export interface JoinRoomRequest {
  offer: string;
  roomId: string;
  hasAudioAccess: boolean;
  hasVideoAccess: boolean;
  peerInfo: PeerInfo;
}

export interface JoinRoomResponse {
  answer: string;
}
