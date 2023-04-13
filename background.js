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

async function translateText(text) {
  const escapedText = text.replace(/\r?\n/g, '{\\n}');
  const requestUrl = 'https://api.deepl.com/jsonrpc?method=LMT_handle_jobs';
  const requestBody = {
    'jsonrpc': '2.0',
    'method': 'LMT_handle_jobs',
    'params': {
      'jobs': [{
        'kind': 'default',
        'sentences': [{ 'text': escapedText, 'id': 0, 'prefix': '' }],
        'raw_en_context_before': [],
        'raw_en_context_after': [],
        'preferred_num_beams': 4
      }],
      'lang': {
        'preference': {
          "weight": {},
          'default': 'default'
        },
        "source_lang_user_selected": "JA",
        'target_lang': 'EN'
      },
      'priority': 1,
      'commonJobParams': { 'regionalVariant': 'en-US', 'mode': 'translate', 'browserType': 1 },
      'timestamp': new Date().getTime(),
    },
    // 8桁の数字
    'id': Math.floor(10000000 + Math.random() * 90000000)
  };

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
      const translatedText = data.result?.translations[0]?.beams[0]?.sentences[0]?.text.replace(/{\\n}/g, '\n');
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
