import golos from 'golos-lib-js'

import { unconvertAsset } from './assets.mjs'
import { golosifyId } from './ids.mjs'

const OPS = {
	'1': async (opPair) => {
		const [ opType, op ] = opPair
		opPair[0] = 'limit_order_create'

		op.orderid = Math.floor(Date.now() / 1000)

		delete op.fee // TODO: just delete? or plus it?

		const owner = await golosifyId(op.seller)
		op.owner = owner.golos_id
		if (!op.owner) {
			throw new Error('Seller not exists', op.owner)
		}
		delete op.seller

		op.amount_to_sell = await unconvertAsset(op.amount_to_sell)
		op.min_to_receive = await unconvertAsset(op.min_to_receive)

		delete op.extensions
	}
}

const fixOp = async (op) => {
	const [ opType, data ] = op
	const fixer = OPS[opType]
	if (fixer) {
		await fixer(op)
		return
	}
	throw new Error('Operation unsupported', opType, data)
}


export async function broadcastTransactionSynchronous(args) {
	const [ trx ] = args
	for (let op of trx.operations) {
		await fixOp(op)
	}
	console.log('TRy' , JSON.stringify(trx))
	const res = await golos.api.broadcastTransactionSynchronousAsync(trx)
	console.log('REEEES', res)
}
