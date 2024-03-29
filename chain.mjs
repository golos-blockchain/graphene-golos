import config from 'config'
import golos from 'golos-lib-js'

import { OTYPES, randomId, ungolosifyId } from './ids.mjs'

export async function getChainProperties() {
    let res = {}
    res.id = randomId()
    res.chain_id = config.get('chain_id')
    // Just copy-paste from BitShares
    res.immutable_parameters = {
      min_committee_member_count: 11,
      min_witness_count: 11,
      num_special_accounts: 0,
      num_special_assets: 0
    }
    return res
}

export async function getDynamicGlobalProperties() {
    let res = {}
    const dgp = await golos.api.getDynamicGlobalPropertiesAsync()
    res.id = '2.1.0'
    res.head_block_number = dgp.head_block_number
    res.head_block_id = dgp.head_block_id
    res.time = dgp.time
    res.current_witness = randomId()
    res.next_maintenance_time = res.time
    res.last_budget_time = res.time
    res.witness_budget = 19260000
    res.accounts_registered_this_interval = 0
    res.recently_missed_count = 0
    res.current_aslot = dgp.current_aslot
    res.recent_slots_filled = dgp.recent_slots_filled
    res.dynamic_flags = 0
    // trick for graphenecommon/transactionbuilder
    // res.last_irreversible_block_num = dgp.last_irreversible_block_num
    res.last_irreversible_block_num = dgp.head_block_number - 1
    return res
}

export async function getRequiredFees(args) {
    const [ ops, assetIdOrName ] = args
    const res = []
    for (const op of ops) {
        res.push({ amount: 0, asset_id: assetIdOrName }) // TODO assetIdOrName is it right?
    }
    return res
}

export async function getBlockHeader(args) {
    const [ blocknum ] = args
    const h = await golos.api.getBlockHeaderAsync(blocknum)
    const res = {}
    res.previous = h.previous
    res.timestamp = h.timestamp
    res.witness = await ungolosifyId(OTYPES.account, h.witness)
    res.transaction_merkle_root = h.transaction_merkle_root
    res.extensions = h.extensions
    return res
}
