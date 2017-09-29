export declare type Credential = {
    port: number;
    host: string;
    user: string;
    secret: string;
};
export declare type GetCredentialParams = {
    astConfPath?: string;
    user?: string;
};
export declare function getCredentialFromConfigFile(params?: GetCredentialParams): Credential;
