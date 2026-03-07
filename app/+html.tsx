import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Custom HTML root for Expo web.
 * Adds PWA meta tags so Safari shows the correct icon and app name
 * when the user adds the app to their home screen.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* ── PWA / Safari home screen ─────────────────────────────── */}
        {/* App name shown when added to home screen */}
        <meta name="apple-mobile-web-app-title" content="View Core" />
        {/* Enable standalone (full-screen) mode */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* Status bar style in standalone mode */}
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Home screen icon for Safari (180×180 for iPhone Retina) */}
        {/* Expo Web serves assets via Metro bundler at /assets/./{path} */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/assets/./assets/images/apple-touch-icon.png"
        />

        {/* Standard favicon */}
        <link rel="icon" type="image/png" href="/assets/./assets/images/favicon.png" />

        {/* Web app manifest (name + icon for Android Chrome / other browsers) */}
        <link rel="manifest" href="/manifest.json" />

        {/* ── Style reset ──────────────────────────────────────────── */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
