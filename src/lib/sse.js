/**
 * Server-Sent Events broadcaster
 * Keeps track of active SSE connections and broadcasts events.
 * In-memory on the server — clients reconnect on server restart automatically.
 */

const clients = new Set();

export function addClient(res) {
  clients.add(res);
}

export function removeClient(res) {
  clients.delete(res);
}

export function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch (_) {
      clients.delete(client);
    }
  }
}

export function getClientCount() {
  return clients.size;
}