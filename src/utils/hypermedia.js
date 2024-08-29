import {URL} from "url";
import {keysort} from "keysort";
import {
	collection as collectionPattern,
	hypermedia as hypermediaPattern,
	trailing,
	trailingS,
	trailingSlash,
	trailingY
} from "./regex";
import {id} from "./id";
import {scheme} from "./scheme";
import {
	COLLECTION,
	COMMA_SPACE,
	DOUBLE_SLASH,
	EMPTY,
	ENCODED_SPACE,
	FIRST,
	GET,
	HEADER_SPLIT,
	IE,
	INT_0,
	INT_1,
	INT_200,
	INT_206,
	INT_5,
	ITEM,
	LAST,
	LINK,
	NEXT,
	PAGE,
	PAGE_SIZE,
	PREV,
	REL_URI,
	RELATED,
	S,
	SLASH,
	URL_127001
} from "../core/constants.js";

// @todo audit this function
export function hypermedia (req, res, rep) {
	const server = req.server,
		headers = res.getHeaders(),
		collection = req.parsed.pathname,
		links = [],
		seen = new Set(),
		exists = rep !== null;
	let query, page, page_size, nth, root, parent;

	// Parsing the object for hypermedia properties
	function marshal (obj, rel, item_collection) {
		let keys = Object.keys(obj),
			lrel = rel || RELATED,
			result;

		if (keys.length === INT_0) {
			result = null;
		} else {
			for (const i of keys) {
				if (obj[i] !== void 0 && obj[i] !== null) {
					const lid = id(i);
					let lcollection, uri;

					// If ID like keys are found, and are not URIs, they are assumed to be root collections
					if (lid || hypermediaPattern.test(i)) {
						const lkey = obj[i].toString();

						if (lid === false) {
							lcollection = i.replace(trailing, EMPTY).replace(trailingS, EMPTY).replace(trailingY, IE) + S;
							lrel = RELATED;
						} else {
							lcollection = item_collection;
							lrel = ITEM;
						}

						if (scheme(lkey) === false) {
							uri = `${lcollection[0] === SLASH ? EMPTY : SLASH}${lcollection.replace(/\s/g, ENCODED_SPACE)}/${lkey.replace(/\s/g, ENCODED_SPACE)}`;

							if (uri !== root && seen.has(uri) === false) {
								seen.add(uri);

								if (server.allowed(GET, uri)) {
									links.push({uri: uri, rel: lrel});
								}
							}
						}
					}
				}
			}

			result = obj;
		}

		return result;
	}

	query = req.parsed.searchParams;
	page = Number(query.get(PAGE)) || INT_1;
	page_size = Number(query.get(PAGE_SIZE)) || server.pageSize || INT_5;

	if (page < INT_1) {
		page = INT_1;
	}

	if (page_size < INT_1) {
		page_size = server.pageSize || INT_5;
	}

	root = new URL(`${URL_127001}${req.parsed.pathname}${req.parsed.search}`);
	root.searchParams.delete(PAGE);
	root.searchParams.delete(PAGE_SIZE);

	if (root.pathname !== SLASH) {
		const proot = root.pathname.replace(trailingSlash, EMPTY).replace(collectionPattern, "$1") || SLASH;

		if (server.allowed(GET, proot)) {
			links.push({uri: proot, rel: COLLECTION});
			seen.add(proot);
		}
	}

	if (exists) {
		if (Array.isArray(rep.data)) {
			if (req.method === GET && (rep.status >= INT_200 && rep.status <= INT_206)) {
				if (isNaN(page) || page <= INT_0) {
					page = INT_1;
				}

				nth = Math.ceil(rep.data.length / page_size);

				if (nth > INT_1) {
					const start = (page - INT_1) * page_size,
						end = start + page_size;

					rep.data = rep.data.slice(start, end);
					root.searchParams.set(PAGE, INT_0);
					root.searchParams.set(PAGE_SIZE, page_size);

					if (page > INT_1) {
						root.searchParams.set(PAGE, INT_1);
						links.push({uri: `${root.pathname}${root.search}`, rel: FIRST});
					}

					if (page - INT_1 > INT_1 && page <= nth) {
						root.searchParams.set(PAGE, page - INT_1);
						links.push({uri: `${root.pathname}${root.search}`, rel: PREV});
					}

					if (page + INT_1 < nth) {
						root.searchParams.set(PAGE, page + INT_1);
						links.push({uri: `${root.pathname}${root.search}`, rel: NEXT});
					}

					if (nth > INT_0 && page !== nth) {
						root.searchParams.set(PAGE, nth);
						links.push({uri: `${root.pathname}${root.search}`, rel: LAST});
					}
				}
			}

			if (req.hypermedia) {
				for (const i of rep.data) {
					if (i instanceof Object) {
						marshal(i, ITEM, req.parsed.pathname.replace(trailingSlash, EMPTY));
					} else {
						const li = i.toString();

						if (li !== collection) {
							const uri = li.indexOf(DOUBLE_SLASH) >= INT_0 ? li : `${collection.replace(/\s/g, ENCODED_SPACE)}/${li.replace(/\s/g, ENCODED_SPACE)}`.replace(/^\/\//, SLASH);

							if (server.allowed(GET, uri)) {
								links.push({uri: uri, rel: ITEM});
							}
						}
					}
				}
			}
		} else if (rep.data instanceof Object && req.hypermedia) {
			parent = req.parsed.pathname.split(SLASH).filter(i => i !== EMPTY);

			if (parent.length > INT_1) {
				parent.pop();
			}

			rep.data = marshal(rep.data, void 0, parent[parent.length - INT_1]);
		}
	}

	if (links.length > INT_0) {
		if (headers.link !== void 0) {
			for (const i of headers.link.split(HEADER_SPLIT)) {
				links.push({
					uri: i.replace(/(^<|>.*$)/g, EMPTY),
					rel: i.replace(/(^.*rel="|"$)/g, EMPTY)
				});
			}
		}

		res.header(LINK, keysort(links, REL_URI).map(i => `<${i.uri}>; rel="${i.rel}"`).join(COMMA_SPACE));

		if (exists && rep.links !== void 0) {
			rep.links = links;
		}
	}

	return rep;
}
