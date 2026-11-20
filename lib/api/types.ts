export type CursorLinks = {
  first?: string | null;
  last?: string | null;
  prev?: string | null;
  next?: string | null;
};

export type CursorMeta = {
  next_cursor: string | null;
  prev_cursor: string | null;
};

export type CursorPage<T> = {
  data: T[];
  links: CursorLinks;
  meta: CursorMeta;
};

export type ApiErrorPayload = {
  message: string;
  code: string;
  request_id: string | null;
  errors?: Record<string, string[]>;
};
