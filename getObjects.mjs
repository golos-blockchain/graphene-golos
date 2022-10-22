import golos from 'golos-lib-js'

import { OTYPES, golosifyId } from './ids.mjs'
import { convertAcc, } from './accounts.mjs'

export async function getObjects(args) {
    const [ ids ] = args
    const names = []
    for (const id of ids) {
        if (!id.startsWith(OTYPES.account)) {
            throw new Error('get_objects currently not supports ' + id)
        }
        const res = await golosifyId(id)
        if (res.golos_id) {
            names.push(res.golos_id)
        } else {
            console.warn('Account not found', res)
        }
        // TODO is it right what we are not adding nulls?
    }
    const accs = await golos.api.getAccountsAsync(names)
    const res = []
    for (const acc of accs) {
        res.push(await convertAcc(acc))
    }
    return res
}
