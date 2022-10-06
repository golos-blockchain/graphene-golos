import config from 'config'
import golos from 'golos-lib-js'

import { randomId } from './ids.mjs'

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
