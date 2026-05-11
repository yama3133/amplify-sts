import { defineFunction } from "@aws-amplify/backend";

export const sessionFunction = defineFunction({
  name: "session",
  entry: "./src/handler.ts",
  runtime: 20,
  timeoutSeconds: 10,
  environment: {
    OPENAI_MODEL: "gpt-4o-realtime-preview",
    OPENAI_VOICE: "coral",
  },
});
