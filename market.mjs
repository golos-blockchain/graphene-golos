import golos from 'golos-lib-js'
import { Asset, } from 'golos-lib-js/lib/utils/index.js'

import { convertAsset, getPrecision } from './assets.mjs'
import { randomId, OTYPES, ungolosifyId, golosifyId, isId, idData } from './ids.mjs'

export const convertPriceObj = (orig) => {
    return {
        base: orig.quote,
        quote: orig.base
    }
}

export const convertPrice = (price) => {
    price = parseFloat(price)
    if (price === 0) return '0'
        // TODO:
        // it can use scientific notation
        // is convertPrice need? for what?
    return (1 / price).toString()
}

const convertOrder = async (order, isAsk) => {
    const obj = {}
    obj.id = await ungolosifyId(OTYPES.limit_order, order.seller + '|' + order.orderid.toString())
    obj.seller = await ungolosifyId(OTYPES.account, order.seller)
    obj.for_sale = isAsk ? order.asset1 : order.asset2

    const { order_price } = order
    let base = await Asset(order_price.base)
    let quote = await Asset(order_price.quote);
    obj.sell_price = {
        base: await convertAsset(base),
        quote: await convertAsset(quote),
    }
    convertPriceObj(obj.sell_price)

    const expiration = new Date()
    expiration.setUTCFullYear(expiration.getUTCFullYear() + 1)
    obj.expiration = expiration.toISOString().split('.')[0]
    obj.deferred_fee = 0
    obj.deferred_paid_fee = { amount: 0, asset_id: '1.3.0' }

    obj._orig_id = order.orderid

    return obj
}

const parseAssetNameOrId = async (arg) => {
    let sym
    let data = await idData(OTYPES.asset, arg)
    const { golos_id } = data
    if (!golos_id) {
        throw new Error('No asset', golos_id)
    }
    const precision = await getPrecision(data)
    return { golos_id, precision }
}

export async function getLimitOrders(args) {
    let [ sellAsset, buyAsset, limit ] = args
    limit = Math.ceil(limit / 2)

    sellAsset = (await parseAssetNameOrId(sellAsset)).golos_id

    buyAsset = (await parseAssetNameOrId(buyAsset)).golos_id

    const book = await golos.api.getOrderBookExtendedAsync(limit, [buyAsset, sellAsset])
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

export async function getOrderBook(args) {
    let [ sellAsset, buyAsset, limit ] = args

    sellAsset = await parseAssetNameOrId(sellAsset)
    const sellPrec = sellAsset.precision
    const sellSym = sellAsset.golos_id

    buyAsset = await parseAssetNameOrId(buyAsset)
    const buyPrec = buyAsset.precision
    const buySym = buyAsset.golos_id

    const book = await golos.api.getOrderBookExtendedAsync(limit, [buySym, sellSym])

    const convertShortOrder = async (order) => {
        const base = await Asset(order.asset1, sellPrec, sellSym)
        const quote = await Asset(order.asset2, buyPrec, buySym)
        return {
            price: convertPrice(order.real_price),
            quote: base.amountFloat,
            base: quote.amountFloat
        }
    }

    const bids = []
    for (const bid of book.bids) {
        bids.push(await convertShortOrder(bid))
    }

    const asks = []
    for (const ask of book.asks) {
        asks.push(await convertShortOrder(ask))
    }

    const res = {
        base: sellSym,
        quote: buySym,
        bids,
        asks
    }
    return res
}

export async function getTicker(args) {
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
    const ticker = await golos.api.getTickerAsync([quote, base])
    const res = {}
    const dgp = await golos.api.getDynamicGlobalPropertiesAsync()
    res.time = dgp.time
    res.base = base
    res.quote = quote
    res.latest = convertPrice(ticker.latest1)
    res.lowest_ask = convertPrice(ticker.lowest_ask)
    res.highest_bid = convertPrice(ticker.highest_bid)
    res.percent_change = ticker.percent_change1 // TODO: looks wrong because of Golos-BitShares price difference
    res.base_volume = new Asset(ticker.asset2_volume).amount.toString()
    res.quote_volume = new Asset(ticker.asset1_volume).amount.toString()
    return res
}
