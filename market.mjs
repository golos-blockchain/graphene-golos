import golos from 'golos-lib-js'
import { Asset, _Asset } from 'golos-lib-js/lib/utils/index.js'

import { randomId, OTYPES, ungolosifyId, golosifyId } from './ids.mjs'

const convertAsset = async (asset) => {
    if (!(asset instanceof _Asset)) {
        asset = await Asset(asset)
    }
    const obj = {}
    obj.amount = asset.amount
    obj.asset_id = await ungolosifyId(OTYPES.asset, asset.symbol)
    return obj
}

const convertOrder = async (order, isAsk) => {
    const obj = {}
    obj.id = await ungolosifyId(OTYPES.limit_order, order.orderid.toString())
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
