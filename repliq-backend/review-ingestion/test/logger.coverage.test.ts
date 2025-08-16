import * as loggerUtil from '../src/utils/logger';

jest.mock('winston', () => {
  const mLogger = {
    log: jest.fn(),
    createLogger: jest.fn().mockReturnThis(),
    transports: { Console: jest.fn() },
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      printf: jest.fn(),
      colorize: jest.fn(),
      simple: jest.fn(),
    },
  };
  return mLogger;
});
jest.mock('winston-daily-rotate-file', () => jest.fn());

describe('logger util', () => {
  it('should call logObj methods with correct level', () => {
    // logger.log is the underlying method called by logWithLevel
    const logger = require('winston');
    const spy = jest.spyOn(logger, 'log');
    loggerUtil.logObj.error('err', ['tag1'], { foo: 1 });
    loggerUtil.logObj.warn('warn', ['tag2'], { bar: 2 });
    loggerUtil.logObj.info('info', ['tag3'], { baz: 3 });
    loggerUtil.logObj.debug('debug', ['tag4'], { qux: 4 });
    loggerUtil.logObj.fatal('fatal', ['tag5'], { quux: 5 });
    expect(spy).toHaveBeenCalledTimes(5);
    expect(spy).toHaveBeenCalledWith('error', 'err', { tags: ['tag1'], foo: 1 });
    expect(spy).toHaveBeenCalledWith('warn', 'warn', { tags: ['tag2'], bar: 2 });
    expect(spy).toHaveBeenCalledWith('info', 'info', { tags: ['tag3'], baz: 3 });
    expect(spy).toHaveBeenCalledWith('debug', 'debug', { tags: ['tag4'], qux: 4 });
    expect(spy).toHaveBeenCalledWith('fatal', 'fatal', { tags: ['tag5'], quux: 5 });
    spy.mockRestore();
  });

  it('should create logger with tags and call logObj', () => {
    const spy = jest.spyOn(loggerUtil.logObj, 'info');
    const taggedLogger = loggerUtil.createLoggerWithTags(['base']);
    taggedLogger.info('msg', ['extra'], { foo: 'bar' });
    expect(spy).toHaveBeenCalledWith('msg', ['base', 'extra'], { foo: 'bar' });
    spy.mockRestore();
  });
});
