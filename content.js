function triggerTranslation(sendResponse) {
  const selectedText = window.getSelection().toString();
  const inputElement = document.activeElement;
  const selectionStart = inputElement.selectionStart;
  const selectionEnd = inputElement.selectionEnd;
  console.log({
    selectedText,
    selectionStart,
    selectionEnd,
    tagName: inputElement.tagName,
    tagType: inputElement.type
  });
  if (selectedText.length === 0 || selectionStart === null || selectionEnd === null) {
    alert('選択したテキストを取得できませんでした。');
    return;
  } else if (selectedText.length > 300) {
    alert(`一度に翻訳できる日本語は300文字以内です。(${selectedText.length}文字)`);
    return;
  }
  if (selectedText.length > 0 && inputElement) {
    // テキストの長さが300文字を超える場合、アラートを表示し、処理を終了します。
    const inputValue = inputElement.value;
    inputElement.value = inputValue.substring(0, selectionEnd) + '\n(翻訳中...)\n' + inputValue.substring(selectionEnd);
    chrome.runtime.sendMessage({ action: 'translateText', text: selectedText }, response => {
      const translatedText = response.translatedText;
      console.log({ translatedText });
      if (!translatedText) {
        alert(`翻訳に失敗しました。再度実行してください。`);
        return;
      }
      const newText = inputValue.substring(0, selectionEnd) + '\n' + translatedText + '\n' + inputValue.substring(selectionEnd);
      inputElement.value = newText;
      // 選択状態を保持する
      inputElement.selectionStart = selectionStart;
      inputElement.selectionEnd = selectionEnd;
      // 応答を返す
      if (sendResponse) {
        sendResponse({ success: true });
      }
    });

    // 非同期応答を示します
    return true;
  }
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === '1') {
    triggerTranslation();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'pasteEnglish') {
    return triggerTranslation(sendResponse);
  }
});
