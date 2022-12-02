import { api } from 'golos-lib-js'

import { convertOrder, convertOrderHeader } from './getObjects.mjs'
import { OTYPES, ungolosifyId } from './ids.mjs'

let notifyingBlocks = false
let notifyingMarket = false

function startNotifyBlocks(wss) {
    if (notifyingBlocks) {
        return
    }
    notifyingBlocks = true
    api.streamBlock(async (err, block) => {
        if (err) {
            console.error('Feed ', err)
            return
        }
        wss.clients.forEach(ws => {
            if (!ws.notifyBlocks) {
                return
            }
            console.log('Sending block notification ')
            // TODO it should be not previous but head_block_id, but in dexbot it is used
            // only in Echo strategy which is not significant
            const msg = {
                method: 'notice',
                params: [ 2, [ block.previous ] ]
            }
            ws.send(JSON.stringify(msg))
        })
    })
}

const EVENT_TYPES = {
    created: 0,
    deleted: 1,
    filled: 2,
}

function startNotifyMarket(wss) {
    if (notifyingMarket) {
        return
    }
    notifyingMarket = true
    api.subscribeToMarket('reserved', async (err, event) => {
        console.log('EVENT', event)
        const [ eType, eData ] = event
        let assetIds = []
        let msg
        if (eType === EVENT_TYPES.created) {
            try {
                const order = await convertOrder(eData)
                assetIds.push(order.sell_price.base.asset_id)
                assetIds.push(order.sell_price.quote.asset_id)
                console.log(assetIds)
                msg = {
                    method: 'notice',
                    params: [ 4, [[ order ]] ]
                }
            } catch (err) {
                console.error('market events - cannot send create order event', event, err)
            }
        } else if (eType === EVENT_TYPES.deleted) {
            const id = await ungolosifyId(OTYPES.limit_order, eData.seller + '|' + eData.orderid.toString())
            const order = await convertOrderHeader(eData)
            assetIds.push(order.sell_price.base.asset_id)
            assetIds.push(order.sell_price.quote.asset_id)
            console.log(assetIds)
            msg = {
                method: 'notice',
                params: [ 4, [[ id ]] ]
            }
        }
        wss.clients.forEach(async (ws) => {
            if (!ws.notifyMarket) {
                return
            }
            const [ asset1, asset2 ] = ws.notifyMarket
            if (msg) {
                const matches = (asset1 === assetIds[0] && asset2 === assetIds[1])
                    || (asset1 === assetIds[1] && asset2 === assetIds[0])
                if (matches) {
                    ws.send(JSON.stringify(msg))
                }
            }
        })
    })
}

function ensureWs(ws) {
    if (!ws) throw new Error('http graphene-golos serving is not supported in this method')
}

export async function setBlockAppliedCallback(params, ws, wss) {
    ensureWs(ws)
    ws.notifyBlocks = true
    startNotifyBlocks(wss)
    return () => null
}

export async function subscribeToMarket(params, ws, wss) {
    ensureWs(ws)
    ws.notifyMarket = params.slice(1)
    startNotifyMarket(wss)
    return () => null
}
