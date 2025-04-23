declare namespace DID {
  class AgentManager {
    constructor(options: {
      apiKey: string;
      container: HTMLVideoElement | null;
      onMessage?: (message: any) => void;
      onError?: (error: any) => void;
    });
    connect(agentId: string): Promise<void>;
    sendMessage(message: string): void;
    disconnect(): void;
  }
}

interface Window {
  DID?: {
    AgentManager: typeof DID.AgentManager;
  };
}
