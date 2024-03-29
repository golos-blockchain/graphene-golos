
import { lookupAccountNames, getKeyReferences, getFullAccounts, getAccountBalances } from './accounts.mjs'
import { lookupAssetSymbols } from './assets.mjs'
import { broadcastTransactionSynchronous, broadcastTransaction } from './broadcast.mjs'
import { getChainProperties, getDynamicGlobalProperties, getRequiredFees, getBlockHeader } from './chain.mjs'
import { getObjects } from './getObjects.mjs'
import { getLimitOrders, getOrderBook, getTicker } from './market.mjs'
import { setBlockAppliedCallback, subscribeToMarket } from './notify.mjs'

export default async function controller(params, ws, wss) {
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
            } else if(params[1] === 'get_account_balances') {
                const args = params[2]
                ret = await getAccountBalances(args)
            } else if(params[1] === 'get_chain_properties') {
                const args = params[2]
                ret = await getChainProperties(args)
            } else if(params[1] === 'get_dynamic_global_properties') {
                const args = params[2]
                ret = await getDynamicGlobalProperties(args)
            } else if(params[1] === 'get_required_fees') {
                const args = params[2]
                ret = await getRequiredFees(args)
            } else if(params[1] === 'get_block_header') {
                const args = params[2]
                ret = await getBlockHeader(args)
            } else if(params[1] === 'get_objects') {
                const args = params[2]
                ret = await getObjects(args)
            } else if(params[1] === 'set_block_applied_callback') {
                const args = params[2]
                ret = await setBlockAppliedCallback(args, ws, wss)
            } else if(params[1] === 'subscribe_to_market') {
                const args = params[2]
                ret = await subscribeToMarket(args, ws, wss)
            } else if(params[1] === 'get_limit_orders') {
                const args = params[2]
                ret = await getLimitOrders(args)
            } else if(params[1] === 'get_order_book') {
                const args = params[2]
                ret = await getOrderBook(args)
            } else if(params[1] === 'get_ticker') {
                const args = params[2]
                ret = await getTicker(args)
            } else if (params[1] === 'cancel_all_subscriptions') {
                // From node.gph.ai experiments.
                // has no params
                // just returns null (TODO or no?)
                ret = () => null
            } else if (params[1] === 'set_subscribe_callback') {
                // From node.gph.ai experiments.
                // has no params
                // just returns null (TODO or no?)
                ret = () => null
            }
        } else if (params[0] === 'network_broadcast') {
            if (params[1] === 'broadcast_transaction_synchronous') {
                const args = params[2]
                ret = await broadcastTransactionSynchronous(args)
            } else if (params[1] === 'broadcast_transaction') {
                const args = params[2]
                ret = await broadcastTransaction(args)
            }
        } else if (params[0] === 1) {
            if (params[1] === 'login') {
                // From node.gph.ai experiments.
                // has 2 params - user and passsword
                // always returns true
                ret = true
            } else if (params[1] === 'database') {
                // From node.gph.ai experiments.
                // has no params
                // always returns 2
                ret = 2
            }
        }
        return ret
    } catch (err) {
        console.error(err)
        throw err
    }
}
