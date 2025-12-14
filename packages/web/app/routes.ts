import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("settings", "routes/settings.tsx"),
  route("project/:projectId", "routes/project.$projectId.tsx"),
  route("project/:projectId/conversation/:conversationId", "routes/project.$projectId.conversation.$conversationId.tsx"),
] satisfies RouteConfig;
