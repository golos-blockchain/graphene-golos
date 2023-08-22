import golos from 'golos-lib-js'
import { Asset, } from 'golos-lib-js/lib/utils/index.js'

import { OTYPES, golosifyId, ungolosifyId } from './ids.mjs'
import { convertAcc, } from './accounts.mjs'
import { convertAsset, lookupAssetSymbols, } from './assets.mjs'
import { convertPriceObj } from './market.mjs'

// Used for order_delete market event
// and in convertOrder() below
export const convertOrderHeader = async (header) => {
    const obj = {}
    obj.id = await ungolosifyId(OTYPES.limit_order, header.seller + '|' + header.orderid.toString())
    obj.seller = await ungolosifyId(OTYPES.account, header.seller)

    const { sell_price } = header
    let base = await Asset(sell_price.base)
    let quote = await Asset(sell_price.quote);
    // required at least for case with "my own orders"
    obj.sell_price = {
        base: await convertAsset(base),
        quote: await convertAsset(quote),
    }
    convertPriceObj(obj.sell_price)

    obj._orig_id = header.orderid

    return obj
}

export const convertOrder = async (order) => {
    const obj = await convertOrderHeader(order)
    // order_create_operation has asset-string,
    // but getOrders returns order with number OR number-string if it is long
    obj.for_sale = (order.for_sale.includes && order.for_sale.includes(' ')) ?
        (await convertAsset(order.for_sale)).amount :
        order.for_sale

    obj.expiration = order.expiration
    obj.deferred_fee = 0
    obj.deferred_paid_fee = { amount: 0, asset_id: '1.3.0' }

    obj._orig_id = order.orderid

    return obj
}

export async function getObjects(args) {
    const [ ids ] = args

    const names = []
    const nameIdx = {}

    const orderids = []
    const orderIdx = {}

    const syms = []
    const symIdx = {}

    for (const id of ids) {
        if (id.startsWith(OTYPES.account)) {
            const res = await golosifyId(id)
            if (res.golos_id) {
                names.push(res.golos_id)
                nameIdx[id] = names.length - 1
            } else {
                console.warn('Account not found', res)
            }
        } else if (id.startsWith(OTYPES.limit_order)) {
            const res = await golosifyId(id)
            if (res.golos_id) {
                orderids.push(res.golos_id)
                orderIdx[id] = orderids.length - 1
            } else {
                console.warn('Limit order not found', res)
            }
        } else if (id.startsWith(OTYPES.asset)) {
            const res = await golosifyId(id)
            if (res.golos_id) {
                syms.push(res.golos_id)
                symIdx[id] = syms.length - 1
            } else {
                console.warn('Asset not found', res)
            }
        } else if (id.startsWith(OTYPES.block_sumamry)) {
            // nothing to do here
        } else {
            throw new Error('get_objects currently not supports ' + id)
        }
    }
    
    let accs = []
    if (names.length) {
        accs = await golos.api.lookupAccountNamesAsync(names)
    }
    let orders = []
    if (orderids.length) {
        orders = await golos.api.getOrdersAsync(orderids)
        console.log(orders)
    }
    let assets = []
    if (syms.length) {
        assets = await lookupAssetSymbols([syms])
    }

    const res = []
    for (const id of ids) {
        if (id.startsWith(OTYPES.account)) {
            const idx = nameIdx[id]
            if (accs[idx]) {
                res.push(await convertAcc(accs[idx]))
            } else {
                res.push(null)
            }
        } else if (id.startsWith(OTYPES.limit_order)) {
            const idx = orderIdx[id]
            if (orders[idx] && orders[idx].for_sale) { // if exists
                res.push(await convertOrder(orders[idx]))
                console.log(JSON.stringify(res))
            } else {
                res.push(null)
                // And it is correct for not-exist orders.
                // TODO: but what about fully filled orders?
            }
        } else if (id.startsWith(OTYPES.asset)) {
            const idx = symIdx[id]
            if (assets[idx]) {
                res.push(assets[idx])
            } else {
                res.push(null)
            }
        } else if (id.startsWith(OTYPES.block_sumamry)) {
            const parts = id.split('.')
            let num = parts[parts.length - 1]
            num = parseInt(num) + 1
            const obj = { id }
            let block = await golos.api.getBlockAsync(num)
            if (!block) {
                block = await golos.api.getBlockAsync(num - 1)
                if (!block) {
                    res.push(null)
                    continue
                }
                await new Promise(resolve => setTimeout(resolve, 3500))
                block = await golos.api.getBlockAsync(num)
                if (block) {
                    obj.block_id = block.previous
                } else {
                    console.warn('WARNING - cannot find block ' + num)
                    res.push(null)
                    continue
                }
            } else {
                obj.block_id = block.previous
            }
            res.push(obj)
        }
    }
    return res
}
