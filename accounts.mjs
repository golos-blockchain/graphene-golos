import golos from 'golos-lib-js'
import cloneDeep from 'lodash/cloneDeep.js'

import { randomId, OTYPES, ungolosifyId, golosifyId, isId } from './ids.mjs'
import { convertAsset } from './assets.mjs'
import { convertOrder } from './getObjects.mjs'

const convertKey = (pubKey) => {
    return pubKey.startsWith('GPH') ?
        pubKey.replace('GPH', 'GLS') :
        pubKey
}

const convertAuth = (auth) => {
    const res = {}
    res.weight_threshold = auth.weight_threshold
    res.account_auths = cloneDeep(auth.account_auths)
    res.key_auths = cloneDeep(auth.key_auths)
    for (let kv of res.key_auths) {
        kv[0] = convertKey(kv[0])
    }
    res.address_auths = []
    return res
}

export const convertAcc = async (acc) => {
    const obj = {}
    obj.id = await ungolosifyId(OTYPES.account, acc.name)
    obj.membership_expiration_date = '1969-12-31T23:59:59'
    obj.registrar = obj.id
    obj.referrer= obj.id
    obj.lifetime_referrer= obj.id
    obj.lifetime_referrer_fee_percentage = 8000
    obj.referrer_rewards_percentage = 8000
    obj.name = acc.name
    obj.owner = convertAuth(acc.owner)
    obj.active = convertAuth(acc.active)
    obj.options = { 
        memo_key: convertKey(acc.memo_key),
        "voting_account": randomId(),
        "num_witness": 0,
        "num_committee": 0,
        "votes": [],
        "extensions": []
    }
    obj.statistics = randomId()
    obj.whitelisting_accounts = []
    obj.blacklisting_accounts = []
    obj.whitelisted_accounts = []
    obj.blacklisted_accounts = []
    obj.cashback_vb = randomId()
    obj.owner_special_authority = [0, {}]
    obj.active_special_authority = [0, {}]
    obj.top_n_control_flags = 0
    return obj
}

const convertStatistics = (accObj) => {
    return {
        "id": randomId(),
        "owner": accObj.id,
        "name": accObj.name,
        "most_recent_op": randomId(),
        "total_ops": 5000,
        "removed_ops": 0,
        "total_core_in_orders": 0,
        "core_in_balance": 0,
        "has_cashback_vb": false,
        "is_voting": false,
        "last_vote_time": "1970-01-01T00:00:00",
        "lifetime_fees_paid": 60100,
        "pending_fees": 0,
        "pending_vested_fees": 0
    }
}


export async function lookupAccountNames(args) {
    const names = args[0]

    let res = []
    const accs = await golos.api.lookupAccountNamesAsync(names, true)
    for (let orig of accs) {
        const obj = await convertAcc(orig)
        res.push(obj)
    }
    return res
}

export async function getKeyReferences(args) {
    const keys = args[0].map(key => convertKey(key))
    const res = await golos.api.getKeyReferencesAsync(keys)
    const obj = []
    for (let r of res) {
        const o = []
        for (let a of r) {
            o.push(await ungolosifyId(OTYPES.account, a))
        }
        obj.push(o)
    }
    return obj
}

export async function getFullAccounts(args) {
    const [ ids, subscribe ] = args
    if (subscribe) {
        // Account subscribe not yet supported because it is very complex
        // and not so need for dexbot because it can monitor limit orders with market callback
        // or with block applied callback
    }
    const names = []
    const nameId = {}
    for (const id of ids) {
        let res
        try {
            res = await golosifyId(id)
        } catch (err) {
            // not id, but account name
            // this case is need for market events
            names.push(id)
            nameId[id] = id
            continue
        }
        if (res.golos_id) {
            names.push(res.golos_id)
        } else {
            console.warn('Account not found', res)
        }
        nameId[res.golos_id] = id
    }
    const accs = await golos.api.getAccountsAsync(names)
    const res = []
    for (const acc of accs) {
        const combined = {}
        combined.account = await convertAcc(acc)
        combined.statistics = convertStatistics(combined.account)
        combined.registrar_name = acc.referrer_account
        combined.referrer_name = acc.referrer_account
        combined.lifetime_referrer_name = acc.referrer_account
        combined.votes = []
        combined.balances = []
        // array of objects like {
        //         "id": "2.5.1295",
        //         "owner": "1.2.106", // account id
        //         "asset_type": "1.3.6",
        //         "balance": 0,
        //         "maintenance_flag": false
        //     }
        combined.vesting_balances = []

        const orders = await golos.api.getOpenOrdersAsync(acc.name, ['', ''])
        combined.limit_orders = []
        for (const order of orders) {
            combined.limit_orders.push(await convertOrder(order))
        }

        combined.call_orders = []
        combined.settle_orders = []
        combined.proposals = []
        combined.assets = []
        combined.withdraws_from = []
        combined.withdraws_to = []
        combined.htlcs_from = []
        combined.htlcs_to = []
        combined.more_data_available = {
            "balances": false,
            "vesting_balances": false,
            "limit_orders": false,
            "call_orders": false,
            "settle_orders": false,
            "proposals": false,
            "assets": false,
            "withdraws_from": false,
            "withdraws_to": false,
            "htlcs_from": false,
            "htlcs_to": false
        }

        const pair = [nameId[acc.name], combined]
        res.push(pair)
        delete nameId[acc.name]
    }
    // And if account not exists, we just should not add the record.
    return res
}

export async function getAccountBalances(args) {
    const [ nameOrId, assetIds ] = args
    let name = nameOrId
    if (isId(nameOrId)) {
        const res = await golosifyId(nameOrId)
        if (res.golos_id) {
            name = res.golos_id
        } else {
            throw new Error('getAccountBalances', nameOrId)
        }
    }

    const res = []

    let acc = await golos.api.getAccountsAsync([name])
    acc = acc[0]
    if (!acc) {
        throw new Error('getAccountBalances', nameOrId, name)
    }
    res.push(await convertAsset(acc.balance))
    res.push(await convertAsset(acc.sbd_balance))

    let bals = await golos.api.getAccountsBalancesAsync([name])
    bals = bals[0]
    if (bals) {
        for (const [key, obj] of Object.entries(bals)) {
            res.push(await convertAsset(obj.balance))
        }
    }

    return res
}
