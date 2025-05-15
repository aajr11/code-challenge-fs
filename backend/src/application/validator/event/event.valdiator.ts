import { z } from "zod";

const CallInitiatedSchema = z.object({
  event_type: z.literal("call_initiated"),
  call_id: z.string(),
  type: z.enum(["voice", "video"]),
  queue_id: z.string(),
});

const CallRoutedSchema = z.object({
  event_type: z.literal("call_routed"),
  agent_id: z.string(),
  call_id: z.string(),
  routing_time: z.number().positive().max(15),
});

const CallAnsweredSchema = z.object({
  event_type: z.literal("call_answered"),
  call_id: z.string(),
});

const CallHoldSchema = z.object({
  event_type: z.literal("call_hold"),
  call_id: z.string(),
});

const CallEndedSchema = z.object({
  event_type: z.literal("call_ended"),
  call_id: z.string(),
});

export const SendEventSchema = z.discriminatedUnion("event_type", [
  CallInitiatedSchema,
  CallRoutedSchema,
  CallAnsweredSchema,
  CallHoldSchema,
  CallEndedSchema,
]);
