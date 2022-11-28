import golos from 'golos-lib-js'

import { unconvertAsset } from './assets.mjs'
import { OTYPES, ungolosifyId } from './ids.mjs'

export async function broadcastTransactionSynchronous(args) {
	const [ trx ] = args
	const operation_results = []
	for (let op of trx.operations) {
		if (op[0] === 5 || op[0] === 'limit_order_create') {
			// TODO: But if called with returnOrderId = False, it should have another format...

			const opr = []
			opr.push(1) // TODO: Bitshares limit_order opid, but isn't it 5 for golos?
    		const orderid = await ungolosifyId(OTYPES.limit_order, op[1].orderid.toString())
			opr.push(orderid)
			operation_results.push(opr)
		}
	}
	console.log('TRy' , JSON.stringify(trx))
	/*delete trx.signatures
	const trx2 = await golos.auth.signTransaction(trx, ['5KEEHBQ9uPWdkFpvjjPzWMcaDZMrMm5HbjPVhycmTHjSY9qC1yU'])
	console.log('TRy2', trx2)
	delete trx.signatures
	await new Promise(resolve => setTimeout(resolve, 2000))
	const trx20 = await golos.auth.signTransaction(trx, ['5KEEHBQ9uPWdkFpvjjPzWMcaDZMrMm5HbjPVhycmTHjSY9qC1yU'])
	console.log('TRy22', trx20)*/
	const res = await golos.api.broadcastTransactionSynchronousAsync(trx)
	trx.operation_results = operation_results
	res.trx = trx
	console.log('REEEES', res)
	return res
}
