import axios from 'axios';
import { useState, useEffect } from 'react';
import { Button } from '@mui/material';

const SLACK_BOT_TOKEN = import.meta.env.VITE_SLACK_BOT_TOKEN ;
const SLACK_API_URL = 'https://slack.com/api';

if (!SLACK_BOT_TOKEN) {
  console.warn('Slack bot token is not set. Please add it to your .env file.');
}

const [userToken, setUserToken] = useState<string | null>(null);
const [isSlackConnected, setIsSlackConnected] = useState(false);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('slack_user_token');
  if (tokenFromUrl) {
    setUserToken(tokenFromUrl);
    setIsSlackConnected(true);
    localStorage.setItem('slack_user_token', tokenFromUrl);
    // Remove token from URL for cleanliness
    params.delete('slack_user_token');
    window.history.replaceState({}, document.title, window.location.pathname + (params.toString() ? '?' + params.toString() : ''));
  } else {
    const tokenFromStorage = localStorage.getItem('slack_user_token');
    if (tokenFromStorage) {
      setUserToken(tokenFromStorage);
      setIsSlackConnected(true);
    }
  }
}, []);

const handleConnectSlack = () => {
  window.open('https://battleship-8p92.onrender.com/slack/oauth/start', '_self'); // or '_blank' for popup
};

export const sendSlackMessage = async ({ channel, text, userToken }) => {
  const response = await axios.post(
    'https://slack.com/api/chat.postMessage',
    { channel, text },
    {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  if (!response.data.ok) {
    throw new Error(response.data.error || 'Failed to send Slack message');
  }
  return response.data;
};

export const fetchSlackChannels = async () => {
  if (!SLACK_BOT_TOKEN) throw new Error('Slack bot token is missing');
  const response = await axios.get(
    `https://battleship-8p92.onrender.com/slack/channels?TOKEN=${SLACK_BOT_TOKEN}`
  );
  if (!response.data.ok) {
    throw new Error(response.data.error || 'Failed to fetch Slack channels');
  }
  return response.data.channels;
};