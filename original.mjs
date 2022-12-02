import axios from 'axios'
import WebSocket from 'ws'

export async function originalHttp(rawBody) {
    const res = await axios.post('https://node.gph.ai', rawBody, {
        headers: {
            'Content-Type': "application/json"
        }
    })
    console.log('original', (res.data))
    return res.data.result
}

let ws
let id
const handlers = {}

export async function originalWs(rawBody) {
    return new Promise(async (resolve, reject) => {
        if (!ws) {
            ws = new WebSocket('wss://node.gph.ai')
            id = 1
            await new Promise(resolve => ws.on('open', () => { resolve() }))
            ws.on('message', (data) => {
                const parsed = JSON.parse(data.toString())
                console.log('original', (data.toString()))
                const handler = handlers[parsed.id]
                if (handler) {
                    handler(parsed.result)
                } else {
                    console.log('originalWs error - No such handler', parsed.id, 'is it callback data?')
                }
            })
        }
        const body = JSON.parse(rawBody)
        body.id = id++
        rawBody = JSON.stringify(body)
        ws.send(rawBody)
        handlers[body.id] = (data) => {
            delete handlers[body.id]
            resolve(data)
        }
    })
}
