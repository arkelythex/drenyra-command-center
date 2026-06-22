import { t } from 'elysia';

export const sendMessageSchema = t.Object({
  sessionId: t.Optional(t.String()),
  message: t.String(),
  images: t.Optional(t.Array(t.String())),
  context: t.Optional(t.String())
});

export const createSessionSchema = t.Object({
  userId: t.String(),
  title: t.Optional(t.String())
});
