/**
 * Decorates the `rep` with hypermedia links
 *
 * Arrays of results are automatically paginated, Objects
 * will be parsed and have keys 'lifted' into the 'link'
 * Array if a pattern is matched, e.g. "user_(guid|uuid|id|uri|url)"
 * will map to "/users/$1"
 *
 * @method hypermedia
 * @param  {Object} server  TurtleIO instance
 * @param  {Object} req     Client request
 * @param  {Object} rep     Serialized representation
 * @param  {Object} headers HTTP response headers
 * @return {Object}         HTTP response body
 */
function hypermedia (server, req, rep, headers) {
	let seen = {},
		collection = req.parsed.pathname,
		query, page, page_size, nth, root, parent;

	// Parsing the object for hypermedia properties
	function parse (obj, rel, item_collection) {
		rel = rel || "related";
		let keys = array.keys(obj);

		if (keys.length === 0) {
			obj = null;
		} else {
			array.each(keys, function (i) {
				let collection, uri;

				// If ID like keys are found, and are not URIs, they are assumed to be root collections
				if (REGEX.id.test(i) || REGEX.hypermedia.test(i)) {
					if (!REGEX.id.test(i)) {
						collection = i.replace(REGEX.trailing, "").replace(REGEX.trailing_s, "").replace(REGEX.trailing_y, "ie") + "s";
						rel = "related";
					} else {
						collection = item_collection;
						rel = "item";
					}

					uri = REGEX.scheme.test(obj[i]) ? obj[i] : ( "/" + collection + "/" + obj[i] );

					if (uri !== root && !seen[uri]) {
						rep.links.push({uri: uri, rel: rel});
						seen[uri] = 1;
					}
				}
			});
		}

		return obj;
	}

	if (rep.status >= 200 && rep.status <= 206) {
		query = req.parsed.query;
		page = query.page || 1;
		page_size = query.page_size || server.config.pageSize || 5;
		root = req.parsed.pathname;

		if (req.parsed.pathname !== "/") {
			rep.links.push({
				uri: root.replace(REGEX.trailing_slash, "").replace(REGEX.collection, "$1") || "/",
				rel: "collection"
			});
		}

		if (rep.data instanceof Array) {
			if (req.method === "GET") {
				if (isNaN(page) || page <= 0) {
					page = 1;
				}

				nth = Math.ceil(rep.data.length / page_size);

				if (nth > 1) {
					rep.data = array.limit(rep.data, ( page - 1 ) * page_size, page_size);
					query.page = 0;
					query.page_size = page_size;

					root += "?" + array.keys(query).map(function (i) {
							return i + "=" + encodeURIComponent(query[i]);
						}).join("&");

					if (page > 1) {
						rep.links.push({uri: root.replace("page=0", "page=1"), rel: "first"});
					}

					if (page - 1 > 1 && page <= nth) {
						rep.links.push({uri: root.replace("page=0", "page=" + ( page - 1 )), rel: "prev"});
					}

					if (page + 1 < nth) {
						rep.links.push({uri: root.replace("page=0", "page=" + ( page + 1 )), rel: "next"});
					}

					if (nth > 0 && page !== nth) {
						rep.links.push({uri: root.replace("page=0", "page=" + nth), rel: "last"});
					}
				} else {
					root += "?" + array.keys(query).map(function (i) {
							return i + "=" + encodeURIComponent(query[i]);
						}).join("&");
				}
			}

			array.each(rep.data, function (i) {
				if (typeof i === "string" && i !== collection) {
					rep.links.push({uri: i.indexOf("//") > -1 || i.indexOf("/") === 0 ? i : ( collection + "/" + i ).replace(/^\/\//, "/"), rel: "item"});
				}

				if (i instanceof Object) {
					parse(i, "item", req.parsed.pathname.replace(REGEX.trailing_slash, "").replace(REGEX.leading, ""));
				}
			});
		} else if (rep.data instanceof Object) {
			parent = req.parsed.pathname.split("/").filter(function (i) {
				return i !== "";
			});

			if (parent.length > 1) {
				parent.pop();
			}

			rep.data = parse(rep.data, undefined, array.last(parent));
		}

		if (rep.links.length > 0) {
			headers.link = array.keySort(rep.links, "rel, uri").map(function (i) {
				return "<" + i.uri + ">; rel=\"" + i.rel + "\"";
			}).join(", ");
		}
	}

	return rep;
}
