
function ungolosify_id(otype, golos_id)
	local res = {}
	local pair = box.space.object_ids.index.by_golos_id:select{golos_id}
	if #pair ~= 0 then
		res.id = pair[1][1] - 1
		res.otype = pair[1][2]
		res.golos_id = golos_id
		return res
	end
	pair = box.space.object_ids:auto_increment{otype, golos_id}
	res.id = pair[1] - 1
	res.otype = pair[2]
	res.golos_id = pair[3]
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
	end
	return res
end
