import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  youtube: router({
    // Fetch channel info (name + avatar) from YouTube's internal API
    channelInfo: publicProcedure
      .input(z.object({ channelUrl: z.string() }))
      .query(async ({ input }) => {
        const { channelUrl } = input;

        // Extract channel handle or ID from URL
        let browseId = '';
        let handle = '';

        // Match @handle format
        const handleMatch = channelUrl.match(/youtube\.com\/@([^/?&]+)/);
        if (handleMatch) {
          handle = handleMatch[1];
        }

        // Match /channel/UC... format
        const channelIdMatch = channelUrl.match(/youtube\.com\/channel\/(UC[^/?&]+)/);
        if (channelIdMatch) {
          browseId = channelIdMatch[1];
        }

        if (!handle && !browseId) {
          throw new Error('Invalid YouTube channel URL');
        }

        // Step 1: If we have a handle, resolve it to a channel ID first
        if (handle && !browseId) {
          try {
            const resolveRes = await fetch(
              'https://www.youtube.com/youtubei/v1/browse?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'X-YouTube-Client-Name': '1',
                  'X-YouTube-Client-Version': '2.20260305.01.00',
                  'Origin': 'https://www.youtube.com',
                  'Referer': 'https://www.youtube.com/',
                },
                body: JSON.stringify({
                  browseId: `@${handle}`,
                  context: {
                    client: {
                      clientName: 'WEB',
                      clientVersion: '2.20260305.01.00',
                      hl: 'ja',
                      gl: 'JP',
                    },
                  },
                }),
              }
            );
            if (resolveRes.ok) {
              const data = await resolveRes.json() as any;
              const metadata = data?.metadata?.channelMetadataRenderer;
              const header = data?.header?.c4TabbedHeaderRenderer;
              const channelName = metadata?.title || header?.title || handle;
              const thumbnails = header?.avatar?.thumbnails || [];
              const iconUrl = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : '';
              const channelId = metadata?.externalId || '';
              return { channelName, iconUrl, channelId };
            }
          } catch (e) {
            // fall through
          }
        }

        // Step 2: Browse by channel ID
        if (browseId) {
          try {
            const browseRes = await fetch(
              'https://www.youtube.com/youtubei/v1/browse?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'X-YouTube-Client-Name': '1',
                  'X-YouTube-Client-Version': '2.20260305.01.00',
                  'Origin': 'https://www.youtube.com',
                  'Referer': 'https://www.youtube.com/',
                },
                body: JSON.stringify({
                  browseId,
                  context: {
                    client: {
                      clientName: 'WEB',
                      clientVersion: '2.20260305.01.00',
                      hl: 'ja',
                      gl: 'JP',
                    },
                  },
                }),
              }
            );
            if (browseRes.ok) {
              const data = await browseRes.json() as any;
              const metadata = data?.metadata?.channelMetadataRenderer;
              const header = data?.header?.c4TabbedHeaderRenderer;
              const channelName = metadata?.title || header?.title || browseId;
              const thumbnails = header?.avatar?.thumbnails || [];
              const iconUrl = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : '';
              return { channelName, iconUrl, channelId: browseId };
            }
          } catch (e) {
            // fall through
          }
        }

        return { channelName: handle || browseId, iconUrl: '', channelId: browseId };
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
