export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogPayload {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDev = (import.meta as any).env?.MODE === 'development';
  private batchedLogs: LogPayload[] = [];
  private readonly MAX_BATCH_SIZE = 10;
  private flushTimeout: NodeJS.Timeout | null = null;

  private formatMessage(level: LogLevel, message: string, data?: any) {
    const ts = new Date().toISOString();
    return { level, message, data, timestamp: ts };
  }

  private sendToBackend() {
    if (this.batchedLogs.length === 0) return;
    
    // Create a copy and clear array
    const logsToSend = [...this.batchedLogs];
    this.batchedLogs = [];

    // Use sendBeacon for best-effort delivery even if page unloads
    try {
      const payload = JSON.stringify({ logs: logsToSend });
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/logs', blob);
      } else {
        fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to send logs to backend', e);
    }
  }

  private queueLog(payload: LogPayload) {
    if (this.isDev) return; // In dev, we don't send to backend unless forced

    if (payload.level === 'WARN' || payload.level === 'ERROR') {
      this.batchedLogs.push(payload);
      
      if (this.batchedLogs.length >= this.MAX_BATCH_SIZE) {
        if (this.flushTimeout) clearTimeout(this.flushTimeout);
        this.sendToBackend();
      } else if (!this.flushTimeout) {
        this.flushTimeout = setTimeout(() => {
          this.flushTimeout = null;
          this.sendToBackend();
        }, 5000); // Flush every 5 seconds
      }
    }
  }

  public debug(message: string, data?: any) {
    if (this.isDev) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }

  public info(message: string, data?: any) {
    if (this.isDev) {
      console.info(`[INFO] ${message}`, data || '');
    }
  }

  public warn(message: string, data?: any) {
    const payload = this.formatMessage('WARN', message, data);
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, data || '');
    } else {
      this.queueLog(payload);
    }
  }

  public error(message: string, data?: any) {
    const payload = this.formatMessage('ERROR', message, data);
    if (this.isDev) {
      console.error(`[ERROR] ${message}`, data || '');
    } else {
      this.queueLog(payload);
    }
  }
}

export const logger = new Logger();
