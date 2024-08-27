export type Bookmark = {
  url: string;
  targetUrl: string;
  method: string;
  type: string;
  title: string;
  description: string;
  responseSelector: string;
  valueTransform: string;
};

export const defaultBookmarks: Bookmark[] = [
  {
    url: 'https://api.twitter.com/1.1/account/settings.json',
    targetUrl: 'https://www.twitter.com',
    method: 'GET',
    type: 'xmlhttprequest',
    title: 'Twitter Profile',
    description:
      'Notarize ownership of a twitter profile. To start, go to your own profile',
    responseSelector: '(?<="screen_name":)"(.*?)"',
    valueTransform: '"screen_name":%s',
  },
  {
    url: 'https://gateway.reddit.com/desktopapi/v1/prefs',
    targetUrl: 'https://www.reddit.com/settings',
    method: 'GET',
    type: 'xmlhttprequest',
    title: 'Reddit Profile',
    description:
      'Notarize ownership of a reddit profile. To start, go to reddit.com/settings',
    responseSelector: '(?<="displayText": )"(.*?)"',
    valueTransform: '"displayText": %s',
  },
  {
    url: 'https://chatgpt.com/api/auth/session',
    targetUrl: 'https://chatgpt.com',
    method: 'GET',
    type: 'xmlhttprequest',
    title: 'ChatGPT Account',
    description:
      'Notarize ownership of a ChatGPT account. To start, go to chatgpt.com',
    responseSelector: '(?<="email":)"(.*?)"',
    valueTransform: '"email":%s',
  },
  {
    url: 'https://dummyjson.com/products/1',
    targetUrl: 'https://dummyjson.com/products/1',
    method: 'GET',
    type: 'main_frame',
    title: 'Dummy JSON',
    description: 'Dummy example',
    responseSelector: '(?<="email":)"(.*?)"',
    valueTransform: '"email":%s',
  },
];
