import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { ThemeProvider } from "~/components/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "~/lib/queryClient";
import { Toaster } from "~/components/ui/toaster";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap",
  },
  // Favicons - Best Practices
  { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
  { rel: "icon", type: "image/svg+xml", href: "/logos/favicon-icon.svg" },
  { rel: "apple-touch-icon", href: "/logos/favicon-icon.svg", sizes: "180x180" },
];

export const meta: Route.MetaFunction = () => [
  { title: "Rewind - Enterprise AI Development Governance & Analytics" },
  {
    name: "description",
    content: "Comprehensive governance, auditability, and cost optimization for Claude Code workflows. Enterprise-grade AI operations management with full traceability, compliance-ready reporting, and data sovereignty."
  },
  { name: "keywords", content: "Claude Code, AI governance, auditability, compliance, cost optimization, traceability, enterprise AI, data sovereignty, audit trail, operational intelligence, AI analytics" },
  { name: "viewport", content: "width=device-width, initial-scale=1" },
  { charSet: "utf-8" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system">
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
