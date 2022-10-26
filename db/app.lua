fiber = require 'fiber'
require 'object_ids'

io.output():setvbuf("no")

box.cfg {
    log_level = 5,
    listen = '0.0.0.0:3301',
    memtx_memory = 1 * 1024*1024*1024,
    wal_dir    = "/var/lib/tarantool",
    memtx_dir   = "/var/lib/tarantool",
    vinyl_dir = "/var/lib/tarantool"
}

box.once('bootstrap', function()
    print('initializing..')
    box.schema.user.grant('guest', 'read,write,execute,create,drop,alter ', 'universe')
    box.session.su('guest')

    object_ids = box.schema.create_space('object_ids')
    object_ids:create_index('primary', {
        type = 'tree', parts = {1, 'unsigned'}
    })
    object_ids:create_index('by_golos_id', {
        type = 'tree', parts = {3, 'STR'}
    })
    object_ids:create_index('by_oid', {
        type = 'tree', parts = {1, 'unsigned', 2, 'STR'}
    })

end)

-- require('console').start()
