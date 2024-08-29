export namespace config {
    export namespace auth {
        export { INT_0 as delay };
        export let protect: any[];
        export let unprotect: any[];
        export namespace basic {
            let enabled: boolean;
            let list: any[];
        }
        export namespace bearer {
            let enabled_1: boolean;
            export { enabled_1 as enabled };
            export let tokens: any[];
        }
        export namespace jwt {
            let enabled_2: boolean;
            export { enabled_2 as enabled };
            let auth_1: any;
            export { auth_1 as auth };
            export { EMPTY as audience };
            export let algorithms: string[];
            export let ignoreExpiration: boolean;
            export { EMPTY as issuer };
            export { BEARER as scheme };
            export { EMPTY as secretOrKey };
        }
        export namespace msg {
            export { MSG_LOGIN as login };
        }
        export namespace oauth2 {
            let enabled_3: boolean;
            export { enabled_3 as enabled };
            let auth_2: any;
            export { auth_2 as auth };
            export { EMPTY as auth_url };
            export { EMPTY as token_url };
            export { EMPTY as client_id };
            export { EMPTY as client_secret };
        }
        export namespace uri {
            export { URL_AUTH_LOGIN as login };
            export { URL_AUTH_LOGOUT as logout };
            export { SLASH as redirect };
            export { URL_AUTH_ROOT as root };
        }
        export namespace saml {
            let enabled_4: boolean;
            export { enabled_4 as enabled };
            let auth_3: any;
            export { auth_3 as auth };
        }
    }
    export let autoindex: boolean;
    export { INT_1000 as cacheSize };
    export { INT_300000 as cacheTTL };
    export let catchAll: boolean;
    export { UTF_8 as charset };
    export { EXPOSE_HEADERS as corsExpose };
    export let defaultHeaders: {
        "content-type": string;
        vary: string;
    };
    export { INT_3 as digit };
    export let etags: boolean;
    export { IP_0000 as host };
    export let index: any[];
    export let initRoutes: {};
    export { INT_0 as jsonIndent };
    export namespace logging {
        let enabled_5: boolean;
        export { enabled_5 as enabled };
        export { LOG_FORMAT as format };
        export { DEBUG as level };
        export let stack: boolean;
    }
    export { INT_0 as maxBytes };
    export { HEADER_APPLICATION_JSON as mimeType };
    export let origins: string[];
    export { INT_5 as pageSize };
    export { INT_8000 as port };
    export namespace rate {
        let enabled_6: boolean;
        export { enabled_6 as enabled };
        export { INT_450 as limit };
        export { MSG_TOO_MANY_REQUESTS as message };
        export let override: any;
        export { INT_900 as reset };
        export { INT_429 as status };
    }
    export let renderHeaders: boolean;
    export let time: boolean;
    export namespace security {
        export { X_CSRF_TOKEN as key };
        export { TENSO as secret };
        export let csrf: boolean;
        export let csp: any;
        export { SAMEORIGIN as xframe };
        export { EMPTY as p3p };
        export let hsts: any;
        export let xssProtection: boolean;
        export let nosniff: boolean;
    }
    export namespace session {
        export namespace cookie {
            export let httpOnly: boolean;
            export { SLASH as path };
            export let sameSite: boolean;
            export { AUTO as secure };
        }
        export { COOKIE_NAME as name };
        export let proxy: boolean;
        export namespace redis {
            export { IP_127001 as host };
            export { INT_6379 as port };
        }
        export let rolling: boolean;
        export let resave: boolean;
        export let saveUninitialized: boolean;
        export { SESSION_SECRET as secret };
        export { MEMORY as store };
    }
    export let silent: boolean;
    export namespace ssl {
        let cert: any;
        let key: any;
        let pfx: any;
    }
    export namespace webroot {
        export { EMPTY as root };
        export { PATH_ASSETS as static };
        export { EMPTY as template };
    }
}
import { INT_0 } from "./constants.js";
import { EMPTY } from "./constants.js";
import { BEARER } from "./constants.js";
import { MSG_LOGIN } from "./constants.js";
import { URL_AUTH_LOGIN } from "./constants.js";
import { URL_AUTH_LOGOUT } from "./constants.js";
import { SLASH } from "./constants.js";
import { URL_AUTH_ROOT } from "./constants.js";
import { INT_1000 } from "./constants.js";
import { INT_300000 } from "./constants.js";
import { UTF_8 } from "./constants.js";
import { EXPOSE_HEADERS } from "./constants.js";
import { INT_3 } from "./constants.js";
import { IP_0000 } from "./constants.js";
import { LOG_FORMAT } from "./constants.js";
import { DEBUG } from "./constants.js";
import { HEADER_APPLICATION_JSON } from "./constants.js";
import { INT_5 } from "./constants.js";
import { INT_8000 } from "./constants.js";
import { INT_450 } from "./constants.js";
import { MSG_TOO_MANY_REQUESTS } from "./constants.js";
import { INT_900 } from "./constants.js";
import { INT_429 } from "./constants.js";
import { X_CSRF_TOKEN } from "./constants.js";
import { TENSO } from "./constants.js";
import { SAMEORIGIN } from "./constants.js";
import { AUTO } from "./constants.js";
import { COOKIE_NAME } from "./constants.js";
import { IP_127001 } from "./constants.js";
import { INT_6379 } from "./constants.js";
import { SESSION_SECRET } from "./constants.js";
import { MEMORY } from "./constants.js";
import { PATH_ASSETS } from "./constants.js";
