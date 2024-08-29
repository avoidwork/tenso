export function tenso(userConfig?: {}): Tenso;
declare class Tenso extends Woodland {
    constructor(config?: {
        auth: {
            delay: number;
            protect: any[];
            unprotect: any[];
            basic: {
                enabled: boolean;
                list: any[];
            };
            bearer: {
                enabled: boolean;
                tokens: any[];
            };
            jwt: {
                enabled: boolean;
                auth: any;
                audience: string;
                algorithms: string[];
                ignoreExpiration: boolean;
                issuer: string;
                scheme: string;
                secretOrKey: string;
            };
            msg: {
                login: string;
            };
            oauth2: {
                enabled: boolean;
                auth: any;
                auth_url: string;
                token_url: string;
                client_id: string;
                client_secret: string;
            };
            uri: {
                login: string;
                logout: string;
                redirect: string;
                root: string;
            };
            saml: {
                enabled: boolean;
                auth: any;
            };
        };
        autoindex: boolean;
        cacheSize: number;
        cacheTTL: number;
        catchAll: boolean;
        charset: string;
        corsExpose: string;
        defaultHeaders: {
            "content-type": string;
            vary: string;
        };
        digit: number;
        etags: boolean;
        host: string;
        index: any[];
        initRoutes: {};
        jsonIndent: number;
        logging: {
            enabled: boolean;
            format: string;
            level: string;
            stack: boolean;
        };
        maxBytes: number;
        mimeType: string;
        origins: string[];
        pageSize: number;
        port: number;
        rate: {
            enabled: boolean;
            limit: number;
            message: string;
            override: any;
            reset: number;
            status: number;
        };
        renderHeaders: boolean;
        time: boolean;
        security: {
            key: string;
            secret: string;
            csrf: boolean;
            csp: any;
            xframe: string;
            p3p: string;
            hsts: any;
            xssProtection: boolean;
            nosniff: boolean;
        };
        session: {
            cookie: {
                httpOnly: boolean;
                path: string;
                sameSite: boolean;
                secure: string;
            };
            name: string;
            proxy: boolean;
            redis: {
                host: string;
                port: number;
            };
            rolling: boolean;
            resave: boolean;
            saveUninitialized: boolean;
            secret: string;
            store: string;
        };
        silent: boolean;
        ssl: {
            cert: any;
            key: any;
            pfx: any;
        };
        webroot: {
            root: string;
            static: string;
            template: string;
        };
    });
    parsers: any;
    rates: any;
    renderers: any;
    serializers: any;
    server: any;
    version: any;
    canModify(arg: any): any;
    connect(req: any, res: any): void;
    eventsource(...args: any[]): import("tiny-eventsource").EventSource;
    final(req: any, res: any, arg: any): any;
    headers(req: any, res: any): void;
    init(): this;
    render(req: any, res: any, arg: any): any;
    parser(mediatype?: string, fn?: (arg: any) => any): this;
    rateLimit(req: any, fn: any): any[];
    renderer(mediatype: any, fn: any): this;
    serializer(mediatype: any, fn: any): this;
    signals(): this;
    start(): this;
    stop(): this;
}
import { Woodland } from "woodland";
export {};
