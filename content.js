function triggerTranslation(sendResponse) {
  const inputElement = document.activeElement;
  let selectedText = window.getSelection().toString();

  let inputValue;
  let selectionStart;
  let selectionEnd;
  if (inputElement.tagName === 'DIV') {
    // ブロック要素があると\nが\n\nになる
    selectedText = selectedText.replace(/\n{2,}/g, '\n');
    inputValue = inputElement.innerText.replace(/\n{2,}/g, '\n');
    selectionStart = inputValue.includes(selectedText) ? inputValue.indexOf(selectedText) : 0;
    selectionEnd = inputValue.includes(selectedText) ? selectionStart + selectedText.length : inputValue.length;
  } else {
    inputValue = inputElement.value;
    selectionStart = inputElement.selectionStart;
    selectionEnd = inputElement.selectionEnd;
  }
  console.log({
    inputValue,
    selectedText,
    selectionStart,
    selectionEnd,
    tagName: inputElement.tagName,
    tagType: inputElement.type
  });
  if (selectedText.length === 0 || selectionStart === null || selectionEnd === null) {
    alert('選択したテキストを取得できませんでした。');
    return;
  }
  if (selectedText.length > 0 && inputElement) {
    const tmpText = inputValue.substring(0, selectionEnd) + '(翻訳中...)' + inputValue.substring(selectionEnd);
    if (inputElement.tagName === 'DIV') {
      inputElement.textContent = tmpText;
    } else {
      inputElement.value = tmpText;
    }
    chrome.runtime.sendMessage({ action: 'translateText', text: selectedText }, response => {
      const translatedText = response.translatedText;
      // console.log({ translatedText });
      if (!translatedText) {
        alert(`翻訳に失敗しました。再度実行してください。`);
        return;
      }
      const newText = inputValue.substring(0, selectionEnd) + translatedText + inputValue.substring(selectionEnd);
      if (inputElement.tagName === 'DIV') {
        inputElement.textContent = newText;
        const textNode = inputElement.firstChild;
        // Rangeオブジェクトを作成
        const range = document.createRange();
        // 選択範囲を設定（例: テキストノードの先頭から3文字目まで）
        range.setStart(textNode, selectionStart);
        range.setEnd(textNode, selectionEnd);
        // 現在の選択範囲をクリア
        const selection = window.getSelection();
        selection.removeAllRanges();
        // 新しい選択範囲を追加
        selection.addRange(range);
      } else {
        inputElement.value = newText;
        // 選択状態を保持する
        inputElement.selectionStart = selectionStart;
        inputElement.selectionEnd = selectionEnd;
      }
      // 応答を返す
      if (sendResponse) {
        sendResponse(true);
      }
    });

    // 非同期応答を示します
    return true;
  }
}

document.addEventListener('keydown', (e) => {
  console.log(e.ctrlKey, e.shiftKey, e.key);
  if (e.ctrlKey && e.shiftKey && (e.key === '1' || e.key === '!')) {
    triggerTranslation();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'pasteEnglish') {
    return triggerTranslation(sendResponse);
  }
});
