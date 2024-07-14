const str_id = "id";
const str_id_2 = "_id";
const str_id_3 = "ID";
const str_id_4 = "_ID";

export function id (arg = "") {
	return arg === str_id || arg === str_id_2 || arg === str_id_3 || arg === str_id_4;
}
