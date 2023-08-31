import { api } from 'golos-lib-js'

import { convertAsset } from './assets.mjs'
import { convertOrder, convertOrderHeader } from './getObjects.mjs'
import { OTYPES, ungolosifyId } from './ids.mjs'
import { reversePriceObj } from './market.mjs'
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
        let msgs = []
        if (eType === EVENT_TYPES.created) {
            try {
                const order = await convertOrder(eData)
                assetIds.push(order.sell_price.base.asset_id)
                assetIds.push(order.sell_price.quote.asset_id)
                console.log(assetIds)
                msgs.push({
                    method: 'notice',
                    params: [ 4, [[ order ]] ]
                })
            } catch (err) {
                console.error('market events - cannot send create order event', event, err)
            }
        } else if (eType === EVENT_TYPES.deleted) {
            const id = await ungolosifyId(OTYPES.limit_order, eData.seller + '|' + eData.orderid.toString())
            const order = await convertOrderHeader(eData)
            assetIds.push(order.sell_price.base.asset_id)
            assetIds.push(order.sell_price.quote.asset_id)
            console.log(assetIds)
            msgs.push({
                method: 'notice',
                params: [ 4, [[ id ]] ]
            })
        } else if (eType === EVENT_TYPES.filled) {
            const wrapEv = (ev) => [
                [4, ev],
                [0, {}]
            ]
            const current_pays = await convertAsset(eData.current_pays)
            const open_pays = await convertAsset(eData.open_pays)
            let fill_price = {
                base: await convertAsset(eData.open_price.base),
                quote: await convertAsset(eData.open_price.quote)
            }
            // TODO: check it all
            fill_price = reversePriceObj(fill_price)
            assetIds.push(fill_price.base.asset_id)
            assetIds.push(fill_price.quote.asset_id)
            const current_oid = eData.current_owner + '|' + eData.current_orderid.toString()
            let ev1 = {
                fee: await convertAsset(eData.current_trade_fee),
                order_id: await ungolosifyId(OTYPES.limit_order, current_oid),
                account_id: await ungolosifyId(OTYPES.account, eData.current_owner),
                pays: current_pays,
                receives: open_pays,
                fill_price,
                is_maker: false
            }
            ev1 = wrapEv(ev1)
            const open_id = eData.open_owner + '|' + eData.open_orderid.toString()
            let ev2 = {
                fee: await convertAsset(eData.open_trade_fee),
                order_id: await ungolosifyId(OTYPES.limit_order, open_id),
                account_id: await ungolosifyId(OTYPES.account, eData.open_owner),
                pays: open_pays,
                receives: current_pays,
                fill_price,
                is_maker: true
            }
            ev2 = wrapEv(ev2)
            const arr = [ ev1, ev2 ]
            msgs.push({
                method: 'notice',
                params: [ 4, [[ arr ]] ]
            })
            const orders = await api.getOrdersAsync([current_oid, open_id])
            const [ curOrder, openOrder ] = orders
            if (curOrder && curOrder.for_sale) {
                const order = await convertOrder(curOrder)
                msgs.push({
                    method: 'notice',
                    params: [ 4, [[ order ]] ]
                })
            }
            if (openOrder && openOrder.for_sale) {
                const order = await convertOrder(openOrder)
                msgs.push({
                    method: 'notice',
                    params: [ 4, [[ order ]] ]
                })
            }
        }
        wss.clients.forEach(async (ws) => {
            if (!ws.notifyMarket) {
                return
            }
            const [ asset1, asset2 ] = ws.notifyMarket
            const matches = (asset1 === assetIds[0] && asset2 === assetIds[1])
                || (asset1 === assetIds[1] && asset2 === assetIds[0])
            if (matches) {
                for (const msg of msgs) {
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
