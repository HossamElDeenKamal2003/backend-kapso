import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class StreamGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('start-stream')
  handleStartStream(client: any, payload: { room: string }) {
    // Handle logic to interact with Janus API
    this.server.emit('stream-started', { room: payload.room });
  }

  @SubscribeMessage('stop-stream')
  handleStopStream(client: any, payload: { room: string }) {
    this.server.emit('stream-stopped', { room: payload.room });
  }
}
