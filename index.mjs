import express from 'express'
import JsonRPC from 'simple-jsonrpc-js'
import golos from 'golos-lib-js'
import config from 'config'
import axios from 'axios'

import { lookupAccountNames, getKeyReferences, getFullAccounts } from './accounts.mjs'
import { lookupAssetSymbols } from './assets.mjs'
import { getChainProperties } from './chain.mjs'
import { getObjects } from './getObjects.mjs'

golos.config.set('websocket', config.get('node'))
if (config.has('chain_id'))
    golos.config.set('chain_id', config.get('chain_id'))
else {
    console.error('Please set chain_id in config because it is required')
    process.exit(-1)
}

golos.importNativeLib()

const app = express()

app.use(express.json())

app.post('*', async (req, res, next) => {
    let jrpc = new JsonRPC()

    const INVALID_REQUEST = -32600

    let rawBody

    jrpc.on('call', 'pass', async (params) => {
        console.log(params)

        let ret

        try {
            if (params[0] === 0) {
                if (params[1] === 'lookup_asset_symbols') {
                    const args = params[2]
                    ret = await lookupAssetSymbols(args)
                } else if(params[1] === 'lookup_account_names') {
                    const args = params[2]
                    ret = await lookupAccountNames(args)
                } else if(params[1] === 'get_key_references') {
                    const args = params[2]
                    ret = await getKeyReferences(args)
                } else if(params[1] === 'get_full_accounts') {
                    const args = params[2]
                    ret = await getFullAccounts(args)
                } else if(params[1] === 'get_chain_properties') {
                    const args = params[2]
                    ret = await getChainProperties(args)
                } else if(params[1] === 'get_objects') {
                    const args = params[2]
                    ret = await getObjects(args)
                }
            }
        } catch (err) {
            console.error(err)
            throw err
        }

        console.log('ret', JSON.stringify(ret))
        //console.log('ret', JSON.stringify(ret))
        if (ret) return ret

        const res = await axios.post('https://node.gph.ai', rawBody, {
            headers: {
                'Content-Type': "application/json"
            }
        })
        console.log('original', (res.data))

        return res.data.result
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
