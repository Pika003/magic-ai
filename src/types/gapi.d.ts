
declare global {
  interface Window {
    gapi: {
      load: (apis: string, callback: () => void) => void;
      client: {
        init: (config: {
          discoveryDocs: string[];
        }) => Promise<void>;
        setToken: (token: { access_token: string }) => void;
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
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token: string;
              expires_in: number;
              error?: string;
            }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

export {};
