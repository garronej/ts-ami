export declare type Credential = {
    port: number;
    host: string;
    user: string;
    secret: string;
};
export declare namespace Credential {
    type Params = {
        astConfPath?: string;
        user?: string;
    };
    function getFromConfigFile(params?: Params): Credential;
}
