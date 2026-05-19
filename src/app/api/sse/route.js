import { addClient, removeClient } from '../../../lib/sse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial ping
      controller.enqueue(encoder.encode('event: connected\ndata: {"status":"ok"}\n\n'));

      const clientWriter = {
        write(data) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (_) {
            // stream closed
          }
        },
      };

      addClient(clientWriter);

      // Keep-alive ping every 25s
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch (_) {
          clearInterval(keepAlive);
        }
      }, 25000);

      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        removeClient(clientWriter);
        try { controller.close(); } catch (_) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}