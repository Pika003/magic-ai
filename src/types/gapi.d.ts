
declare global {
  interface Window {
    gapi: {
      load: (apis: string, callback: () => void) => void;
      client: {
        init: (config: {
          discoveryDocs: string[];
          clientId: string;
          scope: string;
        }) => Promise<void>;
        setApiKey: (apiKey: string) => void;
        calendar: {
          events: {
            list: (params: {
              calendarId: string;
              timeMin: string;
              timeMax: string;
              showDeleted: boolean;
              singleEvents: boolean;
              orderBy: string;
            }) => Promise<{
              result: {
                items?: Array<{
                  id: string;
                  summary?: string;
                  start?: {
                    dateTime?: string;
                    date?: string;
                  };
                  end?: {
                    dateTime?: string;
                    date?: string;
                  };
                  description?: string;
                  location?: string;
                }>;
              };
            }>;
          };
        };
      };
      auth2: {
        getAuthInstance: () => {
          signIn: () => Promise<{
            getAuthResponse: (includeAuthorizationData?: boolean) => {
              access_token: string;
              refresh_token?: string;
              expires_in: number;
            };
          }>;
        };
      };
    };
  }
}

export {};
