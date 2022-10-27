
import { lookupAccountNames, getKeyReferences, getFullAccounts } from './accounts.mjs'
import { lookupAssetSymbols } from './assets.mjs'
import { getChainProperties, getDynamicGlobalProperties} from './chain.mjs'
import { getObjects } from './getObjects.mjs'
import { getLimitOrders } from './market.mjs'
import { setBlockAppliedCallback } from './notify.mjs'

export default async function controller(params, ws) {
    try {
        let ret
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
            } else if(params[1] === 'get_dynamic_global_properties') {
                const args = params[2]
                ret = await getDynamicGlobalProperties(args)
            } else if(params[1] === 'get_objects') {
                const args = params[2]
                ret = await getObjects(args)
            } else if(params[1] === 'set_block_applied_callback') {
                const args = params[2]
                ret = await setBlockAppliedCallback(args, ws)
            } else if(params[1] === 'get_limit_orders') {
                const args = params[2]
                ret = await getLimitOrders(args)
            }
        }
        return ret
    } catch (err) {
        console.error(err)
        throw err
    }
}
