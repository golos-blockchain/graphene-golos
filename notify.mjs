import { api } from 'golos-lib-js'

export default function notify(wss) {
    api.streamBlock(async (err, block) => {
        if (err) {
            console.error('Feed ', err)
            return
        }
        wss.clients.forEach(ws => {
            if (!ws.notifyBlocks) {
                return
            }
            console.log('sedning ')
            const msg = {
                method: 'notice',
                params: [ 2, [ '00f6160541e93a137e57f4d747ad9c9dca95f822' ] ]
            } 
            ws.send(JSON.stringify(msg))
        })
    })
}

export async function setBlockAppliedCallback(params, ws) {
    ws.notifyBlocks = true
    return () => null
}
