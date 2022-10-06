import golos from 'golos-lib-js'
import cloneDeep from 'lodash/cloneDeep.js'

import { randomId } from './ids.mjs'

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


export async function lookupAccountNames(args) {
    const names = args[0]

    let res = []
    const accs = await golos.api.lookupAccountNamesAsync(names, true)
    for (let orig of accs) {
        const obj = {}
        obj.id = randomId()
        obj.membership_expiration_date = '1969-12-31T23:59:59'
        obj.registrar = obj.id
        obj.referrer= obj.id
        obj.lifetime_referrer= obj.id
        obj.lifetime_referrer_fee_percentage = 8000
        obj.referrer_rewards_percentage = 8000
        obj.name = orig.name
        obj.owner = convertAuth(orig.owner)
        obj.active = convertAuth(orig.active)
        obj.options = { 
            memo_key: convertKey(orig.memo_key),
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
        res.push(obj)
    }
    return res
}

export async function getKeyReferences(args) {
    const keys = args[0].map(key => convertKey(key))
    return await golos.api.getKeyReferences(keys)
}
