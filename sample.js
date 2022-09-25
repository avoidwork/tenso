import {tenso} from "./dist/tenso.esm.js";
import {routes} from "./test/routes.js";

tenso({
	port: 8000,
	routes,
	logging: {
		level: "info"
	},
	auth: {
		local: {
			enabled: false,
			auth: function (username, password, callback) {
				if (username === "test" && password === 123) {
					callback(null, {username: username, password: password});
				} else {
					callback(true, null);
				}
			}
		},
		jwt: {
			enabled: false,
			auth: function (token, cb) {
				cb(null, token);
			},
			secretOrKey: "jennifer"
		}
	},
	security: {
		csrf: false
	}
});
