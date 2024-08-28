export namespace config {
    namespace auth {
        let delay: number;
        let protect: any[];
        let unprotect: any[];
        namespace basic {
            let enabled: boolean;
            let list: any[];
        }
        namespace bearer {
            let enabled_1: boolean;
            export { enabled_1 as enabled };
            export let tokens: any[];
        }
        namespace jwt {
            let enabled_2: boolean;
            export { enabled_2 as enabled };
            let auth_1: any;
            export { auth_1 as auth };
            export let audience: string;
            export let algorithms: string[];
            export let ignoreExpiration: boolean;
            export let issuer: string;
            export let scheme: string;
            export let secretOrKey: string;
        }
        namespace local {
            let enabled_3: boolean;
            export { enabled_3 as enabled };
            let auth_2: any;
            export { auth_2 as auth };
        }
        namespace msg {
            let login: string;
        }
        namespace oauth2 {
            let enabled_4: boolean;
            export { enabled_4 as enabled };
            let auth_3: any;
            export { auth_3 as auth };
            export let auth_url: string;
            export let token_url: string;
            export let client_id: string;
            export let client_secret: string;
        }
        namespace uri {
            let login_1: string;
            export { login_1 as login };
            export let logout: string;
            export let redirect: string;
            export let root: string;
        }
        namespace saml {
            let enabled_5: boolean;
            export { enabled_5 as enabled };
            let auth_4: any;
            export { auth_4 as auth };
        }
    }
    let autoindex: boolean;
    let cacheSize: number;
    let cacheTTL: number;
    let catchAll: boolean;
    let charset: string;
    let corsExpose: string;
    let defaultHeaders: {
        "content-type": string;
        vary: string;
    };
    let digit: number;
    let etags: boolean;
    let host: string;
    let index: any[];
    let initRoutes: {};
    let json: number;
    namespace logging {
        let enabled_6: boolean;
        export { enabled_6 as enabled };
        export let format: string;
        export let level: string;
        export let stack: boolean;
    }
    let maxBytes: number;
    let mimeType: string;
    let origins: string[];
    let port: number;
    namespace rate {
        let enabled_7: boolean;
        export { enabled_7 as enabled };
        export let limit: number;
        export let message: string;
        export let override: any;
        export let reset: number;
        export let status: number;
    }
    let renderHeaders: boolean;
    let time: boolean;
    namespace security {
        let key: string;
        let secret: string;
        let csrf: boolean;
        let csp: any;
        let xframe: string;
        let p3p: string;
        let hsts: any;
        let xssProtection: boolean;
        let nosniff: boolean;
    }
    namespace session {
        export namespace cookie {
            let httpOnly: boolean;
            let path: string;
            let sameSite: boolean;
            let secure: string;
        }
        export let name: string;
        export let proxy: boolean;
        export namespace redis {
            let host_1: string;
            export { host_1 as host };
            let port_1: number;
            export { port_1 as port };
        }
        export let rolling: boolean;
        export let resave: boolean;
        export let saveUninitialized: boolean;
        let secret_1: string;
        export { secret_1 as secret };
        export let store: string;
    }
    let silent: boolean;
    namespace ssl {
        export let cert: any;
        let key_1: any;
        export { key_1 as key };
        export let pfx: any;
    }
    namespace webroot {
        let root_1: string;
        export { root_1 as root };
        let _static: string;
        export { _static as static };
        export let template: string;
    }
}
