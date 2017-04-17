export interface Credential {
    port: number;
    host: string;
    user: string;
    secret: string;
}
export declare function retrieveCredential(params?: {
    astConfPath?: string;
    user?: string;
}): Credential;
