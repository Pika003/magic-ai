import axios from 'axios';

const SLACK_BOT_TOKEN = import.meta.env.VITE_SLACK_BOT_TOKEN ;
const SLACK_API_URL = 'https://slack.com/api';

if (!SLACK_BOT_TOKEN) {
  console.warn('Slack bot token is not set. Please add it to your .env file.');
}

export const sendSlackMessage = async ({ channel, text }: { channel: string; text: string }) => {
  if (!SLACK_BOT_TOKEN) throw new Error('Slack bot token is missing');
  const response = await axios.post(
    `${SLACK_API_URL}/chat.postMessage`,
    { channel, text },
    {
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
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
    `${SLACK_API_URL}/conversations.list?types=public_channel,private_channel,im`,
    {
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      },
    }
  );
  if (!response.data.ok) {
    throw new Error(response.data.error || 'Failed to fetch Slack channels');
  }
  return response.data.channels;
}; 