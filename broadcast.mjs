import golos from 'golos-lib-js'

import { OTYPES, ungolosifyId } from './ids.mjs'

export async function broadcastTransactionSynchronous(args) {
	const [ trx ] = args
	console.log('broadcastTransactionSynchronous' , JSON.stringify(trx))

	// TODO: what if error?
	const res = await golos.api.broadcastTransactionSynchronousAsync(trx)

	const operation_results = []
	for (let op of trx.operations) {
		if (op[0] === 5 || op[0] === 'limit_order_create') {
			// TODO: But if called with returnOrderId = False, it should have another format...

			const opr = []
			opr.push(1) // TODO: Bitshares limit_order opid, but isn't it 5 for golos?
    		const orderid = await ungolosifyId(OTYPES.limit_order, op[1].owner + '|' + op[1].orderid.toString())
			opr.push(orderid)
			operation_results.push(opr)
		}
	}

	trx.operation_results = operation_results
	res.trx = trx

	console.log('broadcastTransactionSynchronous result', res)

	return res
}

export async function broadcastTransaction(args) {
	const [ trx ] = args
	console.log('broadcastTransaction' , JSON.stringify(trx))

	let res
	try {
		res = await golos.api.broadcastTransactionAsync(trx)
		console.log('broadcastTransaction result', res)
		return res
	} catch (err) {
		// TODO but actually not works, bot still working
		console.log('broadcastTransaction err', err)
		return err.payload
	}

	return res
}
