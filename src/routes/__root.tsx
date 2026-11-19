import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import React from "react";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MedCare Караганда — Медицинский портал" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  errorComponent: ({ error }) => (
    <div className="p-6 text-red-700 bg-red-50 min-h-screen font-mono text-sm">
      <h1 className="font-bold text-lg mb-2">Ошибка приложения:</h1>
      <pre className="whitespace-pre-wrap">{String(error?.message || error)}</pre>
    </div>
  ),
  component: () => (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  ),
});
