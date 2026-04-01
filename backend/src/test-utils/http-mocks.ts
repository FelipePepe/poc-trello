import type { Response } from 'express';

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
