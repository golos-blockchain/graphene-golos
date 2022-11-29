import golos from 'golos-lib-js'
import { Asset, } from 'golos-lib-js/lib/utils/index.js'

import { convertAsset } from './assets.mjs'
import { randomId, OTYPES, ungolosifyId, golosifyId, isId } from './ids.mjs'

export const convertOrder = async (order, isAsk) => {
    const obj = {}
    obj.id = await ungolosifyId(OTYPES.limit_order, order.seller + '|' + order.orderid.toString())
    obj.seller = await ungolosifyId(OTYPES.account, order.seller)
    obj.for_sale = isAsk ? order.asset1 : order.asset2

    const { order_price } = order
    let base = await Asset(order_price.base)
    let quote = await Asset(order_price.quote);
    [base, quote] = [quote, base]
    obj.sell_price = {
        base: await convertAsset(base),
        quote: await convertAsset(quote),
    }

    const expiration = new Date()
    expiration.setUTCFullYear(expiration.getUTCFullYear() + 1)
    obj.expiration = expiration.toISOString().split('.')[0]
    obj.deferred_fee = 0
    obj.deferred_paid_fee = { amount: 0, asset_id: '1.3.0' }

    obj._orig_id = order.orderid

    return obj
}

export async function getLimitOrders(args) {
    let [ sellAsset, buyAsset, limit ] = args
    limit = Math.ceil(limit / 2)

    sellAsset = await golosifyId(sellAsset)
    sellAsset = sellAsset.golos_id
    if (!sellAsset) {
        throw new Error('No sell asset', sellAsset)
    }

    buyAsset = await golosifyId(buyAsset)
    buyAsset = buyAsset.golos_id
    if (!buyAsset) {
        throw new Error('No buy asset', buyAsset)
    }

    const book = await golos.api.getOrderBookExtendedAsync(limit, [sellAsset, buyAsset])
    const { bids, asks } = book
    const res = []
    for (let i = 0; i < limit; ++i) {
        const bid = bids[i]
        const ask = asks[i]
        if (bid) {
            res.push(await convertOrder(bid, false))
        }
        if (ask) {
            res.push(await convertOrder(ask, true))
        }
        if (!bid && !ask) break
    }
    return res
}

export async function getTicker(args) {
    // TODO not checked at all
    let [ base, quote ] = args
    if (isId(base)) {
        const res = await golosifyId(base)
        if (res.golos_id) {
            base = res.golos_id
        } else {
            throw new Error('getTicker base', base)
        }
    }
    if (isId(quote)) {
        const res = await golosifyId(quote)
        if (res.golos_id) {
            quote = res.golos_id
        } else {
            throw new Error('getTicker quote', quote)
        }
    }
    const ticker = await golos.api.getTickerAsync([base, quote])
    const res = {}
    const dgp = await golos.api.getDynamicGlobalPropertiesAsync()
    res.time = dgp.time
    res.base = base
    res.quote = quote
    // TODO not checked at all
    res.latest = ticker.latest1
    res.lowest_ask = ticker.lowest_ask
    res.highest_bid = ticker.highest_bid
    res.percent_change = ticker.percent_change1
    res.base_volume = new Asset(ticker.asset1_volume).amount.toString()
    res.quote_volume = new Asset(ticker.asset2_volume).amount.toString()
    return res
}
