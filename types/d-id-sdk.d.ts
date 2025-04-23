// Minimal D-ID Agents SDK TypeScript declaration
// Extend as needed for more type safety

declare namespace DID {
  interface Agent {
    sendMessage(msg: { text?: string; audio?: Blob }): Promise<any>;
    on(event: "message", cb: (msg: { text?: string; videoUrl?: string }) => void): void;
    on(event: "status", cb: (status: string) => void): void;
    on(event: "error", cb: (err: any) => void): void;
  }
  function createAgent(opts: { clientKey: string; agentId: string }): Promise<Agent>;
}

declare global {
  interface Window {
    DID: typeof DID;
  }
}
export {};
