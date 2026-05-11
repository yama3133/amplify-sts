import { defineBackend } from "@aws-amplify/backend";
import { sessionFunction } from "./functions/session/resource";

export const backend = defineBackend({ sessionFunction });

backend.sessionFunction.addEnvironment(
  "OPENAI_API_KEY",
  process.env.OPENAI_API_KEY ?? ""
);
