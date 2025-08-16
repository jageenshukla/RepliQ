import { ChannelHandlerFactory } from '../src/services/ChannelHandlerFactory';
import { ChannelHandler } from '../src/types/Notification';

describe('ChannelHandlerFactory', () => {
  it('should return a handler for known type', () => {
    const handler = ChannelHandlerFactory.getHandler('slack');
    expect(handler).toBeDefined();
    expect(typeof handler?.sendNotification).toBe('function');
  });

  it('should return null for unknown type', () => {
    const handler = ChannelHandlerFactory.getHandler('unknown');
    expect(handler).toBeNull();
  });
});
