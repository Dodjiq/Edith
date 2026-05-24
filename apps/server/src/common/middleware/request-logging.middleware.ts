import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { Readable } from 'node:stream';

const MAX_STRING_LENGTH = 80;
const MAX_ARRAY_PREVIEW = 2;
const MAX_DEPTH = 3;

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RequestLogger');

  use(req: Request, _res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const timestamp = new Date().toISOString();
    const route = originalUrl || req.url;
    const body = this.summarizeBody(req.body);
    const query = this.serializeQuery(req.query);
    const contentType = req.headers['content-type'] ?? 'unknown';

    const logLines = [
      `[${timestamp}] ${method} ${route} (${ip})`,
      `  content-type: ${contentType}`,
      `  query: ${query}`,
      `  body: ${body}`,
    ];

    this.logger.debug(logLines.join('\n'));
    next();
  }

  private serializeQuery(query: Request['query']): string {
    if (!query || Object.keys(query).length === 0) {
      return 'none';
    }

    try {
      return JSON.stringify(query);
    } catch {
      return '<Unserializable>';
    }
  }

  /** Produces a concise summary showing all keys with truncated value previews */
  private summarizeBody(body: unknown, depth = 0): string {
    if (body === undefined) return 'undefined';
    if (body === null) return 'null';
    if (Buffer.isBuffer(body)) return `<Buffer(${body.length})>`;
    if (this.isReadableStream(body)) return '<Stream>';

    if (typeof body === 'string') {
      const parsed = this.tryParseJson(body);
      if (parsed !== null) return this.summarizeBody(parsed, depth);
      return this.truncateString(body);
    }

    if (typeof body === 'number' || typeof body === 'boolean') {
      return String(body);
    }

    if (Array.isArray(body)) {
      if (body.length === 0) return '[]';
      if (depth >= MAX_DEPTH) return `[...(${body.length})]`;

      const previews = body.slice(0, MAX_ARRAY_PREVIEW).map((item) => this.summarizeBody(item, depth + 1));
      const suffix = body.length > MAX_ARRAY_PREVIEW ? `, ...(+${body.length - MAX_ARRAY_PREVIEW})` : '';
      return `[${previews.join(', ')}${suffix}]`;
    }

    if (typeof body === 'object') {
      const keys = Object.keys(body);
      if (keys.length === 0) return '{}';
      if (depth >= MAX_DEPTH) return `{${keys.join(', ')}}`;

      const entries = keys.map((key) => {
        const value = (body as Record<string, unknown>)[key];
        return `${key}: ${this.summarizeBody(value, depth + 1)}`;
      });
      return `{ ${entries.join(', ')} }`;
    }

    return String(body);
  }

  private truncateString(value: string): string {
    const trimmed = value.trim();
    if (trimmed.length === 0) return '""';
    if (trimmed.length <= MAX_STRING_LENGTH) return `"${trimmed}"`;
    return `"${trimmed.slice(0, MAX_STRING_LENGTH)}..."(${trimmed.length})`;
  }

  private tryParseJson(value: string): unknown {
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return null;
      }
    }
    return null;
  }

  private isReadableStream(value: unknown): value is Readable {
    if (!value || typeof value !== 'object') return false;
    if (value instanceof Readable) return true;
    return (
      typeof (value as Partial<Readable>).pipe === 'function' && typeof (value as Partial<Readable>).read === 'function'
    );
  }
}
