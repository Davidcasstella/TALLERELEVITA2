declare class Server {
    private port;
    constructor();
    start(): Promise<void>;
    setupGracefulShutdown(): void;
}
declare const server: Server;
export default server;
//# sourceMappingURL=server.d.ts.map