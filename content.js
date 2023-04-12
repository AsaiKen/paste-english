chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'pasteEnglish') {
    const selectedText = window.getSelection().toString();
    const inputElement = document.activeElement;
    if (selectedText && inputElement) {
      // テキストの長さが300文字を超える場合、アラートを表示し、処理を終了します。
      if (selectedText.length > 300) {
        alert(`一度に翻訳できる日本語は300文字以内です。(${selectedText.length}文字)`);
        return;
      }

      chrome.runtime.sendMessage({action: 'translateText', text: selectedText}, response => {
        const translatedText = response.translatedText;
        if (translatedText === null) {
          alert(`翻訳に失敗しました。再度実行してください。`);
          return;
        }
        const selectionStart = inputElement.selectionStart;
        const selectionEnd = inputElement.selectionEnd;
        const inputValue = inputElement.value;
        const newText = inputValue.substring(0, selectionEnd) + '\n' + translatedText + inputValue.substring(selectionEnd);
        inputElement.value = newText;
        // 選択状態を保持する
        inputElement.selectionStart = selectionStart;
        inputElement.selectionEnd = selectionEnd;
        // 応答を返す
        sendResponse({success: true});
      });

      // 非同期応答を示します
      return true;
    }
  }
});
