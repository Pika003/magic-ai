
import { GOOGLE_DISCOVERY_DOC } from '@/constants/googleApi';

let gapiInited = false;
let gisInited = false;

export const initializeGoogleAPI = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Load Google Identity Services
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.onload = () => {
      gisInited = true;
      checkInitialization();
    };
    gisScript.onerror = reject;
    document.head.appendChild(gisScript);

    // Load Google API client
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            discoveryDocs: [GOOGLE_DISCOVERY_DOC],
          });
          gapiInited = true;
          checkInitialization();
        } catch (error) {
          reject(error);
        }
      });
    };
    gapiScript.onerror = reject;
    document.head.appendChild(gapiScript);

    function checkInitialization() {
      if (gapiInited && gisInited) {
        resolve();
      }
    }
  });
};
