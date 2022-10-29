json = require('json')

function ungolosify_id(otype, golos_id, extra)
	local res = {}
	local pair = box.space.object_ids.index.by_golos_id:select{golos_id}
	if #pair ~= 0 then
		res.id = pair[1][1] - 1
		res.otype = pair[1][2]
		res.golos_id = golos_id
		if extra ~= nil then
			local merged = json.decode(pair[1][5])
			if type(merged) == 'table' then
				for k, v in pairs(extra) do
					merged[k] = v
				end
				res.extra = merged
			end
			local extra_str = json.encode(merged)
			box.space.object_ids:update(pair[1][1], {{'=', 5, extra_str}})
		end
		return res
	end

	local extra_str = ''
	if extra ~= nil then
		extra_str = json.encode(extra)
	end
	-- nil is for case if we'll add some another id
	pair = box.space.object_ids:auto_increment{otype, golos_id, nil, extra_str}
	res.id = pair[1] - 1
	res.otype = pair[2]
	res.golos_id = pair[3]
	res.extra = extra
	return res
end

function golosify_id(otype, oid)
	local res = {}
	res.id = oid
	res.otype = otype
	local dbid = oid + 1
	local pair = box.space.object_ids.index.by_oid:select{dbid, otype}
	if #pair ~= 0 then
		res.golos_id = pair[1][3]
		res.extra = json.decode(pair[1][5])
	end
	return res
end
