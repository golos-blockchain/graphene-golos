import express from 'express'
import JsonRPC from 'simple-jsonrpc-js'

const app = express()

app.use(express.json())

app.post('*', async (req, res, next) => {
    let jrpc = new JsonRPC()

    const INVALID_REQUEST = -32600

    jrpc.on('call', 'pass', async (params) => {
        console.log(params)
    })

    jrpc.toStream = (message) => {
        res.json(message)
    }

    let rawBody
    try {
        rawBody = JSON.stringify(req.body)

        console.log('-- Received:', rawBody)

        await jrpc.messageHandler(rawBody)
    } catch (err) {
        console.error('ERROR:', rawBody)
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
