# API Contracts

Use these as the default shapes for new or updated endpoints in Pinkstorm FC Manage.

## Response Envelope

Use the shared helper from `src/lib/response.ts`.

```ts
export type AppResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export function ok<T>(data: T, message?: string): AppResponse<T>;
export function fail(error: string, message?: string): AppResponse<never>;
```

## GET Example

```ts
return ok({
  items,
  meta: {
    total,
    page,
    pageSize,
  },
});
```

## POST Example

```ts
type CreateMatchInput = {
  opponentName: string;
  startTime: string;
  location?: string;
  pitchCost: number;
  opponentFee: number;
  note?: string;
};

const body = (await request.json()) as CreateMatchInput;
// validate body here before writing

return ok(createdMatch, "Tạo trận đấu thành công");
```

## Validation Checklist

- Confirm the resource being created or updated.
- Confirm who is allowed to call the endpoint.
- Confirm required fields and optional fields.
- Confirm how errors should be surfaced to the client.
- Confirm whether the response needs metadata or only the created row.
