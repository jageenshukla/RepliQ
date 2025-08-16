import { ChannelHandler } from '../types/Notification';
import { SlackHandler } from './handlers/SlackHandler';

export class ChannelHandlerFactory {
  private static handlers: Record<string, ChannelHandler> = {
    slack: new SlackHandler(),
    // Add more handlers here (e.g., email, teams)
  };

  static getHandler(type: string): ChannelHandler | null {
    return this.handlers[type] || null;
  }
}
