import { createServer } from 'node:http'
import { validateCreateRequest, validatePaymentRequest } from './validation.js'

const port = Number(process.env.API_PORT ?? 4174)

const server = createServer(async (request, response) => {
  response.setHeader('content-type', 'application/json; charset=utf-8')
  if (request.method !== 'POST') {
    response.writeHead(405).end(JSON.stringify({ error: 'Method not allowed.' }))
    return
  }

  try {
    const body = await readJson(request)
    if (request.url === '/api/validate/payment-link') {
      const result = validateCreateRequest(body)
      response.writeHead(result.valid ? 200 : 422).end(JSON.stringify(result))
      return
    }
    if (request.url === '/api/validate/payment') {
      const error = validatePaymentRequest(body)
      response.writeHead(error ? 422 : 200).end(JSON.stringify(error ? { valid: false, error } : { valid: true }))
      return
    }
    response.writeHead(404).end(JSON.stringify({ error: 'Not found.' }))
  } catch {
    response.writeHead(400).end(JSON.stringify({ error: 'Request body must be valid JSON.' }))
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Payment validation API listening on http://127.0.0.1:${port}`)
})

async function readJson(request: import('node:http').IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > 64 * 1024) throw new Error('Request body is too large')
    chunks.push(Buffer.from(chunk))
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
}