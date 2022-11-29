import golos from 'golos-lib-js'
import { Asset, } from 'golos-lib-js/lib/utils/index.js'

import { OTYPES, golosifyId, ungolosifyId } from './ids.mjs'
import { convertAcc, } from './accounts.mjs'
import { convertAsset, lookupAssetSymbols, } from './assets.mjs'

export const convertOrder = async (order) => {
    const obj = {}
    obj.id = await ungolosifyId(OTYPES.limit_order, order.seller + '|' + order.orderid.toString())
    obj.seller = await ungolosifyId(OTYPES.account, order.seller)
    obj.for_sale = order.for_sale

    const { sell_price } = order
    let base = await Asset(sell_price.base)
    let quote = await Asset(sell_price.quote);
    [base, quote] = [quote, base]
    obj.sell_price = {
        base: await convertAsset(base),
        quote: await convertAsset(quote),
    }

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
        }
    }
    return res
}
