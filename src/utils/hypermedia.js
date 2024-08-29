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
			lrel = rel || "related",
			result;

		if (keys.length === 0) {
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
							lcollection = i.replace(trailing, "").replace(trailingS, "").replace(trailingY, "ie") + "s";
							lrel = "related";
						} else {
							lcollection = item_collection;
							lrel = "item";
						}

						if (scheme(lkey) === false) {
							uri = `${lcollection[0] === "/" ? "" : "/"}${lcollection.replace(/\s/g, "%20")}/${lkey.replace(/\s/g, "%20")}`;

							if (uri !== root && seen.has(uri) === false) {
								seen.add(uri);

								if (server.allowed("GET", uri)) {
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
	page = Number(query.get("page")) || 1;
	page_size = Number(query.get("page_size")) || server.pageSize || 5;

	if (page < 1) {
		page = 1;
	}

	if (page_size < 1) {
		page_size = server.pageSize || 5;
	}

	root = new URL(`http://127.0.0.1${req.parsed.pathname}${req.parsed.search}`);
	root.searchParams.delete("page");
	root.searchParams.delete("page_size");

	if (root.pathname !== "/") {
		const proot = root.pathname.replace(trailingSlash, "").replace(collectionPattern, "$1") || "/";

		if (server.allowed("GET", proot)) {
			links.push({uri: proot, rel: "collection"});
			seen.add(proot);
		}
	}

	if (exists) {
		if (Array.isArray(rep.data)) {
			if (req.method === "GET" && (rep.status >= 200 && rep.status <= 206)) {
				if (isNaN(page) || page <= 0) {
					page = 1;
				}

				nth = Math.ceil(rep.data.length / page_size);

				if (nth > 1) {
					const start = (page - 1) * page_size,
						end = start + page_size;

					rep.data = rep.data.slice(start, end);
					root.searchParams.set("page", 0);
					root.searchParams.set("page_size", page_size);

					if (page > 1) {
						root.searchParams.set("page", 1);
						links.push({uri: `${root.pathname}${root.search}`, rel: "first"});
					}

					if (page - 1 > 1 && page <= nth) {
						root.searchParams.set("page", page - 1);
						links.push({uri: `${root.pathname}${root.search}`, rel: "prev"});
					}

					if (page + 1 < nth) {
						root.searchParams.set("page", page + 1);
						links.push({uri: `${root.pathname}${root.search}`, rel: "next"});
					}

					if (nth > 0 && page !== nth) {
						root.searchParams.set("page", nth);
						links.push({uri: `${root.pathname}${root.search}`, rel: "last"});
					}
				}
			}

			if (req.hypermedia) {
				for (const i of rep.data) {
					if (i instanceof Object) {
						marshal(i, "item", req.parsed.pathname.replace(trailingSlash, ""));
					} else {
						const li = i.toString();

						if (li !== collection) {
							const uri = li.indexOf("//") >= 0 ? li : `${collection.replace(/\s/g, "%20")}/${li.replace(/\s/g, "%20")}`.replace(/^\/\//, "/");

							if (server.allowed("GET", uri)) {
								links.push({uri: uri, rel: "item"});
							}
						}
					}
				}
			}
		} else if (rep.data instanceof Object && req.hypermedia) {
			parent = req.parsed.pathname.split("/").filter(i => i !== "");

			if (parent.length > 1) {
				parent.pop();
			}

			rep.data = marshal(rep.data, void 0, parent[parent.length - 1]);
		}
	}

	if (links.length > 0) {
		if (headers.link !== void 0) {
			for (const i of headers.link.split("\" <")) {
				links.push({
					uri: i.replace(/(^\<|\>.*$)/g, ""),
					rel: i.replace(/(^.*rel\=\"|\"$)/g, "")
				});
			}
		}

		res.header("link", keysort(links, "rel, uri").map(i => `<${i.uri}>; rel="${i.rel}"`).join(", "));

		if (exists && rep.links !== void 0) {
			rep.links = links;
		}
	}

	return rep;
}
