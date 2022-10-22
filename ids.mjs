
import Tarantool from './tarantool.mjs'

export function randomId() {
    return '1.2.' + Math.floor(Math.random() * 500)
}

export const OTYPES = {
    asset: '1.3.',
    account: '1.2.',
}

export async function ungolosifyId(oType, golosId) {
    let res = await Tarantool.instance('tarantool').call(
        'ungolosify_id', oType, golosId
    )
    res = res[0][0]
    const oTypeId = res.otype + res.id
    return oTypeId
}

export async function golosifyId(oTypeId) {
    let [ oSpace, oObjectType, oId ] = oTypeId.split('.')
    const oType = oSpace + '.' + oObjectType + '.'
    oId = parseInt(oId)
    if (!oId || oId < 0) {
        throw new Error('Wrong oId')
    }
    let res = await Tarantool.instance('tarantool').call(
        'golosify_id', oType, oId
    )
    res = res[0][0]
    return res
}
