import type { Response } from 'express';
import type { Request } from 'express';
import { vi } from 'vitest';

type StatusMock = ReturnType<typeof vi.fn>;
type JsonMock = ReturnType<typeof vi.fn>;
type SendMock = ReturnType<typeof vi.fn>;

export interface MockResponse {
  res: Response;
  status: StatusMock;
  json: JsonMock;
  send: SendMock;
}

export const createMockResponse = (): MockResponse => {
  const status = vi.fn();
  const json = vi.fn();
  const send = vi.fn();

  status.mockReturnValue({ status, json, send });
  json.mockReturnValue({ status, json, send });
  send.mockReturnValue({ status, json, send });

  return {
    res: { status, json, send } as unknown as Response,
    status,
    json,
    send,
  };
};

export const createMockRequest = (overrides?: Record<string, unknown>): Request => {
  return {
    user: { id: 'test-user', email: 'test@test.com', name: 'Test', sessionId: 's1' },
    ...overrides,
  } as unknown as Request;
};
