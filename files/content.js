function getArticleText(){
    const article = document.querySelector("article");
    if(article){
        return article.innerText;
    }

    // Use querySelectorAll to get all paragraphs
    const paragraphs = Array.from(document.querySelectorAll("p"));
    return paragraphs.map((p) => p.innerText).join("\n");
}


chrome.runtime.onMessage.addListener((req, sender, sendReponse)=>{
    if((req.type === "GET_ARTICLE_TEXT")){
        const text = getArticleText()
        sendReponse({text});
    }
})