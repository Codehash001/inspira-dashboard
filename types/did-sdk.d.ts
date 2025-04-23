// Type definitions for D-ID SDK
interface DIDAgentManager {
  chat: (message: string) => Promise<any>;
  speak: (options: { type: string; input: string }) => Promise<any>;
  reconnect: () => Promise<any>;
  disconnect: () => void;
  getConnectionState: () => string;
}

interface DIDSDKInterface {
  createAgentManager: (config: {
    agentId: string;
    clientKey: string;
    videoElement: HTMLVideoElement;
    callbacks: {
      onSrcObjectReady?: (value: MediaStream | null) => void;
      onVideoStateChange?: (state: string) => void;
      onConnectionStateChange?: (state: string) => void;
      onNewMessage?: (messages: any[], type: string) => void;
      onError?: (error: any, errorData: any) => void;
    };
  }) => Promise<DIDAgentManager>;
}

declare global {
  interface Window {
    DID: DIDSDKInterface;
  }
}

export {};
