export declare type Credential = {
    port: number;
    host: string;
    user: string;
    secret: string;
};
export declare namespace Credential {
    function match(input: any): input is Credential;
    function getFromConfigFile(asteriskConfigRoot: string, user?: string): Credential;
}
