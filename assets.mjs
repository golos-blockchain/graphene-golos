import golos from 'golos-lib-js'
import { Asset, _Asset } from 'golos-lib-js/lib/utils/index.js'

import { randomId, OTYPES, ungolosifyId, golosifyId } from './ids.mjs'

export const convertAsset = async (asset) => {
    if (!(asset instanceof _Asset)) {
        asset = await Asset(asset)
    }
    const obj = {}
    obj.amount = asset.amount
    obj.asset_id = await ungolosifyId(OTYPES.asset, asset.symbol)
    return obj
}

export const unconvertAsset = async (asset) => {
    let symbol = await golosifyId(asset.asset_id)
    if (symbol.golos_id) {
        symbol = symbol.golos_id
    } else {
        console.error(asset, symbol)
        throw new Error('unconvertAsset')
    }
    // TODO precision should be in DB
    let precision = 3
    if (symbol !== 'GOLOS' && symbol !== 'GBG') {
        let info = await golos.api.getAssetsAsync('', [symbol], '', 20, 'by_symbol_name')
        info = info[0]
        if (!info) {
            console.error(asset, symbol)
            throw new Error('unconvertAsset - not found')
        }
        precision = info.precision
    }
    const obj = Asset(asset.amount, precision, symbol)
    return obj
}

const golosData = async () => {
    let obj = {}
    obj.id = await ungolosifyId(OTYPES.asset, 'GOLOS')
    obj.symbol = 'GOLOS'
    obj.precision = 3
    obj.issuer = randomId()
    obj.options = {
        max_supply: '10000000000000',
        market_fee_percent: 0,
        max_market_fee: '10000000000000',
        "issuer_permissions":0,
        "flags":0,
        "core_exchange_rate":{
            "base":{"amount":0,"asset_id":"1.3.0"},
            "quote":{"amount":0,"asset_id":"1.3.0"}
        },
        "whitelist_authorities":[],
        "blacklist_authorities":[],
        "whitelist_markets":[],
        "blacklist_markets":[],
        description: '',
        extensions: {},
    }
    obj.dynamic_asset_data_id = randomId()
    return obj
}

const gbgData = async () => {
    let obj = {}
    obj.id = await ungolosifyId(OTYPES.asset, 'GBG')
    //console.log('GBG', obj.id)
    obj.symbol = 'GBG'
    obj.precision = 3
    obj.issuer = randomId()
    obj.options = {
        max_supply: '10000000000000',
        market_fee_percent: 0,
        max_market_fee: '10000000000000',
        "issuer_permissions":0,
        "flags":0,
        "core_exchange_rate":{
            "base":{"amount":0,"asset_id":"1.3.0"},
            "quote":{"amount":0,"asset_id":"1.3.0"}
        },
        "whitelist_authorities":[],
        "blacklist_authorities":[],
        "whitelist_markets":[],
        "blacklist_markets":[],
        description: '',
        extensions: {},
    }
    obj.dynamic_asset_data_id = randomId()
    return obj
}

export async function lookupAssetSymbols(args) {
    const [ syms ] = args

    const symsLookup = syms.filter(sym => sym !== 'GOLOS' && sym !== 'GBG')
    const gRes = await golos.api.getAssetsAsync('', symsLookup, '', 20, 'by_symbol_name')
    let symsMap = {}
    symsMap = { GOLOS: await golosData(), GBG: await gbgData() }
    for (let orig of gRes) {
        const maxSupply = Asset(orig.max_supply)
        const symbol = maxSupply.symbol

        let obj = {}
        obj.id = await ungolosifyId(OTYPES.asset, symbol)
        obj.symbol = symbol
        obj.precision = orig.precision
        obj.issuer = randomId()
        obj.options = {
            max_supply: maxSupply.amount.toString(),
            market_fee_percent: orig.fee_percent,
            max_market_fee: maxSupply.amount.toString(),
            "issuer_permissions":0,
            "flags":0,
            "core_exchange_rate":{
                "base":{"amount":0,"asset_id":"1.3.0"},
                "quote":{"amount":0,"asset_id":"1.3.0"}
            },
            "whitelist_authorities":[],
            "blacklist_authorities":[],
            "whitelist_markets":[],
            "blacklist_markets":[],
            description: '',
            extensions: {},
        }
        obj.dynamic_asset_data_id = randomId()

        symsMap[maxSupply.symbol] = obj
    }

    let res = []
    for (let sym of syms) {
        res.push(symsMap[sym])
    }
    return res
}
