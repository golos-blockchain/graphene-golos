import config from 'config'
import express from 'express'
import golos from 'golos-lib-js'
import minimist from 'minimist'
import JsonRPC from 'simple-jsonrpc-js'
import { WebSocketServer } from 'ws' 

import controller from './controller.mjs'
import notify from './notify.mjs'
import { originalHttp, originalWs } from './original.mjs'

golos.config.set('websocket', config.get('node'))
if (config.has('chain_id'))
    golos.config.set('chain_id', config.get('chain_id'))
else {
    console.error('Please set chain_id in config because it is required')
    process.exit(-1)
}

golos.importNativeLib()

const args = minimist(process.argv.slice(2))
if (args.h) {
    const app = express()

    app.use(express.json())

    app.post('*', async (req, res, next) => {
        const jrpc = new JsonRPC()

        const INVALID_REQUEST = -32600

        let rawBody

        jrpc.on('call', 'pass', async (params) => {
            console.log(params)

            const ret = await controller(params)

            console.log('ret', JSON.stringify(ret))
            //console.log('ret', JSON.stringify(ret))
            if (ret) return ret

            const res = await originalHttp(rawBody)
            return res
        })

        jrpc.toStream = (message) => {
            console.log(' IRD', message)
            res.json(JSON.parse(message))
        }

        try {
            rawBody = JSON.stringify(req.body)

            console.log('-- Received:', rawBody)

            await jrpc.messageHandler(rawBody)
        } catch (err) {
            console.error('ERROR:', err)
        }
    })

    app.all('*', async (req, res, next) => {
        console.log('-- Wrong method, POST supported only')
        console.log(JSON.stringify(req.body))
        res.json({err: 'wrong_method'})
    })

    const PORT = 3000
    app.listen(PORT)
    console.log('Listening', PORT)
} else {
    console.log('ws')

    const PORT = 3001
    const wss = new WebSocketServer({ port: PORT })

    wss.on('connection', (ws) => {
        console.log('New connection')

        const jrpc = new JsonRPC()
        ws.jrpc = jrpc

        let rawBody

        jrpc.on('call', 'pass', async (params) => {
            console.log(params)

            const ret = await controller(params, ws)

            console.log('ret', JSON.stringify(ret))
            if (ret) {
                if (typeof ret === 'function') {
                    return ret()
                }
                return ret
            }

            const res = await originalWs(rawBody)
            return res
        })

        jrpc.toStream = (msg) => {
            ws.send(msg)
        }

        ws.on('message', async (msg) => {
            try {
                rawBody = msg.toString()

                console.log('-- Received:', rawBody)

                await jrpc.messageHandler(msg)
            } catch (err) {
                console.error('ERROR:', err)
            }
        })
    })

    notify(wss)

    console.log('Listening', PORT)
}
