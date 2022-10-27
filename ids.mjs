
import Tarantool from './tarantool.mjs'

export function randomId() {
    return '1.2.' + Math.floor(Math.random() * 500)
}

export const OTYPES = {
    asset: '1.3.',
    account: '1.2.',
    limit_order: '1.7.'
}

export async function ungolosifyId(oType, golosId) {
    let res
    try {
        res = await Tarantool.instance('tarantool').call(
            'ungolosify_id', oType, golosId
        )
    } catch (err) {
        console.error('ungolosifyId error')
        console.trace()
        console.error(err)
        throw err
    }
    res = res[0][0]
    const oTypeId = res.otype + res.id
    return oTypeId
}

export async function golosifyId(oTypeId) {
    let [ oSpace, oObjectType, oId ] = oTypeId.split('.')
    const oType = oSpace + '.' + oObjectType + '.'
    oId = parseInt(oId)
    if (isNaN(oId) || oId < 0) {
        throw new Error('Wrong oId')
    }
    let res
    try {
        res = await Tarantool.instance('tarantool').call(
            'golosify_id', oType, oId
        )
    } catch (err) {
        console.error('golosifyId error')
        console.trace()
        console.error(err)
        throw err
    }
    res = res[0][0]
    return res
}
