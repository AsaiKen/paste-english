chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'pasteEnglish',
    title: '日本語→英語 で貼り付け',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'pasteEnglish') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'pasteEnglish'
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translateText') {
    // DeepL APIを使用してテキストを翻訳する関数
    translateText(request.text).then(translatedText => {
      sendResponse({ translatedText: translatedText });
    });
    // 応答を非同期で処理するために true を返す
    return true;
  }
});

// async function isGuest() {
//   const requestUrl = 'https://api.deepl.com/jsonrpc?method=LMT_handle_jobs';
//   const response = await fetch(requestUrl, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Accept': '*/*',
//       'Origin': 'https://www.deepl.com',
//       'Referer': 'https://www.deepl.com/',
//       'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
//     },
//   });
//   const json = await response.json();
//   return json.message?.error?.toLowerCase().includes('unauthorized') || false;
// }

async function translateText(text) {
  // let domain;
  // if (await isGuest()) {
  //   domain = 'api.deepl.com';
  // } else {
  //   domain = 'www2.deepl.com';
  // }
  const domain = 'api.deepl.com';

  const requestUrl = `https://${domain}/jsonrpc?method=LMT_handle_jobs`;
  const lines = text.replace(/。/g, '。\n').split(/\r?\n/).filter(s => !!s);
  const jobs = [];
  for (let i = 0; i < lines.length; i++) {
    jobs.push({
      "kind": "default",
      "sentences": [
        {
          text: lines[i],
          id: i,
          prefix: ""
        }
      ],
      "raw_en_context_before": lines.slice(Math.max(0, i - 5), i),
      "raw_en_context_after": i < lines.length - 1 ? [lines[i + 1]] : [],
      "preferred_num_beams": 1
    });
  }
  const requestBody = {
    "jsonrpc": "2.0",
    "method": "LMT_handle_jobs",
    "params": {
      "jobs": jobs,
      "lang": {
        "preference": {
          "weight": {},
          "default": "default"
        },
        "source_lang_computed": "JA",
        "target_lang": "EN"
      },
      "priority": 1,
      "commonJobParams": {
        "regionalVariant": "en-US",
        "mode": "translate",
        "browserType": 1
      },
      "timestamp": new Date().getTime()
    },
    "id": Math.floor(10000000 + Math.random() * 80000000),
  };
  console.log(requestBody);

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Origin': 'https://www.deepl.com',
        'Referer': 'https://www.deepl.com/',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data);
      let translatedText = text;
      data.result.translations.forEach(t => {
        let sentence = t.beams[0].sentences[0];
        const id = sentence.ids[0]
        const originalLine = lines[id];
        const translatedLine = sentence.text;
        console.log({ originalLine, translatedLine });
        translatedText = translatedText.replace(originalLine, translatedLine + ' ');
      })
      return translatedText;
    } else {
      console.error('Request failed:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Request error:', error);
    return null;
  }
}
