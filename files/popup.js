document.getElementById("summarize").addEventListener("click", ()=>{

    const result = document.getElementById("result")

    const summaryType = document.getElementById("summary-type").value;

    result.innerHTML = '<div class="loader"></div>';

    // Get the user API key 
    chrome.storage.sync.get(['geminiApiKey'], ({geminiApiKey})=>{
        if(!geminiApiKey){
            result.textContent = "No API key is set";
            return;
        }
        // Ask Content.js for the page text
        chrome.tabs.query({active:true, currentWindow: true},([tab])=>{
            chrome.tabs.sendMessage(
                tab?.id,
                {type:"GET_ARTICLE_TEXT"},
                (response)=>{
                    if(!response?.text){
                        result.textContent = "Could Not Extract text from the page";
                        return;
                    }

                    // send text to the Gemini
                    getGeminiSummary(
                        response.text, summaryType, geminiApiKey
                    ).then(summary => {
                        result.textContent = summary;
                    }).catch(error => {
                        result.textContent = "Gemini Error: " + error.message;
                    });
                }
            );
        });
    });
});

async function getGeminiSummary(RawText, summaryType, geminiApiKey ){
    const max = 2000;
    const text = RawText.length > max ? RawText.slice(0, max) + "...": RawText;

    const promptMap = {
        brief: `Summarize in 2-3 sentences: \n\n${text}`,
        detailed: `Summarize in 5-7 bullet points (start each line with "- "): \n\n${text}`,
        bullets: `Summarize in 5-7 bullet points (start each line with "- "): \n\n${text}`
    };

    const prompt = promptMap[summaryType] || promptMap.brief;

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
                contents: [{parts:[{text:prompt}]}],
                generationConfig: {temperature:0.2},
            })
        }
    )

    if(!res.ok){
        const{error} = await res.json();
        throw new Error(error?.message || "Request Failed")
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No Summary";
}


document.getElementById("copy-btn").addEventListener("click", ()=>{
    const summaryType = document.getElementById("result").innerText;

    if(summaryType && summaryType.trim() !== ""){
        navigator.clipboard
            .writeText(summaryType)
            .then(()=> {
                const copyBtn = document.getElementById("copy-btn");
                const orignalText = copyBtn.innerText;

                copyBtn.innerText = "Copied";
                setTimeout(()=>{
                    copyBtn.innerText = orignalText;
                }, 2000);
            })
            .catch((err)=>{
                console.error("Failed to copy text: ", err);
            });
    }
})