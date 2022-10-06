import golos from 'golos-lib-js'
import { Asset } from 'golos-lib-js/lib/utils/index.js'

import { randomId } from './ids.mjs'

const golosData = () => {
    let obj = {}
    obj.id = randomId()
    obj.symbol = 'GOLOS'
    obj.precision = 3
    obj.issuer = randomId()
    obj.options = {
        max_supply: '10000000000000',
        market_fee_percent: 0,
        max_market_fee: '10000000000000',
        "issuer_permissions":0,
        "flags":0,
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

const gbgData = () => {
    let obj = {}
    obj.id = randomId()
    obj.symbol = 'GBG'
    obj.precision = 3
    obj.issuer = randomId()
    obj.options = {
        max_supply: '10000000000000',
        market_fee_percent: 0,
        max_market_fee: '10000000000000',
        "issuer_permissions":0,
        "flags":0,
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
    symsMap = { GOLOS: golosData(), GBG: gbgData() }
    for (let orig of gRes) {
        const maxSupply = Asset(orig.max_supply)
        const symbol = maxSupply.symbol

        let obj = {}
        obj.id = randomId()
        obj.symbol = symbol
        obj.precision = orig.precision
        obj.issuer = randomId()
        obj.options = {
            max_supply: maxSupply.amount.toString(),
            market_fee_percent: orig.fee_percent,
            max_market_fee: maxSupply.amount.toString(),
            "issuer_permissions":0,
            "flags":0,
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
